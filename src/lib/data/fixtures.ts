import type {
  BudgetLine,
  Flight,
  Hotel,
  ItineraryDay,
  Money,
  TripSearch,
} from "@/lib/types";

/**
 * Raw trip content for the mock data layer.
 *
 * A fixture holds everything about a trip *except* its budget verdict: the
 * budget breakdown is derived against a search's cap by the data layer (see
 * ./index.ts), so the same trip reads as under- or over-budget depending on
 * who asks. `baselineSearch` is the canonical request a trip was born from,
 * used when a trip is fetched by id with no search in hand.
 *
 * This module is internal to the data layer — UI must go through the exported
 * functions, never import fixtures directly.
 */
export interface ItineraryFixture {
  id: string;
  summary: string;
  baselineSearch: TripSearch;
  flights: Flight[];
  hotels: Hotel[];
  days: ItineraryDay[];
  /** Costs beyond flights and lodging (food, activities, local transit). */
  extraLines: BudgetLine[];
}

const CURRENCY = "USD";

/** Dollars → Money in minor units, so fixtures read in human amounts. */
function usd(dollars: number): Money {
  return { amount: Math.round(dollars * 100), currency: CURRENCY };
}

function hotel(args: {
  id: string;
  name: string;
  address: string;
  rating: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  nightly: number;
}): Hotel {
  const nightlyRate = usd(args.nightly);
  return {
    id: args.id,
    name: args.name,
    address: args.address,
    rating: args.rating,
    checkIn: args.checkIn,
    checkOut: args.checkOut,
    nights: args.nights,
    nightlyRate,
    total: { amount: nightlyRate.amount * args.nights, currency: CURRENCY },
  };
}

function search(destination: string, capUsd: number): TripSearch {
  return {
    origin: "SFO",
    destination,
    dates: { start: "2026-11-02", end: "2026-11-09" },
    travelers: { adults: 2, children: 0 },
    cabin: "economy",
    budget: usd(capUsd),
    constraints: [{ kind: "max-stops", stops: 1 }],
  };
}

// --- Kyoto (KIX): three trips at different price points, one destination. ---

