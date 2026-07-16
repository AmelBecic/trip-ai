import { expect, test } from "vitest";
import {
  AmadeusAuthError,
  AmadeusError,
  AmadeusRateLimitError,
  createAmadeusClient,
} from "./client";
import type { FlightOffersParams, HotelOffersParams } from "./types";

/**
 * Every reply is a factory, not a `Response` — a body can only be read once, so
 * a shared instance would break the moment two calls hit the same reply.
 */
type Reply = () => Response;

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

const token = (expiresIn = 1799): Reply => () =>
  json({ access_token: "tok", expires_in: expiresIn, token_type: "Bearer" });

const FLIGHTS: FlightOffersParams = {
  originLocationCode: "SFO",
  destinationLocationCode: "KIX",
  departureDate: "2026-11-02",
  adults: 2,
};

const HOTELS: HotelOffersParams = {
  hotelIds: ["HXSFO123", "HXSFO456"],
  adults: 2,
  checkInDate: "2026-11-02",
};

const TOKEN_PATH = "/v1/security/oauth2/token";

/**
 * A client wired to scripted replies, dispatched by endpoint rather than by
 * call order — a token refresh mid-flight must get a token reply, not whatever
 * happened to be next in a flat list. Within each lane the last reply repeats,
 * so a test scripts only as far as the behaviour it cares about.
 *
 * Nothing here touches the network or a real timer.
 */
