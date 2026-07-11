import "server-only";

import type {
  DashboardRollupQuery,
} from "../lib/admin-rollup-query";
import {
  getDashboardAdminApiConfig,
} from "./admin-api-config.server";
import {
  fetchAdminRollups,
} from "./admin-rollups";

export async function getAdminRollups(
  query: DashboardRollupQuery,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminRollups(
    configResult.config,
    query,
  );
}