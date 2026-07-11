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
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Sprint 64 - Read-only operations
        </p>

        <h1>Retention preview</h1>

        <p>
          Inspect dry-run raw-event
          candidate counts under a fixed
          90-day policy without importing
          deletion infrastructure or
          executing retention.
        </p>
      </header>

      <section
        className="analytics-lookup-card"
        aria-labelledby="retention-preview-title"
      >
        <header>
          <p className="eyebrow">
            Candidate-count read
          </p>

          <h2 id="retention-preview-title">
            Retention dry-run
          </h2>

          <p>
            Browser-supplied policy,
            execution and deletion controls
            are intentionally unavailable.
            The route performs count-only
            database reads.
          </p>
        </header>

        <RetentionPreviewPanel />
      </section>
    </section>
  );
}