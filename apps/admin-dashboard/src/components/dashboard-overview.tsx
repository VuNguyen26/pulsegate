import Link from "next/link";

import { RuntimeStatusPanel } from "./runtime-status-panel";
import styles from "./dashboard-overview.module.css";

const controlAreas = [
  {
    href: "/routes",
    icon: "route",
    kicker: "Traffic control",
    title: "Gateway routes",
    copy:
      "Inspect host conditions, weighted upstreams, service discovery targets, and health-aware runtime metadata.",
    action: "Open routes →",
  },
  {
    href: "/usage-analytics",
    icon: "analytics",
    kicker: "Request evidence",
    title: "Usage analytics",
    copy:
      "Explore successful traffic, consumer and API-key summaries, bounded filters, and recent request events.",
    action: "Open analytics →",
  },
  {
    href: "/rejected-events",
    icon: "shield",
    kicker: "Security signal",
    title: "Rejected traffic",
    copy:
      "Review authentication, quota, rate-limit, and downstream rejection evidence without exposing credentials.",
    action: "Review rejections →",
  },
  {
    href: "/rollups",
    icon: "rollup",
    kicker: "Aggregated insight",
    title: "Analytics rollups",
    copy:
      "Inspect persisted usage and rejection rollups through the same read-only operator boundary.",
    action: "Open rollups →",
  },
  {
    href: "/scheduler",
    icon: "schedule",
    kicker: "Runtime planning",
    title: "Scheduler preview",
    copy:
      "Understand the next bounded rollup run while execution remains blocked in the public experience.",
    action: "View scheduler →",
  },
  {
    href: "/retention",
    icon: "retention",
    kicker: "Data lifecycle",
    title: "Retention preview",
    copy:
      "See eligible data windows and safety metadata without exposing destructive retention controls.",
    action: "View retention →",
  },
] as const;

const operatingFlow = [
  ["01", "Configure", "Persist route and policy intent"],
  ["02", "Protect", "Enforce identity, rate, and quota"],
  ["03", "Route", "Resolve a healthy upstream target"],
  ["04", "Observe", "Capture usage, rejection, and trace evidence"],
] as const;

