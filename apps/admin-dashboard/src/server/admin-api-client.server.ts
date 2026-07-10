import "server-only";

import { fetchAdminRuntimeStatus } from "./admin-api-client";
import { getDashboardAdminApiConfig } from "./admin-api-config.server";

export async function getAdminRuntimeStatus() {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminRuntimeStatus(
    configResult.config,
  );
}