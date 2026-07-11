import "server-only";

import type {
  DashboardAnalyticsQuery,
} from "../lib/admin-analytics-query";
import {
  getDashboardAdminApiConfig,
} from "./admin-api-config.server";
import {
  fetchAdminRejectedEvents,
  fetchAdminRejectedEventsSummary,
} from "./admin-rejected-analytics";

export async function getAdminRejectedEventsSummary(
  query: DashboardAnalyticsQuery,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminRejectedEventsSummary(
    configResult.config,
    query,
  );
}

export async function getAdminRejectedEvents(
  query: DashboardAnalyticsQuery,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminRejectedEvents(
    configResult.config,
    query,
  );
}
