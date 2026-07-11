import Link from "next/link";

export default function OverviewPage() {
  return (
    <section className="page-stack">
      <div className="hero">
        <p className="eyebrow">Sprint 66</p>
        <h1>Build against PulseGate with a clear public boundary.</h1>
        <p>
          The Developer Portal now includes bounded public API documentation
          without exposing privileged management operations, credentials, or
          fake account and API-key behavior.
        </p>
        <Link className="primary-link" href="/getting-started">
          Explore getting started
        </Link>
      </div>

      <div className="card-grid">
        <article>
          <h2>Platform overview</h2>
          <p>Understand the role of PulseGate in front of downstream APIs.</p>
        </article>
        <article>
          <h2>Safe foundation</h2>
          <p>No authentication, billing, database, or Admin API integration.</p>
        </article>
        <article>
          <h2>API documentation</h2>
          <p>Review verified public routes, authentication, headers, and errors.</p>
        </article>
      </div>
    </section>
  );
}
