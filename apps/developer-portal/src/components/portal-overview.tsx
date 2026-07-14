import Link from "next/link";

import styles from "./portal-overview.module.css";

const capabilities = [
  {
    icon: "route",
    kicker: "Traffic control",
    title: "Route with intent",
    copy:
      "Host rules, weighted upstreams, service discovery, retries, timeouts, and transforms stay visible as one request policy.",
  },
  {
    icon: "shield",
    kicker: "Security boundary",
    title: "Protect every edge",
    copy:
      "API keys, JWT checks, quotas, rate limits, request limits, and fail-closed errors are enforced before upstream traffic is released.",
  },
  {
    icon: "pulse",
    kicker: "Operational signal",
    title: "Explain what happened",
    copy:
      "Usage analytics, rejection events, traces, metrics, and structured logs make each request path inspectable from one control surface.",
  },
] as const;

const proofPoints = [
  ["1,474", "automated tests"],
  ["3", "public product surfaces"],
  ["0", "browser-exposed secrets"],
  ["v2.0.0", "released platform"],
] as const;

const requestStages = [
  ["01", "Authenticate", "API key or JWT boundary"],
  ["02", "Enforce", "Rate, quota, size, and policy"],
  ["03", "Resolve", "Host, service, and weighted target"],
  ["04", "Observe", "Trace, metric, log, and analytics"],
] as const;

export function PortalOverview() {
  return (
    <div className={styles.page}>
      <section
        className={styles.hero}
        aria-labelledby="portal-overview-title"
      >
        <div className={styles.heroCopy}>
          <div className={styles.eyebrowRow}>
            <span className={styles.liveDot} aria-hidden="true" />
            <span>Public demo v2.0.0</span>
            <span className={styles.eyebrowDivider} aria-hidden="true" />
            <span>Read-only portfolio</span>
          </div>

          <h1 id="portal-overview-title">
            One gateway.
            <span> Every request visible.</span>
          </h1>

          <p className={styles.heroLead}>
            PulseGate brings routing, security, resilience, analytics, and
            runtime observability into one TypeScript control plane that is
            designed to be inspected, demonstrated, and trusted.
          </p>

          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/getting-started">
              Tour the platform
              <ArrowIcon />
            </Link>

            <Link className={styles.secondaryAction} href="/api-docs">
              Explore API contracts
            </Link>

            <a
              className={styles.textAction}
              href="https://github.com/VuNguyen26/pulsegate"
            >
              View source
              <ExternalIcon />
            </a>
          </div>

          <ul className={styles.trustList} aria-label="Demo guarantees">
            <li>
              <CheckIcon />
              Live public API
            </li>
            <li>
              <CheckIcon />
              Read-only admin surface
            </li>
            <li>
              <CheckIcon />
              Open architecture
            </li>
          </ul>
        </div>

        <GatewayConsolePreview />
      </section>

      <aside
        className={styles.availability}
        aria-label="Public demo availability"
      >
        <div className={styles.availabilityIcon} aria-hidden="true">
          <PulseIcon />
        </div>

        <div>
          <strong>Free-tier runtime</strong>
          <p>
            The public API may need up to a minute to wake after inactivity.
            Retry the first health request once while the runtime starts.
          </p>
        </div>

        <a href="https://pulsegate-public-demo-api.onrender.com/health">
          Check API health
          <ArrowIcon />
        </a>
      </aside>

      <section
        className={styles.proofGrid}
        aria-label="PulseGate portfolio proof points"
      >
        {proofPoints.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionKicker}>Platform capabilities</p>
            <h2>Built as an operating system for API traffic.</h2>
          </div>

          <p>
            The public experience is intentionally narrow, but the underlying
            platform connects request policy, runtime routing, and operator
            evidence across the full gateway lifecycle.
          </p>
        </div>

        <div className={styles.capabilityGrid}>
          {capabilities.map((capability) => (
            <article key={capability.title} className={styles.capabilityCard}>
              <div className={styles.capabilityIcon} aria-hidden="true">
                <PlatformIcon name={capability.icon} />
              </div>

              <p>{capability.kicker}</p>
              <h3>{capability.title}</h3>
              <span>{capability.copy}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.lifecycle}>
        <div className={styles.lifecycleCopy}>
          <p className={styles.sectionKicker}>Request lifecycle</p>
          <h2>Follow one request from edge to evidence.</h2>
          <p>
            PulseGate treats every policy decision as part of one observable
            pipeline. The same path that protects an upstream also produces
            the operational context needed to explain its outcome.
          </p>

          <Link className={styles.inlineLink} href="/api-docs">
            Inspect the public contract
            <ArrowIcon />
          </Link>
        </div>

        <ol className={styles.stageList}>
          {requestStages.map(([number, title, copy]) => (
            <li key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
            </li>
          ))}
        </ol>

        <nav className={styles.surfaceDirectory} aria-label="Product surfaces">
          <p>Continue exploring</p>

          <Link href="/getting-started">
            <span>01</span>
            <div>
              <strong>Getting started</strong>
              <small>Run the three-minute public tour</small>
            </div>
            <ArrowIcon />
          </Link>

          <Link href="/api-docs">
            <span>02</span>
            <div>
              <strong>API documentation</strong>
              <small>Read endpoints, headers, and errors</small>
            </div>
            <ArrowIcon />
          </Link>

          <a href="https://pulsegate-admin-dashboard.netlify.app">
            <span>03</span>
            <div>
              <strong>Admin Dashboard</strong>
              <small>Inspect the read-only operator surface</small>
            </div>
            <ArrowIcon />
          </a>
        </nav>
      </section>
    </div>
  );
}

function GatewayConsolePreview() {
  return (
    <div className={styles.console} aria-label="Gateway request preview">
      <div className={styles.consoleChrome}>
        <span />
        <span />
        <span />
        <p>pulsegate / request inspector</p>
        <small>live</small>
      </div>

      <div className={styles.consoleBody}>
        <div className={styles.requestLine}>
          <span>GET</span>
          <code>/api/products</code>
          <strong>200</strong>
        </div>

        <div className={styles.pipeline}>
          <div>
            <span>auth</span>
            <strong>API key verified</strong>
          </div>
          <div>
            <span>policy</span>
            <strong>rate + quota allowed</strong>
          </div>
          <div>
            <span>route</span>
            <strong>product-service / healthy</strong>
          </div>
        </div>

        <div className={styles.consoleDivider} />

        <dl className={styles.signalGrid}>
          <div>
            <dt>Latency</dt>
            <dd>42 ms</dd>
          </div>
          <div>
            <dt>Cache</dt>
            <dd>MISS</dd>
          </div>
          <div>
            <dt>Trace</dt>
            <dd>captured</dd>
          </div>
        </dl>

        <div className={styles.traceLine}>
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className={styles.consoleFooter}>
          <span>
            <PulseIcon />
            request completed
          </span>
          <code>req_7f29a1</code>
        </div>
      </div>
    </div>
  );
}

function PlatformIcon({
  name,
}: {
  name: (typeof capabilities)[number]["icon"];
}) {
  if (name === "route") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 5v4c0 2.2 1.8 4 4 4h6" />
        <path d="m13 10 3 3-3 3" />
        <circle cx="5" cy="5" r="2" />
        <circle cx="18" cy="13" r="2" />
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

  return <PulseIcon />;
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
