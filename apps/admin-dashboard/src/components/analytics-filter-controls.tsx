"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  DASHBOARD_ANALYTICS_CACHE_STATUSES,
  DASHBOARD_ANALYTICS_DEFAULT_LIMIT,
  DASHBOARD_ANALYTICS_MAX_IDENTIFIER_LENGTH,
  DASHBOARD_ANALYTICS_MAX_LIMIT,
  DASHBOARD_ANALYTICS_MAX_ROUTE_PATH_LENGTH,
  DASHBOARD_ANALYTICS_REJECTION_REASONS,
  DASHBOARD_ANALYTICS_ROUTE_METHODS,
  parseDashboardAnalyticsSearchParams,
  type DashboardAnalyticsQuery,
  type DashboardAnalyticsQueryMode,
  type DashboardAnalyticsQueryParseResult,
} from "../lib/admin-analytics-query";

const FILTER_KEYS = [
  "from",
  "to",
  "routePath",
  "routeMethod",
  "statusCode",
  "cacheStatus",
  "rejectionReason",
  "consumerId",
  "apiKeyId",
  "limit",
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

function normalizeUtcDateTime(value: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${value}:00.000Z`
    : value;
}

export function parseAnalyticsFilterSubmission(
  mode: DashboardAnalyticsQueryMode,
  values: Partial<Record<FilterKey, string>>,
): DashboardAnalyticsQueryParseResult {
  const params = new URLSearchParams();

  for (const key of FILTER_KEYS) {
    const value = values[key]?.trim();

    if (!value) {
      continue;
    }

    params.set(
      key,
      key === "from" || key === "to"
        ? normalizeUtcDateTime(value)
        : value,
    );
  }

  return parseDashboardAnalyticsSearchParams(
    mode,
    params,
  );
}

function readFormValues(
  form: HTMLFormElement,
): Partial<Record<FilterKey, string>> {
  const formData = new FormData(form);
  const values: Partial<Record<FilterKey, string>> = {};

  for (const key of FILTER_KEYS) {
    const value = formData.get(key);

    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return values;
}

function toUtcInputValue(
  value: string | undefined,
): string {
  return value ? value.slice(0, 16) : "";
}

export function AnalyticsFilterControls({
  mode,
  initialQuery = {},
  busy = false,
  onApply,
  onReset,
}: {
  mode: DashboardAnalyticsQueryMode;
  initialQuery?: DashboardAnalyticsQuery;
  busy?: boolean;
  onApply: (query: DashboardAnalyticsQuery) => void;
  onReset: () => void;
}) {
  const [error, setError] = useState<string | null>(
    null,
  );

  const isUsage =
    mode === "usage-summary" ||
    mode === "usage-events";
  const isRejected = !isUsage;
  const isEventListing =
    mode === "usage-events" ||
    mode === "rejected-events";
  const supportsSubjectFilters =
    mode !== "usage-summary";

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const result = parseAnalyticsFilterSubmission(
      mode,
      readFormValues(event.currentTarget),
    );

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setError(null);
    onApply(result.value);
  }

  function reset(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    event.currentTarget.reset();
    setError(null);
    onReset();
  }

  return (
    <form
      className="content-card analytics-filter-form"
      aria-label="Analytics filters"
      onSubmit={submit}
      onReset={reset}
    >
      <header>
        <p className="eyebrow">Bounded filters</p>
        <h2>Filter analytics data</h2>
        <p>
          Date and time values are interpreted as UTC.
          Filters are validated before any request is made.
        </p>
      </header>

      <div className="analytics-filter-grid">
        <label>
          From (UTC)
          <input
            name="from"
            type="datetime-local"
            defaultValue={toUtcInputValue(
              initialQuery.from,
            )}
          />
        </label>

        <label>
          To (UTC)
          <input
            name="to"
            type="datetime-local"
            defaultValue={toUtcInputValue(
              initialQuery.to,
            )}
          />
        </label>

        <label>
          Route path
          <input
            name="routePath"
            type="text"
            maxLength={
              DASHBOARD_ANALYTICS_MAX_ROUTE_PATH_LENGTH
            }
            placeholder="/api/products"
            defaultValue={initialQuery.routePath}
          />
        </label>

        <label>
          Method
          <select
            name="routeMethod"
            defaultValue={
              initialQuery.routeMethod ?? ""
            }
          >
            <option value="">Any method</option>
            {DASHBOARD_ANALYTICS_ROUTE_METHODS.map(
              (method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Status code
          <input
            name="statusCode"
            type="number"
            min="100"
            max="599"
            defaultValue={initialQuery.statusCode}
          />
        </label>

        {isUsage ? (
          <label>
            Cache status
            <select
              name="cacheStatus"
              defaultValue={
                initialQuery.cacheStatus ?? ""
              }
            >
              <option value="">Any cache status</option>
              {DASHBOARD_ANALYTICS_CACHE_STATUSES.map(
                (status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ),
              )}
            </select>
          </label>
        ) : null}

        {isRejected ? (
          <label>
            Rejection reason
            <select
              name="rejectionReason"
              defaultValue={
                initialQuery.rejectionReason ?? ""
              }
            >
              <option value="">Any reason</option>
              {DASHBOARD_ANALYTICS_REJECTION_REASONS.map(
                (reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ),
              )}
            </select>
          </label>
        ) : null}

        {supportsSubjectFilters ? (
          <>
            <label>
              Consumer ID
              <input
                name="consumerId"
                type="text"
                maxLength={
                  DASHBOARD_ANALYTICS_MAX_IDENTIFIER_LENGTH
                }
                defaultValue={initialQuery.consumerId}
              />
            </label>

            <label>
              API key ID
              <input
                name="apiKeyId"
                type="text"
                maxLength={
                  DASHBOARD_ANALYTICS_MAX_IDENTIFIER_LENGTH
                }
                defaultValue={initialQuery.apiKeyId}
              />
            </label>
          </>
        ) : null}

        {isEventListing ? (
          <label>
            Page size
            <input
              name="limit"
              type="number"
              min="1"
              max={DASHBOARD_ANALYTICS_MAX_LIMIT}
              defaultValue={
                initialQuery.limit ??
                DASHBOARD_ANALYTICS_DEFAULT_LIMIT
              }
            />
          </label>
        ) : null}
      </div>

      {error ? (
        <p
          className="analytics-filter-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="analytics-filter-actions">
        <button
          className="primary-button"
          type="submit"
          disabled={busy}
        >
          Apply filters
        </button>

        <button
          className="secondary-button"
          type="reset"
          disabled={busy}
        >
          Reset filters
        </button>
      </div>
    </form>
  );
}
