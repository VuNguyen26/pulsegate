import type {
  DownstreamRouteConfig,
  HttpMethod,
} from "./downstream-routes.js";

export type RouteIdentityInput = {
  requestHost?: string;
  method: HttpMethod;
  gatewayPath: string;
};

export function buildRouteIdentityKey(
  route: RouteIdentityInput,
): string {
  return JSON.stringify([
    route.requestHost ?? null,
    route.method,
    route.gatewayPath,
  ]);
}

export function formatRouteIdentityLabel(
  route: RouteIdentityInput,
): string {
  const methodAndPath =
    `${route.method}:${route.gatewayPath}`;

  return route.requestHost
    ? `${route.requestHost}|${methodAndPath}`
    : methodAndPath;
}

export function buildConfiguredRoutePolicyPath(
  route: Pick<
    DownstreamRouteConfig,
    "requestHost" | "gatewayPath"
  >,
): string {
  return route.requestHost
    ? `host=${route.requestHost}:${route.gatewayPath}`
    : route.gatewayPath;
}