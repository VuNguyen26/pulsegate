import type {
  Metadata,
} from "next";

import {
  RollupInspectionPanel,
} from "../../components/rollup-inspection-panel";

export const metadata: Metadata = {
  title: "Analytics rollups",
};

export const dynamic = "force-dynamic";

export default function RollupsPage() {
  const to = new Date();
  const from = new Date(
    to.getTime() -
      24 * 60 * 60 * 1_000,
  );

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Sprint 64 - Read-only operations
        </p>

        <h1>Analytics rollups</h1>

        <p>
          Inspect bounded persisted usage and
          rejected-request rollups through a
          fixed server-only read boundary.
          Rollups are derived analytics only
          and never replace raw-event quota,
          authentication, billing, or audit
          truth.
        </p>
      </header>

      <section
        className="analytics-lookup-card"
        aria-labelledby="rollup-read-title"
      >
        <header>
          <p className="eyebrow">
            Persisted read model
          </p>

          <h2 id="rollup-read-title">
            Rollup inspection
          </h2>

          <p>
            Source-separated, bounded and
            read-only. This page cannot run
            backfills, persist rollups or
            change summary-read runtime
            decisions.
          </p>
        </header>

        <RollupInspectionPanel
          initialFrom={from.toISOString()}
          initialTo={to.toISOString()}
        />
      </section>
    </section>
  );
}