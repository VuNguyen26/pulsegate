import "server-only";

import {
  getDashboardAdminApiConfig,
} from "./admin-api-config.server";
import {
  fetchAdminSchedulerPreview,
} from "./admin-scheduler-preview";

export async function getAdminSchedulerPreview() {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminSchedulerPreview(
    configResult.config,
  );
}