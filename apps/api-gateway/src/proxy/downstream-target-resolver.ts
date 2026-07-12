import type { DownstreamRouteConfig } from "../config/downstream-routes.js";
import {
  composeServiceInstanceDownstreamUrl,
} from "../config/service-discovery.js";
import {
  selectWeightedDownstreamUrl,
  type WeightedRandomSource,
} from "../config/weighted-upstream-selector.js";
import type {
  RouteRuntimeRegistry,
  ServiceDiscoveryRandomSource,
} from "../runtime/route-runtime-registry.js";

export type ResolveDownstreamTargetUrlOptions = {
  routeConfig: DownstreamRouteConfig;
  routeRuntimeRegistry?: RouteRuntimeRegistry;
  weightedRandomSource?: WeightedRandomSource;
  serviceDiscoveryRandomSource?: ServiceDiscoveryRandomSource;
};

export function resolveDownstreamTargetUrl(
  options: ResolveDownstreamTargetUrlOptions,
): string | null {
  const selectedDownstreamUrl =
    selectWeightedDownstreamUrl(
      options.routeConfig,
      options.weightedRandomSource,
    );

  if (
    options.routeConfig.serviceInstances === undefined ||
    options.routeConfig.weightedUpstreams !== undefined
  ) {
    return selectedDownstreamUrl;
  }

  const instanceBaseUrl =
    options.routeRuntimeRegistry
      ?.resolveServiceInstanceBaseUrl(
        options.routeConfig.serviceName,
        options.serviceDiscoveryRandomSource,
      ) ?? null;

  if (!instanceBaseUrl) {
    return null;
  }

  return composeServiceInstanceDownstreamUrl(
    instanceBaseUrl,
    selectedDownstreamUrl,
  );
}