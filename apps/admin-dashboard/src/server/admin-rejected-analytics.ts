import type {
  DashboardAnalyticsQuery,
} from "../lib/admin-analytics-query";
import {
  serializeDashboardAnalyticsQuery,
} from "../lib/admin-analytics-query";
import {
  isDashboardRejectedEventsSummary,
  sanitizeDashboardRejectedEventsListing,
  type DashboardRejectedEventsListing,
  type DashboardRejectedEventsSummary,
} from "../lib/rejected-analytics";
import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminReadUrl,
  type AdminReadResourceClientResult,
} from "./admin-read-resource";

type FetchImplementation = typeof fetch;

function invalidRejectedAnalyticsResponse(
  message: string,
): AdminReadResourceClientResult<never> {
  return {
    ok: false,
    error: {
      code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      message,
      status: null,
      requestId: null,
    },
  };
}

function buildFixedAdminUrl(
  config: DashboardAdminApiConfig,
  pathname: string,
  queryString: string,
): URL {
  const url = new URL(
    pathname,
    config.gatewayBaseUrl,
  );

  if (queryString) {
    url.search = queryString;
  }

  return url;
}

export async function fetchAdminRejectedEventsSummary(
  config: DashboardAdminApiConfig,
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<DashboardRejectedEventsSummary>
> {
  const serialized =
    serializeDashboardAnalyticsQuery(
      "rejected-summary",
      query,
    );

  if (!serialized.ok) {
    return invalidRejectedAnalyticsResponse(
      serialized.error.message,
    );
  }

  return fetchAdminReadUrl(
    config,
    buildFixedAdminUrl(
      config,
      "/internal/admin/api-rejections/summary",
      serialized.value,
    ),
    isDashboardRejectedEventsSummary,
    fetchImplementation,
  );
}

export async function fetchAdminRejectedEvents(
  config: DashboardAdminApiConfig,
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<DashboardRejectedEventsListing>
> {
  const serialized =
    serializeDashboardAnalyticsQuery(
      "rejected-events",
      query,
    );

  if (!serialized.ok) {
    return invalidRejectedAnalyticsResponse(
      serialized.error.message,
    );
  }

  const upstreamResult =
    await fetchAdminReadUrl<unknown>(
      config,
      buildFixedAdminUrl(
        config,
        "/internal/admin/api-rejections/events",
        serialized.value,
      ),
      (_value): _value is unknown => true,
      fetchImplementation,
    );

  if (!upstreamResult.ok) {
    return upstreamResult;
  }

  const sanitized =
    sanitizeDashboardRejectedEventsListing(
      upstreamResult.data,
    );

  if (!sanitized) {
    return invalidRejectedAnalyticsResponse(
      "The Gateway returned an invalid rejected-event listing.",
    );
  }

  return {
    ok: true,
    accessMode: upstreamResult.accessMode,
    data: sanitized,
  };
}
