import type {
  Metadata,
} from "next";

import {
  SchedulerPreviewPanel,
} from "../../components/scheduler-preview-panel";

export const metadata: Metadata = {
  title: "Scheduler preview",
};

export default function SchedulerPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Public Demo - Read-only operations
        </p>

        <h1>Scheduler preview</h1>

        <p>
          Review the background analytics
          scheduler contract without starting
          jobs, invoking runtime adapters,
          executing backfill or changing
          persisted rollups.
        </p>
      </header>

      <section
        className="analytics-lookup-card"
        aria-labelledby="scheduler-preview-title"
      >
        <header>
          <p className="eyebrow">
            Observational contract
          </p>

          <h2 id="scheduler-preview-title">
            Background scheduler state
          </h2>

          <p>
            The preview uses fixed,
            server-owned inputs. Browser
            query parameters and execution
            controls are intentionally
            unavailable.
          </p>
        </header>

        <SchedulerPreviewPanel />
      </section>
    </section>
  );
}