import Link from "next/link";

import { RuntimeStatusPanel } from "@/components/runtime-status-panel";

export default function OverviewPage() {
  return (
    <section className="page-stack">
      <header className="page-header overview-header">
        <p className="eyebrow">Read-only public demo</p>
        <h1>Inspect PulseGate from one secure control plane.</h1>
        <p>
          Review route configuration, runtime health, usage and rejection
          analytics, rollups, scheduler state, and retention previews without
          exposing privileged credentials or mutation controls.
        </p>

        <div className="overview-actions">
          <Link className="primary-button" href="/routes">
            Inspect routes
          </Link>
          <Link className="secondary-button" href="/usage-analytics">
            View analytics
          </Link>
          <a
            className="secondary-button"
            href="https://pulsegate-developer-portal.netlify.app"
          >
            Developer Portal
          </a>
        </div>
      </header>

      <RuntimeStatusPanel />

      <aside
        className="demo-notice"
        aria-label="Public demo availability"
      >
        <strong>Free-tier demo</strong>
        <p>
          The backend may take up to about a minute to wake after inactivity.
          Retry once if the first connectivity check is unavailable.
        </p>
      </aside>

      <div className="content-grid overview-grid">
        <Link className="content-card overview-card" href="/routes">
          <span className="card-kicker">Routing</span>
          <h2>Gateway routes</h2>
          <p>
            Inspect persisted and runtime routes, host conditions, weighted
            upstreams, service discovery, and health-aware routing metadata.
          </p>
          <span className="card-link">Open routes →</span>
        </Link>

        <Link
          className="content-card overview-card"
          href="/usage-analytics"
        >
          <span className="card-kicker">Analytics</span>
          <h2>Traffic insights</h2>
          <p>
            Explore successful requests, quota summaries, rejected traffic,
            and bounded event filters through read-only views.
          </p>
          <span className="card-link">Open analytics →</span>
        </Link>

        <Link className="content-card overview-card" href="/rollups">
          <span className="card-kicker">Operations</span>
          <h2>Rollups and previews</h2>
          <p>
            Review persisted analytics rollups plus scheduler and retention
            previews without executing destructive operations.
          </p>
          <span className="card-link">Open rollups →</span>
        </Link>
      </div>
    </section>
  );
}
