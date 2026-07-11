import {
  parseDashboardAnalyticsSearchParams,
  type DashboardAnalyticsQuery,
  type DashboardAnalyticsQueryMode,
} from "../lib/admin-analytics-query";
import {
  mapAdminReadResourceResponse,
  type AdminReadResourceServerResult,
} from "./admin-read-resource";

export type AdminAnalyticsRequestQueryResult =
  | {
      ok: true;
      query: DashboardAnalyticsQuery;
    }
  | {
      ok: false;
      response: Response;
    };

function invalidQueryResponse(
  message: string,
): Response {
  return Response.json(
    {
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        message,
        requestId: null,
      },
    },
    {
      status: 400,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

export function parseAdminAnalyticsRequestQuery(
  request: Request,
  mode: DashboardAnalyticsQueryMode,
): AdminAnalyticsRequestQueryResult {
  const url = new URL(request.url);
  const result =
    parseDashboardAnalyticsSearchParams(
      mode,
      url.searchParams,
    );

  if (!result.ok) {
    return {
      ok: false,
      response: invalidQueryResponse(
        result.error.message,
      ),
    };
  }

  return {
    ok: true,
    query: result.value,
  };
}

export function rejectAdminAnalyticsRequestQuery(
  request: Request,
): Response | null {
  const url = new URL(request.url);
  const firstKey =
    url.searchParams.keys().next().value;

  if (typeof firstKey !== "string") {
    return null;
  }

  return invalidQueryResponse(
    `${firstKey} is not supported for this resource.`,
  );
}

export function createAdminAnalyticsReadResponse<T>(
  result: AdminReadResourceServerResult<T>,
): Response {
  const response =
    mapAdminReadResourceResponse(result);

  return Response.json(response.body, {
    status: response.status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
