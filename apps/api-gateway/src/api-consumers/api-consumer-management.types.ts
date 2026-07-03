export type ApiConsumerStatusValue = "ACTIVE" | "DISABLED";

export type ApiConsumerReadModel = {
  id: string;
  name: string;
  description: string | null;
  status: ApiConsumerStatusValue;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type ApiConsumerCreateData = {
  name: string;
  description: string | null;
  status: ApiConsumerStatusValue;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type ApiConsumerUpdateData = {
  name: string;
  description: string | null;
  status: ApiConsumerStatusValue;
  updatedBy?: string | null;
};

export type ApiConsumerManagementRepository = {
  listConsumers: () => Promise<ApiConsumerReadModel[]>;
  findConsumerById: (id: string) => Promise<ApiConsumerReadModel | null>;
  createConsumer: (
    data: ApiConsumerCreateData,
  ) => Promise<ApiConsumerReadModel>;
  updateConsumer: (
    id: string,
    data: ApiConsumerUpdateData,
  ) => Promise<ApiConsumerReadModel>;
};

export type ApiConsumerResponse = {
  id: string;
  name: string;
  description: string | null;
  status: ApiConsumerStatusValue;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};
