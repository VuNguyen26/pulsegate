import type {
  RouteConfigReadModel,
  RouteConfigResponse,
} from "./route-management.types.js";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

export function mapRouteConfigReadModelToResponse(
  route: RouteConfigReadModel,
): RouteConfigResponse {
  return {
    id: route.id,
    serviceName: route.serviceName,
    gatewayPath: route.gatewayPath,
    downstreamUrl: route.downstreamUrl,
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
  };
}