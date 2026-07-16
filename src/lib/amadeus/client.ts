/**
 * Transport for the Amadeus Self-Service API: OAuth2, HTTP, retries, typed
 * responses. Nothing else — no domain mapping (TRIP-28 owns that) and no
 * business logic, so the only reason to change this file is that Amadeus's
 * wire protocol changed.
 *
 * Everything the client needs to touch the outside world — `fetch`, `sleep`,
 * `now` — is injectable, so the tests drive the whole retry and expiry surface
 * without a network call or a real timer. CI has no Amadeus credentials and
 * must never need any.
 */

import type {
  AmadeusErrorResponse,
  AmadeusFlightOffer,
  AmadeusFlightOffersResponse,
  AmadeusHotelOfferEntry,
  AmadeusHotelOffersResponse,
  AmadeusTokenResponse,
  FlightOffersParams,
  HotelOffersParams,
} from "./types";

/**
 * The free tier lives on the test host; production is a different domain and a
 * different contract. Sprint 2 develops against test only — see TRIP-27.
 */
const TEST_BASE_URL = "https://test.api.amadeus.com";

/**
 * Renew slightly before the token actually dies. Without the skew a request can
 * be issued with a token that is valid at check time and expired by the time it
 * lands, which surfaces as a spurious 401.
 */
const EXPIRY_SKEW_MS = 30_000;

const MAX_RATE_LIMIT_RETRIES = 3;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8_000;

/** Any Amadeus transport failure. Carries the HTTP status when there was one. */
export class AmadeusError extends Error {
  readonly status?: number;

  constructor(message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message);
    this.name = "AmadeusError";
    this.status = options.status;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

/** Credentials or token rejected — retrying the same request will not help. */
export class AmadeusAuthError extends AmadeusError {
  constructor(message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message, options);
    this.name = "AmadeusAuthError";
  }
}

/** Rate limited beyond our retry budget. The caller decides whether to back off further. */
export class AmadeusRateLimitError extends AmadeusError {
  constructor(message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message, options);
    this.name = "AmadeusRateLimitError";
  }
}

export interface AmadeusClientConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  /** Injected in tests; defaults to the platform `fetch`. */
  fetch?: typeof fetch;
  /** Injected in tests so backoff doesn't cost real seconds. */
  sleep?: (ms: number) => Promise<void>;
  /** Injected in tests to drive token expiry without waiting. */
  now?: () => number;
}

export interface AmadeusClient {
  /** A valid bearer token, from cache when one is still good. */
  getAccessToken(): Promise<string>;
  searchFlightOffers(params: FlightOffersParams): Promise<AmadeusFlightOffer[]>;
  searchHotelOffers(params: HotelOffersParams): Promise<AmadeusHotelOfferEntry[]>;
}

/**
 * How long to wait before retrying a 429. Amadeus tells us via `Retry-After`
 * when it feels like it, and its own number beats our guess; otherwise back off
 * exponentially. Capped either way so a wedged upstream can't stall a request
 * indefinitely.
 */
function backoffMs(attempt: number, retryAfter: string | null): number {
  const headerSeconds = retryAfter === null ? Number.NaN : Number(retryAfter);
  if (Number.isFinite(headerSeconds) && headerSeconds >= 0) {
    return Math.min(headerSeconds * 1000, MAX_BACKOFF_MS);
  }
  return Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
}

