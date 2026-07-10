import "server-only";

import {
  getDashboardAdminApiConfig,
} from "./admin-api-config.server";
import {
  fetchAdminRouteById,
  fetchAdminRouteRuntime,
  fetchAdminRoutes,
} from "./admin-routes";

export async function getAdminRoutes() {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminRoutes(configResult.config);
}

export async function getAdminRoute(
  routeId: string,
) {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminRouteById(
    configResult.config,
    routeId,
  );
}

export async function getAdminRouteRuntime() {
  const configResult =
    getDashboardAdminApiConfig();

  if (!configResult.ok) {
    return configResult;
  }

  return fetchAdminRouteRuntime(
    configResult.config,
  );
}
