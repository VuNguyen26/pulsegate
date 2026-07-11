import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API-key foundation",
  description:
    "A non-operational preview of the future PulseGate API-key self-service boundary.",
};

const futureWorkflow = [
  {
    title: "Establish developer identity",
    description:
      "A future authentication boundary must identify the developer without using an Admin credential.",
  },
  {
    title: "Resolve API consumer ownership",
    description:
      "The backend must prove which API consumer and keys the authenticated developer is allowed to manage.",
  },
  {
    title: "Issue a key once",
    description:
      "A browser-safe issuance contract must return a new secret only once and must never expose stored key hashes.",
  },
  {
    title: "Store the secret safely",
    description:
      "The developer must move the secret into an approved secret manager or protected runtime environment.",
  },
  {
    title: "Revoke or rotate deliberately",
    description:
      "Future lifecycle actions require explicit authorization, audit attribution, and safe confirmation behavior.",
  },
] as const;

const contractGaps = [
  "No public developer identity exists.",
  "No developer-to-consumer ownership mapping exists.",
  "No browser-safe API-key self-service endpoint exists.",
  "Existing key lifecycle operations remain private administrative capabilities.",
] as const;

const safetyGuidance = [
  "Never place an API key in a URL or query string.",
  "Never commit an API key to source control.",
  "Never render an API key into public HTML.",
  "Do not store an API key in browser local or session storage.",
  "Treat a newly issued raw key as a one-time secret.",
  "Revoke a key immediately when exposure is suspected.",
] as const;

export default function ApiKeysPage() {
  return (
    <section className="page-stack key-page">
      <header className="key-hero">
        <p className="eyebrow">Available in Sprint 66</p>
        <h1>API-key self-service foundation.</h1>
        <p>
          This page defines the expected security and ownership boundary for a
          future developer workflow. It is not connected to an account,
          session, database, or API-key mutation endpoint.
        </p>

        <div className="docs-status-row" aria-label="API-key foundation status">
          <span className="status-badge">Foundation</span>
          <span className="status-badge status-badge-muted">
            Not connected
          </span>
          <span className="status-badge status-badge-warning">
            No key will be created
          </span>
        </div>
      </header>

      <section
        className="key-boundary-panel"
        aria-labelledby="current-capability-title"
      >
        <div>
          <p className="section-kicker">Current capability</p>
          <h2 id="current-capability-title">
            Self-service remains intentionally non-operational.
          </h2>
        </div>

        <ul className="capability-list">
          <li>
            <strong>API documentation:</strong> available as a verified static
            reference.
          </li>
          <li>
            <strong>Key issuance:</strong> unavailable through this Portal.
          </li>
          <li>
            <strong>Key listing:</strong> unavailable through this Portal.
          </li>
          <li>
            <strong>Key revocation or rotation:</strong> unavailable through
            this Portal.
          </li>
        </ul>
      </section>

      <div className="key-content-grid">
        <section
          className="key-section"
          aria-labelledby="contract-gaps-title"
        >
          <p className="section-kicker">Contract gaps</p>
          <h2 id="contract-gaps-title">
            Real self-service requires identity and ownership first.
          </h2>
          <p>
            The current backend can manage API keys only through a privileged
            administrative boundary. Exposing that boundary to this public
            Portal would bypass developer authentication and ownership checks.
          </p>

          <ul className="contract-gap-list">
            {contractGaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </section>

        <section
          className="key-section"
          aria-labelledby="current-state-title"
        >
          <p className="section-kicker">Current state</p>
          <h2 id="current-state-title">No developer key data is displayed.</h2>
          <div className="empty-key-state" role="status">
            <strong>No connected API-key account</strong>
            <p>
              There is no fake developer, sample key, secret value, usage
              record, or successful issuance state on this page.
            </p>
          </div>
        </section>
      </div>

      <section
        className="key-section"
        aria-labelledby="future-workflow-title"
      >
        <p className="section-kicker">Future workflow</p>
        <h2 id="future-workflow-title">
          Expected stages after a real public contract exists.
        </h2>
        <p>
          These stages describe a future design boundary. They do not execute
          any request and do not represent an available backend workflow.
        </p>

        <ol className="workflow-steps">
          {futureWorkflow.map((step, index) => (
            <li key={step.title}>
              <span aria-hidden="true">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="key-section"
        aria-labelledby="key-safety-title"
      >
        <p className="section-kicker">Credential safety</p>
        <h2 id="key-safety-title">Prepare for safe key handling.</h2>

        <ul className="security-guidance-list">
          {safetyGuidance.map((guidance) => (
            <li key={guidance}>{guidance}</li>
          ))}
        </ul>
      </section>

      <aside className="key-next-step" aria-labelledby="key-next-step-title">
        <h2 id="key-next-step-title">What must happen before activation?</h2>
        <p>
          A future Sprint must introduce and review developer authentication,
          ownership mapping, browser-safe authorization, mutation protection,
          and audit attribution before any real key lifecycle action can be
          connected.
        </p>
      </aside>
    </section>
  );
}