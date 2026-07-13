"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AdminResourceEmpty,
  AdminResourceError,
  AdminResourceLoading,
  AdminResourceTable,
  type AdminResourceColumn,
} from "./admin-resource-view";
import {
  AnalyticsSummaryGrid,
} from "./analytics-summary-grid";
import type {
  DashboardAdminResourceLoadResult,
} from "../lib/admin-resource-contract";
import {
  DASHBOARD_ROLLUP_DEFAULT_LIMIT,
  type DashboardRollupQuery,
  type DashboardRollupSource,
} from "../lib/admin-rollup-query";
import {
  loadDashboardRollups,
} from "../lib/admin-rollup-client";
import type {
  DashboardRejectedRollupItem,
  DashboardRejectedRollupRead,
  DashboardRollupRead,
  DashboardUsageRollupItem,
  DashboardUsageRollupRead,
} from "../lib/admin-rollups";

type RollupInspectionPanelState =
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardRollupRead
    >;

export type RollupInspectionPanelProps = {
  initialFrom: string;
  initialTo: string;
};

function formatTimestamp(
  timestamp: string,
): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle: "medium",
      timeStyle: "medium",
    },
  ).format(new Date(timestamp));
}

function formatInteger(
  value: number,
): string {
  return new Intl.NumberFormat("en").format(
    value,
  );
}

function nullableValue(
  value: string | null,
): string {
  return value ?? "—";
}

