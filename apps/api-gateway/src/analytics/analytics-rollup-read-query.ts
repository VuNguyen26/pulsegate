import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import {
  createAnalyticsRollupWindowPlan,
  type AnalyticsRollupWindowPlan,
} from "./analytics-rollup-window-plan.js";

export const DEFAULT_ANALYTICS_ROLLUP_READ_MAX_BUCKETS = 744;
export const DEFAULT_ANALYTICS_ROLLUP_READ_LIMIT = 100;
export const MAX_ANALYTICS_ROLLUP_READ_LIMIT = 1_000;

export type AnalyticsRollupReadSource = "usage" | "rejected";

export type AnalyticsRollupReadQueryInput = {
  from: string;
  to: string;
  granularity: string;
  source: string;
  routePath?: string;
  routeMethod?: string;
  statusCode?: string | number;
  cacheStatus?: string;
  apiKeyAuthSource?: string;
  apiKeyId?: string;
  consumerId?: string;
  rejectionReason?: string;
  limit?: string | number;
  maxBuckets?: number;
};

export type AnalyticsRollupReadFilters = {
  routePath?: string;
  routeMethod?: string;
  statusCode?: number;
  cacheStatus?: string;
  apiKeyAuthSource?: string;
  apiKeyId?: string;
  consumerId?: string;
  rejectionReason?: string;
};

export type AnalyticsRollupReadQuery = {
  source: AnalyticsRollupReadSource;
  granularity: AnalyticsRollupGranularity;
  windowPlan: AnalyticsRollupWindowPlan;
  filters: AnalyticsRollupReadFilters;
  limit: number;
};

function parseRequiredDate(value: string, name: string): Date {
  if (value.trim() === "") {
    throw new RangeError(`${name} must be a non-empty date string`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError(`${name} must be a valid date string`);
  }

  return parsed;
}

function parseGranularity(value: string): AnalyticsRollupGranularity {
  if (value === "hour" || value === "day") {
    return value;
  }

  throw new RangeError("granularity must be hour or day");
}

function parseSource(value: string): AnalyticsRollupReadSource {
  if (value === "usage" || value === "rejected") {
    return value;
  }

  throw new RangeError("source must be usage or rejected");
}

function parseOptionalText(
  value: string | undefined,
  name: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    throw new RangeError(`${name} must be a non-empty string`);
  }

  return trimmed;
}

function parseOptionalRouteMethod(value: string | undefined): string | undefined {
  const parsed = parseOptionalText(value, "routeMethod");

  if (parsed === undefined) {
    return undefined;
  }

  return parsed.toUpperCase();
}

function parseOptionalPositiveInteger(
  value: string | number | undefined,
  name: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new RangeError(`${name} must be an integer`);
    }

    return value;
  }

  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    throw new RangeError(`${name} must be an integer`);
  }

  return Number.parseInt(trimmed, 10);
}

function parseOptionalStatusCode(
  value: string | number | undefined,
): number | undefined {
  const statusCode = parseOptionalPositiveInteger(value, "statusCode");

  if (statusCode === undefined) {
    return undefined;
  }

  if (statusCode < 100 || statusCode > 599) {
    throw new RangeError("statusCode must be a valid HTTP status code");
  }

  return statusCode;
}

function parseLimit(value: string | number | undefined): number {
  const limit =
    parseOptionalPositiveInteger(value, "limit") ??
    DEFAULT_ANALYTICS_ROLLUP_READ_LIMIT;

  if (limit < 1 || limit > MAX_ANALYTICS_ROLLUP_READ_LIMIT) {
    throw new RangeError(
      `limit must be between 1 and ${MAX_ANALYTICS_ROLLUP_READ_LIMIT}`,
    );
  }

  return limit;
}

function assertSourceSpecificFilters(
  source: AnalyticsRollupReadSource,
  input: AnalyticsRollupReadQueryInput,
): void {
  if (source === "usage" && input.rejectionReason !== undefined) {
    throw new RangeError(
      "rejectionReason filter is only supported for rejected rollups",
    );
  }

  if (source === "rejected" && input.cacheStatus !== undefined) {
    throw new RangeError(
      "cacheStatus filter is only supported for usage rollups",
    );
  }
}

function buildFilters(
  source: AnalyticsRollupReadSource,
  input: AnalyticsRollupReadQueryInput,
): AnalyticsRollupReadFilters {
  const filters: AnalyticsRollupReadFilters = {};

  const routePath = parseOptionalText(input.routePath, "routePath");
  if (routePath !== undefined) {
    filters.routePath = routePath;
  }

  const routeMethod = parseOptionalRouteMethod(input.routeMethod);
  if (routeMethod !== undefined) {
    filters.routeMethod = routeMethod;
  }

  const statusCode = parseOptionalStatusCode(input.statusCode);
  if (statusCode !== undefined) {
    filters.statusCode = statusCode;
  }

  const apiKeyAuthSource = parseOptionalText(
    input.apiKeyAuthSource,
    "apiKeyAuthSource",
  );
  if (apiKeyAuthSource !== undefined) {
    filters.apiKeyAuthSource = apiKeyAuthSource;
  }

  const apiKeyId = parseOptionalText(input.apiKeyId, "apiKeyId");
  if (apiKeyId !== undefined) {
    filters.apiKeyId = apiKeyId;
  }

  const consumerId = parseOptionalText(input.consumerId, "consumerId");
  if (consumerId !== undefined) {
    filters.consumerId = consumerId;
  }

  if (source === "usage") {
    const cacheStatus = parseOptionalText(input.cacheStatus, "cacheStatus");
    if (cacheStatus !== undefined) {
      filters.cacheStatus = cacheStatus;
    }
  }

  if (source === "rejected") {
    const rejectionReason = parseOptionalText(
      input.rejectionReason,
      "rejectionReason",
    );
    if (rejectionReason !== undefined) {
      filters.rejectionReason = rejectionReason;
    }
  }

  return filters;
}

export function createAnalyticsRollupReadQuery(
  input: AnalyticsRollupReadQueryInput,
): AnalyticsRollupReadQuery {
  const from = parseRequiredDate(input.from, "from");
  const to = parseRequiredDate(input.to, "to");
  const granularity = parseGranularity(input.granularity);
  const source = parseSource(input.source);

  if (from >= to) {
    throw new RangeError("from must be earlier than to");
  }

  assertSourceSpecificFilters(source, input);

  return {
    source,
    granularity,
    windowPlan: createAnalyticsRollupWindowPlan({
      from,
      to,
      granularity,
      maxBuckets:
        input.maxBuckets ?? DEFAULT_ANALYTICS_ROLLUP_READ_MAX_BUCKETS,
    }),
    filters: buildFilters(source, input),
    limit: parseLimit(input.limit),
  };
}
