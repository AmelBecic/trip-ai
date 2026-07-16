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
  AmadeusHotelOfferEntry,
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

/**
 * Platform `fetch` has no default timeout, so without this a wedged connection
 * blocks the caller forever — and in TRIP-30's fan-out one hung request would
 * stall a whole plan with nothing to report.
 *
 * 10s is a defensible guess, not a measured one: real Amadeus latencies are
 * unknown until the test tier has been exercised (the "verify early" gap on
 * TRIP-27). Re-tune once we have observed timings.
 */
const DEFAULT_TIMEOUT_MS = 10_000;

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
  /** Per-request ceiling. Defaults to `DEFAULT_TIMEOUT_MS`. */
  timeoutMs?: number;
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
 * exponentially. Capped either way, so a `Retry-After: 3600` can't park a
 * request for an hour. This bounds the *waiting* only — bounding the request
 * itself is `send`'s job.
 */
function backoffMs(attempt: number, retryAfter: string | null): number {
  const headerSeconds = retryAfter === null ? Number.NaN : Number(retryAfter);
  if (Number.isFinite(headerSeconds) && headerSeconds >= 0) {
    return Math.min(headerSeconds * 1000, MAX_BACKOFF_MS);
  }
  return Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
}

/**
 * Amadeus wraps every collection in `{ data: [...] }`. A missing `data` means
 * no results — a legitimate answer. Anything else is a protocol violation, and
 * naming it here keeps it inside the `AmadeusError` contract instead of letting
 * TRIP-28's mapper trip over it several frames from the cause.
 *
 * Only the envelope is checked. The shape of each element stays a modelled
 * assumption (see `types.ts`) — validating that would be TRIP-28's job.
 */
function unwrapData<T>(body: unknown, path: string): T[] {
  if (typeof body !== "object" || body === null) {
    throw new AmadeusError(`Amadeus returned a non-object body for ${path}.`);
  }
  const data = (body as { data?: unknown }).data;
  if (data === undefined || data === null) return [];
  if (!Array.isArray(data)) {
    throw new AmadeusError(`Amadeus returned a non-array \`data\` for ${path}.`);
  }
  return data as T[];
}

export function createAmadeusClient(config: AmadeusClientConfig): AmadeusClient {
  const baseUrl = config.baseUrl ?? TEST_BASE_URL;
  const doFetch = config.fetch ?? globalThis.fetch;
  const sleep =
    config.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = config.now ?? Date.now;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let cached: { value: string; expiresAt: number } | null = null;

  /**
   * The in-flight token request, shared by everyone who arrives while it runs.
   * Caching only the *value* isn't enough: a fan-out on a cold cache — the agent
   * searching flights and hotels in parallel, say — would fire one token POST
   * per caller and could burn the free tier's rate limit before the first real
   * search goes out.
   */
  let inFlight: Promise<string> | null = null;

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

  /**
   * One HTTP call, bounded by `timeoutMs`, with transport-level failures folded
   * into the `AmadeusError` contract. A bare abort or socket error escaping this
   * module is the "raw fetch failure" the ticket rules out.
   */
  async function send(url: string, init: RequestInit): Promise<Response> {
    try {
      return await doFetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (cause) {
      const aborted = cause instanceof Error && cause.name === "TimeoutError";
      throw new AmadeusError(
        aborted
          ? `Amadeus did not respond within ${timeoutMs}ms.`
          : `Amadeus request failed before a response: ${String(cause)}`,
        { cause },
      );
    }
  }

  /**
   * Retry 429s with capped backoff, then give up with a typed error. Shared by
   * the token endpoint and the searches: Amadeus throttles the *account*, not
   * the route, so a cold-start token POST can be limited exactly as a search
   * can. Returns the first non-429 response.
   */
  async function withRateLimitRetry(
    what: string,
    attempt: () => Promise<Response>,
  ): Promise<Response> {
    let attempts = 0;
    for (;;) {
      const res = await attempt();
      if (res.status !== 429) return res;

      if (attempts >= MAX_RATE_LIMIT_RETRIES) {
        throw new AmadeusRateLimitError(
          `Amadeus rate limit still hit after ${attempts} retries on ${what}: ${await describe(res)}`,
          { status: 429 },
        );
      }
      const wait = backoffMs(attempts, res.headers.get("retry-after"));
      // Discarded response — release the body rather than leaving it for the GC.
      await res.body?.cancel();
      await sleep(wait);
      attempts += 1;
    }
  }

  async function fetchToken(): Promise<string> {
    const res = await withRateLimitRetry("the token endpoint", () =>
      send(`${baseUrl}/v1/security/oauth2/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      }),
    );

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

    // The shape is modelled from Amadeus's published schema, not from observed
    // traffic, so check the two fields we actually depend on. A missing
    // `expires_in` is the dangerous one: `expiresAt` becomes NaN, every
    // `now() < NaN` check is false, and the client silently re-fetches a token
    // on every single request — burning the rate limit with nothing to trace.
    if (
      typeof body.access_token !== "string" ||
      !Number.isFinite(body.expires_in)
    ) {
      throw new AmadeusError(
        "Amadeus returned a token response without a usable access_token/expires_in.",
        { status: res.status },
      );
    }

    cached = { value: body.access_token, expiresAt: now() + body.expires_in * 1000 };
    return body.access_token;
  }

  async function getAccessToken(): Promise<string> {
    if (cached !== null && now() < cached.expiresAt - EXPIRY_SKEW_MS) {
      return cached.value;
    }
    // Clear the slot once it settles rather than holding the promise forever —
    // a failed token request must not poison every later caller.
    inFlight ??= fetchToken().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  async function request(path: string, search: URLSearchParams): Promise<unknown> {
    let refreshed = false;

    for (;;) {
      const token = await getAccessToken();
      const res = await withRateLimitRetry(path, () =>
        send(`${baseUrl}${path}?${search.toString()}`, {
          headers: { authorization: `Bearer ${token}` },
        }),
      );

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
        // This response is being discarded — release the body so the connection
        // isn't held open waiting for a reader that never comes.
        await res.body?.cancel();
        continue;
      }

      if (!res.ok) {
        throw new AmadeusError(
          `Amadeus request to ${path} failed (${res.status}): ${await describe(res)}`,
          { status: res.status },
        );
      }

      return await res.json();
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

      const path = "/v2/shopping/flight-offers";
      // An empty result set is a legitimate answer (no route, no availability),
      // so a missing `data` is [] rather than an error — see `unwrapData`.
      return unwrapData<AmadeusFlightOffer>(await request(path, search), path);
    },

    async searchHotelOffers(params) {
      const search = new URLSearchParams({
        hotelIds: params.hotelIds.join(","),
        adults: String(params.adults),
        checkInDate: params.checkInDate,
      });
      if (params.checkOutDate !== undefined) search.set("checkOutDate", params.checkOutDate);
      if (params.currency !== undefined) search.set("currency", params.currency);

      const path = "/v3/shopping/hotel-offers";
      return unwrapData<AmadeusHotelOfferEntry>(await request(path, search), path);
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
