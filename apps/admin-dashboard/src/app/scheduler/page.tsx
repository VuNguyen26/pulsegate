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
    <section className="page-stack operations-page">
      <header className="operations-hero operations-hero-scheduler">
        <div className="operations-hero-copy">
          <p className="operations-eyebrow">
            <span aria-hidden="true" />
            Read-only operations
          </p>

          <h1>Scheduler contract preview</h1>

          <p>
            Review the plan that a background analytics scheduler would
            produce while every runtime invocation and persistence boundary
            remains closed.
          </p>

          <div
            className="operations-hero-badges"
            aria-label="Scheduler preview guarantees"
          >
            <span data-tone="safe">Observational only</span>
            <span>No job start</span>
            <span>No backfill execution</span>
          </div>
        </div>

        <aside
          className="operations-boundary-card"
          aria-label="Scheduler execution boundary"
        >
          <p>Runtime boundary</p>

          <dl>
            <div>
              <dt>Contract</dt>
              <dd>Preview</dd>
            </div>

            <div>
              <dt>Adapter</dt>
              <dd>Not invoked</dd>
            </div>

            <div>
              <dt>Persistence</dt>
              <dd>Blocked</dd>
            </div>
          </dl>

          <small>
            The page can evaluate a plan, but it cannot start a job or
            resolve an execution adapter.
          </small>
        </aside>
      </header>

      <section
        className="operations-surface"
        aria-labelledby="scheduler-preview-title"
      >
        <header className="operations-surface-heading">
          <div>
            <p className="eyebrow">
              Pure contract inspection
            </p>

            <h2 id="scheduler-preview-title">
              Background runner preview
            </h2>
          </div>

          <p>
            Inspect scheduling intent, runtime-gate state, and
            non-destructive evidence through a server-owned read boundary.
          </p>
        </header>

        <SchedulerPreviewPanel />
      </section>
    </section>
  );
}
