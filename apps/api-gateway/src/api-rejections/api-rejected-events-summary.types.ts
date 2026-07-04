import type { ApiRejectionReason } from "../generated/prisma/index.js";
import type {
  ApiRejectedEventsListingFilters,
  ApiRejectedEventsListingFiltersResponse,
} from "./api-rejected-events-listing.types.js";

export type ApiRejectedEventsByReasonReadModel = {
  rejectionReason: ApiRejectionReason;
  count: number;
};

export type ApiRejectedEventsByStatusCodeReadModel = {
  statusCode: number;
  count: number;
};

export type ApiRejectedEventsSummaryReadModel = {
  totalRejectedRequests: number;
  byReason: ApiRejectedEventsByReasonReadModel[];
  byStatusCode: ApiRejectedEventsByStatusCodeReadModel[];
  lastRejectedAt: Date | null;
  filters: ApiRejectedEventsListingFilters;
};

export type ApiRejectedEventsByReasonResponse = {
  rejectionReason: ApiRejectionReason;
  count: number;
};

export type ApiRejectedEventsByStatusCodeResponse = {
  statusCode: number;
  count: number;
};

export type ApiRejectedEventsSummaryResponse = {
  totalRejectedRequests: number;
  byReason: ApiRejectedEventsByReasonResponse[];
  byStatusCode: ApiRejectedEventsByStatusCodeResponse[];
  lastRejectedAt: string | null;
  filters: ApiRejectedEventsListingFiltersResponse;
};

export type ApiRejectedEventsSummaryRepository = {
  getSummary(
    filters?: ApiRejectedEventsListingFilters,
  ): Promise<ApiRejectedEventsSummaryReadModel>;
};
