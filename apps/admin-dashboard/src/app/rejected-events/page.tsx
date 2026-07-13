import type { Metadata } from "next";

import {
  RejectedEventsPanel,
} from "../../components/rejected-events-panel";

export const metadata: Metadata = {
  title: "Rejected events",
};

export default function RejectedEventsPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Public Demo - Read-only rejection analytics
        </p>
        <h1>Rejected events</h1>
        <p>
          Review bounded Gateway authentication,
          rate-limit, and quota rejection events through
          fixed server-only read boundaries. These events
          remain separate from successful usage totals,
          and raw rejection metadata is never rendered.
        </p>
      </header>

      <section
        className="analytics-lookup-card"
        aria-labelledby="rejected-events-title"
      >
        <header>
          <p className="eyebrow">
            Rejected request stream
          </p>
          <h2 id="rejected-events-title">
            Rejection summary and events
          </h2>
          <p>
            Apply bounded filters and navigate through
            opaque cursor pagination. Offset pagination,
            rollup switches, raw metadata, and mutation
            controls are not exposed.
          </p>
        </header>

        <RejectedEventsPanel />
      </section>
    </section>
  );
}
