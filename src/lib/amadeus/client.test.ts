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

/**
 * A client wired to a scripted list of replies. The last reply repeats, so a
 * test only scripts as far as the behaviour it cares about. Nothing here
 * touches the network or a real timer.
 */
function harness(replies: Reply[], opts: { expiresIn?: number } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const slept: number[] = [];
  let clock = 0;
  let i = 0;

  const doFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const reply = replies[i] ?? replies[replies.length - 1];
    i += 1;
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

  void opts;
  return {
    client,
    calls,
    slept,
    tokenCalls: () => calls.filter((c) => c.url.includes("oauth2/token")).length,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

test("a token is fetched once and reused across requests", async () => {
  const h = harness([token(), () => json({ data: [] })]);

  await h.client.searchFlightOffers(FLIGHTS);
  await h.client.searchFlightOffers(FLIGHTS);

  expect(h.tokenCalls()).toBe(1);
});

test("the token is renewed before it expires, not after", async () => {
  // 60s token: the 30s skew means it must be replaced at 30s, while the token
  // itself is still nominally valid.
  const h = harness([token(60), () => json({ data: [] })]);

  await h.client.searchFlightOffers(FLIGHTS);
  h.advance(31_000);
  await h.client.searchFlightOffers(FLIGHTS);

  expect(h.tokenCalls()).toBe(2);
});

test("a 401 triggers exactly one refresh-and-retry, then succeeds", async () => {
  let served = 0;
  const h = harness([
    token(),
    () => {
      served += 1;
      // First search 401s (stale token); the retry after a refresh succeeds.
      return served === 1
        ? json({ errors: [{ title: "Invalid access token" }] }, { status: 401 })
        : json({ data: [{ id: "1" }] });
    },
  ]);

  const offers = await h.client.searchFlightOffers(FLIGHTS);

  expect(offers).toHaveLength(1);
  expect(h.tokenCalls()).toBe(2);
});

test("a second 401 after the refresh throws rather than spinning", async () => {
  const h = harness([
    token(),
    () => json({ errors: [{ title: "Invalid access token" }] }, { status: 401 }),
  ]);

  await expect(h.client.searchFlightOffers(FLIGHTS)).rejects.toBeInstanceOf(
    AmadeusAuthError,
  );
  // One initial token + exactly one refresh. No third attempt.
  expect(h.tokenCalls()).toBe(2);
});

test("bad credentials surface as an auth error, not a generic failure", async () => {
  const h = harness([
    () => json({ errors: [{ title: "invalid_client" }] }, { status: 401 }),
  ]);

  await expect(h.client.getAccessToken()).rejects.toBeInstanceOf(AmadeusAuthError);
});

test("a 429 backs off exponentially and then succeeds", async () => {
  let served = 0;
  const h = harness([
    token(),
    () => {
      served += 1;
      return served <= 2 ? json({}, { status: 429 }) : json({ data: [{ id: "1" }] });
    },
  ]);

  const offers = await h.client.searchFlightOffers(FLIGHTS);

  expect(offers).toHaveLength(1);
  expect(h.slept).toEqual([500, 1000]);
});

test("Retry-After wins over our own backoff guess", async () => {
  let served = 0;
  const h = harness([
    token(),
    () => {
      served += 1;
      return served === 1
        ? json({}, { status: 429, headers: { "retry-after": "2" } })
        : json({ data: [] });
    },
  ]);

  await h.client.searchFlightOffers(FLIGHTS);

  expect(h.slept).toEqual([2000]);
});

test("an absurd Retry-After is capped rather than trusted", async () => {
  let served = 0;
  const h = harness([
    token(),
    () => {
      served += 1;
      return served === 1
        ? json({}, { status: 429, headers: { "retry-after": "3600" } })
        : json({ data: [] });
    },
  ]);

  await h.client.searchFlightOffers(FLIGHTS);

  expect(h.slept).toEqual([8000]);
});

test("a persistent 429 gives a typed rate-limit error, not a raw fetch failure", async () => {
  const h = harness([token(), () => json({}, { status: 429 })]);

  const err = await h.client.searchFlightOffers(FLIGHTS).catch((e: unknown) => e);

  expect(err).toBeInstanceOf(AmadeusRateLimitError);
  expect((err as AmadeusRateLimitError).status).toBe(429);
  // Capped: three retries, then it stops.
  expect(h.slept).toHaveLength(3);
});

test("a 500 surfaces the status and Amadeus's own message", async () => {
  const h = harness([
    token(),
    () => json({ errors: [{ detail: "Internal error" }] }, { status: 500 }),
  ]);

  const err = await h.client.searchFlightOffers(FLIGHTS).catch((e: unknown) => e);

  expect(err).toBeInstanceOf(AmadeusError);
  expect((err as AmadeusError).status).toBe(500);
  expect((err as AmadeusError).message).toContain("Internal error");
});

test("a non-JSON error body does not mask the status", async () => {
  const h = harness([
    token(),
    () => new Response("<html>502 Bad Gateway</html>", { status: 502 }),
  ]);

  const err = await h.client.searchFlightOffers(FLIGHTS).catch((e: unknown) => e);

  expect((err as AmadeusError).status).toBe(502);
});

test("flight params are sent as the documented query, optionals omitted", async () => {
  const h = harness([token(), () => json({ data: [] })]);

  await h.client.searchFlightOffers({
    ...FLIGHTS,
    returnDate: "2026-11-09",
    travelClass: "BUSINESS",
    currencyCode: "USD",
    max: 5,
  });

  const url = new URL(h.calls[1].url);
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
  const h = harness([token(), () => json({ data: [] })]);

  await h.client.searchFlightOffers(FLIGHTS);

  const headers = h.calls[1].init?.headers as Record<string, string>;
  expect(headers.authorization).toBe("Bearer tok");
});

test("hotel ids are sent comma-joined to the hotel-offers endpoint", async () => {
  const h = harness([token(), () => json({ data: [] })]);

  await h.client.searchHotelOffers({ ...HOTELS, checkOutDate: "2026-11-09" });

  const url = new URL(h.calls[1].url);
  expect(url.pathname).toBe("/v3/shopping/hotel-offers");
  expect(url.searchParams.get("hotelIds")).toBe("HXSFO123,HXSFO456");
  expect(url.searchParams.get("checkOutDate")).toBe("2026-11-09");
});

test("an empty result set is an answer, not an error", async () => {
  const h = harness([token(), () => json({})]);

  await expect(h.client.searchFlightOffers(FLIGHTS)).resolves.toEqual([]);
});

test("unknown fields ride along without breaking the parse", async () => {
  const h = harness([
    token(),
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
  ]);

  const offers = await h.client.searchFlightOffers(FLIGHTS);

  expect(offers[0].id).toBe("1");
  expect(offers[0].price.total).toBe("1299.50");
});

test("hotel offers survive a property with no rating", async () => {
  // The test tier omits `rating` on many properties; TRIP-28 has to cope, so
  // the transport must hand the gap through rather than reject the payload.
  const h = harness([
    token(),
    () =>
      json({
        data: [
          {
            hotel: { hotelId: "HXSFO123", name: "Hotel Kansai" },
            offers: [{ id: "o1", price: { currency: "USD", total: "820.00" } }],
          },
        ],
      }),
  ]);

  const entries = await h.client.searchHotelOffers(HOTELS);

  expect(entries[0].hotel.rating).toBeUndefined();
  expect(entries[0].offers[0].price.total).toBe("820.00");
});
