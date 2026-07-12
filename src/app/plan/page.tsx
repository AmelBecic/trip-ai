import type { Metadata } from "next";
import { TripSearchForm } from "./trip-search-form";

export const metadata: Metadata = {
  title: "Plan a trip",
};

export default function Plan() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-foreground">Plan a trip</h1>
        <p className="text-muted-foreground">
          Tell us where and when — and the budget it needs to fit.
        </p>
      </div>
      <TripSearchForm />
    </section>
  );
}
