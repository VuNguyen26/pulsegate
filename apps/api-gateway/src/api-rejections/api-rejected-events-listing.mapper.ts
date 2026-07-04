import type {
  ApiRejectedEventsListingReadModel,
  ApiRejectedEventsListingResponse,
} from "./api-rejected-events-listing.types.js";

export function mapApiRejectedEventsListingReadModelToResponse(
  listing: ApiRejectedEventsListingReadModel,
): ApiRejectedEventsListingResponse {
  return {
    items: listing.items.map((item) => ({
      id: item.id,
      requestId: item.requestId,
      routePath: item.routePath,
      routeMethod: item.routeMethod,
      statusCode: item.statusCode,
      rejectionReason: item.rejectionReason,
      apiKeyAuthSource: item.apiKeyAuthSource,
      apiKeyId: item.apiKeyId,
      consumerId: item.consumerId,
      metadata: item.metadata,
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
      rejectionReason: listing.filters.rejectionReason ?? null,
      statusCode: listing.filters.statusCode ?? null,
      routePath: listing.filters.routePath ?? null,
      routeMethod: listing.filters.routeMethod ?? null,
      apiKeyAuthSource: listing.filters.apiKeyAuthSource ?? null,
      apiKeyId: listing.filters.apiKeyId ?? null,
      consumerId: listing.filters.consumerId ?? null,
    },
  };
}
