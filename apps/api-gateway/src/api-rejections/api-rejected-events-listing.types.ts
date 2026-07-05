import type {
  ApiRejectionReason,
  GatewayRouteMethod,
  Prisma,
} from "../generated/prisma/index.js";

export type ApiRejectedEventsListingFilters = {
  from?: Date;
  to?: Date;
  rejectionReason?: ApiRejectionReason;
  statusCode?: number;
  routePath?: string;
  routeMethod?: GatewayRouteMethod;
  apiKeyAuthSource?: string;
  apiKeyId?: string;
  consumerId?: string;
};

export type ApiRejectedEventsListingCursor = {
  occurredAt: Date;
  id: string;
};

export type ApiRejectedEventsListingQuery = {
  limit: number;
  offset: number;
  cursor?: ApiRejectedEventsListingCursor;
  filters: ApiRejectedEventsListingFilters;
};

export type ApiRejectedEventListItemReadModel = {
  id: string;
  requestId: string;
  routePath: string | null;
  routeMethod: GatewayRouteMethod | null;
  statusCode: number;
  rejectionReason: ApiRejectionReason;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
  metadata: Prisma.JsonValue | null;
  occurredAt: Date;
};

export type ApiRejectedEventsListingPaginationReadModel = {
  limit: number;
  offset: number;
  total: number;
  hasNextPage: boolean;
};

export type ApiRejectedEventsListingReadModel = {
  items: ApiRejectedEventListItemReadModel[];
  pagination: ApiRejectedEventsListingPaginationReadModel;
  filters: ApiRejectedEventsListingFilters;
};

export type ApiRejectedEventListItemResponse = {
  id: string;
  requestId: string;
  routePath: string | null;
  routeMethod: GatewayRouteMethod | null;
  statusCode: number;
  rejectionReason: ApiRejectionReason;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
  metadata: Prisma.JsonValue | null;
  occurredAt: string;
};

export type ApiRejectedEventsListingPaginationResponse = {
  limit: number;
  offset: number;
  total: number;
  hasNextPage: boolean;
  nextCursor: string | null;
};

export type ApiRejectedEventsListingFiltersResponse = {
  from: string | null;
  to: string | null;
  rejectionReason: ApiRejectionReason | null;
  statusCode: number | null;
  routePath: string | null;
  routeMethod: GatewayRouteMethod | null;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
};

export type ApiRejectedEventsListingResponse = {
  items: ApiRejectedEventListItemResponse[];
  pagination: ApiRejectedEventsListingPaginationResponse;
  filters: ApiRejectedEventsListingFiltersResponse;
};

export type ApiRejectedEventsListingRepository = {
  listEvents(
    query: ApiRejectedEventsListingQuery,
  ): Promise<ApiRejectedEventsListingReadModel>;
};
