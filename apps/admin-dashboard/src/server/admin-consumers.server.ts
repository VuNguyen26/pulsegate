import "server-only";

import {
  getDashboardAdminApiConfig,
} from "./admin-api-config.server";
import { fetchAdminConsumers } from "./admin-consumers";

export async function getAdminConsumers() {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminConsumers(
    configResult.config,
  );
}
