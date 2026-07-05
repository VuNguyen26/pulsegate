import { Buffer } from "node:buffer";

import type {
  ApiUsageEventListItemReadModel,
  ApiUsageEventsListingReadModel,
  ApiUsageEventsListingResponse,
} from "./api-usage-events-listing.types.js";

function encodeBase64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeNextCursor(item: ApiUsageEventListItemReadModel): string {
  return encodeBase64UrlJson({
    occurredAt: item.occurredAt.toISOString(),
    id: item.id,
  });
}

function getNextCursor(listing: ApiUsageEventsListingReadModel): string | null {
  if (!listing.pagination.hasNextPage) {
    return null;
  }

  const lastItem = listing.items[listing.items.length - 1];

  return lastItem ? encodeNextCursor(lastItem) : null;
}

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
      nextCursor: getNextCursor(listing),
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
