import type { ReactNode } from "react";

import styles from "./registry-workspace.module.css";

export type RegistryWorkspaceTone =
  | "routes"
  | "consumers"
  | "keys"
  | "plans";

export type RegistryWorkspaceIcon =
  | "route"
  | "policy"
  | "target"
  | "health"
  | "identity"
  | "ownership"
  | "audit"
  | "key"
  | "redact"
  | "quota"
  | "window"
  | "status";

export type RegistryWorkspaceStep = {
  label: string;
  title: string;
  detail: string;
};

export type RegistryWorkspaceCapability = {
  icon: RegistryWorkspaceIcon;
  eyebrow: string;
  title: string;
  description: string;
};

export function RegistryWorkspace({
  tone,
  eyebrow,
  title,
  description,
  badges,
  previewLabel,
  previewTitle,
  steps,
  capabilities,
  boundaryTitle,
  boundaryItems,
  children,
}: {
  tone: RegistryWorkspaceTone;
  eyebrow: string;
  title: string;
  description: string;
  badges: readonly string[];
  previewLabel: string;
  previewTitle: string;
  steps: readonly RegistryWorkspaceStep[];
  capabilities: readonly RegistryWorkspaceCapability[];
  boundaryTitle: string;
  boundaryItems: readonly string[];
  children: ReactNode;
}) {
  return (
    <section
      className={styles.page}
      data-workspace={tone}
    >
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <span aria-hidden="true" />
            {eyebrow}
          </div>

          <h1>{title}</h1>
          <p>{description}</p>

          <div
            className={styles.badges}
            aria-label="Workspace guarantees"
          >
            {badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>

        <div
          className={styles.preview}
          role="img"
          aria-label={`${previewTitle} control flow`}
        >
          <div className={styles.previewChrome}>
            <span />
            <span />
            <span />
            <p>PulseGate control plane</p>
            <small>read only</small>
          </div>

          <div className={styles.previewBody}>
            <div className={styles.previewHeading}>
              <span>{previewLabel}</span>
              <strong>{previewTitle}</strong>
            </div>

            <ol className={styles.stepList}>
              {steps.map((step, index) => (
                <li key={`${step.label}-${step.title}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <small>{step.label}</small>
                    <strong>{step.title}</strong>
                    <p>{step.detail}</p>
                  </div>
                  <CheckIcon />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </header>

      <section
        className={styles.capabilityGrid}
        aria-label={`${eyebrow} capabilities`}
      >
        {capabilities.map((capability) => (
          <article key={capability.title}>
            <div className={styles.capabilityIcon}>
              <WorkspaceIcon name={capability.icon} />
            </div>
            <p>{capability.eyebrow}</p>
            <h2>{capability.title}</h2>
            <span>{capability.description}</span>
          </article>
        ))}
      </section>

      <aside className={styles.boundary}>
        <div className={styles.boundaryIcon}>
          <ShieldIcon />
        </div>

        <div>
          <p>Public demo boundary</p>
          <h2>{boundaryTitle}</h2>
        </div>

        <ul>
          {boundaryItems.map((item) => (
            <li key={item}>
              <CheckIcon />
              {item}
            </li>
          ))}
        </ul>
      </aside>

      <div className={styles.resourceRegion}>
        <div className={styles.resourceHeading}>
          <div>
            <p>Live read model</p>
            <h2>Inspect the configured workspace</h2>
          </div>
          <span>
            Data is loaded through the server-only Dashboard BFF.
          </span>
        </div>

        {children}
      </div>
    </section>
  );
}

function WorkspaceIcon({
  name,
}: {
  name: RegistryWorkspaceIcon;
}) {
  if (name === "route") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M7 6h4a4 4 0 0 1 4 4v4" />
        <path d="m12 11 3 3 3-3" />
      </svg>
    );
  }

  if (name === "policy") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <path d="m16 8 4-4M17 4h3v3" />
      </svg>
    );
  }

  if (name === "health") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M3 12h4l2-5 4 10 2-5h6" />
      </svg>
    );
  }

  if (name === "identity") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" />
      </svg>
    );
  }

  if (name === "ownership") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="7" cy="12" r="3" />
        <path d="M10 12h9M16 9l3 3-3 3" />
      </svg>
    );
  }

  if (name === "audit") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h5M8 16h7" />
      </svg>
    );
  }

  if (name === "key") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="8" cy="12" r="4" />
        <path d="M12 12h9M18 12v3M15 12v2" />
      </svg>
    );
  }

  if (name === "redact") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 7h16v10H4z" />
        <path d="M8 12h1M12 12h1M16 12h1" />
      </svg>
    );
  }

  if (name === "quota") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 18V9M10 18V5M15 18v-7M20 18V7" />
      </svg>
    );
  }

  if (name === "window") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 5h14v14H5z" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5.5 6v5.3c0 4.2 2.6 7.8 6.5 9.7 3.9-1.9 6.5-5.5 6.5-9.7V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 10 3 3 7-7" />
    </svg>
  );
}
