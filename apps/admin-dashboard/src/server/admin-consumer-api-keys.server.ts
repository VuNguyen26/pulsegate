import "server-only";

import {
  getDashboardAdminApiConfig,
} from "./admin-api-config.server";
import {
  fetchAdminConsumerApiKeys,
} from "./admin-consumer-api-keys";

export async function getAdminConsumerApiKeys(
  consumerId: string,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminConsumerApiKeys(
    configResult.config,
    consumerId,
  );
}
