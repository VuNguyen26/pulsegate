import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApiGatewayApp } from "../app.js";
import type {
  ApiConsumerCreateData,
  ApiConsumerManagementRepository,
  ApiConsumerReadModel,
  ApiConsumerUpdateData,
} from "../api-consumers/api-consumer-management.types.js";
import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";

const createdAt = new Date("2026-07-03T00:00:00.000Z");
const updatedAt = new Date("2026-07-03T01:00:00.000Z");

const activeConsumer: ApiConsumerReadModel = {
  id: "consumer_mobile",
  name: "Mobile App",
  description: "Main mobile application",
  status: "ACTIVE",
  createdAt,
  updatedAt,
  createdBy: "admin",
  updatedBy: "admin",
};

const disabledConsumer: ApiConsumerReadModel = {
  id: "consumer_partner",
  name: "Partner App",
  description: null,
  status: "DISABLED",
  createdAt,
  updatedAt,
  createdBy: "admin",
  updatedBy: "admin",
};

function createTestRepository(
  consumers: ApiConsumerReadModel[],
): ApiConsumerManagementRepository {
  const storedConsumers = [...consumers];

  return {
    listConsumers: vi.fn(async () => {
      return storedConsumers;
    }),

    findConsumerById: vi.fn(async (id: string) => {
      return storedConsumers.find((consumer) => consumer.id === id) ?? null;
    }),

    createConsumer: vi.fn(async (data: ApiConsumerCreateData) => {
      const createdConsumer: ApiConsumerReadModel = {
        id: `consumer_${storedConsumers.length + 1}`,
        name: data.name,
        description: data.description,
        status: data.status,
        createdAt,
        updatedAt,
        createdBy: data.createdBy ?? null,
        updatedBy: data.updatedBy ?? null,
      };

      storedConsumers.push(createdConsumer);

      return createdConsumer;
    }),

    updateConsumer: vi.fn(async (id: string, data: ApiConsumerUpdateData) => {
      const consumerIndex = storedConsumers.findIndex(
        (consumer) => consumer.id === id,
      );

      if (consumerIndex === -1) {
        throw new Error("API consumer not found");
      }

      const updatedConsumer: ApiConsumerReadModel = {
        id,
        name: data.name,
        description: data.description,
        status: data.status,
        createdAt: storedConsumers[consumerIndex].createdAt,
        updatedAt,
        createdBy: storedConsumers[consumerIndex].createdBy ?? null,
        updatedBy: data.updatedBy ?? null,
      };

      storedConsumers[consumerIndex] = updatedConsumer;

      return updatedConsumer;
    }),
  };
}

describe("adminConsumerRoute", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApiGatewayApp({
      logger: false,
      productProxy: {
        rateLimitStore: new InMemoryRateLimitStore(),
      },
      consumerManagement: {
        repository: createTestRepository([activeConsumer, disabledConsumer]),
        adminApiKey: "test-admin-key",
        adminApiKeyHeader: "x-admin-api-key",
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("should reject consumer list request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/consumers",
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toMatchObject({
      error: {
        code: "ADMIN_API_KEY_MISSING",
        message: "Admin API key is required",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject consumer list request when admin API key is invalid", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/consumers",
      headers: {
        "x-admin-api-key": "wrong-admin-key",
      },
    });

    expect(response.statusCode).toBe(403);

    expect(response.json()).toMatchObject({
      error: {
        code: "ADMIN_API_KEY_INVALID",
        message: "Admin API key is invalid",
        requestId: expect.any(String),
      },
    });
  });

  it("should return all API consumers for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/consumers",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: [
        {
          id: "consumer_mobile",
          name: "Mobile App",
          description: "Main mobile application",
          status: "ACTIVE",
          createdAt: "2026-07-03T00:00:00.000Z",
          updatedAt: "2026-07-03T01:00:00.000Z",
          createdBy: "admin",
          updatedBy: "admin",
        },
        {
          id: "consumer_partner",
          name: "Partner App",
          description: null,
          status: "DISABLED",
        },
      ],
    });
  });

  it("should return an API consumer by id for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/consumers/consumer_mobile",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        id: "consumer_mobile",
        name: "Mobile App",
        status: "ACTIVE",
      },
    });
  });

  it("should return 404 when API consumer id does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/consumers/missing_consumer",
      headers: {
        "x-admin-api-key": "test-admin-key",
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_CONSUMER_NOT_FOUND",
        message: "API consumer was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should create an API consumer for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/consumers",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
        "x-admin-actor": "test-admin",
      },
      payload: JSON.stringify({
        name: "Public Web App",
        description: "Website frontend consumer",
      }),
    });

    expect(response.statusCode).toBe(201);

    expect(response.json()).toMatchObject({
      data: {
        id: "consumer_3",
        name: "Public Web App",
        description: "Website frontend consumer",
        status: "ACTIVE",
        createdBy: "test-admin",
        updatedBy: "test-admin",
      },
    });
  });

  it("should reject create request when API consumer payload is invalid", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/consumers",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        name: "",
      }),
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_CONSUMER_INVALID",
        message: "API consumer is invalid",
        details: "name must be a non-empty string",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject create request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/consumers",
      headers: {
        "content-type": "application/json",
      },
      payload: JSON.stringify({
        name: "Public Web App",
      }),
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toMatchObject({
      error: {
        code: "ADMIN_API_KEY_MISSING",
        message: "Admin API key is required",
        requestId: expect.any(String),
      },
    });
  });

  it("should update an API consumer for an authenticated admin request", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/consumers/consumer_mobile",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
        "x-admin-actor": "test-admin",
      },
      payload: JSON.stringify({
        name: "Mobile App v2",
        description: null,
        status: "DISABLED",
      }),
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      data: {
        id: "consumer_mobile",
        name: "Mobile App v2",
        description: null,
        status: "DISABLED",
        createdBy: "admin",
        updatedBy: "test-admin",
      },
    });
  });

  it("should return 404 when updating an API consumer that does not exist", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/consumers/missing_consumer",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        status: "DISABLED",
      }),
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_CONSUMER_NOT_FOUND",
        message: "API consumer was not found",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject update request when API consumer payload is invalid", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/consumers/consumer_mobile",
      headers: {
        "content-type": "application/json",
        "x-admin-api-key": "test-admin-key",
      },
      payload: JSON.stringify({
        status: "DELETED",
      }),
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toMatchObject({
      error: {
        code: "API_CONSUMER_INVALID",
        message: "API consumer is invalid",
        details: "status must be one of: ACTIVE, DISABLED",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject update request when admin API key is missing", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/internal/admin/consumers/consumer_mobile",
      headers: {
        "content-type": "application/json",
      },
      payload: JSON.stringify({
        status: "DISABLED",
      }),
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toMatchObject({
      error: {
        code: "ADMIN_API_KEY_MISSING",
        message: "Admin API key is required",
        requestId: expect.any(String),
      },
    });
  });
});
