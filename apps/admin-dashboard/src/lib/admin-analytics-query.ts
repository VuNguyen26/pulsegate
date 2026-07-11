export const DASHBOARD_ANALYTICS_DEFAULT_LIMIT = 20;
export const DASHBOARD_ANALYTICS_MAX_LIMIT = 100;
export const DASHBOARD_ANALYTICS_MAX_DATE_RANGE_DAYS = 31;
export const DASHBOARD_ANALYTICS_MAX_CURSOR_LENGTH = 1_024;
export const DASHBOARD_ANALYTICS_MAX_IDENTIFIER_LENGTH = 128;
export const DASHBOARD_ANALYTICS_MAX_ROUTE_PATH_LENGTH = 256;

const MAX_DATE_RANGE_MS =
  DASHBOARD_ANALYTICS_MAX_DATE_RANGE_DAYS *
  24 *
  60 *
  60 *
  1_000;

const IDENTIFIER_PATTERN =
  /^[A-Za-z0-9._:@-]{1,128}$/;
const CURSOR_PATTERN =
  /^[A-Za-z0-9_-]{1,1024}$/;
const INTEGER_PATTERN = /^\d+$/;
const CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u001F\u007F]/;

export const DASHBOARD_ANALYTICS_ROUTE_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

export const DASHBOARD_ANALYTICS_CACHE_STATUSES = [
  "HIT",
  "MISS",
  "BYPASS",
] as const;

export const DASHBOARD_ANALYTICS_REJECTION_REASONS = [
  "API_KEY_MISSING",
  "API_KEY_INVALID",
  "JWT_TOKEN_MISSING",
  "JWT_TOKEN_INVALID",
  "RATE_LIMIT_EXCEEDED",
  "QUOTA_EXCEEDED",
] as const;

export type DashboardAnalyticsQueryMode =
  | "usage-summary"
  | "usage-events"
  | "rejected-summary"
  | "rejected-events";

export type DashboardAnalyticsRouteMethod =
  (typeof DASHBOARD_ANALYTICS_ROUTE_METHODS)[number];

export type DashboardAnalyticsCacheStatus =
  (typeof DASHBOARD_ANALYTICS_CACHE_STATUSES)[number];

export type DashboardAnalyticsRejectionReason =
  (typeof DASHBOARD_ANALYTICS_REJECTION_REASONS)[number];

export type DashboardAnalyticsQuery = {
  from?: string;
  to?: string;
  routePath?: string;
  routeMethod?: DashboardAnalyticsRouteMethod;
  statusCode?: number;
  cacheStatus?: DashboardAnalyticsCacheStatus;
  rejectionReason?: DashboardAnalyticsRejectionReason;
  consumerId?: string;
  apiKeyId?: string;
  limit?: number;
  cursor?: string;
};

export type DashboardAnalyticsQueryError = {
  code: "ADMIN_DASHBOARD_INVALID_QUERY";
  field: string | null;
  message: string;
};

export type DashboardAnalyticsQueryParseResult =
  | {
      ok: true;
      value: DashboardAnalyticsQuery;
    }
  | {
      ok: false;
      error: DashboardAnalyticsQueryError;
    };

export type DashboardAnalyticsQuerySerializationResult =
  | {
      ok: true;
      value: string;
      query: DashboardAnalyticsQuery;
    }
  | {
      ok: false;
      error: DashboardAnalyticsQueryError;
    };

const COMMON_QUERY_KEYS = [
  "from",
  "to",
  "routePath",
  "routeMethod",
  "statusCode",
] as const;

const ALLOWED_QUERY_KEYS: Record<
  DashboardAnalyticsQueryMode,
  ReadonlySet<string>
> = {
  "usage-summary": new Set([
    ...COMMON_QUERY_KEYS,
    "cacheStatus",
  ]),
  "usage-events": new Set([
    ...COMMON_QUERY_KEYS,
    "cacheStatus",
    "consumerId",
    "apiKeyId",
    "limit",
    "cursor",
  ]),
  "rejected-summary": new Set([
    ...COMMON_QUERY_KEYS,
    "rejectionReason",
    "consumerId",
    "apiKeyId",
  ]),
  "rejected-events": new Set([
    ...COMMON_QUERY_KEYS,
    "rejectionReason",
    "consumerId",
    "apiKeyId",
    "limit",
    "cursor",
  ]),
};

