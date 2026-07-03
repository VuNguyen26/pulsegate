export type ApiUsageSummarySubjectType = "consumer" | "apiKey";

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
  ) => Promise<ApiUsageSummaryReadModel>;

  getApiKeyUsageSummary: (
    apiKeyId: string,
  ) => Promise<ApiUsageSummaryReadModel>;
};
