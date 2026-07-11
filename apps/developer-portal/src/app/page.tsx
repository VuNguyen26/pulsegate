import Link from "next/link";

export default function OverviewPage() {
  return (
    <section className="page-stack">
      <div className="hero">
        <p className="eyebrow">Sprint 65</p>
        <h1>Build against PulseGate with a clear public boundary.</h1>
        <p>
          This foundation introduces the developer-facing experience
          without exposing Admin credentials, internal routes, or fake
          account and API-key behavior.
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
          <h2>Next milestone</h2>
          <p>API documentation and API-key self-service foundations arrive in Sprint 66.</p>
        </article>
      </div>
    </section>
  );
}
