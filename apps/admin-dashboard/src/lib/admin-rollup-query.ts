export const DASHBOARD_ROLLUP_DEFAULT_LIMIT = 50;
export const DASHBOARD_ROLLUP_MAX_LIMIT = 100;
export const DASHBOARD_ROLLUP_MAX_BUCKETS = 744;

export type DashboardRollupSource =
  | "usage"
  | "rejected";

export type DashboardRollupGranularity =
  | "hour"
  | "day";

export type DashboardRollupQuery = {
  from: string;
  to: string;
  granularity: DashboardRollupGranularity;
  source: DashboardRollupSource;
  routePath?: string;
  routeMethod?: string;
  statusCode?: number;
  cacheStatus?: string;
  apiKeyAuthSource?: string;
  apiKeyId?: string;
  consumerId?: string;
  rejectionReason?: string;
  limit: number;
};

export type DashboardRollupQueryError = {
  code: "ADMIN_DASHBOARD_INVALID_QUERY";
  field: string;
  message: string;
};

type ParseResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: DashboardRollupQueryError;
    };

const ALLOWED_KEYS = new Set([
  "from",
  "to",
  "granularity",
  "source",
  "routePath",
  "routeMethod",
  "statusCode",
  "cacheStatus",
  "apiKeyAuthSource",
  "apiKeyId",
  "consumerId",
  "rejectionReason",
  "limit",
]);

function invalid(
  field: string,
  message: string,
): ParseResult<never> {
  return {
    ok: false,
    error: {
      code: "ADMIN_DASHBOARD_INVALID_QUERY",
      field,
      message,
    },
  };
}

function readSingle(
  searchParams: URLSearchParams,
  key: string,
): ParseResult<string | undefined> {
  const values = searchParams.getAll(key);

  if (values.length > 1) {
    return invalid(
      key,
      `${key} must be supplied once.`,
    );
  }

  const value = values[0]?.trim();

  return {
    ok: true,
    value:
      value && value.length > 0
        ? value
        : undefined,
  };
}

function parseRequiredTimestamp(
  searchParams: URLSearchParams,
  key: "from" | "to",
): ParseResult<string> {
  const raw = readSingle(searchParams, key);

  if (!raw.ok) {
    return raw;
  }

  if (!raw.value) {
    return invalid(key, `${key} is required.`);
  }

  const parsed = new Date(raw.value);

  if (Number.isNaN(parsed.getTime())) {
    return invalid(
      key,
      `${key} must be a valid timestamp.`,
    );
  }

  return {
    ok: true,
    value: parsed.toISOString(),
  };
}

function parseRequiredEnum<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowed: readonly T[],
): ParseResult<T> {
  const raw = readSingle(searchParams, key);

  if (!raw.ok) {
    return raw;
  }

  if (!raw.value) {
    return invalid(key, `${key} is required.`);
  }

  if (!allowed.includes(raw.value as T)) {
    return invalid(
      key,
      `${key} must be one of: ${allowed.join(", ")}.`,
    );
  }

  return {
    ok: true,
    value: raw.value as T,
  };
}

function parseOptionalText(
  searchParams: URLSearchParams,
  key: string,
  maximumLength: number,
): ParseResult<string | undefined> {
  const raw = readSingle(searchParams, key);

  if (!raw.ok) {
    return raw;
  }

  if (
    raw.value &&
    raw.value.length > maximumLength
  ) {
    return invalid(
      key,
      `${key} must be at most ${maximumLength} characters.`,
    );
  }

  return raw;
}

function parseOptionalInteger(
  searchParams: URLSearchParams,
  key: string,
  minimum: number,
  maximum: number,
): ParseResult<number | undefined> {
  const raw = readSingle(searchParams, key);

  if (!raw.ok) {
    return raw;
  }

  if (!raw.value) {
    return {
      ok: true,
      value: undefined,
    };
  }

  if (!/^\d+$/.test(raw.value)) {
    return invalid(
      key,
      `${key} must be an integer.`,
    );
  }

  const value = Number.parseInt(raw.value, 10);

  if (value < minimum || value > maximum) {
    return invalid(
      key,
      `${key} must be between ${minimum} and ${maximum}.`,
    );
  }

  return {
    ok: true,
    value,
  };
}