function invalidQuery(
  field: string | null,
  message: string,
): DashboardAnalyticsQueryParseResult {
  return {
    ok: false,
    error: {
      code: "ADMIN_DASHBOARD_INVALID_QUERY",
      field,
      message,
    },
  };
}

function readSingleOptionalValue(
  searchParams: URLSearchParams,
  key: string,
):
  | {
      ok: true;
      value: string | undefined;
    }
  | {
      ok: false;
      error: DashboardAnalyticsQueryError;
    } {
  const values = searchParams.getAll(key);

  if (values.length > 1) {
    return {
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        field: key,
        message: `${key} must be provided at most once.`,
      },
    };
  }

  const value = values[0]?.trim();

  return {
    ok: true,
    value: value ? value : undefined,
  };
}

function parseIsoDate(
  searchParams: URLSearchParams,
  key: "from" | "to",
):
  | {
      ok: true;
      value: string | undefined;
    }
  | {
      ok: false;
      error: DashboardAnalyticsQueryError;
    } {
  const rawValue = readSingleOptionalValue(
    searchParams,
    key,
  );

  if (!rawValue.ok || !rawValue.value) {
    return rawValue;
  }

  const parsed = new Date(rawValue.value);

  if (Number.isNaN(parsed.getTime())) {
    return {
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        field: key,
        message: `${key} must be a valid ISO date-time string.`,
      },
    };
  }

  return {
    ok: true,
    value: parsed.toISOString(),
  };
}

function parseInteger(
  searchParams: URLSearchParams,
  key: string,
  minimum: number,
  maximum: number,
  defaultValue?: number,
):
  | {
      ok: true;
      value: number | undefined;
    }
  | {
      ok: false;
      error: DashboardAnalyticsQueryError;
    } {
  const rawValue = readSingleOptionalValue(
    searchParams,
    key,
  );

  if (!rawValue.ok) {
    return rawValue;
  }

  if (!rawValue.value) {
    return {
      ok: true,
      value: defaultValue,
    };
  }

  if (!INTEGER_PATTERN.test(rawValue.value)) {
    return {
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        field: key,
        message:
          `${key} must be an integer between ` +
          `${minimum} and ${maximum}.`,
      },
    };
  }

  const value = Number(rawValue.value);

  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    return {
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        field: key,
        message:
          `${key} must be an integer between ` +
          `${minimum} and ${maximum}.`,
      },
    };
  }

  return {
    ok: true,
    value,
  };
}

function parseEnum<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  values: readonly T[],
):
  | {
      ok: true;
      value: T | undefined;
    }
  | {
      ok: false;
      error: DashboardAnalyticsQueryError;
    } {
  const rawValue = readSingleOptionalValue(
    searchParams,
    key,
  );

  if (!rawValue.ok || !rawValue.value) {
    return rawValue as
      | {
          ok: true;
          value: T | undefined;
        }
      | {
          ok: false;
          error: DashboardAnalyticsQueryError;
        };
  }

  const normalizedValue = rawValue.value.toUpperCase();

  if (!values.includes(normalizedValue as T)) {
    return {
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        field: key,
        message: `${key} must be one of: ${values.join(", ")}.`,
      },
    };
  }

  return {
    ok: true,
    value: normalizedValue as T,
  };
}

export function isDashboardAnalyticsIdentifier(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    value.length <=
      DASHBOARD_ANALYTICS_MAX_IDENTIFIER_LENGTH &&
    IDENTIFIER_PATTERN.test(value)
  );
}

export function isDashboardAnalyticsCursor(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.length <=
      DASHBOARD_ANALYTICS_MAX_CURSOR_LENGTH &&
    CURSOR_PATTERN.test(value)
  );
}

