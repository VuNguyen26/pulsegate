import type { Metadata } from "next";

import {
  UsageEventsPanel,
} from "../../components/usage-events-panel";
import {
  UsageSummaryLookups,
} from "../../components/usage-summary-lookups";
import styles from "../analytics-workspace.module.css";

export const metadata: Metadata = {
  title: "Usage analytics",
};

const usageSignals = [
  {
    number: "01",
    title: "Event stream",
    copy: "Successful request records only",
  },
  {
    number: "02",
    title: "Identity summaries",
    copy: "Consumer and API-key read models",
  },
  {
    number: "03",
    title: "Quota posture",
    copy: "Current bounded enforcement state",
  },
  {
    number: "04",
    title: "Plan consumption",
    copy: "Windowed usage-plan evidence",
  },
] as const;

const readModels = [
  {
    title: "Consumer",
    copy: "Aggregate successful traffic by consumer identity.",
  },
  {
    title: "API key",
    copy: "Inspect a key identifier without exposing key material.",
  },
  {
    title: "Quota state",
    copy: "Read the active plan, limit, and current-window posture.",
  },
  {
    title: "Usage plan",
    copy: "Understand assigned keys and bounded plan consumption.",
  },
] as const;

export default function UsageAnalyticsPage() {
  return (
    <section
      className={`${styles.workspace} page-stack`}
      data-surface="usage"
    >
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            Public Demo - Read-only analytics
          </p>

          <h1>Usage analytics</h1>

          <p className={styles.heroLead}>
            Inspect successful Gateway usage, API-key quota state,
            and usage-plan consumption through fixed server-only
            read boundaries. Rejected request events remain separate
            and are not included in these totals.
          </p>

          <div
            className={styles.heroBadges}
            aria-label="Usage analytics guarantees"
          >
            <span>Successful traffic only</span>
            <span>Server-only BFF</span>
            <span>Opaque cursor pagination</span>
          </div>
        </div>

        <aside
          className={styles.signalPanel}
          aria-label="Successful request read model"
        >
          <div className={styles.panelChrome}>
            <span>usage / request model</span>
            <strong>
              <i aria-hidden="true" />
              live
            </strong>
          </div>

          <ol className={styles.signalFlow}>
            {usageSignals.map((signal) => (
              <li key={signal.number}>
                <span>{signal.number}</span>
                <div>
                  <strong>{signal.title}</strong>
                  <p>{signal.copy}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.panelFooter}>
            <PulseIcon />
            <span>Read model stays separate from rejected traffic</span>
          </div>
        </aside>
      </header>

      <section
        className={styles.workspaceSection}
        aria-labelledby="usage-intelligence-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionKicker}>
              Identity and quota intelligence
            </p>
            <h2 id="usage-intelligence-title">
              Move from request identity to quota evidence.
            </h2>
          </div>

          <p>
            Every lookup stays explicit and bounded. No request is
            made until an identifier is submitted, and no browser
            credential is exposed to the public surface.
          </p>
        </div>

        <div
          className={styles.modelMap}
          aria-label="Available usage read models"
        >
          {readModels.map((model, index) => (
            <article key={model.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{model.title}</strong>
                <p>{model.copy}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.embeddedSurface}>
          <UsageSummaryLookups />
        </div>
      </section>

      <section
        className={styles.streamSection}
        aria-labelledby="successful-events-title"
      >
        <div className={styles.streamHeading}>
          <div className={styles.streamIcon} aria-hidden="true">
            <StreamIcon />
          </div>

          <div>
            <p className={styles.sectionKicker}>
              Successful request stream
            </p>
            <h2 id="successful-events-title">
              Successful usage events
            </h2>
            <p>
              Apply bounded filters and navigate with opaque cursor
              pagination. Offset pagination and rollup switches are
              not exposed.
            </p>
          </div>
        </div>

        <div className={styles.embeddedSurface}>
          <UsageEventsPanel />
        </div>
      </section>
    </section>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

function StreamIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 7h11" />
      <path d="M4 12h16" />
      <path d="M4 17h8" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="15" cy="17" r="2" />
    </svg>
  );
}
