import "server-only";

import type {
  DashboardAnalyticsQuery,
} from "../lib/admin-analytics-query";
import {
  getDashboardAdminApiConfig,
} from "./admin-api-config.server";
import {
  fetchAdminApiKeyQuotaState,
  fetchAdminApiKeyUsageSummary,
  fetchAdminConsumerUsageSummary,
  fetchAdminUsageEvents,
  fetchAdminUsagePlanUsageSummary,
} from "./admin-usage-analytics";

export async function getAdminConsumerUsageSummary(
  consumerId: string,
  query: DashboardAnalyticsQuery,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminConsumerUsageSummary(
    configResult.config,
    consumerId,
    query,
  );
}

export async function getAdminApiKeyUsageSummary(
  apiKeyId: string,
  query: DashboardAnalyticsQuery,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminApiKeyUsageSummary(
    configResult.config,
    apiKeyId,
    query,
  );
}

export async function getAdminApiKeyQuotaState(
  apiKeyId: string,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminApiKeyQuotaState(
    configResult.config,
    apiKeyId,
  );
}

export async function getAdminUsagePlanUsageSummary(
  usagePlanId: string,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminUsagePlanUsageSummary(
    configResult.config,
    usagePlanId,
  );
}

export async function getAdminUsageEvents(
  query: DashboardAnalyticsQuery,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminUsageEvents(
    configResult.config,
    query,
  );
}