const usageColumns:
  readonly AdminResourceColumn<
    DashboardUsageRollupItem
  >[] = [
    {
      key: "bucket",
      header: "Bucket",
      render: (item) => (
        <span>
          {formatTimestamp(item.bucketStart)}
        </span>
      ),
    },
    {
      key: "route",
      header: "Route",
      render: (item) => (
        <span>
          {nullableValue(item.routeMethod)}{" "}
          {nullableValue(item.routePath)}
        </span>
      ),
    },
    {
      key: "identity",
      header: "Consumer / API key",
      render: (item) => (
        <span>
          {nullableValue(item.consumerId)}
          {" / "}
          {nullableValue(item.apiKeyId)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status / cache",
      render: (item) => (
        <span>
          {item.statusClass}
          {" / "}
          {nullableValue(item.cacheStatus)}
        </span>
      ),
    },
    {
      key: "requests",
      header: "Requests",
      render: (item) =>
        formatInteger(item.totalRequests),
    },
    {
      key: "errors",
      header: "Errors",
      render: (item) =>
        formatInteger(item.errorRequests),
    },
    {
      key: "duration",
      header: "Duration",
      render: (item) =>
        `${formatInteger(
          item.totalDurationMs,
        )} ms`,
    },
  ];

const rejectedColumns:
  readonly AdminResourceColumn<
    DashboardRejectedRollupItem
  >[] = [
    {
      key: "bucket",
      header: "Bucket",
      render: (item) => (
        <span>
          {formatTimestamp(item.bucketStart)}
        </span>
      ),
    },
    {
      key: "route",
      header: "Route",
      render: (item) => (
        <span>
          {nullableValue(item.routeMethod)}{" "}
          {nullableValue(item.routePath)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (item) =>
        item.rejectionReason,
    },
    {
      key: "status",
      header: "Status",
      render: (item) =>
        String(item.statusCode),
    },
    {
      key: "auth-source",
      header: "Auth source",
      render: (item) =>
        nullableValue(item.apiKeyAuthSource),
    },
    {
      key: "requests",
      header: "Rejected",
      render: (item) =>
        formatInteger(
          item.totalRejectedRequests,
        ),
    },
  ];

function sumUsage(
  read: DashboardUsageRollupRead,
) {
  return read.items.reduce(
    (totals, item) => ({
      requests:
        totals.requests +
        item.totalRequests,
      errors:
        totals.errors +
        item.errorRequests,
      cacheHits:
        totals.cacheHits +
        item.cacheHits,
      durationMs:
        totals.durationMs +
        item.totalDurationMs,
    }),
    {
      requests: 0,
      errors: 0,
      cacheHits: 0,
      durationMs: 0,
    },
  );
}

function sumRejected(
  read: DashboardRejectedRollupRead,
): number {
  return read.items.reduce(
    (total, item) =>
      total +
      item.totalRejectedRequests,
    0,
  );
}

export function RollupInspectionContent({
  read,
}: {
  read: DashboardRollupRead;
}) {
  if (read.items.length === 0) {
    return (
      <AdminResourceEmpty
        title="No persisted rollup buckets"
        description="No persisted rollup rows matched the selected bounded source and time window."
      />
    );
  }

  if (read.source === "usage") {
    const totals = sumUsage(read);

    return (
      <div className="analytics-results-stack">
        <AnalyticsSummaryGrid
          label="Usage rollup summary"
          items={[
            {
              key: "buckets",
              label: "Rows",
              value: formatInteger(
                read.count,
              ),
            },
            {
              key: "requests",
              label: "Requests",
              value: formatInteger(
                totals.requests,
              ),
            },
            {
              key: "errors",
              label: "Errors",
              value: formatInteger(
                totals.errors,
              ),
            },
            {
              key: "cache-hits",
              label: "Cache hits",
              value: formatInteger(
                totals.cacheHits,
              ),
            },
          ]}
        />

        <AdminResourceTable
          caption="Persisted successful usage rollups"
          columns={usageColumns}
          rows={read.items}
          getRowKey={(item) => item.id}
        />
      </div>
    );
  }

  return (
    <div className="analytics-results-stack">
      <AnalyticsSummaryGrid
        label="Rejected rollup summary"
        items={[
          {
            key: "buckets",
            label: "Rows",
            value: formatInteger(
              read.count,
            ),
          },
          {
            key: "rejected",
            label: "Rejected requests",
            value: formatInteger(
              sumRejected(read),
            ),
          },
          {
            key: "window-buckets",
            label: "Window buckets",
            value: formatInteger(
              read.window.bucketCount,
            ),
          },
          {
            key: "limit",
            label: "Result limit",
            value: formatInteger(
              read.limit,
            ),
          },
        ]}
      />

      <AdminResourceTable
        caption="Persisted rejected request rollups"
        columns={rejectedColumns}
        rows={read.items}
        getRowKey={(item) => item.id}
      />
    </div>
  );
}

export function RollupInspectionPanel({
  initialFrom,
  initialTo,
}: RollupInspectionPanelProps) {
  const [query, setQuery] =
    useState<DashboardRollupQuery>({
      from: initialFrom,
      to: initialTo,
      granularity: "hour",
      source: "usage",
      limit:
        DASHBOARD_ROLLUP_DEFAULT_LIMIT,
    });

  const [refreshToken, setRefreshToken] =
    useState(0);

  const [state, setState] =
    useState<RollupInspectionPanelState>({
      status: "loading",
    });

  useEffect(() => {
    const controller =
      new AbortController();

    let active = true;

    setState({
      status: "loading",
    });

    void loadDashboardRollups(
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
  }, [query, refreshToken]);

  function selectSource(
    source: DashboardRollupSource,
  ) {
    setQuery((current) => ({
      from: current.from,
      to: current.to,
      granularity:
        current.granularity,
      source,
      limit: current.limit,
    }));
  }

  function retry() {
    setRefreshToken(
      (current) => current + 1,
    );
  }

  const busy =
    state.status === "loading";

  return (
    <section
      className="analytics-panel-stack"
      aria-label="Persisted analytics rollups"
    >
      <div
        role="group"
        aria-label="Rollup source"
      >
        <button
          type="button"
          disabled={busy}
          aria-pressed={
            query.source === "usage"
          }
          onClick={() =>
            selectSource("usage")
          }
        >
          Usage rollups
        </button>

        <button
          type="button"
          disabled={busy}
          aria-pressed={
            query.source === "rejected"
          }
          onClick={() =>
            selectSource("rejected")
          }
        >
          Rejected rollups
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={retry}
        >
          Refresh
        </button>
      </div>

      <p>
        Showing a bounded hourly window from{" "}
        <strong>
          {formatTimestamp(query.from)}
        </strong>{" "}
        to{" "}
        <strong>
          {formatTimestamp(query.to)}
        </strong>
        . These persisted rollups are derived
        analytics and are never quota truth.
      </p>

      {state.status === "loading" ? (
        <AdminResourceLoading
          title="Persisted analytics rollups"
          description="Loading persisted rollup rows through the read-only Dashboard BFF."
        />
      ) : null}

      {state.status === "error" ? (
        <AdminResourceError
          title="Analytics rollups unavailable"
          error={state.error}
          onRetry={retry}
        />
      ) : null}

      {state.status === "success" ? (
        <RollupInspectionContent
          read={state.data}
        />
      ) : null}
    </section>
  );
}