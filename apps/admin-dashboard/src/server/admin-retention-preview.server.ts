import "server-only";

import {
  getDashboardAdminApiConfig,
} from "./admin-api-config.server";
import {
  fetchAdminRetentionPreview,
} from "./admin-retention-preview";

export async function getAdminRetentionPreview() {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminRetentionPreview(
    configResult.config,
  );
}