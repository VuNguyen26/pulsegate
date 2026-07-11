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
  DashboardAdminResourceError,
} from "../lib/admin-resource-contract";
import {
  DASHBOARD_ANALYTICS_DEFAULT_LIMIT,
  type DashboardAnalyticsQuery,
} from "../lib/admin-analytics-query";
import {
  loadDashboardRejectedEvents,
  loadDashboardRejectedEventsSummary,
} from "../lib/rejected-analytics-client";
import type {
  DashboardRejectedEvent,
  DashboardRejectedEventsListing,
  DashboardRejectedEventsSummary,
} from "../lib/rejected-analytics";

type RejectedEventsPanelState =
  | {
      status: "loading";
    }
  | {
      status: "error";
      error: DashboardAdminResourceError;
    }
  | {
      status: "success";
      summary: DashboardRejectedEventsSummary;
      listing: DashboardRejectedEventsListing;
    };

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(
    value,
  );
}

function formatTimestamp(
  value: string | null,
): string {
  if (!value) {
    return "No rejected event recorded";
  }

  return value
    .replace("T", " ")
    .replace(/Z$/, " UTC");
}

function getRejectedSummaryQuery(
  query: DashboardAnalyticsQuery,
): DashboardAnalyticsQuery {
  const {
    limit: _limit,
    cursor: _cursor,
    ...summaryQuery
  } = query;

  return summaryQuery;
}

const rejectedEventColumns:
  readonly AdminResourceColumn<DashboardRejectedEvent>[] = [
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
      key: "reason",
      header: "Rejection reason",
      render: (event) => (
        <span className="rejection-reason-pill">
          {event.rejectionReason}
        </span>
      ),
    },
    {
      key: "route",
      header: "Route",
      render: (event) => (
        <div className="analytics-route-cell">
          <strong>
            {event.routeMethod ?? "Unknown method"}
          </strong>
          <code>
            {event.routePath ?? "Unknown route"}
          </code>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (event) => (
        <span
          className="analytics-status-pill"
          data-error="true"
        >
          {event.statusCode}
        </span>
      ),
    },
    {
      key: "identity",
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
      key: "auth-source",
      header: "Auth source",
      render: (event) =>
        event.apiKeyAuthSource ?? "Not recorded",
    },
    {
      key: "request",
      header: "Request ID",
      render: (event) => (
        <code>{event.requestId}</code>
      ),
    },
  ];

function RejectedBreakdowns({
  summary,
}: {
  summary: DashboardRejectedEventsSummary;
}) {
  return (
    <div
      className="analytics-breakdown-grid"
      aria-label="Rejected request breakdowns"
    >
      <section className="analytics-breakdown-card">
        <h3>By rejection reason</h3>

        {summary.byReason.length === 0 ? (
          <p>No reason buckets returned.</p>
        ) : (
          <ul>
            {summary.byReason.map((item) => (
              <li key={item.rejectionReason}>
                <code>{item.rejectionReason}</code>
                <strong>
                  {formatCount(item.count)}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="analytics-breakdown-card">
        <h3>By status code</h3>

        {summary.byStatusCode.length === 0 ? (
          <p>No status buckets returned.</p>
        ) : (
          <ul>
            {summary.byStatusCode.map((item) => (
              <li key={item.statusCode}>
                <code>{item.statusCode}</code>
                <strong>
                  {formatCount(item.count)}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function RejectedEventsContent({
  summary,
  listing,
  hasPreviousPage,
  busy,
  onPrevious,
  onNext,
}: {
  summary: DashboardRejectedEventsSummary;
  listing: DashboardRejectedEventsListing;
  hasPreviousPage: boolean;
  busy: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="analytics-results-stack">
      <AnalyticsSummaryGrid
        label="Rejected request summary"
        items={[
          {
            key: "total",
            label: "Total rejected requests",
            value: formatCount(
              summary.totalRejectedRequests,
            ),
          },
          {
            key: "reason-buckets",
            label: "Reason buckets",
            value: formatCount(
              summary.byReason.length,
            ),
          },
          {
            key: "status-buckets",
            label: "Status buckets",
            value: formatCount(
              summary.byStatusCode.length,
            ),
          },
          {
            key: "last-rejected",
            label: "Last rejected request",
            value: formatTimestamp(
              summary.lastRejectedAt,
            ),
          },
        ]}
      />

      <RejectedBreakdowns summary={summary} />

      {listing.items.length === 0 ? (
        <AdminResourceEmpty
          title="No rejected events"
          description="No rejected Gateway events matched the selected bounded filters."
        />
      ) : (
        <>
          <AdminResourceTable
            caption="Rejected Gateway request events"
            columns={rejectedEventColumns}
            rows={listing.items}
            getRowKey={(event) => event.id}
          />

          <CursorPagination
            description={
              `Showing ${listing.items.length} rejected ` +
              `events for the current cursor position.`
            }
            hasPreviousPage={hasPreviousPage}
            hasNextPage={
              listing.pagination.hasNextPage &&
              listing.pagination.nextCursor !==
                null
            }
            busy={busy}
            onPrevious={onPrevious}
            onNext={onNext}
          />
        </>
      )}
    </div>
  );
}

export function RejectedEventsPanel() {
  const [query, setQuery] =
    useState<DashboardAnalyticsQuery>({
      limit: DASHBOARD_ANALYTICS_DEFAULT_LIMIT,
    });

  const [previousQueries, setPreviousQueries] =
    useState<DashboardAnalyticsQuery[]>([]);

  const [refreshToken, setRefreshToken] =
    useState(0);

  const [state, setState] =
    useState<RejectedEventsPanelState>({
      status: "loading",
    });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({
      status: "loading",
    });

    void Promise.all([
      loadDashboardRejectedEventsSummary(
        getRejectedSummaryQuery(query),
        fetch,
        controller.signal,
      ),
      loadDashboardRejectedEvents(
        query,
        fetch,
        controller.signal,
      ),
    ]).then(
      ([summaryResult, eventsResult]) => {
        if (!active) {
          return;
        }

        if (summaryResult.status === "error") {
          setState({
            status: "error",
            error: summaryResult.error,
          });
          return;
        }

        if (eventsResult.status === "error") {
          setState({
            status: "error",
            error: eventsResult.error,
          });
          return;
        }

        setState({
          status: "success",
          summary: summaryResult.data,
          listing: eventsResult.data,
        });
      },
    );

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
      !state.listing.pagination.nextCursor
    ) {
      return;
    }

    setPreviousQueries((current) => [
      ...current,
      query,
    ]);

    setQuery({
      ...query,
      cursor:
        state.listing.pagination.nextCursor,
    });
  }

  function previousPage() {
    const previous =
      previousQueries[
        previousQueries.length - 1
      ];

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
      aria-label="Rejected request analytics"
    >
      <AnalyticsFilterControls
        key={JSON.stringify(query)}
        mode="rejected-events"
        initialQuery={query}
        busy={state.status === "loading"}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {state.status === "loading" ? (
        <AdminResourceLoading
          title="Rejected request analytics"
          description="Loading rejected-request summary and events through the read-only Dashboard BFF."
        />
      ) : null}

      {state.status === "error" ? (
        <AdminResourceError
          title="Rejected request analytics unavailable"
          error={state.error}
          onRetry={retry}
        />
      ) : null}

      {state.status === "success" ? (
        <RejectedEventsContent
          summary={state.summary}
          listing={state.listing}
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
