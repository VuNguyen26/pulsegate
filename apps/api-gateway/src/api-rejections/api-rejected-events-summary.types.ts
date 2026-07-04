import type { ApiRejectionReason } from "../generated/prisma/index.js";

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
};

export type ApiRejectedEventsSummaryRepository = {
  getSummary(): Promise<ApiRejectedEventsSummaryReadModel>;
};
