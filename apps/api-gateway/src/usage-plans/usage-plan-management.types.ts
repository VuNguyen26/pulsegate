export type UsagePlanQuotaWindowValue = "DAILY" | "MONTHLY";

export type UsagePlanReadModel = {
  id: string;
  name: string;
  description: string | null;
  quotaLimit: number;
  quotaWindow: UsagePlanQuotaWindowValue;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UsagePlanCreateData = {
  name: string;
  description: string | null;
  quotaLimit: number;
  quotaWindow: UsagePlanQuotaWindowValue;
  enabled: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UsagePlanUpdateData = {
  name: string;
  description: string | null;
  quotaLimit: number;
  quotaWindow: UsagePlanQuotaWindowValue;
  enabled: boolean;
  updatedBy?: string | null;
};

export type UsagePlanManagementRepository = {
  listUsagePlans: () => Promise<UsagePlanReadModel[]>;
  findUsagePlanById: (id: string) => Promise<UsagePlanReadModel | null>;
  createUsagePlan: (data: UsagePlanCreateData) => Promise<UsagePlanReadModel>;
  updateUsagePlan: (
    id: string,
    data: UsagePlanUpdateData,
  ) => Promise<UsagePlanReadModel>;
};

export type UsagePlanResponse = {
  id: string;
  name: string;
  description: string | null;
  quotaLimit: number;
  quotaWindow: UsagePlanQuotaWindowValue;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};