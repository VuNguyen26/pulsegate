import type { GatewayRouteMethod } from "../generated/prisma/index.js";
import type { ApiUsageCacheStatus } from "./api-usage-recorder.js";

const GATEWAY_ROUTE_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const satisfies readonly GatewayRouteMethod[];

const API_USAGE_CACHE_STATUSES = [
  "HIT",
  "MISS",
  "BYPASS",
] as const satisfies readonly ApiUsageCacheStatus[];

export type AdminApiUsageSummaryQuerystring = Record<
  string,
  string | undefined
>;

export type ApiUsageSummaryFilters = {
  from?: Date;
  to?: Date;
  routePath?: string;
  routeMethod?: GatewayRouteMethod;
  statusCode?: number;
  cacheStatus?: ApiUsageCacheStatus;
  apiKeyAuthSource?: string;
};

export type ApiUsageSummaryQuery = {
  filters: ApiUsageSummaryFilters;
};

export type QueryValidationError = {
  code: "INVALID_QUERY_PARAMETER";
  message: string;
};

type QueryParseResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: QueryValidationError;
    };

function getOptionalQueryString(
  query: AdminApiUsageSummaryQuerystring,
  key: string,
): string | undefined {
  const value = query[key];

  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function parseIntegerQueryParam(options: {
  query: AdminApiUsageSummaryQuerystring;
  key: string;
  min: number;
  max: number;
}): QueryParseResult<number | undefined> {
  const rawValue = getOptionalQueryString(options.query, options.key);

  if (!rawValue) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const value = Number(rawValue);

  if (
    !Number.isInteger(value) ||
    value < options.min ||
    value > options.max
  ) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: `${options.key} must be an integer between ${options.min} and ${options.max}`,
      },
    };
  }

  return {
    ok: true,
    value,
  };
}

function parseDateQueryParam(
  query: AdminApiUsageSummaryQuerystring,
  key: string,
): QueryParseResult<Date | undefined> {
  const rawValue = getOptionalQueryString(query, key);

  if (!rawValue) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const value = new Date(rawValue);

  if (Number.isNaN(value.getTime())) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: `${key} must be a valid ISO date-time string`,
      },
    };
  }

  return {
    ok: true,
    value,
  };
}

function parseRouteMethodQueryParam(
  query: AdminApiUsageSummaryQuerystring,
): QueryParseResult<GatewayRouteMethod | undefined> {
  const rawValue = getOptionalQueryString(query, "routeMethod");

  if (!rawValue) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const value = rawValue.toUpperCase();

  if (!GATEWAY_ROUTE_METHODS.includes(value as GatewayRouteMethod)) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: `routeMethod must be one of: ${GATEWAY_ROUTE_METHODS.join(", ")}`,
      },
    };
  }

  return {
    ok: true,
    value: value as GatewayRouteMethod,
  };
}

function parseCacheStatusQueryParam(
  query: AdminApiUsageSummaryQuerystring,
): QueryParseResult<ApiUsageCacheStatus | undefined> {
  const rawValue = getOptionalQueryString(query, "cacheStatus");

  if (!rawValue) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const value = rawValue.toUpperCase();

  if (!API_USAGE_CACHE_STATUSES.includes(value as ApiUsageCacheStatus)) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: `cacheStatus must be one of: ${API_USAGE_CACHE_STATUSES.join(", ")}`,
      },
    };
  }

  return {
    ok: true,
    value: value as ApiUsageCacheStatus,
  };
}

export function parseApiUsageSummaryQuery(
  query: AdminApiUsageSummaryQuerystring,
): QueryParseResult<ApiUsageSummaryQuery> {
  const statusCode = parseIntegerQueryParam({
    query,
    key: "statusCode",
    min: 100,
    max: 599,
  });

  if (!statusCode.ok) {
    return statusCode;
  }

  const from = parseDateQueryParam(query, "from");

  if (!from.ok) {
    return from;
  }

  const to = parseDateQueryParam(query, "to");

  if (!to.ok) {
    return to;
  }

  if (from.value && to.value && from.value > to.value) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "from must be earlier than or equal to to",
      },
    };
  }

  const routeMethod = parseRouteMethodQueryParam(query);

  if (!routeMethod.ok) {
    return routeMethod;
  }

  const cacheStatus = parseCacheStatusQueryParam(query);

  if (!cacheStatus.ok) {
    return cacheStatus;
  }

  const routePath = getOptionalQueryString(query, "routePath");
  const apiKeyAuthSource = getOptionalQueryString(query, "apiKeyAuthSource");

  return {
    ok: true,
    value: {
      filters: {
        ...(from.value ? { from: from.value } : {}),
        ...(to.value ? { to: to.value } : {}),
        ...(routePath ? { routePath } : {}),
        ...(routeMethod.value ? { routeMethod: routeMethod.value } : {}),
        ...(statusCode.value ? { statusCode: statusCode.value } : {}),
        ...(cacheStatus.value ? { cacheStatus: cacheStatus.value } : {}),
        ...(apiKeyAuthSource ? { apiKeyAuthSource } : {}),
      },
    },
  };
}
