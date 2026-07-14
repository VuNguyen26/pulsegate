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
    <section className="page-stack operations-page">
      <header className="operations-hero operations-hero-rollups">
        <div className="operations-hero-copy">
          <p className="operations-eyebrow">
            <span aria-hidden="true" />
            Derived analytics
          </p>

          <h1>Persisted rollup explorer</h1>

          <p>
            Inspect hourly usage and rejection aggregates across a bounded
            24-hour window without changing source events, quota truth, or
            summary-read decisions.
          </p>

          <div
            className="operations-hero-badges"
            aria-label="Rollup inspection guarantees"
          >
            <span data-tone="safe">Read-only model</span>
            <span>Hourly buckets</span>
            <span>24-hour window</span>
          </div>
        </div>

        <aside
          className="operations-boundary-card"
          aria-label="Rollup data boundary"
        >
          <p>Data boundary</p>

          <dl>
            <div>
              <dt>Sources</dt>
              <dd>Usage + rejected</dd>
            </div>

            <div>
              <dt>Granularity</dt>
              <dd>Hourly</dd>
            </div>

            <div>
              <dt>Quota truth</dt>
              <dd>Raw events</dd>
            </div>
          </dl>

          <small>
            Rollups are derived analytics. They never replace
            authentication, billing, quota, or audit truth.
          </small>
        </aside>
      </header>

      <section
        className="operations-surface"
        aria-labelledby="rollup-read-title"
      >
        <header className="operations-surface-heading">
          <div>
            <p className="eyebrow">
              Persisted read model
            </p>

            <h2 id="rollup-read-title">
              Rollup inspection
            </h2>
          </div>

          <p>
            Switch between successful usage and rejected-request buckets,
            then inspect bounded summaries and table evidence.
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
