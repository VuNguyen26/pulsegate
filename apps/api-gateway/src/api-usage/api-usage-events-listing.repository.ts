import type {
  Prisma,
  PrismaClient,
} from "../generated/prisma/index.js";
import type {
  ApiUsageEventsListingCursor,
  ApiUsageEventsListingFilters,
  ApiUsageEventsListingQuery,
  ApiUsageEventsListingReadModel,
  ApiUsageEventsListingRepository,
} from "./api-usage-events-listing.types.js";

function buildApiUsageEventsCursorWhereInput(
  cursor: ApiUsageEventsListingCursor,
): Prisma.ApiUsageEventWhereInput {
  return {
    OR: [
      {
        occurredAt: {
          lt: cursor.occurredAt,
        },
      },
      {
        occurredAt: cursor.occurredAt,
        id: {
          lt: cursor.id,
        },
      },
    ],
  };
}

export function buildApiUsageEventsWhereInput(
  filters: ApiUsageEventsListingFilters,
  cursor?: ApiUsageEventsListingCursor,
): Prisma.ApiUsageEventWhereInput {
  const where: Prisma.ApiUsageEventWhereInput = {};

  if (filters.from || filters.to) {
    where.occurredAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  if (filters.routePath) {
    where.routePath = filters.routePath;
  }

  if (filters.routeMethod) {
    where.routeMethod = filters.routeMethod;
  }

  if (filters.statusCode) {
    where.statusCode = filters.statusCode;
  }

  if (filters.cacheStatus) {
    where.cacheStatus = filters.cacheStatus;
  }

  if (filters.apiKeyAuthSource) {
    where.apiKeyAuthSource = filters.apiKeyAuthSource;
  }

  if (filters.apiKeyId) {
    where.apiKeyId = filters.apiKeyId;
  }

  if (filters.consumerId) {
    where.consumerId = filters.consumerId;
  }

  if (cursor) {
    where.AND = [buildApiUsageEventsCursorWhereInput(cursor)];
  }

  return where;
}

export function createPrismaApiUsageEventsListingRepository(
  prisma: PrismaClient,
): ApiUsageEventsListingRepository {
  return {
    async listEvents(
      query: ApiUsageEventsListingQuery,
    ): Promise<ApiUsageEventsListingReadModel> {
      const where = buildApiUsageEventsWhereInput(query.filters, query.cursor);

      const [total, items] = await Promise.all([
        prisma.apiUsageEvent.count({
          where,
        }),
        prisma.apiUsageEvent.findMany({
          where,
          orderBy: [
            {
              occurredAt: "desc",
            },
            {
              id: "desc",
            },
          ],
          skip: query.cursor ? 0 : query.offset,
          take: query.limit,
          select: {
            id: true,
            requestId: true,
            routePath: true,
            routeMethod: true,
            statusCode: true,
            durationMs: true,
            cacheStatus: true,
            apiKeyAuthSource: true,
            apiKeyId: true,
            consumerId: true,
            occurredAt: true,
          },
        }),
      ]);

      return {
        items,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total,
          hasNextPage: query.offset + items.length < total,
        },
        filters: query.filters,
      };
    },
  };
}
