import type {
  DownstreamRouteConfig,
  HttpMethod,
} from "../config/downstream-routes.js";
import { validateDownstreamRoutes } from "../config/validate-downstream-routes.js";

export type RouteRuntimeSnapshot = {
  version: number;
  loadedAt: Date;
  routeCount: number;
  routes: readonly DownstreamRouteConfig[];
};

export type ReplaceRouteRuntimeSnapshotResult = {
  previousVersion: number;
  currentVersion: number;
  routeCount: number;
  loadedAt: Date;
};

export type RouteRuntimeRegistry = {
  getSnapshot: () => RouteRuntimeSnapshot;
  replaceRoutes: (
    routes: readonly DownstreamRouteConfig[],
  ) => ReplaceRouteRuntimeSnapshotResult;
  findRoute: (
    method: HttpMethod,
    gatewayPath: string,
    requestHost?: string,
  ) => DownstreamRouteConfig | null;
};

type CreateRouteRuntimeRegistryOptions = {
  initialRoutes?: readonly DownstreamRouteConfig[];
  now?: () => Date;
};

function cloneRouteConfigs(
  routes: readonly DownstreamRouteConfig[],
): DownstreamRouteConfig[] {
  return structuredClone([...routes]) as DownstreamRouteConfig[];
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function createSnapshot(
  version: number,
  routes: readonly DownstreamRouteConfig[],
  loadedAt: Date,
): RouteRuntimeSnapshot {
  const clonedRoutes = cloneRouteConfigs(routes);

  return {
    version,
    loadedAt: cloneDate(loadedAt),
    routeCount: clonedRoutes.length,
    routes: clonedRoutes,
  };
}

export function createRouteRuntimeRegistry(
  options: CreateRouteRuntimeRegistryOptions = {},
): RouteRuntimeRegistry {
  const now = options.now ?? (() => new Date());

  let currentSnapshot = createSnapshot(
    1,
    validateDownstreamRoutes(cloneRouteConfigs(options.initialRoutes ?? [])),
    now(),
  );

  return {
    getSnapshot() {
      return createSnapshot(
        currentSnapshot.version,
        currentSnapshot.routes,
        currentSnapshot.loadedAt,
      );
    },

    replaceRoutes(routes) {
      const previousVersion = currentSnapshot.version;
      const validatedRoutes = validateDownstreamRoutes(cloneRouteConfigs(routes));
      const loadedAt = now();

      currentSnapshot = createSnapshot(
        previousVersion + 1,
        validatedRoutes,
        loadedAt,
      );

      return {
        previousVersion,
        currentVersion: currentSnapshot.version,
        routeCount: currentSnapshot.routeCount,
        loadedAt: cloneDate(currentSnapshot.loadedAt),
      };
    },

    findRoute(method, gatewayPath, requestHost) {
      const findMatch = (candidateHost: string | undefined) =>
        currentSnapshot.routes.find(
          (route) =>
            route.method === method &&
            route.gatewayPath === gatewayPath &&
            route.requestHost === candidateHost,
        ) ?? null;

      const matchedRoute =
        requestHost === undefined
          ? findMatch(undefined)
          : findMatch(requestHost) ?? findMatch(undefined);

      return matchedRoute ? structuredClone(matchedRoute) : null;
    },
  };
}