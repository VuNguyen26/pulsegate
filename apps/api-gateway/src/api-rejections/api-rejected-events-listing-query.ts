import { Buffer } from "node:buffer";

import type {
  ApiRejectionReason,
  GatewayRouteMethod,
} from "../generated/prisma/index.js";
import type {
  ApiRejectedEventsListingCursor,
  ApiRejectedEventsListingQuery,
} from "./api-rejected-events-listing.types.js";

const DEFAULT_REJECTED_EVENTS_LIMIT = 20;
const MAX_REJECTED_EVENTS_LIMIT = 100;

const API_REJECTION_REASONS = [
  "API_KEY_MISSING",
  "API_KEY_INVALID",
  "JWT_TOKEN_MISSING",
  "JWT_TOKEN_INVALID",
  "RATE_LIMIT_EXCEEDED",
  "QUOTA_EXCEEDED",
] as const satisfies readonly ApiRejectionReason[];

const GATEWAY_ROUTE_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const satisfies readonly GatewayRouteMethod[];

export type AdminApiRejectedEventsQuerystring = Record<
  string,
  string | undefined
>;

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

type RejectedEventsListingQueryParseOptions = {
  allowCursor?: boolean;
};

function getOptionalQueryString(
  query: AdminApiRejectedEventsQuerystring,
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
  query: AdminApiRejectedEventsQuerystring;
  key: string;
  defaultValue?: number;
  min: number;
  max: number;
}): QueryParseResult<number | undefined> {
  const rawValue = getOptionalQueryString(options.query, options.key);

  if (!rawValue) {
    return {
      ok: true,
      value: options.defaultValue,
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
  query: AdminApiRejectedEventsQuerystring,
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

function parseRejectionReasonQueryParam(
  query: AdminApiRejectedEventsQuerystring,
): QueryParseResult<ApiRejectionReason | undefined> {
  const rawValue = getOptionalQueryString(query, "rejectionReason");

  if (!rawValue) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const value = rawValue.toUpperCase();

  if (!API_REJECTION_REASONS.includes(value as ApiRejectionReason)) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: `rejectionReason must be one of: ${API_REJECTION_REASONS.join(", ")}`,
      },
    };
  }

  return {
    ok: true,
    value: value as ApiRejectionReason,
  };
}

function parseRouteMethodQueryParam(
  query: AdminApiRejectedEventsQuerystring,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeBase64UrlJson(rawValue: string): QueryParseResult<unknown> {
  try {
    const normalizedValue = rawValue.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalizedValue.length % 4)) % 4;
    const paddedValue = `${normalizedValue}${"=".repeat(paddingLength)}`;
    const decodedValue = Buffer.from(paddedValue, "base64").toString("utf8");

    return {
      ok: true,
      value: JSON.parse(decodedValue) as unknown,
    };
  } catch {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor must be a valid base64url encoded JSON object",
      },
    };
  }
}

function parseCursorQueryParam(
  query: AdminApiRejectedEventsQuerystring,
): QueryParseResult<ApiRejectedEventsListingCursor | undefined> {
  const rawValue = getOptionalQueryString(query, "cursor");

  if (!rawValue) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const decodedCursor = decodeBase64UrlJson(rawValue);

  if (!decodedCursor.ok) {
    return decodedCursor;
  }

  if (!isRecord(decodedCursor.value)) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor must be a valid base64url encoded JSON object",
      },
    };
  }

  const rawOccurredAt = decodedCursor.value.occurredAt;

  if (typeof rawOccurredAt !== "string" || rawOccurredAt.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor.occurredAt must be a valid ISO date-time string",
      },
    };
  }

  const occurredAt = new Date(rawOccurredAt);

  if (Number.isNaN(occurredAt.getTime())) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor.occurredAt must be a valid ISO date-time string",
      },
    };
  }

  const rawId = decodedCursor.value.id;

  if (typeof rawId !== "string" || rawId.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor.id must be a non-empty string",
      },
    };
  }

  return {
    ok: true,
    value: {
      occurredAt,
      id: rawId.trim(),
    },
  };
}

export function parseRejectedEventsListingQuery(
  query: AdminApiRejectedEventsQuerystring,
  options: RejectedEventsListingQueryParseOptions = {
    allowCursor: true,
  },
): QueryParseResult<ApiRejectedEventsListingQuery> {
  const limit = parseIntegerQueryParam({
    query,
    key: "limit",
    defaultValue: DEFAULT_REJECTED_EVENTS_LIMIT,
    min: 1,
    max: MAX_REJECTED_EVENTS_LIMIT,
  });

  if (!limit.ok) {
    return limit;
  }

  const offset = parseIntegerQueryParam({
    query,
    key: "offset",
    defaultValue: 0,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  });

  if (!offset.ok) {
    return offset;
  }

  const cursor = parseCursorQueryParam(query);

  if (!cursor.ok) {
    return cursor;
  }

  if (cursor.value && options.allowCursor === false) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "cursor is only supported for rejected events listing",
      },
    };
  }

  if (cursor.value && getOptionalQueryString(query, "offset")) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "offset cannot be used with cursor",
      },
    };
  }

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

  const rejectionReason = parseRejectionReasonQueryParam(query);

  if (!rejectionReason.ok) {
    return rejectionReason;
  }

  const routeMethod = parseRouteMethodQueryParam(query);

  if (!routeMethod.ok) {
    return routeMethod;
  }

  const routePath = getOptionalQueryString(query, "routePath");
  const apiKeyAuthSource = getOptionalQueryString(query, "apiKeyAuthSource");
  const apiKeyId = getOptionalQueryString(query, "apiKeyId");
  const consumerId = getOptionalQueryString(query, "consumerId");

  return {
    ok: true,
    value: {
      limit: limit.value ?? DEFAULT_REJECTED_EVENTS_LIMIT,
      offset: offset.value ?? 0,
      ...(cursor.value ? { cursor: cursor.value } : {}),
      filters: {
        ...(from.value ? { from: from.value } : {}),
        ...(to.value ? { to: to.value } : {}),
        ...(rejectionReason.value
          ? { rejectionReason: rejectionReason.value }
          : {}),
        ...(statusCode.value ? { statusCode: statusCode.value } : {}),
        ...(routePath ? { routePath } : {}),
        ...(routeMethod.value ? { routeMethod: routeMethod.value } : {}),
        ...(apiKeyAuthSource ? { apiKeyAuthSource } : {}),
        ...(apiKeyId ? { apiKeyId } : {}),
        ...(consumerId ? { consumerId } : {}),
      },
    },
  };
}
