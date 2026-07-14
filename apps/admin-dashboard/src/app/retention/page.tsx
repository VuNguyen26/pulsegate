import type {
  Metadata,
} from "next";

import {
  RetentionPreviewPanel,
} from "../../components/retention-preview-panel";

export const metadata: Metadata = {
  title: "Retention preview",
};

export default function RetentionPage() {
  return (
    <section className="page-stack operations-page">
      <header className="operations-hero operations-hero-retention">
        <div className="operations-hero-copy">
          <p className="operations-eyebrow">
            <span aria-hidden="true" />
            Read-only operations
          </p>

          <h1>Retention safety preview</h1>

          <p>
            Inspect the raw-event population that would fall outside the
            fixed retention window while the deletion path remains
            structurally unavailable.
          </p>

          <div
            className="operations-hero-badges"
            aria-label="Retention preview guarantees"
          >
            <span data-tone="safe">Count-only reads</span>
            <span>90-day policy</span>
            <span>No delete controls</span>
          </div>
        </div>

        <aside
          className="operations-boundary-card"
          aria-label="Retention execution boundary"
        >
          <p>Execution boundary</p>

          <dl>
            <div>
              <dt>Mode</dt>
              <dd>Dry-run</dd>
            </div>

            <div>
              <dt>Policy owner</dt>
              <dd>Server</dd>
            </div>

            <div>
              <dt>Mutation path</dt>
              <dd>Unavailable</dd>
            </div>
          </dl>

          <small>
            The browser cannot supply policy, execution, or deletion
            instructions.
          </small>
        </aside>
      </header>

      <section
        className="operations-surface"
        aria-labelledby="retention-preview-title"
      >
        <header className="operations-surface-heading">
          <div>
            <p className="eyebrow">
              Candidate-count read
            </p>

            <h2 id="retention-preview-title">
              Retention dry-run
            </h2>
          </div>

          <p>
            A bounded database read reports candidate counts and safety
            evidence without importing deletion infrastructure.
          </p>
        </header>

        <RetentionPreviewPanel />
      </section>
    </section>
  );
}
