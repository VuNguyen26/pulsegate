import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <section className="page-stack content-page getting-started-page">
      <header className="getting-started-hero">
        <p className="eyebrow">3-minute public demo</p>
        <h1>See how requests move through PulseGate.</h1>
        <p>
          The public experience is intentionally read-only: it demonstrates
          routing, health, documentation, analytics, and security boundaries
          without requiring a local environment or privileged credential.
        </p>
      </header>

      <div className="demo-step-grid">
        <article>
          <span className="step-number">1</span>
          <h2>Review the contracts</h2>
          <p>
            Start with the documented health and product routes, headers,
            authentication requirements, and error responses.
          </p>
          <Link className="text-link" href="/api-docs">
            Open API docs →
          </Link>
        </article>

        <article>
          <span className="step-number">2</span>
          <h2>Check the live gateway</h2>
          <p>
            Confirm the Gateway is available, then verify the proxied Product
            Service health route through the same public entry point.
          </p>
          <a
            className="text-link"
            href="https://pulsegate-public-demo-api.onrender.com/health"
          >
            Open Gateway health →
          </a>
        </article>

        <article>
          <span className="step-number">3</span>
          <h2>Inspect operations</h2>
          <p>
            Use the Admin Dashboard to review runtime routes, analytics,
            rollups, scheduler state, and retention previews in read-only mode.
          </p>
          <a
            className="text-link"
            href="https://pulsegate-admin-dashboard.netlify.app"
          >
            Open Admin Dashboard →
          </a>
        </article>
      </div>

      <section className="integration-boundary">
        <p className="eyebrow">Current public boundary</p>
        <h2>Safe to explore without pretending to be a commercial SaaS.</h2>
        <p>
          The demo does not create developer accounts, issue browser-visible
          credentials, or expose privileged administration routes. Public
          API-key issuance remains a documented design boundary until a real
          identity and ownership model exists.
        </p>
        <ul>
          <li>Admin credentials remain server-side.</li>
          <li>The Dashboard exposes read-only inspection only.</li>
          <li>The free-tier backend may cold start after inactivity.</li>
          <li>The full observability stack remains available in local Compose.</li>
        </ul>
      </section>
    </section>
  );
}
