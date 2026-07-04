import type { GatewayRouteMethod } from "../generated/prisma/index.js";
import type { ApiUsageCacheStatus } from "./api-usage-recorder.js";

export type ApiUsageSummarySubjectType = "consumer" | "apiKey";

export type ApiUsageSummaryFilters = {
  from?: Date;
  to?: Date;
  routePath?: string;
  routeMethod?: GatewayRouteMethod;
  statusCode?: number;
  cacheStatus?: ApiUsageCacheStatus;
  apiKeyAuthSource?: string;
};

export type ApiUsageSummaryQuery = {
  filters: ApiUsageSummaryFilters;
};

export type ApiUsageSummaryReadModel = {
  subjectType: ApiUsageSummarySubjectType;
  subjectId: string;
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageDurationMs: number;
  cacheHits: number;
  cacheMisses: number;
  cacheBypasses: number;
  lastRequestAt: Date | null;
};

export type ApiUsageSummaryResponse = {
  subjectType: ApiUsageSummarySubjectType;
  subjectId: string;
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageDurationMs: number;
  cacheHits: number;
  cacheMisses: number;
  cacheBypasses: number;
  lastRequestAt: string | null;
};

export type ApiUsageSummaryRepository = {
  getConsumerUsageSummary: (
    consumerId: string,
    filters?: ApiUsageSummaryFilters,
  ) => Promise<ApiUsageSummaryReadModel>;

  getApiKeyUsageSummary: (
    apiKeyId: string,
    filters?: ApiUsageSummaryFilters,
  ) => Promise<ApiUsageSummaryReadModel>;
};