function parseIdentifier(
  searchParams: URLSearchParams,
  key: "consumerId" | "apiKeyId",
):
  | {
      ok: true;
      value: string | undefined;
    }
  | {
      ok: false;
      error: DashboardAnalyticsQueryError;
    } {
  const rawValue = readSingleOptionalValue(
    searchParams,
    key,
  );

  if (!rawValue.ok || !rawValue.value) {
    return rawValue;
  }

  if (!isDashboardAnalyticsIdentifier(rawValue.value)) {
    return {
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        field: key,
        message: `${key} is invalid.`,
      },
    };
  }

  return rawValue;
}

function parseRoutePath(
  searchParams: URLSearchParams,
):
  | {
      ok: true;
      value: string | undefined;
    }
  | {
      ok: false;
      error: DashboardAnalyticsQueryError;
    } {
  const rawValue = readSingleOptionalValue(
    searchParams,
    "routePath",
  );

  if (!rawValue.ok || !rawValue.value) {
    return rawValue;
  }

  const routePath = rawValue.value;

  if (
    !routePath.startsWith("/") ||
    routePath.length >
      DASHBOARD_ANALYTICS_MAX_ROUTE_PATH_LENGTH ||
    routePath.includes("?") ||
    routePath.includes("#") ||
    CONTROL_CHARACTER_PATTERN.test(routePath)
  ) {
    return {
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        field: "routePath",
        message:
          "routePath must be a bounded Gateway path without a query or fragment.",
      },
    };
  }

  return rawValue;
}

function parseCursor(
  searchParams: URLSearchParams,
):
  | {
      ok: true;
      value: string | undefined;

    }
  | {
      ok: false;
      error: DashboardAnalyticsQueryError;
    } {
  const rawValue = readSingleOptionalValue(
    searchParams,
    "cursor",
  );

  if (!rawValue.ok || !rawValue.value) {
    return rawValue;
  }

  if (!isDashboardAnalyticsCursor(rawValue.value)) {
    return {
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        field: "cursor",
        message:
          "cursor must be a bounded opaque base64url token.",
      },
    };
  }

  return rawValue;
}

