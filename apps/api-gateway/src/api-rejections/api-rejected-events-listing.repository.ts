import type {
  Prisma,
  PrismaClient,
} from "../generated/prisma/index.js";
import type {
  ApiRejectedEventsListingFilters,
  ApiRejectedEventsListingQuery,
  ApiRejectedEventsListingReadModel,
  ApiRejectedEventsListingRepository,
} from "./api-rejected-events-listing.types.js";

function buildApiRejectedEventsWhereInput(
  filters: ApiRejectedEventsListingFilters,
): Prisma.ApiRejectedEventWhereInput {
  const where: Prisma.ApiRejectedEventWhereInput = {};

  if (filters.from || filters.to) {
    where.occurredAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  if (filters.rejectionReason) {
    where.rejectionReason = filters.rejectionReason;
  }

  if (filters.statusCode) {
    where.statusCode = filters.statusCode;
  }

  if (filters.routePath) {
    where.routePath = filters.routePath;
  }

  if (filters.routeMethod) {
    where.routeMethod = filters.routeMethod;
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

  return where;
}

export function createPrismaApiRejectedEventsListingRepository(
  prisma: PrismaClient,
): ApiRejectedEventsListingRepository {
  return {
    async listEvents(
      query: ApiRejectedEventsListingQuery,
    ): Promise<ApiRejectedEventsListingReadModel> {
      const where = buildApiRejectedEventsWhereInput(query.filters);

      const [total, items] = await Promise.all([
        prisma.apiRejectedEvent.count({
          where,
        }),
        prisma.apiRejectedEvent.findMany({
          where,
          orderBy: [
            {
              occurredAt: "desc",
            },
            {
              id: "desc",
            },
          ],
          skip: query.offset,
          take: query.limit,
          select: {
            id: true,
            requestId: true,
            routePath: true,
            routeMethod: true,
            statusCode: true,
            rejectionReason: true,
            apiKeyAuthSource: true,
            apiKeyId: true,
            consumerId: true,
            metadata: true,
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
