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

export type ApiUsageEventsListingQuery = {
  limit: number;
  offset: number;
  filters: ApiUsageEventsListingFilters;
};
