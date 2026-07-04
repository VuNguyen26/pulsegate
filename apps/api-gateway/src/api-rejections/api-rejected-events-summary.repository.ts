import type { PrismaClient } from "../generated/prisma/index.js";
import { buildApiRejectedEventsWhereInput } from "./api-rejected-events-listing.repository.js";
import type { ApiRejectedEventsListingFilters } from "./api-rejected-events-listing.types.js";
import type {
  ApiRejectedEventsSummaryReadModel,
  ApiRejectedEventsSummaryRepository,
} from "./api-rejected-events-summary.types.js";

export function createPrismaApiRejectedEventsSummaryRepository(
  prisma: PrismaClient,
): ApiRejectedEventsSummaryRepository {
  return {
    async getSummary(
      filters: ApiRejectedEventsListingFilters = {},
    ): Promise<ApiRejectedEventsSummaryReadModel> {
      const where = buildApiRejectedEventsWhereInput(filters);

      const [totalRejectedRequests, byReason, byStatusCode, lastRejectedEvent] =
        await Promise.all([
          prisma.apiRejectedEvent.count({
            where,
          }),
          prisma.apiRejectedEvent.groupBy({
            by: ["rejectionReason"],
            where,
            _count: {
              _all: true,
            },
            orderBy: {
              rejectionReason: "asc",
            },
          }),
          prisma.apiRejectedEvent.groupBy({
            by: ["statusCode"],
            where,
            _count: {
              _all: true,
            },
            orderBy: {
              statusCode: "asc",
            },
          }),
          prisma.apiRejectedEvent.findFirst({
            where,
            orderBy: {
              occurredAt: "desc",
            },
            select: {
              occurredAt: true,
            },
          }),
        ]);

      return {
        totalRejectedRequests,
        byReason: byReason.map((item) => ({
          rejectionReason: item.rejectionReason,
          count: item._count._all,
        })),
        byStatusCode: byStatusCode.map((item) => ({
          statusCode: item.statusCode,
          count: item._count._all,
        })),
        lastRejectedAt: lastRejectedEvent?.occurredAt ?? null,
        filters,
      };
    },
  };
}