export function DashboardOverview() {
  return (
    <section className={styles.page}>
      <header
        className={styles.hero}
        aria-labelledby="dashboard-overview-title"
      >
        <div className={styles.heroCopy}>
          <div className={styles.eyebrowRow}>
            <span className={styles.liveDot} aria-hidden="true" />
            <span>Public control plane</span>
            <span className={styles.eyebrowDivider} aria-hidden="true" />
            <span>Read-only operator access</span>
          </div>

          <h1 id="dashboard-overview-title">
            Operate the gateway from one guarded surface.
          </h1>

          <p className={styles.heroLead}>
            PulseGate brings route state, runtime health, traffic evidence,
            rollups, scheduling, and retention previews into a control plane
            that keeps privileged credentials and mutation controls off the
            browser boundary.
          </p>

          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/routes">
              Inspect routes
              <ArrowIcon />
            </Link>

            <Link className={styles.secondaryAction} href="/usage-analytics">
              Review analytics
            </Link>

            <a
              className={styles.textAction}
              href="https://pulsegate-developer-portal.netlify.app"
            >
              Developer Portal
              <ExternalIcon />
            </a>
          </div>

          <ul className={styles.trustList} aria-label="Control plane guarantees">
            <li>
              <CheckIcon />
              Server-held Admin credential
            </li>
            <li>
              <CheckIcon />
              Mutation controls disabled
            </li>
            <li>
              <CheckIcon />
              Live runtime metadata
            </li>
          </ul>
        </div>

        <ControlPlanePreview />
      </header>

      <section
        className={styles.statusSection}
        aria-labelledby="runtime-status-heading"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionKicker}>Live system status</p>
            <h2 id="runtime-status-heading">
              Runtime evidence, without browser secrets.
            </h2>
          </div>

          <p>
            The Dashboard server reads bounded Admin API metadata and returns
            only safe operational fields to the public interface.
          </p>
        </div>

        <div className={styles.statusGrid}>
          <div className={styles.runtimeSurface}>
            <RuntimeStatusPanel />
          </div>

          <aside
            className={styles.availabilityCard}
            aria-label="Public demo availability"
          >
            <div className={styles.availabilityIcon} aria-hidden="true">
              <PulseIcon />
            </div>

            <p className={styles.cardKicker}>Public runtime</p>
            <h3>Free-tier wake-up window</h3>
            <p>
              The backend can need up to about a minute to wake after
              inactivity. Retry the first connectivity check once while the
              runtime starts.
            </p>

            <a href="https://pulsegate-public-demo-api.onrender.com/health">
              Check Gateway health
              <ArrowIcon />
            </a>
          </aside>
        </div>
      </section>

      <section className={styles.controlSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionKicker}>Operator workspace</p>
            <h2>Move from traffic intent to operational evidence.</h2>
          </div>

          <p>
            Each surface is focused on one bounded responsibility so the
            public demo feels like an operator product rather than a collection
            of disconnected administration pages.
          </p>
        </div>

        <div className={styles.controlGrid}>
          {controlAreas.map((area) => (
            <Link key={area.href} className={styles.controlCard} href={area.href}>
              <div className={styles.controlCardTopline}>
                <span className={styles.controlIcon} aria-hidden="true">
                  <ControlIcon name={area.icon} />
                </span>
                <small>{area.kicker}</small>
              </div>

              <h3>{area.title}</h3>
              <p>{area.copy}</p>
              <span className={styles.cardAction}>{area.action}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.flowSection}>
        <div className={styles.flowCopy}>
          <p className={styles.sectionKicker}>Gateway lifecycle</p>
          <h2>One request. Four visible decisions.</h2>
          <p>
            PulseGate makes every request move through a consistent operating
            model. The same path that protects an upstream also creates the
            evidence needed to explain the result.
          </p>
        </div>

        <ol className={styles.flowList}>
          {operatingFlow.map(([number, title, copy]) => (
            <li key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}

function ControlPlanePreview() {
  return (
    <div
      className={styles.preview}
      role="img"
      aria-label="PulseGate control plane request flow"
    >
      <div className={styles.previewChrome}>
        <div>
          <span />
          <span />
          <span />
        </div>
        <p>control-plane / live request</p>
        <small>connected</small>
      </div>

      <div className={styles.previewBody}>
        <div className={styles.requestBar}>
          <span>GET</span>
          <code>/api/products</code>
          <strong>200</strong>
        </div>

        <div className={styles.previewFlow}>
          <PreviewNode
            index="01"
            label="Identity boundary"
            value="API key verified"
            status="pass"
          />
          <PreviewNode
            index="02"
            label="Policy engine"
            value="Rate + quota allowed"
            status="pass"
          />
          <PreviewNode
            index="03"
            label="Runtime registry"
            value="Healthy target selected"
            status="active"
          />
          <PreviewNode
            index="04"
            label="Telemetry"
            value="Trace + usage captured"
            status="signal"
          />
        </div>

        <div className={styles.previewFooter}>
          <span>
            <PulseIcon />
            42 ms end-to-end
          </span>
          <code>req_7f29a1</code>
        </div>
      </div>
    </div>
  );
}

function PreviewNode({
  index,
  label,
  value,
  status,
}: {
  index: string;
  label: string;
  value: string;
  status: "pass" | "active" | "signal";
}) {
  return (
    <div className={styles.previewNode} data-status={status}>
      <span>{index}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
      <i aria-hidden="true" />
    </div>
  );
}

function ControlIcon({
  name,
}: {
  name: (typeof controlAreas)[number]["icon"];
}) {
  if (name === "route") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 5v4c0 2.2 1.8 4 4 4h7" />
        <path d="m13 10 3 3-3 3" />
        <circle cx="5" cy="5" r="2" />
        <circle cx="18" cy="13" r="2" />
      </svg>
    );
  }

  if (name === "analytics") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 19V9" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
        <path d="M3 19h18" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 3 5.5 6v5.3c0 4.2 2.6 7.8 6.5 9.7 3.9-1.9 6.5-5.5 6.5-9.7V6z" />
        <path d="m9.5 12 1.7 1.7 3.6-4" />
      </svg>
    );
  }

  if (name === "rollup") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 7h14" />
        <path d="M7 12h10" />
        <path d="M9 17h6" />
        <path d="m17 4 2 3-2 3" />
      </svg>
    );
  }

  if (name === "schedule") {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 7h12" />
      <path d="m9 7 .8-3h4.4l.8 3" />
      <path d="m8 10 .7 9h6.6l.7-9" />
      <path d="M10 13v3M14 13v3" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11" />
      <path d="m11 6 4 4-4 4" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8 5H5v10h10v-3" />
      <path d="M11 5h4v4" />
      <path d="m9 11 6-6" />
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
