import {
  mapOptionalWeightedUpstreams as mapPersistedWeightedUpstreams,
} from "../config/database-route-config.mapper.js";
import {
  buildServiceDiscoverySnapshot,
  mapOptionalServiceInstances,
} from "../config/service-discovery.js";
import type {
  DownstreamRouteConfig,
  HttpMethod,
  WeightedUpstream,
} from "../config/downstream-routes.js";
import {
  normalizeConfiguredRequestHost,
} from "../config/request-host.js";
import { validateDownstreamRoutes } from "../config/validate-downstream-routes.js";
import type {
  RouteConfigCreateData,
  RouteConfigReadModel,
  RouteConfigResponse,
  RouteConfigUpdateData,
} from "./route-management.types.js";

const SUPPORTED_HTTP_METHODS = new Set<HttpMethod>([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

const DEFAULT_RETRY_ON_STATUSES = [502, 503, 504];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requirePlainObject(
  fieldName: string,
  value: unknown,
): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new Error(`${fieldName} must be an object`);
  }

  return value;
}

function getOptionalObject(
  fieldName: string,
  value: unknown,
): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }

  return requirePlainObject(fieldName, value);
}

function readRequiredString(
  fieldName: string,
  value: unknown,
): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  return trimmedValue;
}

function readOptionalRequestHost(
  value: unknown,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error("requestHost must be a string or null");
  }

  return normalizeConfiguredRequestHost(value);
}

function readHttpMethod(value: unknown): HttpMethod {
  const method = readRequiredString("method", value).toUpperCase();

  if (!SUPPORTED_HTTP_METHODS.has(method as HttpMethod)) {
    throw new Error("method is not supported");
  }

  return method as HttpMethod;
}

function readOptionalBoolean(
  fieldName: string,
  value: unknown,
  fallback: boolean,
): boolean {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be a boolean`);
  }

  return value;
}

function readOptionalInteger(
  fieldName: string,
  value: unknown,
  fallback: number,
): number {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }

  return value;
}

function readRequiredInteger(
  fieldName: string,
  value: unknown,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }

  return value;
}

function mapRequestWeightedUpstreams(
  value: unknown,
): WeightedUpstream[] | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("weightedUpstreams must be an array");
  }

  return value.map((item, index) => {
    const fieldName = `weightedUpstreams[${index}]`;
    const upstream = requirePlainObject(fieldName, item);

    return {
      downstreamUrl: readRequiredString(
        `${fieldName}.downstreamUrl`,
        upstream.downstreamUrl,
      ),
      weight: readRequiredInteger(
        `${fieldName}.weight`,
        upstream.weight,
      ),
    };
  });
}
function mapHeaderMap(
  fieldName: string,
  value: unknown,
): Record<string, string> {
  if (value === null || value === undefined) {
    return {};
  }

  if (!isPlainObject(value)) {
    throw new Error(`${fieldName} must be an object with string values`);
  }

  const headers: Record<string, string> = {};

  for (const [headerName, headerValue] of Object.entries(value)) {
    if (typeof headerValue !== "string") {
      throw new Error(`${fieldName}.${headerName} must be a string`);
    }

    headers[headerName] = headerValue;
  }

  return headers;
}

function mapStringArray(fieldName: string, value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array of strings`);
  }

  for (const item of value) {
    if (typeof item !== "string") {
      throw new Error(`${fieldName} must contain only strings`);
    }
  }

  return value;
}

