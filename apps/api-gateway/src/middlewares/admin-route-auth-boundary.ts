import type { RouteOptions } from "fastify";

import { isAdminApiKeyAuthMiddleware } from "./admin-api-key-auth.middleware.js";

const ADMIN_ROUTE_PREFIX = "/internal/admin";

function normalizePreHandlers(
  preHandler: RouteOptions["preHandler"],
): readonly unknown[] {
  if (!preHandler) {
    return [];
  }

  return Array.isArray(preHandler) ? preHandler : [preHandler];
}

function formatRouteMethod(method: RouteOptions["method"]): string {
  return Array.isArray(method) ? method.join(",") : method;
}

export function assertAdminRouteAuthBoundary(
  routeOptions: RouteOptions,
): void {
  if (
    routeOptions.url !== ADMIN_ROUTE_PREFIX &&
    !routeOptions.url.startsWith(`${ADMIN_ROUTE_PREFIX}/`)
  ) {
    return;
  }

  const hasAdminApiKeyGuard = normalizePreHandlers(
    routeOptions.preHandler,
  ).some(isAdminApiKeyAuthMiddleware);

  if (hasAdminApiKeyGuard) {
    return;
  }

  throw new Error(
    `Admin route ${formatRouteMethod(routeOptions.method)} ${
      routeOptions.url
    } must use createAdminApiKeyAuthMiddleware`,
  );
}