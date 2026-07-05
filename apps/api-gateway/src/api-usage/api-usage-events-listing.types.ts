import type { GatewayRouteMethod } from "../generated/prisma/index.js";
import type { ApiUsageCacheStatus } from "./api-usage-recorder.js";

export type ApiUsageEventsListingFilters = {
  from?: Date;
  to?: Date;
  routePath?: string;
  routeMethod?: GatewayRouteMethod;
  statusCode?: number;
  cacheStatus?: ApiUsageCacheStatus;
  apiKeyAuthSource?: string;
  apiKeyId?: string;
  consumerId?: string;
};

export type ApiUsageEventsListingCursor = {
  occurredAt: Date;
  id: string;
};

export type ApiUsageEventsListingQuery = {
  limit: number;
  offset: number;
  cursor?: ApiUsageEventsListingCursor;
  filters: ApiUsageEventsListingFilters;
};

export type ApiUsageEventListItemReadModel = {
  id: string;
  requestId: string;
  routePath: string;
  routeMethod: GatewayRouteMethod;
  statusCode: number;
  durationMs: number;
  cacheStatus: string | null;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
  occurredAt: Date;
};

export type ApiUsageEventsListingPaginationReadModel = {
  limit: number;
  offset: number;
  total: number;
  hasNextPage: boolean;
};

export type ApiUsageEventsListingReadModel = {
  items: ApiUsageEventListItemReadModel[];
  pagination: ApiUsageEventsListingPaginationReadModel;
  filters: ApiUsageEventsListingFilters;
};

export type ApiUsageEventListItemResponse = {
  id: string;
  requestId: string;
  routePath: string;
  routeMethod: GatewayRouteMethod;
  statusCode: number;
  durationMs: number;
  cacheStatus: string | null;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
  occurredAt: string;
};

export type ApiUsageEventsListingPaginationResponse = {
  limit: number;
  offset: number;
  total: number;
  hasNextPage: boolean;
  nextCursor: string | null;
};

export type ApiUsageEventsListingFiltersResponse = {
  from: string | null;
  to: string | null;
  routePath: string | null;
  routeMethod: GatewayRouteMethod | null;
  statusCode: number | null;
  cacheStatus: ApiUsageCacheStatus | null;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
};

export type ApiUsageEventsListingResponse = {
  items: ApiUsageEventListItemResponse[];
  pagination: ApiUsageEventsListingPaginationResponse;
  filters: ApiUsageEventsListingFiltersResponse;
};

export type ApiUsageEventsListingRepository = {
  listEvents(
    query: ApiUsageEventsListingQuery,
  ): Promise<ApiUsageEventsListingReadModel>;
};
