import type {
  ApiRejectionReason,
  GatewayRouteMethod,
} from "../generated/prisma/index.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { createPrismaApiRejectedEventsListingRepository } from "../api-rejections/api-rejected-events-listing.repository.js";
import type {
  ApiRejectedEventsListingQuery,
  ApiRejectedEventsListingRepository,
} from "../api-rejections/api-rejected-events-listing.types.js";
import { mapApiRejectedEventsListingReadModelToResponse } from "../api-rejections/api-rejected-events-listing.mapper.js";
import { createPrismaApiRejectedEventsSummaryRepository } from "../api-rejections/api-rejected-events-summary.repository.js";
import type { ApiRejectedEventsSummaryRepository } from "../api-rejections/api-rejected-events-summary.types.js";
import { mapApiRejectedEventsSummaryReadModelToResponse } from "../api-rejections/api-rejected-events-summary.mapper.js";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";

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

type AdminApiRejectedEventsQuerystring = Record<string, string | undefined>;

type QueryValidationError = {
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

export type AdminApiRejectionRouteOptions = {
  rejectedEventsSummaryRepository?: ApiRejectedEventsSummaryRepository;
  rejectedEventsListingRepository?: ApiRejectedEventsListingRepository;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
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

function parseRejectedEventsListingQuery(
  query: AdminApiRejectedEventsQuerystring,
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

  return {
    ok: true,
    value: {
      limit: limit.value ?? DEFAULT_REJECTED_EVENTS_LIMIT,
      offset: offset.value ?? 0,
      filters: {
        ...(from.value ? { from: from.value } : {}),
        ...(to.value ? { to: to.value } : {}),
        ...(rejectionReason.value
          ? { rejectionReason: rejectionReason.value }
          : {}),
        ...(statusCode.value ? { statusCode: statusCode.value } : {}),
        ...(getOptionalQueryString(query, "routePath")
          ? { routePath: getOptionalQueryString(query, "routePath") }
          : {}),
        ...(routeMethod.value ? { routeMethod: routeMethod.value } : {}),
        ...(getOptionalQueryString(query, "apiKeyAuthSource")
          ? {
              apiKeyAuthSource: getOptionalQueryString(
                query,
                "apiKeyAuthSource",
              ),
            }
          : {}),
        ...(getOptionalQueryString(query, "apiKeyId")
          ? { apiKeyId: getOptionalQueryString(query, "apiKeyId") }
          : {}),
        ...(getOptionalQueryString(query, "consumerId")
          ? { consumerId: getOptionalQueryString(query, "consumerId") }
          : {}),
      },
    },
  };
}

function sendBadQueryResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  error: QueryValidationError,
) {
  return reply.code(400).send({
    error: {
      code: error.code,
      message: error.message,
      requestId: request.id,
    },
  });
}

export async function adminApiRejectionRoute(
  app: FastifyInstance,
  options: AdminApiRejectionRouteOptions = {},
): Promise<void> {
  const rejectedEventsSummaryRepository =
    options.rejectedEventsSummaryRepository ??
    createPrismaApiRejectedEventsSummaryRepository(gatewayPrisma);

  const rejectedEventsListingRepository =
    options.rejectedEventsListingRepository ??
    createPrismaApiRejectedEventsListingRepository(gatewayPrisma);

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

  app.get(
    "/internal/admin/api-rejections/summary",
    {
      preHandler: requireAdminApiKey,
    },
    async () => {
      const summary = await rejectedEventsSummaryRepository.getSummary();

      return {
        data: mapApiRejectedEventsSummaryReadModelToResponse(summary),
      };
    },
  );

  app.get<{ Querystring: AdminApiRejectedEventsQuerystring }>(
    "/internal/admin/api-rejections/events",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const parsedQuery = parseRejectedEventsListingQuery(request.query);

      if (!parsedQuery.ok) {
        return sendBadQueryResponse(request, reply, parsedQuery.error);
      }

      const listing = await rejectedEventsListingRepository.listEvents(
        parsedQuery.value,
      );

      return {
        data: mapApiRejectedEventsListingReadModelToResponse(listing),
      };
    },
  );
}
