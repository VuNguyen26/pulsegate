import type {
  ApiRejectedEventsSummaryReadModel,
  ApiRejectedEventsSummaryResponse,
} from "./api-rejected-events-summary.types.js";

export function mapApiRejectedEventsSummaryReadModelToResponse(
  summary: ApiRejectedEventsSummaryReadModel,
): ApiRejectedEventsSummaryResponse {
  return {
    totalRejectedRequests: summary.totalRejectedRequests,
    byReason: summary.byReason.map((item) => ({
      rejectionReason: item.rejectionReason,
      count: item.count,
    })),
    byStatusCode: summary.byStatusCode.map((item) => ({
      statusCode: item.statusCode,
      count: item.count,
    })),
    lastRejectedAt: summary.lastRejectedAt
      ? summary.lastRejectedAt.toISOString()
      : null,
  };
}
