import Link from "next/link";

export default function OverviewPage() {
  return (
    <section className="page-stack portal-home">
      <div className="hero">
        <p className="eyebrow">Public Demo v2.0.0</p>
        <h1>
          Explore a product-oriented API gateway built for routing,
          security, and observability.
        </h1>
        <p className="hero-copy">
          PulseGate combines dynamic routing, authentication, rate limiting,
          caching, resilience policies, analytics, and operational tooling in
          a TypeScript platform that is easy to inspect and demonstrate.
        </p>

        <div className="hero-actions">
          <Link className="primary-link" href="/api-docs">
            Explore API docs
          </Link>
          <a
            className="secondary-link"
            href="https://pulsegate-admin-dashboard.netlify.app"
          >
            Open Admin Dashboard
          </a>
          <a
            className="text-link"
            href="https://github.com/VuNguyen26/pulsegate"
          >
            View source
          </a>
        </div>
      </div>

      <aside
        className="demo-notice"
        aria-label="Public demo availability"
      >
        <strong>Free-tier availability</strong>
        <p>
          The public API may take up to about a minute to wake after
          inactivity. Retry once if the first health request is unavailable.
        </p>
      </aside>

      <div className="card-grid">
        <Link className="feature-card" href="/getting-started">
          <span className="card-kicker">Demo flow</span>
          <h2>Getting started</h2>
          <p>
            Follow a short path through public health checks, API contracts,
            and the read-only operator experience.
          </p>
          <span className="card-link">Start the tour →</span>
        </Link>

        <Link className="feature-card" href="/api-docs">
          <span className="card-kicker">Integration</span>
          <h2>Public API docs</h2>
          <p>
            Review live endpoints, required headers, authentication rules,
            and the normalized downstream error model.
          </p>
          <span className="card-link">Read the contracts →</span>
        </Link>

        <Link className="feature-card" href="/api-keys">
          <span className="card-kicker">Security boundary</span>
          <h2>API-key design</h2>
          <p>
            Understand the current authentication model and why public key
            issuance remains intentionally outside this portfolio demo.
          </p>
          <span className="card-link">Review the boundary →</span>
        </Link>
      </div>
    </section>
  );
}
