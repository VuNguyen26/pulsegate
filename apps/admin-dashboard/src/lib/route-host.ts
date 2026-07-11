export type RouteRequestHost = string | null;

export function isRouteRequestHost(
  value: unknown,
): value is RouteRequestHost {
  return (
    value === null ||
    (typeof value === "string" && value.length > 0)
  );
}

export function isOptionalRouteRequestHost(
  value: unknown,
): value is RouteRequestHost | undefined {
  return (
    value === undefined ||
    isRouteRequestHost(value)
  );
}

export function formatRouteRequestHost(
  requestHost: RouteRequestHost | undefined,
): string {
  return requestHost ?? "Path-only";
}

export function buildRouteRowKey(route: {
  requestHost?: RouteRequestHost;
  method: string;
  gatewayPath: string;
}): string {
  return [
    route.requestHost ?? "*",
    route.method,
    route.gatewayPath,
  ].join(":");
}
