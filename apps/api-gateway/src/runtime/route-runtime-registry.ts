import type {
  DownstreamRouteConfig,
  HttpMethod,
} from "../config/downstream-routes.js";
import {
  buildServiceDiscoverySnapshot,
  type ServiceDiscoverySnapshot,
} from "../config/service-discovery.js";
import { validateDownstreamRoutes } from "../config/validate-downstream-routes.js";

export type ServiceDiscoveryRandomSource = () => number;

export type RouteRuntimeSnapshot = {
  version: number;
  loadedAt: Date;
  routeCount: number;
  routes: readonly DownstreamRouteConfig[];
  serviceDiscovery: ServiceDiscoverySnapshot;
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
  resolveServiceInstanceBaseUrl: (
    serviceName: string,
    randomSource?: ServiceDiscoveryRandomSource,
  ) => string | null;
};

type CreateRouteRuntimeRegistryOptions = {
  initialRoutes?: readonly DownstreamRouteConfig[];
  now?: () => Date;
};

function cloneRouteConfigs(
  routes: readonly DownstreamRouteConfig[],
): DownstreamRouteConfig[] {
  return structuredClone(
    [...routes],
  ) as DownstreamRouteConfig[];
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function createValidatedSnapshot(
  version: number,
  routes: readonly DownstreamRouteConfig[],
  loadedAt: Date,
): RouteRuntimeSnapshot {
  const clonedRoutes = cloneRouteConfigs(routes);

  const validatedRoutes =
    validateDownstreamRoutes(clonedRoutes);

  const serviceDiscovery =
    buildServiceDiscoverySnapshot(validatedRoutes);

  return {
    version,
    loadedAt: cloneDate(loadedAt),
    routeCount: validatedRoutes.length,
    routes: validatedRoutes,
    serviceDiscovery,
  };
}

function cloneSnapshot(
  snapshot: RouteRuntimeSnapshot,
): RouteRuntimeSnapshot {
  return {
    version: snapshot.version,
    loadedAt: cloneDate(snapshot.loadedAt),
    routeCount: snapshot.routeCount,
    routes: cloneRouteConfigs(snapshot.routes),
    serviceDiscovery: structuredClone(
      snapshot.serviceDiscovery,
    ) as ServiceDiscoverySnapshot,
  };
}

function readServiceDiscoveryRandomValue(
  randomSource: ServiceDiscoveryRandomSource,
): number {
  const randomValue = randomSource();

  if (
    !Number.isFinite(randomValue) ||
    randomValue < 0 ||
    randomValue >= 1
  ) {
    throw new Error(
      "Service discovery random source must return a number from 0 inclusive to 1 exclusive",
    );
  }

  return randomValue;
}

export function createRouteRuntimeRegistry(
  options: CreateRouteRuntimeRegistryOptions = {},
): RouteRuntimeRegistry {
  const now =
    options.now ?? (() => new Date());

  let currentSnapshot =
    createValidatedSnapshot(
      1,
      options.initialRoutes ?? [],
      now(),
    );

  return {
    getSnapshot() {
      return cloneSnapshot(currentSnapshot);
    },

    replaceRoutes(routes) {
      const previousVersion =
        currentSnapshot.version;

      const nextSnapshot =
        createValidatedSnapshot(
          previousVersion + 1,
          routes,
          now(),
        );

      currentSnapshot = nextSnapshot;

      return {
        previousVersion,
        currentVersion:
          currentSnapshot.version,
        routeCount:
          currentSnapshot.routeCount,
        loadedAt:
          cloneDate(currentSnapshot.loadedAt),
      };
    },

    findRoute(
      method,
      gatewayPath,
      requestHost,
    ) {
      const findMatch = (
        candidateHost: string | undefined,
      ) =>
        currentSnapshot.routes.find(
          (route) =>
            route.method === method &&
            route.gatewayPath ===
              gatewayPath &&
            route.requestHost ===
              candidateHost,
        ) ?? null;

      const matchedRoute =
        requestHost === undefined
          ? findMatch(undefined)
          : findMatch(requestHost) ??
            findMatch(undefined);

      return matchedRoute
        ? structuredClone(matchedRoute)
        : null;
    },

    resolveServiceInstanceBaseUrl(
      serviceName,
      randomSource = Math.random,
    ) {
      const service =
        currentSnapshot
          .serviceDiscovery
          .services
          .find(
            (candidate) =>
              candidate.serviceName ===
              serviceName,
          );

      if (!service) {
        return null;
      }

      const randomValue =
        readServiceDiscoveryRandomValue(
          randomSource,
        );

      const selectedIndex =
        Math.floor(
          randomValue *
            service.instances.length,
        );

      return (
        service.instances[selectedIndex]
          ?.baseUrl ?? null
      );
    },
  };
}