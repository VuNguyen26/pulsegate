export default function OverviewPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Sprint 61</p>
        <h1>Admin Dashboard foundation</h1>
        <p>
          A secure, read-only administration shell for PulseGate.
          Protected Gateway connectivity will be added through a
          server-only boundary.
        </p>
      </header>

      <div className="content-grid">
        <article className="content-card">
          <h2>Application shell</h2>
          <p>
            Responsive navigation, accessible page structure, loading,
            error, and not-found boundaries.
          </p>
        </article>

        <article className="content-card">
          <h2>Security boundary</h2>
          <p>
            Admin credentials will remain server-side and will never be
            sent to the browser.
          </p>
        </article>

        <article className="content-card">
          <h2>Current scope</h2>
          <p>
            No mutations, fake analytics, scheduler execution, or
            retention actions are exposed.
          </p>
        </article>
      </div>
    </section>
  );
}