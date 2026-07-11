import type { Metadata } from "next";

import {
  UsageEventsPanel,
} from "../../components/usage-events-panel";
import {
  UsageSummaryLookups,
} from "../../components/usage-summary-lookups";

export const metadata: Metadata = {
  title: "Usage analytics",
};

export default function UsageAnalyticsPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Sprint 63 - Read-only analytics
        </p>
        <h1>Usage analytics</h1>
        <p>
          Inspect successful Gateway usage, API-key
          quota state, and usage-plan consumption
          through fixed server-only read boundaries.
          Rejected request events remain separate and
          are not included in these totals.
        </p>
      </header>

      <UsageSummaryLookups />

      <section
        className="analytics-lookup-card"
        aria-labelledby="successful-events-title"
      >
        <header>
          <p className="eyebrow">
            Successful request stream
          </p>
          <h2 id="successful-events-title">
            Successful usage events
          </h2>
          <p>
            Apply bounded filters and navigate with
            opaque cursor pagination. Offset pagination
            and rollup switches are not exposed.
          </p>
        </header>

        <UsageEventsPanel />
      </section>
    </section>
  );
}
