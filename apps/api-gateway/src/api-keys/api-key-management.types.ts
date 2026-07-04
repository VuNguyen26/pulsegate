export type ApiKeyStatusValue = "ACTIVE" | "REVOKED";

export type ApiKeyReadModel = {
  id: string;
  consumerId: string;
  usagePlanId: string | null;
  name: string;
  keyPrefix: string;
  keyHash: string;
  status: ApiKeyStatusValue;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  revokedAt?: Date | null;
  revokedBy?: string | null;
};

export type ApiKeyCreateRequestData = {
  name: string;
  expiresAt: Date | null;
};

export type ApiKeyCreateData = {
  consumerId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  status: ApiKeyStatusValue;
  expiresAt: Date | null;
  createdBy?: string | null;
};

export type ApiKeyUsagePlanAssignmentData = {
  usagePlanId: string | null;
};

export type ApiKeyManagementRepository = {
  listApiKeysByConsumerId: (consumerId: string) => Promise<ApiKeyReadModel[]>;
  findApiKeyById: (id: string) => Promise<ApiKeyReadModel | null>;
  createApiKey: (data: ApiKeyCreateData) => Promise<ApiKeyReadModel>;
  revokeApiKey: (id: string, actor: string) => Promise<ApiKeyReadModel>;
  assignUsagePlanToApiKey: (
    id: string,
    usagePlanId: string | null,
  ) => Promise<ApiKeyReadModel>;
};

export type ApiKeyResponse = {
  id: string;
  consumerId: string;
  usagePlanId: string | null;
  name: string;
  keyPrefix: string;
  status: ApiKeyStatusValue;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
};

export type IssuedApiKeyResponse = ApiKeyResponse & {
  rawKey: string;
};