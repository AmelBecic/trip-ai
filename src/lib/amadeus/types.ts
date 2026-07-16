/**
 * The Amadeus Self-Service wire shapes this project reads.
 *
 * Deliberately partial. Amadeus returns far more per offer than the planner
 * needs, and every field named here is a field we have to keep true — so only
 * what TRIP-28 maps onto the domain types is declared. Anything else in the
 * payload rides along unread, which is what "unknown fields are tolerated"
 * means in practice: extra keys are invisible to structural typing, never fatal.
 *
 * Fields Amadeus may legitimately omit are marked optional, so the mapping layer
 * is forced to handle their absence instead of trusting a cast. That matters
 * because these shapes are modelled from Amadeus's published schemas, **not yet
 * from observed responses** — the test tier's real payloads are unverified until
 * credentials exist (see the "verify early" note on TRIP-27). Treat an optional
 * field as genuinely uncertain until a recorded fixture proves otherwise.
 */

/** Response from `POST /v1/security/oauth2/token`. */
export interface AmadeusTokenResponse {
  access_token: string;
  /** Seconds the token stays valid, counted from when it was issued. */
  expires_in: number;
  token_type: string;
}

/**
 * Amadeus reports money as a decimal string in major units ("1299.50"), with the
 * currency alongside it. Never parse this into a float without carrying the
 * currency with it — `Money` in `@/lib/types` is integer minor units precisely
 * to avoid that ambiguity, and TRIP-28 owns the conversion.
 */
export interface AmadeusPrice {
  /** ISO 4217 code. */
  currency: string;
  total: string;
  grandTotal?: string;
}

export interface AmadeusFlightEndpoint {
  iataCode: string;
  /** Local ISO 8601 date-time at that airport, e.g. "2026-11-02T09:15:00". */
  at: string;
}

export interface AmadeusFlightSegment {
  departure: AmadeusFlightEndpoint;
  arrival: AmadeusFlightEndpoint;
  carrierCode: string;
  number?: string;
  /** ISO 8601 duration, e.g. "PT11H25M". */
  duration?: string;
  numberOfStops?: number;
}

export interface AmadeusFlightItinerary {
  duration?: string;
  segments: AmadeusFlightSegment[];
}

export interface AmadeusFareDetail {
  segmentId?: string;
  /** Amadeus spells cabins upper-case: "ECONOMY", "BUSINESS", … */
  cabin?: string;
}

export interface AmadeusTravelerPricing {
  fareDetailsBySegment?: AmadeusFareDetail[];
}

export interface AmadeusFlightOffer {
  id: string;
  itineraries: AmadeusFlightItinerary[];
  price: AmadeusPrice;
  travelerPricings?: AmadeusTravelerPricing[];
}

export interface AmadeusFlightOffersResponse {
  data?: AmadeusFlightOffer[];
}

export interface AmadeusHotelAddress {
  lines?: string[];
  cityName?: string;
  countryCode?: string;
}

export interface AmadeusHotelInfo {
  hotelId: string;
  name?: string;
  cityCode?: string;
  /** Star rating as a string ("4"). Many test-tier properties carry none. */
  rating?: string;
  address?: AmadeusHotelAddress;
}

export interface AmadeusHotelOffer {
  id: string;
  price: AmadeusPrice;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface AmadeusHotelOfferEntry {
  hotel: AmadeusHotelInfo;
  offers: AmadeusHotelOffer[];
}

export interface AmadeusHotelOffersResponse {
  data?: AmadeusHotelOfferEntry[];
}

/** Amadeus's error envelope — a useful title/detail lives in here on a non-2xx. */
export interface AmadeusErrorDetail {
  status?: number;
  code?: number;
  title?: string;
  detail?: string;
}

export interface AmadeusErrorResponse {
  errors?: AmadeusErrorDetail[];
}

export type AmadeusTravelClass =
  | "ECONOMY"
  | "PREMIUM_ECONOMY"
  | "BUSINESS"
  | "FIRST";

export interface FlightOffersParams {
  originLocationCode: string;
  destinationLocationCode: string;
  /** ISO 8601 date, e.g. "2026-11-02". */
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  travelClass?: AmadeusTravelClass;
  nonStop?: boolean;
  /** ISO 4217; Amadeus prices in the market default otherwise. */
  currencyCode?: string;
  max?: number;
}

export interface HotelOffersParams {
  /** Amadeus property ids. The endpoint requires at least one. */
  hotelIds: string[];
  adults: number;
  checkInDate: string;
  checkOutDate?: string;
  currency?: string;
}