const KYOTO: ItineraryFixture[] = [
  {
    id: "kix-lean",
    summary: "Kyoto on a budget — guesthouse stays and temple walks.",
    baselineSearch: search("KIX", 6500),
    flights: [
      {
        id: "kix-lean-out",
        cabin: "economy",
        price: usd(1650),
        segments: [
          {
            from: "SFO",
            to: "KIX",
            departure: "2026-11-02T11:20:00-08:00",
            arrival: "2026-11-03T15:05:00+09:00",
            carrier: "ZipAir",
            flightNumber: "ZG25",
          },
        ],
      },
    ],
    hotels: [
      hotel({
        id: "kix-lean-hotel",
        name: "Gion Guesthouse",
        address: "Higashiyama, Kyoto",
        rating: 4,
        checkIn: "2026-11-03",
        checkOut: "2026-11-09",
        nights: 6,
        nightly: 95,
      }),
    ],
    extraLines: [
      { category: "food", amount: usd(520) },
      { category: "activities", amount: usd(240) },
      { category: "transit", amount: usd(160) },
    ],
    days: [
      {
        date: "2026-11-03",
        title: "Arrival & Higashiyama",
        activities: [
          {
            id: "kix-lean-d1-a1",
            name: "Kiyomizu-dera at dusk",
            location: "Higashiyama",
            cost: usd(4),
          },
        ],
      },
    ],
  },
  {
    id: "kix-classic",
    summary: "The classic week — a ryokan night and the Arashiyama day trip.",
    baselineSearch: search("KIX", 6500),
    flights: [
      {
        id: "kix-classic-out",
        cabin: "economy",
        price: usd(2100),
        segments: [
          {
            from: "SFO",
            to: "KIX",
            departure: "2026-11-02T13:40:00-08:00",
            arrival: "2026-11-03T17:30:00+09:00",
            carrier: "ANA",
            flightNumber: "NH107",
          },
        ],
      },
    ],
    hotels: [
      hotel({
        id: "kix-classic-hotel",
        name: "Hotel Kanra Kyoto",
        address: "Shimogyo, Kyoto",
        rating: 5,
        checkIn: "2026-11-03",
        checkOut: "2026-11-09",
        nights: 6,
        nightly: 320,
      }),
    ],
    extraLines: [
      { category: "food", amount: usd(900) },
      { category: "activities", amount: usd(600) },
      { category: "transit", amount: usd(220) },
    ],
    days: [
      {
        date: "2026-11-03",
        title: "Arrival & Gion",
        activities: [
          {
            id: "kix-classic-d1-a1",
            name: "Evening stroll through Gion",
            start: "2026-11-03T19:30:00+09:00",
            location: "Gion",
          },
        ],
      },
      {
        date: "2026-11-04",
        title: "Southern Higashiyama",
        activities: [
          {
            id: "kix-classic-d2-a1",
            name: "Fushimi Inari before the crowds",
            start: "2026-11-04T07:30:00+09:00",
            location: "Fushimi",
          },
          {
            id: "kix-classic-d2-a2",
            name: "Kiyomizu-dera & Sannenzaka",
            start: "2026-11-04T11:00:00+09:00",
            location: "Higashiyama",
            cost: usd(4),
          },
          {
            id: "kix-classic-d2-a3",
            name: "Kaiseki dinner in Pontocho",
            start: "2026-11-04T19:00:00+09:00",
            location: "Pontocho",
            cost: usd(160),
          },
        ],
      },
      {
        date: "2026-11-05",
        title: "Arashiyama",
        activities: [
          {
            id: "kix-classic-d3-a1",
            name: "Bamboo grove & Tenryu-ji",
            start: "2026-11-05T09:00:00+09:00",
            location: "Arashiyama",
            cost: usd(8),
          },
          {
            id: "kix-classic-d3-a2",
            name: "Okochi Sanso villa & gardens",
            location: "Arashiyama",
            cost: usd(10),
          },
        ],
      },
      {
        date: "2026-11-06",
        title: "Ryokan night in the hills",
        activities: [
          {
            id: "kix-classic-d4-a1",
            name: "Onsen soak & ryokan kaiseki",
            location: "Kurama",
          },
        ],
      },
    ],
  },
  {
    id: "kix-lux",
    summary: "Splurge week — business-class flights and a suite by the river.",
    baselineSearch: search("KIX", 6500),
    flights: [
      {
        id: "kix-lux-out",
        cabin: "business",
        price: usd(5200),
        segments: [
          {
            from: "SFO",
            to: "KIX",
            departure: "2026-11-02T13:40:00-08:00",
            arrival: "2026-11-03T17:30:00+09:00",
            carrier: "ANA",
            flightNumber: "NH107",
          },
        ],
      },
    ],
    hotels: [
      hotel({
        id: "kix-lux-hotel",
        name: "The Ritz-Carlton Kyoto",
        address: "Nakagyo, Kyoto",
        rating: 5,
        checkIn: "2026-11-03",
        checkOut: "2026-11-09",
        nights: 6,
        nightly: 780,
      }),
    ],
    extraLines: [
      { category: "food", amount: usd(1400) },
      { category: "activities", amount: usd(900) },
      { category: "transit", amount: usd(300) },
    ],
    days: [
      {
        date: "2026-11-04",
        title: "Kaiseki evening",
        activities: [
          {
            id: "kix-lux-d2-a1",
            name: "Kaiseki tasting menu",
            location: "Pontocho",
            cost: usd(220),
          },
        ],
      },
    ],
  },
];

// --- Paris (CDG): a second destination, mainly to exercise the getters. ---

const PARIS: ItineraryFixture[] = [
  {
    id: "cdg-classic",
    summary: "A week in Paris — Left Bank hotel, museums, and long lunches.",
    baselineSearch: search("CDG", 5500),
    flights: [
      {
        id: "cdg-classic-out",
        cabin: "economy",
        price: usd(1450),
        segments: [
          {
            from: "SFO",
            to: "CDG",
            departure: "2026-11-02T16:10:00-08:00",
            arrival: "2026-11-03T12:25:00+01:00",
            carrier: "Air France",
            flightNumber: "AF83",
          },
        ],
      },
    ],
    hotels: [
      hotel({
        id: "cdg-classic-hotel",
        name: "Hôtel des Grands Boulevards",
        address: "2nd arrondissement, Paris",
        rating: 4,
        checkIn: "2026-11-03",
        checkOut: "2026-11-09",
        nights: 6,
        nightly: 260,
      }),
    ],
    extraLines: [
      { category: "food", amount: usd(780) },
      { category: "activities", amount: usd(320) },
      { category: "transit", amount: usd(140) },
    ],
    days: [
      {
        date: "2026-11-04",
        title: "Louvre & Tuileries",
        activities: [
          {
            id: "cdg-classic-d2-a1",
            name: "Louvre, morning entry",
            location: "1st arrondissement",
            cost: usd(22),
          },
        ],
      },
    ],
  },
];

/** Every trip the mock source knows about, keyed for lookup by the data layer. */
export const ITINERARIES: readonly ItineraryFixture[] = [...KYOTO, ...PARIS];
