import type {
  ApiUsageEventsListingReadModel,
  ApiUsageEventsListingResponse,
} from "./api-usage-events-listing.types.js";

export function mapApiUsageEventsListingReadModelToResponse(
  listing: ApiUsageEventsListingReadModel,
): ApiUsageEventsListingResponse {
  return {
    items: listing.items.map((item) => ({
      id: item.id,
      requestId: item.requestId,
      routePath: item.routePath,
      routeMethod: item.routeMethod,
      statusCode: item.statusCode,
      durationMs: item.durationMs,
      cacheStatus: item.cacheStatus,
      apiKeyAuthSource: item.apiKeyAuthSource,
      apiKeyId: item.apiKeyId,
      consumerId: item.consumerId,
      occurredAt: item.occurredAt.toISOString(),
    })),
    pagination: {
      limit: listing.pagination.limit,
      offset: listing.pagination.offset,
      total: listing.pagination.total,
      hasNextPage: listing.pagination.hasNextPage,
    },
    filters: {
      from: listing.filters.from ? listing.filters.from.toISOString() : null,
      to: listing.filters.to ? listing.filters.to.toISOString() : null,
      routePath: listing.filters.routePath ?? null,
      routeMethod: listing.filters.routeMethod ?? null,
      statusCode: listing.filters.statusCode ?? null,
      cacheStatus: listing.filters.cacheStatus ?? null,
      apiKeyAuthSource: listing.filters.apiKeyAuthSource ?? null,
      apiKeyId: listing.filters.apiKeyId ?? null,
      consumerId: listing.filters.consumerId ?? null,
    },
  };
}