export function parseDashboardRollupSearchParams(
  searchParams: URLSearchParams,
): ParseResult<DashboardRollupQuery> {
  for (const key of searchParams.keys()) {
    if (!ALLOWED_KEYS.has(key)) {
      return invalid(
        key,
        `${key} is not supported for rollup inspection.`,
      );
    }
  }

  const from =
    parseRequiredTimestamp(searchParams, "from");

  if (!from.ok) {
    return from;
  }

  const to =
    parseRequiredTimestamp(searchParams, "to");

  if (!to.ok) {
    return to;
  }

  const granularity = parseRequiredEnum(
    searchParams,
    "granularity",
    ["hour", "day"] as const,
  );

  if (!granularity.ok) {
    return granularity;
  }

  const source = parseRequiredEnum(
    searchParams,
    "source",
    ["usage", "rejected"] as const,
  );

  if (!source.ok) {
    return source;
  }

  if (
    new Date(from.value) >= new Date(to.value)
  ) {
    return invalid(
      "from",
      "from must be earlier than to.",
    );
  }

  const bucketDurationMs =
    granularity.value === "hour"
      ? 60 * 60 * 1_000
      : 24 * 60 * 60 * 1_000;

  const bucketCount = Math.ceil(
    (
      new Date(to.value).getTime() -
      new Date(from.value).getTime()
    ) / bucketDurationMs,
  );

  if (bucketCount > DASHBOARD_ROLLUP_MAX_BUCKETS) {
    return invalid(
      "to",
      `The requested window exceeds ${DASHBOARD_ROLLUP_MAX_BUCKETS} ${granularity.value} buckets.`,
    );
  }

  const routePath = parseOptionalText(
    searchParams,
    "routePath",
    256,
  );
  const routeMethod = parseOptionalText(
    searchParams,
    "routeMethod",
    16,
  );
  const statusCode = parseOptionalInteger(
    searchParams,
    "statusCode",
    100,
    599,
  );
  const cacheStatus = parseOptionalText(
    searchParams,
    "cacheStatus",
    32,
  );
  const apiKeyAuthSource = parseOptionalText(
    searchParams,
    "apiKeyAuthSource",
    64,
  );
  const apiKeyId = parseOptionalText(
    searchParams,
    "apiKeyId",
    128,
  );
  const consumerId = parseOptionalText(
    searchParams,
    "consumerId",
    128,
  );
  const rejectionReason = parseOptionalText(
    searchParams,
    "rejectionReason",
    64,
  );
  const limit = parseOptionalInteger(
    searchParams,
    "limit",
    1,
    DASHBOARD_ROLLUP_MAX_LIMIT,
  );

  if (!routePath.ok) {
    return routePath;
  }

  if (!routeMethod.ok) {
    return routeMethod;
  }

  if (!statusCode.ok) {
    return statusCode;
  }

  if (!cacheStatus.ok) {
    return cacheStatus;
  }

  if (!apiKeyAuthSource.ok) {
    return apiKeyAuthSource;
  }

  if (!apiKeyId.ok) {
    return apiKeyId;
  }

  if (!consumerId.ok) {
    return consumerId;
  }

  if (!rejectionReason.ok) {
    return rejectionReason;
  }

  if (!limit.ok) {
    return limit;
  }

  if (
    source.value === "usage" &&
    rejectionReason.value
  ) {
    return invalid(
      "rejectionReason",
      "rejectionReason is only supported for rejected rollups.",
    );
  }

  if (
    source.value === "rejected" &&
    cacheStatus.value
  ) {
    return invalid(
      "cacheStatus",
      "cacheStatus is only supported for usage rollups.",
    );
  }

  return {
    ok: true,
    value: {
      from: from.value,
      to: to.value,
      granularity: granularity.value,
      source: source.value,
      ...(routePath.value
        ? { routePath: routePath.value }
        : {}),
      ...(routeMethod.value
        ? {
            routeMethod:
              routeMethod.value.toUpperCase(),
          }
        : {}),
      ...(statusCode.value !== undefined
        ? { statusCode: statusCode.value }
        : {}),
      ...(cacheStatus.value
        ? {
            cacheStatus:
              cacheStatus.value.toUpperCase(),
          }
        : {}),
      ...(apiKeyAuthSource.value
        ? {
            apiKeyAuthSource:
              apiKeyAuthSource.value.toUpperCase(),
          }
        : {}),
      ...(apiKeyId.value
        ? { apiKeyId: apiKeyId.value }
        : {}),
      ...(consumerId.value
        ? { consumerId: consumerId.value }
        : {}),
      ...(rejectionReason.value
        ? {
            rejectionReason:
              rejectionReason.value.toUpperCase(),
          }
        : {}),
      limit:
        limit.value ??
        DASHBOARD_ROLLUP_DEFAULT_LIMIT,
    },
  };
}

export function serializeDashboardRollupQuery(
  query: DashboardRollupQuery,
): ParseResult<string> {
  const params = new URLSearchParams();

  const entries: Array<
    [keyof DashboardRollupQuery, unknown]
  > = [
    ["from", query.from],
    ["to", query.to],
    ["granularity", query.granularity],
    ["source", query.source],
    ["routePath", query.routePath],
    ["routeMethod", query.routeMethod],
    ["statusCode", query.statusCode],
    ["cacheStatus", query.cacheStatus],
    ["apiKeyAuthSource", query.apiKeyAuthSource],
    ["apiKeyId", query.apiKeyId],
    ["consumerId", query.consumerId],
    ["rejectionReason", query.rejectionReason],
    ["limit", query.limit],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const parsed =
    parseDashboardRollupSearchParams(params);

  if (!parsed.ok) {
    return parsed;
  }

  const normalized = new URLSearchParams();

  for (const [key, value] of entries) {
    const normalizedValue = parsed.value[key];

    if (normalizedValue !== undefined) {
      normalized.set(
        key,
        String(normalizedValue),
      );
    }
  }

  return {
    ok: true,
    value: normalized.toString(),
  };
}