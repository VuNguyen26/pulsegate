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
    filters: {
      from: summary.filters.from ? summary.filters.from.toISOString() : null,
      to: summary.filters.to ? summary.filters.to.toISOString() : null,
      rejectionReason: summary.filters.rejectionReason ?? null,
      statusCode: summary.filters.statusCode ?? null,
      routePath: summary.filters.routePath ?? null,
      routeMethod: summary.filters.routeMethod ?? null,
      apiKeyAuthSource: summary.filters.apiKeyAuthSource ?? null,
      apiKeyId: summary.filters.apiKeyId ?? null,
      consumerId: summary.filters.consumerId ?? null,
    },
  };
}