function harness(opts: { token?: Reply[]; search?: Reply[] } = {}) {
  const tokenReplies = opts.token ?? [token()];
  const searchReplies = opts.search ?? [() => json({ data: [] })];
  const calls: { url: string; init?: RequestInit }[] = [];
  const slept: number[] = [];
  let clock = 0;
  let ti = 0;
  let si = 0;

  const next = (replies: Reply[], i: number): Reply =>
    replies[i] ?? replies[replies.length - 1];

  const doFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes(TOKEN_PATH)) {
      const reply = next(tokenReplies, ti);
      ti += 1;
      return reply();
    }
    const reply = next(searchReplies, si);
    si += 1;
    return reply();
  }) as typeof fetch;

  const client = createAmadeusClient({
    clientId: "id",
    clientSecret: "secret",
    fetch: doFetch,
    sleep: async (ms) => {
      slept.push(ms);
    },
    now: () => clock,
  });

  return {
    client,
    slept,
    tokenCalls: () => calls.filter((c) => c.url.includes(TOKEN_PATH)).length,
    searchCalls: () => calls.filter((c) => !c.url.includes(TOKEN_PATH)),
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

test("a token is fetched once and reused across requests", async () => {
  const h = harness();

  await h.client.searchFlightOffers(FLIGHTS);
  await h.client.searchFlightOffers(FLIGHTS);

  expect(h.tokenCalls()).toBe(1);
});

test("concurrent cold-start callers share a single token request", async () => {
  const h = harness();

  // The agent fans out — TRIP-30's tool runner calls flights and hotels in
  // parallel. On a cold cache that must still be one token POST, not one per
  // caller, or the free tier's rate limit goes before the first real search.
  await Promise.all([
    h.client.searchFlightOffers(FLIGHTS),
    h.client.searchHotelOffers(HOTELS),
  ]);

  expect(h.tokenCalls()).toBe(1);
});

test("a failed token request does not poison later callers", async () => {
  let served = 0;
  const h = harness({
    token: [
      () => {
        served += 1;
        return served === 1
          ? json({}, { status: 500 })
          : json({ access_token: "tok", expires_in: 1799, token_type: "Bearer" });
      },
    ],
  });

  await expect(h.client.getAccessToken()).rejects.toBeInstanceOf(AmadeusError);
  // The in-flight slot must have cleared on rejection, so a retry can succeed.
  await expect(h.client.getAccessToken()).resolves.toBe("tok");
});

test("the token is renewed before it expires, not after", async () => {
  // 60s token: the 30s skew means it must be replaced at 30s, while the token
  // itself is still nominally valid.
  const h = harness({ token: [token(60)] });

  await h.client.searchFlightOffers(FLIGHTS);
  h.advance(31_000);
  await h.client.searchFlightOffers(FLIGHTS);

  expect(h.tokenCalls()).toBe(2);
});

test("a 401 triggers exactly one refresh-and-retry, then succeeds", async () => {
  const h = harness({
    search: [
      // First search 401s (stale token); the retry after a refresh succeeds.
      () => json({ errors: [{ title: "Invalid access token" }] }, { status: 401 }),
      () => json({ data: [{ id: "1" }] }),
    ],
  });

  const offers = await h.client.searchFlightOffers(FLIGHTS);

  expect(offers).toHaveLength(1);
  expect(h.tokenCalls()).toBe(2);
});

test("a second 401 after the refresh throws rather than spinning", async () => {
  const h = harness({
    search: [() => json({ errors: [{ title: "Invalid access token" }] }, { status: 401 })],
  });

  await expect(h.client.searchFlightOffers(FLIGHTS)).rejects.toBeInstanceOf(
    AmadeusAuthError,
  );
  // One initial token + exactly one refresh. No third attempt.
  expect(h.tokenCalls()).toBe(2);
});

test("bad credentials surface as an auth error, not a generic failure", async () => {
  const h = harness({
    token: [() => json({ errors: [{ title: "invalid_client" }] }, { status: 401 })],
  });

  await expect(h.client.getAccessToken()).rejects.toBeInstanceOf(AmadeusAuthError);
});

test("a 429 backs off exponentially and then succeeds", async () => {
  const h = harness({
    search: [
      () => json({}, { status: 429 }),
      () => json({}, { status: 429 }),
      () => json({ data: [{ id: "1" }] }),
    ],
  });

  const offers = await h.client.searchFlightOffers(FLIGHTS);

  expect(offers).toHaveLength(1);
  expect(h.slept).toEqual([500, 1000]);
});

test("Retry-After wins over our own backoff guess", async () => {
  const h = harness({
    search: [
      () => json({}, { status: 429, headers: { "retry-after": "2" } }),
      () => json({ data: [] }),
    ],
  });

  await h.client.searchFlightOffers(FLIGHTS);

  expect(h.slept).toEqual([2000]);
});

test("an absurd Retry-After is capped rather than trusted", async () => {
  const h = harness({
    search: [
      () => json({}, { status: 429, headers: { "retry-after": "3600" } }),
      () => json({ data: [] }),
    ],
  });

  await h.client.searchFlightOffers(FLIGHTS);

  expect(h.slept).toEqual([8000]);
});

test("a persistent 429 gives a typed rate-limit error, not a raw fetch failure", async () => {
  const h = harness({ search: [() => json({}, { status: 429 })] });

  const err = await h.client.searchFlightOffers(FLIGHTS).catch((e: unknown) => e);

  expect(err).toBeInstanceOf(AmadeusRateLimitError);
  expect((err as AmadeusRateLimitError).status).toBe(429);
  // Capped: three retries, then it stops.
  expect(h.slept).toHaveLength(3);
});

test("a 500 surfaces the status and Amadeus's own message", async () => {
  const h = harness({
    search: [() => json({ errors: [{ detail: "Internal error" }] }, { status: 500 })],
  });

  const err = await h.client.searchFlightOffers(FLIGHTS).catch((e: unknown) => e);

  expect(err).toBeInstanceOf(AmadeusError);
  expect((err as AmadeusError).status).toBe(500);
  expect((err as AmadeusError).message).toContain("Internal error");
});

test("a non-JSON error body does not mask the status", async () => {
  const h = harness({
    search: [() => new Response("<html>502 Bad Gateway</html>", { status: 502 })],
  });

  const err = await h.client.searchFlightOffers(FLIGHTS).catch((e: unknown) => e);

  expect((err as AmadeusError).status).toBe(502);
});

test("flight params are sent as the documented query, optionals omitted", async () => {
  const h = harness();

  await h.client.searchFlightOffers({
    ...FLIGHTS,
    returnDate: "2026-11-09",
    travelClass: "BUSINESS",
    currencyCode: "USD",
    max: 5,
  });

  const url = new URL(h.searchCalls()[0].url);
  expect(url.pathname).toBe("/v2/shopping/flight-offers");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    originLocationCode: "SFO",
    destinationLocationCode: "KIX",
    departureDate: "2026-11-02",
    adults: "2",
    returnDate: "2026-11-09",
    travelClass: "BUSINESS",
    currencyCode: "USD",
    max: "5",
  });
  // Unset optionals must not appear at all — an empty `children=` is not the
  // same request as no `children`.
  expect(url.searchParams.has("children")).toBe(false);
  expect(url.searchParams.has("nonStop")).toBe(false);
});

