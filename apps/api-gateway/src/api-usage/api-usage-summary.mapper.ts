import type {
  ApiUsageSummaryReadModel,
  ApiUsageSummaryResponse,
} from "./api-usage-summary.types.js";

export function mapApiUsageSummaryReadModelToResponse(
  summary: ApiUsageSummaryReadModel,
): ApiUsageSummaryResponse {
  return {
    subjectType: summary.subjectType,
    subjectId: summary.subjectId,
    totalRequests: summary.totalRequests,
    successfulRequests: summary.successfulRequests,
    errorRequests: summary.errorRequests,
    averageDurationMs: summary.averageDurationMs,
    cacheHits: summary.cacheHits,
    cacheMisses: summary.cacheMisses,
    cacheBypasses: summary.cacheBypasses,
    lastRequestAt: summary.lastRequestAt
      ? summary.lastRequestAt.toISOString()
      : null,
  };
}
