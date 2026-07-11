import {
  containsSensitiveAdminField,
  isRecord,
  readSafeRequestId,
  type DashboardAdminResourceError,
  type DashboardAdminResourceErrorCode,
  type DashboardAdminResourceLoadResult,
} from "./admin-resource-contract";
import {
  isDashboardAnalyticsIdentifier,
  serializeDashboardAnalyticsQuery,
  type DashboardAnalyticsQuery,
  type DashboardAnalyticsQueryMode,
} from "./admin-analytics-query";
import {
  isDashboardApiKeyQuotaStateForKey,
  isDashboardUsageEventsListing,
  isDashboardUsagePlanSummaryForPlan,
  isDashboardUsageSummaryForSubject,
  type DashboardApiKeyQuotaState,
  type DashboardUsageEventsListing,
  type DashboardUsagePlanUsageSummary,
  type DashboardUsageSummary,
  type DashboardUsageSummarySubjectType,
} from "./usage-analytics";

const SAFE_ANALYTICS_ERROR_CODES =
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
    "The Dashboard received an invalid analytics response.",
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
      "The Dashboard analytics resource is unavailable.",
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
    !SAFE_ANALYTICS_ERROR_CODES.has(
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

async function loadDashboardAnalyticsResource<T>(
  path: string,
  validateData: (value: unknown) => value is T,
  fetchImplementation: FetchImplementation,
  signal?: AbortSignal,
): Promise<DashboardAdminResourceLoadResult<T>> {
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

function buildSubjectSummaryPath(
  subjectType: DashboardUsageSummarySubjectType,
  subjectId: string,
  query: DashboardAnalyticsQuery,
): string | null {
  if (!isDashboardAnalyticsIdentifier(subjectId)) {
    return null;
  }

  const serialized = serializeDashboardAnalyticsQuery(
    "usage-summary",
    query,
  );

  if (!serialized.ok) {
    return null;
  }

  const segment =
    subjectType === "consumer"
      ? "consumers"
      : "api-keys";

  const path =
    `/api/admin/usage/${segment}/` +
    `${encodeURIComponent(subjectId)}/summary`;

  return serialized.value
    ? `${path}?${serialized.value}`
    : path;
}

function buildFixedIdentityPath(
  prefix: string,
  identifier: string,
  suffix: string,
): string | null {
  if (!isDashboardAnalyticsIdentifier(identifier)) {
    return null;
  }

  return (
    `${prefix}${encodeURIComponent(identifier)}` +
    suffix
  );
}

function buildEventListingPath(
  query: DashboardAnalyticsQuery,
): string | null {
  const serialized = serializeDashboardAnalyticsQuery(
    "usage-events",
    query,
  );

  if (!serialized.ok) {
    return null;
  }

  return (
    "/api/admin/usage/events" +
    `?${serialized.value}`
  );
}

function invalidPathResult<T>():
  DashboardAdminResourceLoadResult<T> {
  return {
    status: "error",
    error: invalidResponseError(
      "The Dashboard analytics request is invalid.",
    ),
  };
}

export async function loadDashboardConsumerUsageSummary(
  consumerId: string,
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<
  DashboardAdminResourceLoadResult<DashboardUsageSummary>
> {
  const path = buildSubjectSummaryPath(
    "consumer",
    consumerId,
    query,
  );

  if (!path) {
    return invalidPathResult();
  }

  return loadDashboardAnalyticsResource(
    path,
    (
      value,
    ): value is DashboardUsageSummary =>
      isDashboardUsageSummaryForSubject(
        value,
        "consumer",
        consumerId,
      ),
    fetchImplementation,
    signal,
  );
}

export async function loadDashboardApiKeyUsageSummary(
  apiKeyId: string,
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<
  DashboardAdminResourceLoadResult<DashboardUsageSummary>
> {
  const path = buildSubjectSummaryPath(
    "apiKey",
    apiKeyId,
    query,
  );

  if (!path) {
    return invalidPathResult();
  }

  return loadDashboardAnalyticsResource(
    path,
    (
      value,
    ): value is DashboardUsageSummary =>
      isDashboardUsageSummaryForSubject(
        value,
        "apiKey",
        apiKeyId,
      ),
    fetchImplementation,
    signal,
  );
}

export async function loadDashboardApiKeyQuotaState(
  apiKeyId: string,
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<
  DashboardAdminResourceLoadResult<DashboardApiKeyQuotaState>
> {
  const path = buildFixedIdentityPath(
    "/api/admin/api-keys/",
    apiKeyId,
    "/quota",
  );

  if (!path) {
    return invalidPathResult();
  }

  return loadDashboardAnalyticsResource(
    path,
    (
      value,
    ): value is DashboardApiKeyQuotaState =>
      isDashboardApiKeyQuotaStateForKey(
        value,
        apiKeyId,
      ),
    fetchImplementation,
    signal,
  );
}

export async function loadDashboardUsagePlanUsageSummary(
  usagePlanId: string,
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<
  DashboardAdminResourceLoadResult<DashboardUsagePlanUsageSummary>
> {
  const path = buildFixedIdentityPath(
    "/api/admin/usage-plans/",
    usagePlanId,
    "/usage-summary",
  );

  if (!path) {
    return invalidPathResult();
  }

  return loadDashboardAnalyticsResource(
    path,
    (
      value,
    ): value is DashboardUsagePlanUsageSummary =>
      isDashboardUsagePlanSummaryForPlan(
        value,
        usagePlanId,
      ),
    fetchImplementation,
    signal,
  );
}

export async function loadDashboardUsageEvents(
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<
  DashboardAdminResourceLoadResult<DashboardUsageEventsListing>
> {
  const path = buildEventListingPath(query);

  if (!path) {
    return invalidPathResult();
  }

  return loadDashboardAnalyticsResource(
    path,
    isDashboardUsageEventsListing,
    fetchImplementation,
    signal,
  );
}
