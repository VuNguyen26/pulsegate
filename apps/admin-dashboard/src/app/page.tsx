import { RuntimeStatusPanel } from "@/components/runtime-status-panel";

export default function OverviewPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Sprint 61</p>
        <h1>Admin Dashboard foundation</h1>
        <p>
          A secure, read-only administration shell for
          PulseGate with server-only Gateway connectivity.
        </p>
      </header>

      <RuntimeStatusPanel />

      <div className="content-grid">
        <article className="content-card">
          <h2>Application shell</h2>
          <p>
            Responsive navigation, accessible page structure,
            loading, error, and not-found boundaries.
          </p>
        </article>

        <article className="content-card">
          <h2>Security boundary</h2>
          <p>
            Admin credentials remain server-side and are never
            sent to browser code or browser storage.
          </p>
        </article>

        <article className="content-card">
          <h2>Current scope</h2>
          <p>
            No mutations, fake analytics, scheduler execution,
            or retention actions are exposed.
          </p>
        </article>
      </div>
    </section>
  );
}