export function parseDashboardAnalyticsSearchParams(
  mode: DashboardAnalyticsQueryMode,
  searchParams: URLSearchParams,
): DashboardAnalyticsQueryParseResult {
  const allowedKeys = ALLOWED_QUERY_KEYS[mode];

  for (const key of new Set(searchParams.keys())) {
    if (!allowedKeys.has(key)) {
      return invalidQuery(
        key,
        `${key} is not supported for ${mode}.`,
      );
    }
  }

  const from = parseIsoDate(searchParams, "from");

  if (!from.ok) {
    return from;
  }

  const to = parseIsoDate(searchParams, "to");

  if (!to.ok) {
    return to;
  }

  const routePath = parseRoutePath(searchParams);

  if (!routePath.ok) {
    return routePath;
  }

  const routeMethod = parseEnum(
    searchParams,
    "routeMethod",
    DASHBOARD_ANALYTICS_ROUTE_METHODS,
  );

  if (!routeMethod.ok) {
    return routeMethod;
  }

  const statusCode = parseInteger(
    searchParams,
    "statusCode",
    100,
    599,
  );

  if (!statusCode.ok) {
    return statusCode;
  }

  if (from.value && to.value) {
    const fromTime = Date.parse(from.value);
    const toTime = Date.parse(to.value);

    if (fromTime > toTime) {
      return invalidQuery(
        "from",
        "from must be earlier than or equal to to.",
      );
    }

    if (toTime - fromTime > MAX_DATE_RANGE_MS) {
      return invalidQuery(
        "to",
        `The analytics date range cannot exceed ${DASHBOARD_ANALYTICS_MAX_DATE_RANGE_DAYS} days.`,
      );
    }
  }

  const query: DashboardAnalyticsQuery = {
    ...(from.value ? { from: from.value } : {}),
    ...(to.value ? { to: to.value } : {}),
    ...(routePath.value
      ? { routePath: routePath.value }
      : {}),
    ...(routeMethod.value
      ? { routeMethod: routeMethod.value }
      : {}),
    ...(typeof statusCode.value === "number"
      ? { statusCode: statusCode.value }
      : {}),
  };

  if (
    mode === "usage-summary" ||
    mode === "usage-events"
  ) {
    const cacheStatus = parseEnum(
      searchParams,
      "cacheStatus",
      DASHBOARD_ANALYTICS_CACHE_STATUSES,
    );

    if (!cacheStatus.ok) {
      return cacheStatus;
    }

    if (cacheStatus.value) {
      query.cacheStatus = cacheStatus.value;
    }
  }

  if (
    mode === "rejected-summary" ||
    mode === "rejected-events"
  ) {
    const rejectionReason = parseEnum(
      searchParams,
      "rejectionReason",
      DASHBOARD_ANALYTICS_REJECTION_REASONS,
    );

    if (!rejectionReason.ok) {
      return rejectionReason;
    }

    if (rejectionReason.value) {
      query.rejectionReason =
        rejectionReason.value;
    }
  }

  if (mode !== "usage-summary") {
    const consumerId = parseIdentifier(
      searchParams,
      "consumerId",
    );

    if (!consumerId.ok) {
      return consumerId;
    }

    const apiKeyId = parseIdentifier(
      searchParams,
      "apiKeyId",
    );

    if (!apiKeyId.ok) {
      return apiKeyId;
    }

    if (consumerId.value) {
      query.consumerId = consumerId.value;
    }

    if (apiKeyId.value) {
      query.apiKeyId = apiKeyId.value;
    }
  }

  if (
    mode === "usage-events" ||
    mode === "rejected-events"
  ) {
    const limit = parseInteger(
      searchParams,
      "limit",
      1,
      DASHBOARD_ANALYTICS_MAX_LIMIT,
      DASHBOARD_ANALYTICS_DEFAULT_LIMIT,
    );

    if (!limit.ok) {
      return limit;
    }

    const cursor = parseCursor(searchParams);

    if (!cursor.ok) {
      return cursor;
    }

    query.limit =
      limit.value ??
      DASHBOARD_ANALYTICS_DEFAULT_LIMIT;

    if (cursor.value) {
      query.cursor = cursor.value;
    }
  }

  return {
    ok: true,
    value: query,
  };
}

const SERIALIZATION_KEY_ORDER = [
  "from",
  "to",
  "routePath",
  "routeMethod",
  "statusCode",
  "cacheStatus",
  "rejectionReason",
  "consumerId",
  "apiKeyId",
  "limit",
  "cursor",
] as const satisfies readonly (
  keyof DashboardAnalyticsQuery
)[];

export function serializeDashboardAnalyticsQuery(
  mode: DashboardAnalyticsQueryMode,
  query: DashboardAnalyticsQuery,
): DashboardAnalyticsQuerySerializationResult {
  const allowedKeys = ALLOWED_QUERY_KEYS[mode];

  for (const key of Object.keys(query)) {
    if (!allowedKeys.has(key)) {
      return {
        ok: false,
        error: {
          code: "ADMIN_DASHBOARD_INVALID_QUERY",
          field: key,
          message: `${key} is not supported for ${mode}.`,
        },
      };
    }
  }

  const rawParams = new URLSearchParams();

  for (const key of SERIALIZATION_KEY_ORDER) {
    const value = query[key];

    if (value !== undefined) {
      rawParams.set(key, String(value));
    }
  }

  const parsed = parseDashboardAnalyticsSearchParams(
    mode,
    rawParams,
  );

  if (!parsed.ok) {
    return parsed;
  }

  const normalizedParams = new URLSearchParams();

  for (const key of SERIALIZATION_KEY_ORDER) {
    const value = parsed.value[key];

    if (value !== undefined) {
      normalizedParams.set(key, String(value));
    }
  }

  return {
    ok: true,
    value: normalizedParams.toString(),
    query: parsed.value,
  };
}
