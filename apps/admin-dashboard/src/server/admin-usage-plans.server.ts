import "server-only";

import {
  getDashboardAdminApiConfig,
} from "./admin-api-config.server";
import {
  fetchAdminUsagePlanById,
  fetchAdminUsagePlans,
} from "./admin-usage-plans";

export async function getAdminUsagePlans() {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminUsagePlans(configResult.config);
}

export async function getAdminUsagePlan(
  usagePlanId: string,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminUsagePlanById(
    configResult.config,
    usagePlanId,
  );
}
