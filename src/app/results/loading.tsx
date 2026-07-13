import { ResultsSkeleton } from "./results-skeleton";

/*
 * Route-level Suspense fallback. Next renders this while the async results page
 * awaits `searchTrips`, so the skeleton shows for the fixture's latency and the
 * real layout streams in over it.
 */
export default function Loading() {
  return <ResultsSkeleton />;
}
