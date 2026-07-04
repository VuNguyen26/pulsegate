import type { PrismaClient } from "../generated/prisma/index.js";
import type {
  ApiRejectedEventsSummaryReadModel,
  ApiRejectedEventsSummaryRepository,
} from "./api-rejected-events-summary.types.js";

export function createPrismaApiRejectedEventsSummaryRepository(
  prisma: PrismaClient,
): ApiRejectedEventsSummaryRepository {
  return {
    async getSummary(): Promise<ApiRejectedEventsSummaryReadModel> {
      const [totalRejectedRequests, byReason, byStatusCode, lastRejectedEvent] =
        await Promise.all([
          prisma.apiRejectedEvent.count(),
          prisma.apiRejectedEvent.groupBy({
            by: ["rejectionReason"],
            _count: {
              _all: true,
            },
            orderBy: {
              rejectionReason: "asc",
            },
          }),
          prisma.apiRejectedEvent.groupBy({
            by: ["statusCode"],
            _count: {
              _all: true,
            },
            orderBy: {
              statusCode: "asc",
            },
          }),
          prisma.apiRejectedEvent.findFirst({
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
      };
    },
  };
}