function mapNumberArray(fieldName: string, value: unknown): number[] {
  if (value === null || value === undefined) {
    return DEFAULT_RETRY_ON_STATUSES;
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array of numbers`);
  }

  for (const item of value) {
    if (!Number.isInteger(item)) {
      throw new Error(`${fieldName} must contain only integers`);
    }
  }

  return value;
}

function mapRouteConfigReadModelToRequestBody(
  route: RouteConfigReadModel,
): Record<string, unknown> {
  return {
    serviceName: route.serviceName,
    gatewayPath: route.gatewayPath,
    requestHost: route.requestHost ?? null,
    downstreamUrl: route.downstreamUrl,
    weightedUpstreams:
      mapPersistedWeightedUpstreams(
        "weightedUpstreams",
        route.weightedUpstreams,
      ) ?? null,
    serviceInstances:
      mapOptionalServiceInstances(
        route.serviceInstances,
      )?.map((instance) => ({
        ...instance,
      })) ?? null,
    method: route.method,
    enabled: route.enabled,
    priority: route.priority,
    policies: {
      auth: {
        requireApiKey: route.requireApiKey,
        requireJwt: route.requireJwt,
      },
      timeout: {
        enabled: route.timeoutEnabled,
        timeoutMs: route.timeoutMs,
      },
      cache: {
        enabled: route.cacheEnabled,
        ttlSeconds: route.cacheTtlSeconds,
      },
      rateLimit: {
        enabled: route.rateLimitEnabled,
        limit: route.rateLimitLimit,
        windowMs: route.rateLimitWindowMs,
      },
      requestTransform: {
        enabled: route.requestTransformEnabled,
        addHeaders: mapHeaderMap("requestAddHeaders", route.requestAddHeaders),
        removeHeaders: mapStringArray(
          "requestRemoveHeaders",
          route.requestRemoveHeaders,
        ),
      },
      responseTransform: {
        enabled: route.responseTransformEnabled,
        addHeaders: mapHeaderMap(
          "responseAddHeaders",
          route.responseAddHeaders,
        ),
        removeHeaders: mapStringArray(
          "responseRemoveHeaders",
          route.responseRemoveHeaders,
        ),
      },
      retry: {
        enabled: route.retryEnabled,
        attempts: route.retryAttempts,
        retryOnStatuses: mapNumberArray(
          "retryOnStatuses",
          route.retryOnStatuses,
        ),
      },
    },
  };
}

function mergePolicyGroup(
  existingPolicies: Record<string, unknown>,
  patchPolicies: Record<string, unknown>,
  policyName: string,
): Record<string, unknown> {
  const existingPolicy = getOptionalObject(
    `existing.policies.${policyName}`,
    existingPolicies[policyName],
  );

  const patchPolicy = getOptionalObject(
    `policies.${policyName}`,
    patchPolicies[policyName],
  );

  return {
    ...existingPolicy,
    ...patchPolicy,
  };
}

function mergeRouteConfigUpdateRequest(
  existingRoute: RouteConfigReadModel,
  body: unknown,
): Record<string, unknown> {
  const existingBody = mapRouteConfigReadModelToRequestBody(existingRoute);
  const patchBody = requirePlainObject("body", body);

  const existingPolicies = getOptionalObject(
    "existing.policies",
    existingBody.policies,
  );

  const patchPolicies = getOptionalObject("policies", patchBody.policies);

  return {
    ...existingBody,
    ...patchBody,
    policies: {
      auth: mergePolicyGroup(existingPolicies, patchPolicies, "auth"),
      timeout: mergePolicyGroup(existingPolicies, patchPolicies, "timeout"),
      cache: mergePolicyGroup(existingPolicies, patchPolicies, "cache"),
      rateLimit: mergePolicyGroup(
        existingPolicies,
        patchPolicies,
        "rateLimit",
      ),
      requestTransform: mergePolicyGroup(
        existingPolicies,
        patchPolicies,
        "requestTransform",
      ),
      responseTransform: mergePolicyGroup(
        existingPolicies,
        patchPolicies,
        "responseTransform",
      ),
      retry: mergePolicyGroup(existingPolicies, patchPolicies, "retry"),
    },
  };
}

export function mapRouteConfigCreateRequestToDownstreamRouteConfig(
  body: unknown,
): DownstreamRouteConfig {
  const route = requirePlainObject("body", body);
  const policies = getOptionalObject("policies", route.policies);

  const auth = getOptionalObject("policies.auth", policies.auth);
  const timeout = getOptionalObject("policies.timeout", policies.timeout);
  const cache = getOptionalObject("policies.cache", policies.cache);
  const rateLimit = getOptionalObject("policies.rateLimit", policies.rateLimit);
  const requestTransform = getOptionalObject(
    "policies.requestTransform",
    policies.requestTransform,
  );
  const responseTransform = getOptionalObject(
    "policies.responseTransform",
    policies.responseTransform,
  );
  const retry = getOptionalObject("policies.retry", policies.retry);
  const requestHost = readOptionalRequestHost(route.requestHost);
  const weightedUpstreams = mapRequestWeightedUpstreams(
    route.weightedUpstreams,
  );

  const serviceInstances =
    mapOptionalServiceInstances(
      route.serviceInstances,
    );

  const routeConfig: DownstreamRouteConfig = {
    ...(requestHost ? { requestHost } : {}),
    serviceName: readRequiredString("serviceName", route.serviceName),
    gatewayPath: readRequiredString("gatewayPath", route.gatewayPath),
    downstreamUrl: readRequiredString("downstreamUrl", route.downstreamUrl),
    ...(weightedUpstreams
      ? { weightedUpstreams }
      : {}),
    ...(serviceInstances
      ? { serviceInstances }
      : {}),
    method: readHttpMethod(route.method),
    policies: {
      auth: {
        requireApiKey: readOptionalBoolean(
          "policies.auth.requireApiKey",
          auth.requireApiKey,
          true,
        ),
        requireJwt: readOptionalBoolean(
          "policies.auth.requireJwt",
          auth.requireJwt,
          true,
        ),
      },
      timeout: {
        enabled: readOptionalBoolean(
          "policies.timeout.enabled",
          timeout.enabled,
          true,
        ),
        timeoutMs: readOptionalInteger(
          "policies.timeout.timeoutMs",
          timeout.timeoutMs,
          3000,
        ),
      },
      cache: {
        enabled: readOptionalBoolean(
          "policies.cache.enabled",
          cache.enabled,
          false,
        ),
        ttlSeconds: readOptionalInteger(
          "policies.cache.ttlSeconds",
          cache.ttlSeconds,
          30,
        ),
      },
      rateLimit: {
        enabled: readOptionalBoolean(
          "policies.rateLimit.enabled",
          rateLimit.enabled,
          false,
        ),
        limit: readOptionalInteger(
          "policies.rateLimit.limit",
          rateLimit.limit,
          100,
        ),
        windowMs: readOptionalInteger(
          "policies.rateLimit.windowMs",
          rateLimit.windowMs,
          60000,
        ),
      },
      requestTransform: {
        enabled: readOptionalBoolean(
          "policies.requestTransform.enabled",
          requestTransform.enabled,
          false,
        ),
        addHeaders: mapHeaderMap(
          "policies.requestTransform.addHeaders",
          requestTransform.addHeaders,
        ),
        removeHeaders: mapStringArray(
          "policies.requestTransform.removeHeaders",
          requestTransform.removeHeaders,
        ),
      },
      responseTransform: {
        enabled: readOptionalBoolean(
          "policies.responseTransform.enabled",
          responseTransform.enabled,
          false,
        ),
        addHeaders: mapHeaderMap(
          "policies.responseTransform.addHeaders",
          responseTransform.addHeaders,
        ),
        removeHeaders: mapStringArray(
          "policies.responseTransform.removeHeaders",
          responseTransform.removeHeaders,
        ),
      },
      retry: {
        enabled: readOptionalBoolean(
          "policies.retry.enabled",
          retry.enabled,
          false,
        ),
        attempts: readOptionalInteger(
          "policies.retry.attempts",
          retry.attempts,
          0,
        ),
        retryOnStatuses: mapNumberArray(
          "policies.retry.retryOnStatuses",
          retry.retryOnStatuses,
        ),
      },
    },
  };

  const validatedRoute =
    validateDownstreamRoutes([routeConfig])[0];

  buildServiceDiscoverySnapshot([
    validatedRoute,
  ]);

  return validatedRoute;
}

export function mapRouteConfigCreateRequestToCreateData(
  body: unknown,
): RouteConfigCreateData {
  const route = requirePlainObject("body", body);
  const routeConfig = mapRouteConfigCreateRequestToDownstreamRouteConfig(body);

  return {
    serviceName: routeConfig.serviceName,
    gatewayPath: routeConfig.gatewayPath,
    requestHost: routeConfig.requestHost ?? null,
    downstreamUrl: routeConfig.downstreamUrl,
    weightedUpstreams: routeConfig.weightedUpstreams
      ? routeConfig.weightedUpstreams.map((upstream) => ({
          ...upstream,
        }))
      : null,
    serviceInstances: routeConfig.serviceInstances
      ? routeConfig.serviceInstances.map((instance) => ({
          ...instance,
        }))
      : null,
    method: routeConfig.method,
    enabled: readOptionalBoolean("enabled", route.enabled, true),
    priority: readOptionalInteger("priority", route.priority, 100),
    requireApiKey: routeConfig.policies.auth.requireApiKey,
    requireJwt: routeConfig.policies.auth.requireJwt,
    timeoutEnabled: routeConfig.policies.timeout.enabled,
    timeoutMs: routeConfig.policies.timeout.timeoutMs,
    cacheEnabled: routeConfig.policies.cache.enabled,
    cacheTtlSeconds: routeConfig.policies.cache.ttlSeconds,
    rateLimitEnabled: routeConfig.policies.rateLimit.enabled,
    rateLimitLimit: routeConfig.policies.rateLimit.limit,
    rateLimitWindowMs: routeConfig.policies.rateLimit.windowMs,
    requestTransformEnabled: routeConfig.policies.requestTransform.enabled,
    requestAddHeaders:
      routeConfig.policies.requestTransform.addHeaders ?? null,
    requestRemoveHeaders:
      routeConfig.policies.requestTransform.removeHeaders ?? null,
    responseTransformEnabled: routeConfig.policies.responseTransform.enabled,
    responseAddHeaders:
      routeConfig.policies.responseTransform.addHeaders ?? null,
    responseRemoveHeaders:
      routeConfig.policies.responseTransform.removeHeaders ?? null,
    retryEnabled: routeConfig.policies.retry.enabled,
    retryAttempts: routeConfig.policies.retry.attempts,
    retryOnStatuses: routeConfig.policies.retry.retryOnStatuses,
  };
}

export function mapRouteConfigUpdateRequestToUpdateData(
  existingRoute: RouteConfigReadModel,
  body: unknown,
): RouteConfigUpdateData {
  const mergedBody = mergeRouteConfigUpdateRequest(existingRoute, body);

  return mapRouteConfigCreateRequestToCreateData(mergedBody);
}

export function mapRouteConfigReadModelToResponse(
  route: RouteConfigReadModel,
): RouteConfigResponse {
  return {
    id: route.id,
    serviceName: route.serviceName,
    gatewayPath: route.gatewayPath,
    requestHost: route.requestHost ?? null,
    downstreamUrl: route.downstreamUrl,
    weightedUpstreams:
      mapPersistedWeightedUpstreams(
        "weightedUpstreams",
        route.weightedUpstreams,
      ) ?? null,
    serviceInstances:
      mapOptionalServiceInstances(
        route.serviceInstances,
      )?.map((instance) => ({
        ...instance,
      })) ?? null,
    method: route.method,
    enabled: route.enabled,
    priority: route.priority,
    policies: {
      auth: {
        requireApiKey: route.requireApiKey,
        requireJwt: route.requireJwt,
      },
      timeout: {
        enabled: route.timeoutEnabled,
        timeoutMs: route.timeoutMs,
      },
      cache: {
        enabled: route.cacheEnabled,
        ttlSeconds: route.cacheTtlSeconds,
      },
      rateLimit: {
        enabled: route.rateLimitEnabled,
        limit: route.rateLimitLimit,
        windowMs: route.rateLimitWindowMs,
      },
      requestTransform: {
        enabled: route.requestTransformEnabled,
        addHeaders: mapHeaderMap("requestAddHeaders", route.requestAddHeaders),
        removeHeaders: mapStringArray(
          "requestRemoveHeaders",
          route.requestRemoveHeaders,
        ),
      },
      responseTransform: {
        enabled: route.responseTransformEnabled,
        addHeaders: mapHeaderMap(
          "responseAddHeaders",
          route.responseAddHeaders,
        ),
        removeHeaders: mapStringArray(
          "responseRemoveHeaders",
          route.responseRemoveHeaders,
        ),
      },
      retry: {
        enabled: route.retryEnabled,
        attempts: route.retryAttempts,
        retryOnStatuses: mapNumberArray(
          "retryOnStatuses",
          route.retryOnStatuses,
        ),
      },
    },
    createdAt: route.createdAt.toISOString(),
    updatedAt: route.updatedAt.toISOString(),
    createdBy: route.createdBy ?? null,
    updatedBy: route.updatedBy ?? null,
    deletedAt: route.deletedAt ? route.deletedAt.toISOString() : null,
    deletedBy: route.deletedBy ?? null,
  };
}