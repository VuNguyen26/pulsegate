import type {
  DashboardAnalyticsQuery,
} from "../lib/admin-analytics-query";
import {
  isDashboardAnalyticsIdentifier,
  serializeDashboardAnalyticsQuery,
} from "../lib/admin-analytics-query";
import {
  isDashboardApiKeyQuotaStateForKey,
  isDashboardUsageEventsListing,
  isDashboardUsagePlanSummaryForPlan,
  isDashboardUsageSummaryForSubject,
  type DashboardApiKeyQuotaState,
  type DashboardUsageEventsListing,
  type DashboardUsagePlanUsageSummary,
  type DashboardUsageSummary,
} from "../lib/usage-analytics";
import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminReadUrl,
  type AdminReadResourceClientResult,
} from "./admin-read-resource";

type FetchImplementation = typeof fetch;

function invalidAnalyticsRequest(
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
  queryString = "",
): URL {
  const url = new URL(pathname, config.gatewayBaseUrl);

  if (queryString) {
    url.search = queryString;
  }

  return url;
}

export async function fetchAdminConsumerUsageSummary(
  config: DashboardAdminApiConfig,
  consumerId: string,
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
): Promise<AdminReadResourceClientResult<DashboardUsageSummary>> {
  if (!isDashboardAnalyticsIdentifier(consumerId)) {
    return invalidAnalyticsRequest(
      "The consumer identifier is invalid.",
    );
  }

  const serialized = serializeDashboardAnalyticsQuery(
    "usage-summary",
    query,
  );

  if (!serialized.ok) {
    return invalidAnalyticsRequest(
      serialized.error.message,
    );
  }

  return fetchAdminReadUrl(
    config,
    buildFixedAdminUrl(
      config,
      `/internal/admin/usage/consumers/${encodeURIComponent(consumerId)}/summary`,
      serialized.value,
    ),
    (
      value,
    ): value is DashboardUsageSummary =>
      isDashboardUsageSummaryForSubject(
        value,
        "consumer",
        consumerId,
      ),
    fetchImplementation,
  );
}

export async function fetchAdminApiKeyUsageSummary(
  config: DashboardAdminApiConfig,
  apiKeyId: string,
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
): Promise<AdminReadResourceClientResult<DashboardUsageSummary>> {
  if (!isDashboardAnalyticsIdentifier(apiKeyId)) {
    return invalidAnalyticsRequest(
      "The API-key identifier is invalid.",
    );
  }

  const serialized = serializeDashboardAnalyticsQuery(
    "usage-summary",
    query,
  );

  if (!serialized.ok) {
    return invalidAnalyticsRequest(
      serialized.error.message,
    );
  }

  return fetchAdminReadUrl(
    config,
    buildFixedAdminUrl(
      config,
      `/internal/admin/usage/api-keys/${encodeURIComponent(apiKeyId)}/summary`,
      serialized.value,
    ),
    (
      value,
    ): value is DashboardUsageSummary =>
      isDashboardUsageSummaryForSubject(
        value,
        "apiKey",
        apiKeyId,
      ),
    fetchImplementation,
  );
}

export async function fetchAdminApiKeyQuotaState(
  config: DashboardAdminApiConfig,
  apiKeyId: string,
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<DashboardApiKeyQuotaState>
> {
  if (!isDashboardAnalyticsIdentifier(apiKeyId)) {
    return invalidAnalyticsRequest(
      "The API-key identifier is invalid.",
    );
  }

  return fetchAdminReadUrl(
    config,
    buildFixedAdminUrl(
      config,
      `/internal/admin/api-keys/${encodeURIComponent(apiKeyId)}/quota`,
    ),
    (
      value,
    ): value is DashboardApiKeyQuotaState =>
      isDashboardApiKeyQuotaStateForKey(
        value,
        apiKeyId,
      ),
    fetchImplementation,
  );
}

export async function fetchAdminUsagePlanUsageSummary(
  config: DashboardAdminApiConfig,
  usagePlanId: string,
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<DashboardUsagePlanUsageSummary>
> {
  if (!isDashboardAnalyticsIdentifier(usagePlanId)) {
    return invalidAnalyticsRequest(
      "The usage-plan identifier is invalid.",
    );
  }

  return fetchAdminReadUrl(
    config,
    buildFixedAdminUrl(
      config,
      `/internal/admin/usage-plans/${encodeURIComponent(usagePlanId)}/usage-summary`,
    ),
    (
      value,
    ): value is DashboardUsagePlanUsageSummary =>
      isDashboardUsagePlanSummaryForPlan(
        value,
        usagePlanId,
      ),
    fetchImplementation,
  );
}

export async function fetchAdminUsageEvents(
  config: DashboardAdminApiConfig,
  query: DashboardAnalyticsQuery = {},
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<DashboardUsageEventsListing>
> {
  const serialized = serializeDashboardAnalyticsQuery(
    "usage-events",
    query,
  );

  if (!serialized.ok) {
    return invalidAnalyticsRequest(
      serialized.error.message,
    );
  }

  return fetchAdminReadUrl(
    config,
    buildFixedAdminUrl(
      config,
      "/internal/admin/usage/events",
      serialized.value,
    ),
    isDashboardUsageEventsListing,
    fetchImplementation,
  );
}