export function createAmadeusClient(config: AmadeusClientConfig): AmadeusClient {
  const baseUrl = config.baseUrl ?? TEST_BASE_URL;
  const doFetch = config.fetch ?? globalThis.fetch;
  const sleep =
    config.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = config.now ?? Date.now;

  let cached: { value: string; expiresAt: number } | null = null;

  /**
   * Amadeus puts a readable title/detail in the error body. Read it when it's
   * there, but never let a body-parse failure mask the status we already know.
   */
  async function describe(res: Response): Promise<string> {
    try {
      const body = (await res.json()) as AmadeusErrorResponse;
      const first = body.errors?.[0];
      return first?.detail ?? first?.title ?? res.statusText;
    } catch {
      return res.statusText;
    }
  }

  async function fetchToken(): Promise<string> {
    const res = await doFetch(`${baseUrl}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    // Amadeus answers bad credentials with 401, and a malformed grant with 400.
    // Both mean "your keys are wrong" — a retry with the same keys is pointless.
    if (res.status === 401 || res.status === 400) {
      throw new AmadeusAuthError(
        `Amadeus rejected the client credentials (${res.status}): ${await describe(res)}`,
        { status: res.status },
      );
    }
    if (!res.ok) {
      throw new AmadeusError(
        `Amadeus token request failed (${res.status}): ${await describe(res)}`,
        { status: res.status },
      );
    }

    const body = (await res.json()) as AmadeusTokenResponse;
    cached = { value: body.access_token, expiresAt: now() + body.expires_in * 1000 };
    return body.access_token;
  }

  async function getAccessToken(): Promise<string> {
    if (cached !== null && now() < cached.expiresAt - EXPIRY_SKEW_MS) {
      return cached.value;
    }
    return fetchToken();
  }

  async function request<T>(path: string, search: URLSearchParams): Promise<T> {
    let rateLimitAttempts = 0;
    let refreshed = false;

    for (;;) {
      const token = await getAccessToken();
      const res = await doFetch(`${baseUrl}${path}?${search.toString()}`, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // The token was refused despite looking fresh — it can be revoked, or
        // expire earlier than advertised. Drop it and try once with a new one;
        // a second 401 is a credentials problem, not a stale-token problem, so
        // retrying again would just spin.
        if (refreshed) {
          throw new AmadeusAuthError(
            `Amadeus rejected the access token after a refresh: ${await describe(res)}`,
            { status: 401 },
          );
        }
        refreshed = true;
        cached = null;
        continue;
      }

      if (res.status === 429) {
        if (rateLimitAttempts >= MAX_RATE_LIMIT_RETRIES) {
          throw new AmadeusRateLimitError(
            `Amadeus rate limit still hit after ${rateLimitAttempts} retries: ${await describe(res)}`,
            { status: 429 },
          );
        }
        await sleep(backoffMs(rateLimitAttempts, res.headers.get("retry-after")));
        rateLimitAttempts += 1;
        continue;
      }

      if (!res.ok) {
        throw new AmadeusError(
          `Amadeus request to ${path} failed (${res.status}): ${await describe(res)}`,
          { status: res.status },
        );
      }

      return (await res.json()) as T;
    }
  }

  return {
    getAccessToken,

    async searchFlightOffers(params) {
      const search = new URLSearchParams({
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDate: params.departureDate,
        adults: String(params.adults),
      });
      if (params.returnDate !== undefined) search.set("returnDate", params.returnDate);
      if (params.children !== undefined) search.set("children", String(params.children));
      if (params.travelClass !== undefined) search.set("travelClass", params.travelClass);
      if (params.nonStop !== undefined) search.set("nonStop", String(params.nonStop));
      if (params.currencyCode !== undefined) search.set("currencyCode", params.currencyCode);
      if (params.max !== undefined) search.set("max", String(params.max));

      const body = await request<AmadeusFlightOffersResponse>(
        "/v2/shopping/flight-offers",
        search,
      );
      // An empty result set is a legitimate answer (no route, no availability),
      // so a missing `data` is [] rather than an error.
      return body.data ?? [];
    },

    async searchHotelOffers(params) {
      const search = new URLSearchParams({
        hotelIds: params.hotelIds.join(","),
        adults: String(params.adults),
        checkInDate: params.checkInDate,
      });
      if (params.checkOutDate !== undefined) search.set("checkOutDate", params.checkOutDate);
      if (params.currency !== undefined) search.set("currency", params.currency);

      const body = await request<AmadeusHotelOffersResponse>(
        "/v3/shopping/hotel-offers",
        search,
      );
      return body.data ?? [];
    },
  };
}

let defaultClient: AmadeusClient | null = null;

function readEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new AmadeusError(
      `${name} is not set. Copy .env.example to .env and fill in your Amadeus test-tier credentials (developers.amadeus.com).`,
    );
  }
  return value;
}

/**
 * The process-wide client, built from the environment on first use. Lazy on
 * purpose: importing this module must not require credentials, or every test
 * that touches the data layer would need them.
 */
function getDefaultClient(): AmadeusClient {
  defaultClient ??= createAmadeusClient({
    clientId: readEnv("AMADEUS_CLIENT_ID"),
    clientSecret: readEnv("AMADEUS_CLIENT_SECRET"),
  });
  return defaultClient;
}

/** Drop the cached default client (and its token). For tests. */
export function resetAmadeusClient(): void {
  defaultClient = null;
}

export function getAccessToken(): Promise<string> {
  return getDefaultClient().getAccessToken();
}

export function searchFlightOffers(
  params: FlightOffersParams,
): Promise<AmadeusFlightOffer[]> {
  return getDefaultClient().searchFlightOffers(params);
}

export function searchHotelOffers(
  params: HotelOffersParams,
): Promise<AmadeusHotelOfferEntry[]> {
  return getDefaultClient().searchHotelOffers(params);
}
