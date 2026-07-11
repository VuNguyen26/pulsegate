"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AnalyticsFilterControls,
} from "./analytics-filter-controls";
import {
  AnalyticsSummaryGrid,
} from "./analytics-summary-grid";
import {
  AdminResourceEmpty,
  AdminResourceError,
  AdminResourceLoading,
  AdminResourceTable,
  type AdminResourceColumn,
} from "./admin-resource-view";
import {
  CursorPagination,
} from "./cursor-pagination";
import type {
  DashboardAdminResourceLoadResult,
} from "../lib/admin-resource-contract";
import {
  DASHBOARD_ANALYTICS_DEFAULT_LIMIT,
  type DashboardAnalyticsQuery,
} from "../lib/admin-analytics-query";
import {
  loadDashboardUsageEvents,
} from "../lib/usage-analytics-client";
import type {
  DashboardUsageEvent,
  DashboardUsageEventsListing,
} from "../lib/usage-analytics";

type UsageEventsPanelState =
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardUsageEventsListing
    >;

function formatTimestamp(timestamp: string): string {
  return timestamp
    .replace("T", " ")
    .replace(/Z$/, " UTC");
}

function formatDuration(durationMs: number): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(durationMs)} ms`;
}

const usageEventColumns:
  readonly AdminResourceColumn<DashboardUsageEvent>[] = [
    {
      key: "occurred",
      header: "Occurred",
      render: (event) => (
        <time dateTime={event.occurredAt}>
          {formatTimestamp(event.occurredAt)}
        </time>
      ),
    },
    {
      key: "route",
      header: "Route",
      render: (event) => (
        <div className="analytics-route-cell">
          <strong>{event.routeMethod}</strong>
          <code>{event.routePath}</code>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (event) => (
        <span
          className="analytics-status-pill"
          data-error={event.statusCode >= 400}
        >
          {event.statusCode}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (event) =>
        formatDuration(event.durationMs),
    },
    {
      key: "cache",
      header: "Cache",
      render: (event) =>
        event.cacheStatus ?? "Not recorded",
    },
    {
      key: "subject",
      header: "Consumer / API key",
      render: (event) => (
        <div className="analytics-identity-cell">
          <code>
            {event.consumerId ?? "No consumer"}
          </code>
          <small>
            {event.apiKeyId ?? "No API key"}
          </small>
        </div>
      ),
    },
    {
      key: "request",
      header: "Request ID",
      render: (event) => (
        <code>{event.requestId}</code>
      ),
    },
  ];

export function UsageEventsContent({
  listing,
  hasPreviousPage,
  busy,
  onPrevious,
  onNext,
}: {
  listing: DashboardUsageEventsListing;
  hasPreviousPage: boolean;
  busy: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (listing.items.length === 0) {
    return (
      <AdminResourceEmpty
        title="No successful usage events"
        description="No successful Gateway usage events matched the selected bounded filters."
      />
    );
  }

  return (
    <div className="analytics-results-stack">
      <AnalyticsSummaryGrid
        label="Successful usage event summary"
        items={[
          {
            key: "page",
            label: "Events on this page",
            value: listing.items.length,
          },
          {
            key: "reported-total",
            label: "Gateway reported total",
            value: listing.pagination.total,
          },
          {
            key: "limit",
            label: "Page size",
            value: listing.pagination.limit,
          },
        ]}
      />

      <AdminResourceTable
        caption="Successful Gateway usage events"
        columns={usageEventColumns}
        rows={listing.items}
        getRowKey={(event) => event.id}
      />

      <CursorPagination
        description={
          `Showing ${listing.items.length} successful ` +
          `events for the current cursor position.`
        }
        hasPreviousPage={hasPreviousPage}
        hasNextPage={
          listing.pagination.hasNextPage &&
          listing.pagination.nextCursor !== null
        }
        busy={busy}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
}

export function UsageEventsPanel() {
  const [query, setQuery] =
    useState<DashboardAnalyticsQuery>({
      limit: DASHBOARD_ANALYTICS_DEFAULT_LIMIT,
    });
  const [previousQueries, setPreviousQueries] =
    useState<DashboardAnalyticsQuery[]>([]);
  const [refreshToken, setRefreshToken] =
    useState(0);
  const [state, setState] =
    useState<UsageEventsPanelState>({
      status: "loading",
    });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({
      status: "loading",
    });

    void loadDashboardUsageEvents(
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

  function applyFilters(
    nextQuery: DashboardAnalyticsQuery,
  ) {
    setPreviousQueries([]);
    setQuery({
      ...nextQuery,
      cursor: undefined,
    });
  }

  function resetFilters() {
    setPreviousQueries([]);
    setQuery({
      limit: DASHBOARD_ANALYTICS_DEFAULT_LIMIT,
    });
  }

  function retry() {
    setRefreshToken((current) => current + 1);
  }

  function nextPage() {
    if (
      state.status !== "success" ||
      !state.data.pagination.nextCursor
    ) {
      return;
    }

    setPreviousQueries((current) => [
      ...current,
      query,
    ]);

    setQuery({
      ...query,
      cursor: state.data.pagination.nextCursor,
    });
  }

  function previousPage() {
    const previous =
      previousQueries[previousQueries.length - 1];

    if (!previous) {
      return;
    }

    setPreviousQueries((current) =>
      current.slice(0, -1),
    );
    setQuery(previous);
  }

  return (
    <section
      className="analytics-panel-stack"
      aria-label="Successful usage events"
    >
      <AnalyticsFilterControls
        key={JSON.stringify(query)}
        mode="usage-events"
        initialQuery={query}
        busy={state.status === "loading"}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {state.status === "loading" ? (
        <AdminResourceLoading
          title="Successful usage events"
          description="Loading successful Gateway usage events through the read-only Dashboard BFF."
        />
      ) : null}

      {state.status === "error" ? (
        <AdminResourceError
          title="Successful usage events unavailable"
          error={state.error}
          onRetry={retry}
        />
      ) : null}

      {state.status === "success" ? (
        <UsageEventsContent
          listing={state.data}
          hasPreviousPage={
            previousQueries.length > 0
          }
          busy={false}
          onPrevious={previousPage}
          onNext={nextPage}
        />
      ) : null}
    </section>
  );
}
