import type { DownstreamRouteConfig } from "../config/downstream-routes.js";
import {
  composeServiceInstanceDownstreamUrl,
  MAX_SERVICE_INSTANCE_COUNT,
} from "../config/service-discovery.js";
import {
  selectWeightedDownstreamUrl,
  type WeightedRandomSource,
} from "../config/weighted-upstream-selector.js";
import type {
  RouteRuntimeRegistry,
  ServiceDiscoveryRandomSource,
} from "../runtime/route-runtime-registry.js";

export type ResolvedDownstreamTarget = Readonly<{
  downstreamUrl: string;
  serviceInstanceBaseUrl: string | null;
}>;

export type ResolveDownstreamTargetUrlOptions = {
  routeConfig: DownstreamRouteConfig;
  routeRuntimeRegistry?: RouteRuntimeRegistry;
  weightedRandomSource?: WeightedRandomSource;
  serviceDiscoveryRandomSource?: ServiceDiscoveryRandomSource;
  excludedServiceInstanceBaseUrls?: readonly string[];
};

function readExcludedServiceInstanceBaseUrls(
  values: readonly string[] | undefined,
): ReadonlySet<string> {
  if (values === undefined) {
    return new Set();
  }

  if (values.length > MAX_SERVICE_INSTANCE_COUNT) {
    throw new Error(
      `Excluded service instances must contain at most ${MAX_SERVICE_INSTANCE_COUNT} entries`,
    );
  }

  return new Set(values);
}

function readServiceDiscoveryRandomValue(
  randomSource: ServiceDiscoveryRandomSource = Math.random,
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

function resolveLegacyTarget(
  options: ResolveDownstreamTargetUrlOptions,
): ResolvedDownstreamTarget {
  return Object.freeze({
    downstreamUrl: selectWeightedDownstreamUrl(
      options.routeConfig,
      options.weightedRandomSource,
    ),
    serviceInstanceBaseUrl: null,
  });
}

function resolveDirectDiscoveryTarget(
  options: ResolveDownstreamTargetUrlOptions,
  excludedBaseUrls: ReadonlySet<string>,
): ResolvedDownstreamTarget | null {
  const routeRuntimeRegistry =
    options.routeRuntimeRegistry;

  if (!routeRuntimeRegistry) {
    return null;
  }

  const eligibleInstances =
    options.routeConfig.serviceInstances?.filter(
      (instance) => {
        if (
          excludedBaseUrls.has(
            instance.baseUrl,
          )
        ) {
          return false;
        }

        return (
          routeRuntimeRegistry
            .getServiceInstanceHealthStatus(
              options.routeConfig.serviceName,
              instance.baseUrl,
            )
            ?.eligible === true
        );
      },
    ) ?? [];

  if (eligibleInstances.length === 0) {
    return null;
  }

  const randomValue =
    readServiceDiscoveryRandomValue(
      options.serviceDiscoveryRandomSource,
    );

  const selectedInstance =
    eligibleInstances[
      Math.floor(
        randomValue *
          eligibleInstances.length,
      )
    ];

  if (!selectedInstance) {
    throw new Error(
      "Service discovery selection did not resolve an eligible instance",
    );
  }

  return Object.freeze({
    downstreamUrl:
      composeServiceInstanceDownstreamUrl(
        selectedInstance.baseUrl,
        options.routeConfig.downstreamUrl,
      ),
    serviceInstanceBaseUrl:
      selectedInstance.baseUrl,
  });
}

function resolveWeightedDiscoveryTarget(
  options: ResolveDownstreamTargetUrlOptions,
  excludedBaseUrls: ReadonlySet<string>,
): ResolvedDownstreamTarget | null {
  const routeRuntimeRegistry =
    options.routeRuntimeRegistry;

  const weightedUpstreams =
    options.routeConfig.weightedUpstreams;

  if (
    !routeRuntimeRegistry ||
    weightedUpstreams === undefined
  ) {
    return null;
  }

  const eligibleWeightedUpstreams =
    weightedUpstreams.filter(
      (upstream) => {
        const instanceBaseUrl =
          new URL(
            upstream.downstreamUrl,
          ).origin;

        if (
          excludedBaseUrls.has(
            instanceBaseUrl,
          )
        ) {
          return false;
        }

        return (
          routeRuntimeRegistry
            .getServiceInstanceHealthStatus(
              options.routeConfig.serviceName,
              instanceBaseUrl,
            )
            ?.eligible === true
        );
      },
    );

  if (
    eligibleWeightedUpstreams.length === 0
  ) {
    return null;
  }

  const selectedDownstreamUrl =
    selectWeightedDownstreamUrl(
      {
        ...options.routeConfig,
        weightedUpstreams:
          eligibleWeightedUpstreams,
      },
      options.weightedRandomSource,
    );

  return Object.freeze({
    downstreamUrl:
      selectedDownstreamUrl,
    serviceInstanceBaseUrl:
      new URL(
        selectedDownstreamUrl,
      ).origin,
  });
}

export function resolveDownstreamTarget(
  options: ResolveDownstreamTargetUrlOptions,
): ResolvedDownstreamTarget | null {
  if (
    options.routeConfig.serviceInstances ===
    undefined
  ) {
    return resolveLegacyTarget(options);
  }

  const excludedBaseUrls =
    readExcludedServiceInstanceBaseUrls(
      options.excludedServiceInstanceBaseUrls,
    );

  if (
    options.routeConfig.weightedUpstreams !==
    undefined
  ) {
    return resolveWeightedDiscoveryTarget(
      options,
      excludedBaseUrls,
    );
  }

  return resolveDirectDiscoveryTarget(
    options,
    excludedBaseUrls,
  );
}

export function resolveDownstreamTargetUrl(
  options: ResolveDownstreamTargetUrlOptions,
): string | null {
  return (
    resolveDownstreamTarget(options)
      ?.downstreamUrl ?? null
  );
}