test("the bearer token is attached to searches", async () => {
  const h = harness();

  await h.client.searchFlightOffers(FLIGHTS);

  const headers = h.searchCalls()[0].init?.headers as Record<string, string>;
  expect(headers.authorization).toBe("Bearer tok");
});

test("hotel ids are sent comma-joined to the hotel-offers endpoint", async () => {
  const h = harness();

  await h.client.searchHotelOffers({ ...HOTELS, checkOutDate: "2026-11-09" });

  const url = new URL(h.searchCalls()[0].url);
  expect(url.pathname).toBe("/v3/shopping/hotel-offers");
  expect(url.searchParams.get("hotelIds")).toBe("HXSFO123,HXSFO456");
  expect(url.searchParams.get("checkOutDate")).toBe("2026-11-09");
});

test("an empty result set is an answer, not an error", async () => {
  const h = harness({ search: [() => json({})] });

  await expect(h.client.searchFlightOffers(FLIGHTS)).resolves.toEqual([]);
});

test("a token response missing expires_in fails loudly, not silently", async () => {
  // The dangerous shape: NaN expiry makes every cache check false, so the
  // client would re-fetch a token on every request and quietly burn the rate
  // limit with nothing to trace it back to.
  const h = harness({ token: [() => json({ access_token: "tok", token_type: "Bearer" })] });

  const err = await h.client.getAccessToken().catch((e: unknown) => e);

  expect(err).toBeInstanceOf(AmadeusError);
  expect((err as AmadeusError).message).toContain("expires_in");
});

test("a malformed data envelope stays inside the AmadeusError contract", async () => {
  // The element shapes are modelled, not observed, so the envelope is the one
  // thing this layer can honestly check. A violation must surface here, not as
  // a TypeError in TRIP-28's mapper several frames away.
  const h = harness({ search: [() => json({ data: { unexpected: "object" } })] });

  const err = await h.client.searchFlightOffers(FLIGHTS).catch((e: unknown) => e);

  expect(err).toBeInstanceOf(AmadeusError);
  expect((err as AmadeusError).message).toContain("non-array");
});

test("unknown fields ride along without breaking the parse", async () => {
  const h = harness({
    search: [
      () =>
        json({
          meta: { count: 1, links: { self: "…" } },
          dictionaries: { carriers: { NH: "ALL NIPPON AIRWAYS" } },
          data: [
            {
              id: "1",
              source: "GDS",
              instantTicketingRequired: false,
              itineraries: [{ segments: [] }],
              price: { currency: "USD", total: "1299.50", fees: [] },
            },
          ],
        }),
    ],
  });

  const offers = await h.client.searchFlightOffers(FLIGHTS);

  expect(offers[0].id).toBe("1");
  expect(offers[0].price.total).toBe("1299.50");
});

test("hotel offers survive a property with no rating", async () => {
  // The test tier omits `rating` on many properties; TRIP-28 has to cope, so
  // the transport must hand the gap through rather than reject the payload.
  const h = harness({
    search: [
      () =>
        json({
          data: [
            {
              hotel: { hotelId: "HXSFO123", name: "Hotel Kansai" },
              offers: [{ id: "o1", price: { currency: "USD", total: "820.00" } }],
            },
          ],
        }),
    ],
  });

  const entries = await h.client.searchHotelOffers(HOTELS);

  expect(entries[0].hotel.rating).toBeUndefined();
  expect(entries[0].offers[0].price.total).toBe("820.00");
});
