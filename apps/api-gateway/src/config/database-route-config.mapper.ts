import type {
  DownstreamRouteConfig,
  HttpMethod,
  WeightedUpstream,
} from "./downstream-routes.js";
import { mapOptionalServiceInstances } from "./service-discovery.js";
import { validateDownstreamRoutes } from "./validate-downstream-routes.js";

export type DatabaseGatewayRouteRecord = {
  serviceName: string;
  gatewayPath: string;
  requestHost?: string | null;
  downstreamUrl: string;
  weightedUpstreams?: unknown;
  serviceInstances?: unknown;
  method: HttpMethod;
  enabled: boolean;
  priority: number;
  deletedAt?: Date | null;

  requireApiKey: boolean;
  requireJwt: boolean;

  timeoutEnabled: boolean;
  timeoutMs: number;

  cacheEnabled: boolean;
  cacheTtlSeconds: number;

  rateLimitEnabled: boolean;
  rateLimitLimit: number;
  rateLimitWindowMs: number;

  requestTransformEnabled: boolean;
  requestAddHeaders: unknown;
  requestRemoveHeaders: unknown;

  responseTransformEnabled: boolean;
  responseAddHeaders: unknown;
  responseRemoveHeaders: unknown;

  retryEnabled: boolean;
  retryAttempts: number;
  retryOnStatuses: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapOptionalWeightedUpstreams(
  fieldName: string,
  value: unknown,
): WeightedUpstream[] | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }

  return value.map((item, index) => {
    const itemFieldName = `${fieldName}[${index}]`;

    if (!isPlainObject(item)) {
      throw new Error(`${itemFieldName} must be an object`);
    }

    if (typeof item.downstreamUrl !== "string") {
      throw new Error(
        `${itemFieldName}.downstreamUrl must be a string`,
      );
    }

    if (
      typeof item.weight !== "number" ||
      !Number.isInteger(item.weight)
    ) {
      throw new Error(
        `${itemFieldName}.weight must be an integer`,
      );
    }

    return {
      downstreamUrl: item.downstreamUrl,
      weight: item.weight,
    };
  });
}
function mapOptionalHeaderMap(
  fieldName: string,
  value: unknown,
): Record<string, string> | undefined {
  if (value === null || value === undefined) {
    return undefined;
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

function mapOptionalStringArray(
  fieldName: string,
  value: unknown,
): string[] | undefined {
  if (value === null || value === undefined) {
    return undefined;
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

function mapRetryOnStatuses(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw new Error("retryOnStatuses must be an array of numbers");
  }

  for (const statusCode of value) {
    if (!Number.isInteger(statusCode)) {
      throw new Error("retryOnStatuses must contain only integers");
    }
  }

  return value;
}

export function mapGatewayRouteRecordToDownstreamRouteConfig(
  record: DatabaseGatewayRouteRecord,
): DownstreamRouteConfig {
  const weightedUpstreams = mapOptionalWeightedUpstreams(
    "weightedUpstreams",
    record.weightedUpstreams,
  );

  const serviceInstances =
    mapOptionalServiceInstances(
      record.serviceInstances,
    );

  return {
    ...(record.requestHost
      ? { requestHost: record.requestHost }
      : {}),
    serviceName: record.serviceName,
    gatewayPath: record.gatewayPath,
    downstreamUrl: record.downstreamUrl,
    ...(weightedUpstreams
      ? { weightedUpstreams }
      : {}),
    ...(serviceInstances
      ? { serviceInstances }
      : {}),
    method: record.method,
    policies: {
      auth: {
        requireApiKey: record.requireApiKey,
        requireJwt: record.requireJwt,
      },
      timeout: {
        enabled: record.timeoutEnabled,
        timeoutMs: record.timeoutMs,
      },
      cache: {
        enabled: record.cacheEnabled,
        ttlSeconds: record.cacheEnabled ? record.cacheTtlSeconds : 0,
      },
      rateLimit: {
        enabled: record.rateLimitEnabled,
        limit: record.rateLimitEnabled ? record.rateLimitLimit : 0,
        windowMs: record.rateLimitEnabled ? record.rateLimitWindowMs : 0,
      },
      requestTransform: {
        enabled: record.requestTransformEnabled,
        addHeaders: mapOptionalHeaderMap(
          "requestAddHeaders",
          record.requestAddHeaders,
        ),
        removeHeaders: mapOptionalStringArray(
          "requestRemoveHeaders",
          record.requestRemoveHeaders,
        ),
      },
      responseTransform: {
        enabled: record.responseTransformEnabled,
        addHeaders: mapOptionalHeaderMap(
          "responseAddHeaders",
          record.responseAddHeaders,
        ),
        removeHeaders: mapOptionalStringArray(
          "responseRemoveHeaders",
          record.responseRemoveHeaders,
        ),
      },
      retry: {
        enabled: record.retryEnabled,
        attempts: record.retryAttempts,
        retryOnStatuses: mapRetryOnStatuses(record.retryOnStatuses),
      },
    },
  };
}

export function mapGatewayRouteRecordsToDownstreamRouteConfigs(
  records: DatabaseGatewayRouteRecord[],
): DownstreamRouteConfig[] {
  const routes = [...records]
    .filter((record) => record.enabled && !record.deletedAt)
    .sort((first, second) => {
      if (first.priority !== second.priority) {
        return first.priority - second.priority;
      }

      return first.gatewayPath.localeCompare(second.gatewayPath);
    })
    .map(mapGatewayRouteRecordToDownstreamRouteConfig);

  return validateDownstreamRoutes(routes);
}