import type { Metadata } from "next";

import {
  RejectedEventsPanel,
} from "../../components/rejected-events-panel";
import styles from "../analytics-workspace.module.css";

export const metadata: Metadata = {
  title: "Rejected events",
};

const rejectionStages = [
  {
    number: "01",
    title: "Edge decision",
    copy: "Authentication, quota, rate, or policy blocks traffic.",
  },
  {
    number: "02",
    title: "Reason bucket",
    copy: "A bounded rejection category explains the outcome.",
  },
  {
    number: "03",
    title: "Event evidence",
    copy: "Safe request context is retained for operator review.",
  },
] as const;

const boundaries = [
  {
    title: "Authentication",
    copy: "Missing, invalid, or disallowed identities.",
  },
  {
    title: "Rate limits",
    copy: "Requests blocked by bounded traffic policy.",
  },
  {
    title: "Quota",
    copy: "Current-window usage beyond assigned capacity.",
  },
  {
    title: "Policy",
    copy: "Fail-closed request validation and gateway controls.",
  },
] as const;

export default function RejectedEventsPage() {
  return (
    <section
      className={`${styles.workspace} page-stack`}
      data-surface="rejected"
    >
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            Public Demo - Read-only rejection analytics
          </p>

          <h1>Rejected events</h1>

          <p className={styles.heroLead}>
            Review bounded Gateway authentication, rate-limit, and
            quota rejection events through fixed server-only read
            boundaries. These events remain separate from successful
            usage totals, and raw rejection metadata is never
            rendered.
          </p>

          <div
            className={styles.heroBadges}
            aria-label="Rejected analytics guarantees"
          >
            <span>Fail-closed evidence</span>
            <span>Safe metadata only</span>
            <span>No mutation controls</span>
          </div>
        </div>

        <aside
          className={styles.signalPanel}
          aria-label="Rejected request evidence flow"
        >
          <div className={styles.panelChrome}>
            <span>gateway / rejection path</span>
            <strong data-tone="warning">
              <i aria-hidden="true" />
              blocked
            </strong>
          </div>

          <ol className={styles.signalFlow}>
            {rejectionStages.map((stage) => (
              <li key={stage.number}>
                <span>{stage.number}</span>
                <div>
                  <strong>{stage.title}</strong>
                  <p>{stage.copy}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.panelFooter}>
            <ShieldIcon />
            <span>Rejected traffic never enters successful totals</span>
          </div>
        </aside>
      </header>

      <section
        className={styles.workspaceSection}
        aria-labelledby="rejection-boundaries-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionKicker}>
              Enforcement boundaries
            </p>
            <h2 id="rejection-boundaries-title">
              Understand why the gateway refused traffic.
            </h2>
          </div>

          <p>
            The surface groups safe rejection evidence by operational
            reason and status. Sensitive raw metadata, secrets, and
            administrative controls stay outside the browser boundary.
          </p>
        </div>

        <div
          className={styles.modelMap}
          aria-label="Rejected request boundary categories"
        >
          {boundaries.map((boundary, index) => (
            <article key={boundary.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{boundary.title}</strong>
                <p>{boundary.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className={styles.streamSection}
        aria-labelledby="rejected-events-title"
      >
        <div className={styles.streamHeading}>
          <div
            className={styles.streamIcon}
            data-tone="danger"
            aria-hidden="true"
          >
            <ShieldIcon />
          </div>

          <div>
            <p className={styles.sectionKicker}>
              Rejected request stream
            </p>
            <h2 id="rejected-events-title">
              Rejection summary and events
            </h2>
            <p>
              Apply bounded filters and navigate through opaque cursor
              pagination. Offset pagination, rollup switches, raw
              metadata, and mutation controls are not exposed.
            </p>
          </div>
        </div>

        <aside className={styles.safetyRail}>
          <div>
            <strong>Rendered</strong>
            <span>
              Reason, status, route, identity reference, and request ID
            </span>
          </div>

          <div>
            <strong>Never rendered</strong>
            <span>
              Secrets, raw rejection payloads, and mutation controls
            </span>
          </div>
        </aside>

        <div className={styles.embeddedSurface}>
          <RejectedEventsPanel />
        </div>
      </section>
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5.5 6v5.3c0 4.2 2.6 7.8 6.5 9.7 3.9-1.9 6.5-5.5 6.5-9.7V6z" />
      <path d="M9 9l6 6" />
      <path d="m15 9-6 6" />
    </svg>
  );
}
