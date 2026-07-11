"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AnalyticsFilterControls,
} from "./analytics-filter-controls";
import {
  AnalyticsSummaryGrid,
} from "./analytics-summary-grid";
import {
  AdminResourceError,
  AdminResourceLoading,
} from "./admin-resource-view";
import type {
  DashboardAdminResourceLoadResult,
} from "../lib/admin-resource-contract";
import type {
  DashboardAnalyticsQuery,
} from "../lib/admin-analytics-query";
import {
  loadDashboardApiKeyQuotaState,
  loadDashboardApiKeyUsageSummary,
  loadDashboardConsumerUsageSummary,
  loadDashboardUsagePlanUsageSummary,
} from "../lib/usage-analytics-client";
import type {
  DashboardApiKeyQuotaState,
  DashboardUsagePlanUsageSummary,
  DashboardUsageSummary,
  DashboardUsageSummarySubjectType,
} from "../lib/usage-analytics";

type LookupState<T> =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<T>;

type IdentityLoader<T> = (
  identifier: string,
  fetchImplementation?: typeof fetch,
  signal?: AbortSignal,
) => Promise<DashboardAdminResourceLoadResult<T>>;

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(value: number): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)} ms`;
}

function formatTimestamp(
  value: string | null,
): string {
  if (!value) {
    return "Not recorded";
  }

  return value
    .replace("T", " ")
    .replace(/Z$/, " UTC");
}

function booleanLabel(value: boolean): string {
  return value ? "Yes" : "No";
}

function LookupForm({
  identifier,
  label,
  placeholder,
  busy,
  onIdentifierChange,
  onSubmit,
}: {
  identifier: string;
  label: string;
  placeholder: string;
  busy: boolean;
  onIdentifierChange: (value: string) => void;
  onSubmit: () => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (identifier.trim()) {
      onSubmit();
    }
  }

  return (
    <form
      className="analytics-lookup-form"
      onSubmit={submit}
    >
      <label>
        <span>{label}</span>
        <input
          type="text"
          value={identifier}
          placeholder={placeholder}
          autoComplete="off"
          maxLength={128}
          disabled={busy}
          onChange={(event) =>
            onIdentifierChange(event.target.value)
          }
        />
      </label>

      <button
        type="submit"
        disabled={busy || !identifier.trim()}
      >
        {busy ? "Loading..." : "Load read-only data"}
      </button>
    </form>
  );
}

function LookupIdle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="content-card analytics-lookup-idle">
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export function UsageSummaryContent({
  summary,
}: {
  summary: DashboardUsageSummary;
}) {
  return (
    <div className="analytics-results-stack">
      <div className="analytics-result-heading">
        <div>
          <span>Subject</span>
          <strong>{summary.subjectType}</strong>
        </div>
        <code>{summary.subjectId}</code>
      </div>

      <AnalyticsSummaryGrid
        label="Usage summary"
        items={[
          {
            key: "total",
            label: "Total requests",
            value: formatCount(summary.totalRequests),
          },
          {
            key: "successful",
            label: "Successful",
            value: formatCount(
              summary.successfulRequests,
            ),
          },
          {
            key: "errors",
            label: "Errors",
            value: formatCount(summary.errorRequests),
          },
          {
            key: "average-duration",
            label: "Average duration",
            value: formatDuration(
              summary.averageDurationMs,
            ),
          },
          {
            key: "cache-hits",
            label: "Cache hits",
            value: formatCount(summary.cacheHits),
          },
          {
            key: "cache-misses",
            label: "Cache misses",
            value: formatCount(summary.cacheMisses),
          },
          {
            key: "cache-bypasses",
            label: "Cache bypasses",
            value: formatCount(summary.cacheBypasses),
          },
          {
            key: "last-request",
            label: "Last request",
            value: formatTimestamp(
              summary.lastRequestAt,
            ),
          },
        ]}
      />
    </div>
  );
}

export function ApiKeyQuotaContent({
  quotaState,
}: {
  quotaState: DashboardApiKeyQuotaState;
}) {
  const remaining =
    quotaState.quota.remainingRequests === null
      ? "Unlimited"
      : formatCount(
          quotaState.quota.remainingRequests,
        );

  return (
    <div className="analytics-results-stack">
      <div className="analytics-result-heading">
        <div>
          <span>Quota reason</span>
          <strong>{quotaState.reason}</strong>
        </div>
        <code>{quotaState.apiKeyId}</code>
      </div>

      <AnalyticsSummaryGrid
        label="API key quota state"
        items={[
          {
            key: "consumer",
            label: "Consumer",
            value:
              quotaState.consumerId ??
              "No consumer recorded",
          },
          {
            key: "plan",
            label: "Usage plan",
            value:
              quotaState.usagePlan?.name ??
              "No assigned plan",
          },
          {
            key: "used",
            label: "Used requests",
            value: formatCount(
              quotaState.quota.usedRequests,
            ),
          },
          {
            key: "remaining",
            label: "Remaining",
            value: remaining,
          },
          {
            key: "exceeded",
            label: "Exceeded",
            value: booleanLabel(
              quotaState.quota.exceeded,
            ),
          },
          {
            key: "enforced",
            label: "Enforced",
            value: booleanLabel(
              quotaState.quota.enforced,
            ),
          },
          {
            key: "window-start",
            label: "Window started",
            value: formatTimestamp(
              quotaState.quota.windowStartedAt,
            ),
          },
          {
            key: "reset",
            label: "Reset at",
            value: formatTimestamp(
              quotaState.quota.resetAt,
            ),
          },
        ]}
      />
    </div>
  );
}

export function UsagePlanSummaryContent({
  summary,
}: {
  summary: DashboardUsagePlanUsageSummary;
}) {
  return (
    <div className="analytics-results-stack">
      <div className="analytics-result-heading">
        <div>
          <span>Usage plan</span>
          <strong>{summary.usagePlan.name}</strong>
        </div>
        <code>{summary.usagePlan.id}</code>
      </div>

      <AnalyticsSummaryGrid
        label="Usage plan current-window summary"
        items={[
          {
            key: "quota",
            label: "Quota limit",
            value: formatCount(
              summary.usagePlan.quotaLimit,
            ),
          },
          {
            key: "window",
            label: "Quota window",
            value: summary.usagePlan.quotaWindow,
          },
          {
            key: "enabled",
            label: "Plan enabled",
            value: booleanLabel(
              summary.usagePlan.enabled,
            ),
          },
          {
            key: "assigned",
            label: "Assigned API keys",
            value: formatCount(
              summary.assignedApiKeys,
            ),
          },
          {
            key: "active",
            label: "Active API keys",
            value: formatCount(
              summary.activeApiKeys,
            ),
          },
          {
            key: "requests",
            label: "Current-window requests",
            value: formatCount(
              summary.totalRequestsInCurrentWindow,
            ),
          },
          {
            key: "exceeded",
            label: "Exceeded API keys",
            value: formatCount(
              summary.exceededApiKeys,
            ),
          },
          {
            key: "near-limit",
            label: "Near-limit API keys",
            value: formatCount(
              summary.nearLimitApiKeys,
            ),
          },
          {
            key: "top-api-keys",
            label: "Ranked API keys returned",
            value: formatCount(
              summary.topApiKeysByUsage.length,
            ),
          },
          {
            key: "reset",
            label: "Reset at",
            value: formatTimestamp(summary.resetAt),
          },
        ]}
      />
    </div>
  );
}

function UsageSubjectLookup({
  subjectType,
}: {
  subjectType: DashboardUsageSummarySubjectType;
}) {
  const isConsumer = subjectType === "consumer";
  const title = isConsumer
    ? "Consumer usage summary"
    : "API key usage summary";
  const identifierLabel = isConsumer
    ? "Consumer ID"
    : "API key ID";

  const [draftIdentifier, setDraftIdentifier] =
    useState("");
  const [identifier, setIdentifier] =
    useState<string | null>(null);
  const [query, setQuery] =
    useState<DashboardAnalyticsQuery>({});
  const [refreshToken, setRefreshToken] =
    useState(0);
  const [state, setState] =
    useState<LookupState<DashboardUsageSummary>>({
      status: "idle",
    });

  useEffect(() => {
    if (!identifier) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    setState({
      status: "loading",
    });

    const loader = isConsumer
      ? loadDashboardConsumerUsageSummary
      : loadDashboardApiKeyUsageSummary;

    void loader(
      identifier,
      query,
      fetch,
      controller.signal,
    ).then((result) => {
      if (active) {
        setState(result);
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    identifier,
    isConsumer,
    query,
    refreshToken,
  ]);

  function submitIdentifier() {
    setIdentifier(draftIdentifier.trim());
  }

  function applyFilters(
    nextQuery: DashboardAnalyticsQuery,
  ) {
    setQuery(nextQuery);
  }

  function resetFilters() {
    setQuery({});
  }

  function retry() {
    setRefreshToken((current) => current + 1);
  }

  return (
    <section
      className="analytics-lookup-card"
      aria-label={title}
    >
      <header>
        <p className="eyebrow">
          Successful usage only
        </p>
        <h2>{title}</h2>
        <p>
          Read a bounded successful-request summary
          through the server-only Dashboard BFF.
        </p>
      </header>

      <LookupForm
        identifier={draftIdentifier}
        label={identifierLabel}
        placeholder={
          isConsumer
            ? "consumer_mobile"
            : "api_key_1"
        }
        busy={state.status === "loading"}
        onIdentifierChange={setDraftIdentifier}
        onSubmit={submitIdentifier}
      />

      <AnalyticsFilterControls
        key={JSON.stringify(query)}
        mode="usage-summary"
        initialQuery={query}
        busy={state.status === "loading"}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {state.status === "idle" ? (
        <LookupIdle
          title={`Enter a ${identifierLabel.toLowerCase()}`}
          description="No summary request is made until an identifier is submitted."
        />
      ) : null}

      {state.status === "loading" ? (
        <AdminResourceLoading
          title={title}
          description={`Loading ${title.toLowerCase()} through the read-only Dashboard BFF.`}
        />
      ) : null}

      {state.status === "error" ? (
        <AdminResourceError
          title={`${title} unavailable`}
          error={state.error}
          onRetry={retry}
        />
      ) : null}

      {state.status === "success" ? (
        <UsageSummaryContent
          summary={state.data}
        />
      ) : null}
    </section>
  );
}

function IdentityLookupPanel<T>({
  title,
  description,
  identifierLabel,
  placeholder,
  loadingDescription,
  loader,
  renderResult,
}: {
  title: string;
  description: string;
  identifierLabel: string;
  placeholder: string;
  loadingDescription: string;
  loader: IdentityLoader<T>;
  renderResult: (data: T) => ReactNode;
}) {
  const [draftIdentifier, setDraftIdentifier] =
    useState("");
  const [identifier, setIdentifier] =
    useState<string | null>(null);
  const [refreshToken, setRefreshToken] =
    useState(0);
  const [state, setState] =
    useState<LookupState<T>>({
      status: "idle",
    });

  useEffect(() => {
    if (!identifier) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    setState({
      status: "loading",
    });

    void loader(
      identifier,
      fetch,
      controller.signal,
    ).then((result) => {
      if (active) {
        setState(result);
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [identifier, loader, refreshToken]);

  function submitIdentifier() {
    setIdentifier(draftIdentifier.trim());
  }

  function retry() {
    setRefreshToken((current) => current + 1);
  }

  return (
    <section
      className="analytics-lookup-card"
      aria-label={title}
    >
      <header>
        <p className="eyebrow">
          Current read model
        </p>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>

      <LookupForm
        identifier={draftIdentifier}
        label={identifierLabel}
        placeholder={placeholder}
        busy={state.status === "loading"}
        onIdentifierChange={setDraftIdentifier}
        onSubmit={submitIdentifier}
      />

      {state.status === "idle" ? (
        <LookupIdle
          title={`Enter a ${identifierLabel.toLowerCase()}`}
          description="No read request is made until an identifier is submitted."
        />
      ) : null}

      {state.status === "loading" ? (
        <AdminResourceLoading
          title={title}
          description={loadingDescription}
        />
      ) : null}

      {state.status === "error" ? (
        <AdminResourceError
          title={`${title} unavailable`}
          error={state.error}
          onRetry={retry}
        />
      ) : null}

      {state.status === "success"
        ? renderResult(state.data)
        : null}
    </section>
  );
}

export function UsageSummaryLookups() {
  return (
    <div className="analytics-lookup-stack">
      <UsageSubjectLookup subjectType="consumer" />
      <UsageSubjectLookup subjectType="apiKey" />

      <div className="analytics-lookup-grid">
        <IdentityLookupPanel
          title="API key quota state"
          description="Inspect the assigned plan and current quota enforcement state without exposing key material."
          identifierLabel="API key ID"
          placeholder="api_key_1"
          loadingDescription="Loading API key quota state through the read-only Dashboard BFF."
          loader={loadDashboardApiKeyQuotaState}
          renderResult={(data) => (
            <ApiKeyQuotaContent quotaState={data} />
          )}
        />

        <IdentityLookupPanel
          title="Usage plan summary"
          description="Inspect current-window plan consumption and bounded API-key counts."
          identifierLabel="Usage plan ID"
          placeholder="plan_starter"
          loadingDescription="Loading usage plan summary through the read-only Dashboard BFF."
          loader={
            loadDashboardUsagePlanUsageSummary
          }
          renderResult={(data) => (
            <UsagePlanSummaryContent
              summary={data}
            />
          )}
        />
      </div>
    </div>
  );
}
