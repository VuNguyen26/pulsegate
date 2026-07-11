import {
  containsSensitiveAdminField,
  isRecord,
  readSafeRequestId,
  type DashboardAdminResourceError,
  type DashboardAdminResourceErrorCode,
  type DashboardAdminResourceLoadResult,
} from "./admin-resource-contract";
import {
  serializeDashboardAnalyticsQuery,
  type DashboardAnalyticsQuery,
  type DashboardAnalyticsQueryMode,
} from "./admin-analytics-query";
import {
  isDashboardRejectedEventsListing,
  isDashboardRejectedEventsSummary,
  type DashboardRejectedEventsListing,
  type DashboardRejectedEventsSummary,
} from "./rejected-analytics";

const SAFE_REJECTED_ERROR_CODES =
  new Set<DashboardAdminResourceErrorCode>([
    "ADMIN_DASHBOARD_CONFIG_MISSING",
    "ADMIN_DASHBOARD_CONFIG_INVALID",
    "ADMIN_DASHBOARD_UNAUTHORIZED",
    "ADMIN_DASHBOARD_FORBIDDEN",
    "ADMIN_DASHBOARD_NOT_FOUND",
    "ADMIN_DASHBOARD_TIMEOUT",
    "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE",
    "ADMIN_DASHBOARD_UPSTREAM_ERROR",
    "ADMIN_DASHBOARD_INVALID_RESPONSE",
    "ADMIN_DASHBOARD_INVALID_QUERY",
    "ADMIN_DASHBOARD_UNAVAILABLE",
  ]);

type FetchImplementation = typeof fetch;

function invalidResponseError(
  message =
    "The Dashboard received an invalid rejected-analytics response.",
): DashboardAdminResourceError {
  return {
    code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
    message,
    requestId: null,
  };
}

function unavailableError(): DashboardAdminResourceError {
  return {
    code: "ADMIN_DASHBOARD_UNAVAILABLE",
    message:
      "The Dashboard rejected-events resource is unavailable.",
    requestId: null,
  };
}

function readErrorPayload(
  value: unknown,
): DashboardAdminResourceError | null {
  if (
    !isRecord(value) ||
    !isRecord(value.error) ||
    typeof value.error.code !== "string" ||
    !SAFE_REJECTED_ERROR_CODES.has(
      value.error.code as DashboardAdminResourceErrorCode,
    ) ||
    typeof value.error.message !== "string" ||
    value.error.message.trim().length === 0 ||
    value.error.message.length > 512
  ) {
    return null;
  }

  return {
    code:
      value.error.code as DashboardAdminResourceErrorCode,
    message: value.error.message,
    requestId: readSafeRequestId(
      value.error.requestId,
    ),
  };
}

function buildRejectedAnalyticsPath(
  mode:
    | "rejected-summary"
    | "rejected-events",
  query: DashboardAnalyticsQuery,
): string | null {
  const serialized =
    serializeDashboardAnalyticsQuery(
      mode,
      query,
    );

  if (!serialized.ok) {
    return null;
  }

  const resource =
    mode === "rejected-summary"
      ? "summary"
      : "events";

  const path =
    `/api/admin/api-rejections/${resource}`;

  return serialized.value
    ? `${path}?${serialized.value}`
    : path;
}

async function loadRejectedAnalyticsResource<T>(
  mode: DashboardAnalyticsQueryMode,
  query: DashboardAnalyticsQuery,
  validateData: (value: unknown) => value is T,
  fetchImplementation: FetchImplementation,
  signal?: AbortSignal,
): Promise<DashboardAdminResourceLoadResult<T>> {
  if (
    mode !== "rejected-summary" &&
    mode !== "rejected-events"
  ) {
    return {
      status: "error",
      error: invalidResponseError(
        "The rejected-analytics request mode is invalid.",
      ),
    };
  }

  const path = buildRejectedAnalyticsPath(
    mode,
    query,
  );

  if (!path) {
    return {
      status: "error",
      error: invalidResponseError(
        "The rejected-analytics request is invalid.",
      ),
    };
  }

  try {
    const requestInit: RequestInit = {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
      ...(signal ? { signal } : {}),
    };

    const response = await fetchImplementation(
      path,
      requestInit,
    );

    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      return {
        status: "error",
        error:
          readErrorPayload(payload) ??
          unavailableError(),
      };
    }

    if (
      !isRecord(payload) ||
      !("data" in payload) ||
      containsSensitiveAdminField(payload.data) ||
      !validateData(payload.data)
    ) {
      return {
        status: "error",
        error: invalidResponseError(),
      };
    }

    return {
      status: "success",
      data: payload.data,
    };
  } catch {
    return {
      status: "error",
      error: unavailableError(),
    };
  }
}

export async function loadDashboardRejectedEventsSummary(
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<
  DashboardAdminResourceLoadResult<DashboardRejectedEventsSummary>
> {
  return loadRejectedAnalyticsResource(
    "rejected-summary",
    query,
    isDashboardRejectedEventsSummary,
    fetchImplementation,
    signal,
  );
}

export async function loadDashboardRejectedEvents(
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<
  DashboardAdminResourceLoadResult<DashboardRejectedEventsListing>
> {
  return loadRejectedAnalyticsResource(
    "rejected-events",
    query,
    isDashboardRejectedEventsListing,
    fetchImplementation,
    signal,
  );
}
