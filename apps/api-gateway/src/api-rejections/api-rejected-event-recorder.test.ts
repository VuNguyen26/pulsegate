import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../generated/prisma/index.js";
import { createPrismaApiRejectedEventRecorder } from "./api-rejected-event-recorder.js";

function createMockPrisma() {
  return {
    apiRejectedEvent: {
      create: vi.fn().mockResolvedValue({
        id: "rejected_event_1",
      }),
    },
  } as unknown as PrismaClient;
}

describe("createPrismaApiRejectedEventRecorder", () => {
  it("should persist a rejected request event with route and API key context", async () => {
    const prisma = createMockPrisma();
    const recorder = createPrismaApiRejectedEventRecorder(prisma);

    await recorder.record({
      requestId: "req_1",
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 429,
      rejectionReason: "QUOTA_EXCEEDED",
      apiKeyAuthSource: "database",
      apiKeyId: "key_1",
      consumerId: "consumer_1",
      metadata: {
        usagePlanId: "plan_1",
        quotaLimit: 100,
        quotaWindow: "DAILY",
        usedRequests: 100,
        remainingRequests: 0,
        resetAt: "2026-07-05T00:00:00.000Z",
      },
    });

    expect(prisma.apiRejectedEvent.create).toHaveBeenCalledWith({
      data: {
        requestId: "req_1",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 429,
        rejectionReason: "QUOTA_EXCEEDED",
        apiKeyAuthSource: "database",
        apiKeyId: "key_1",
        consumerId: "consumer_1",
        metadata: {
          usagePlanId: "plan_1",
          quotaLimit: 100,
          quotaWindow: "DAILY",
          usedRequests: 100,
          remainingRequests: 0,
          resetAt: "2026-07-05T00:00:00.000Z",
        },
      },
    });
  });

  it("should support rejected events without route or identity context", async () => {
    const prisma = createMockPrisma();
    const recorder = createPrismaApiRejectedEventRecorder(prisma);

    await recorder.record({
      requestId: "req_2",
      statusCode: 401,
      rejectionReason: "API_KEY_MISSING",
    });

    expect(prisma.apiRejectedEvent.create).toHaveBeenCalledWith({
      data: {
        requestId: "req_2",
        routePath: undefined,
        routeMethod: undefined,
        statusCode: 401,
        rejectionReason: "API_KEY_MISSING",
        apiKeyAuthSource: undefined,
        apiKeyId: undefined,
        consumerId: undefined,
        metadata: undefined,
      },
    });
  });

  it("should persist occurredAt when provided", async () => {
    const prisma = createMockPrisma();
    const recorder = createPrismaApiRejectedEventRecorder(prisma);
    const occurredAt = new Date("2026-07-04T09:00:00.000Z");

    await recorder.record({
      requestId: "req_3",
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 429,
      rejectionReason: "RATE_LIMIT_EXCEEDED",
      apiKeyAuthSource: "env",
      metadata: {
        identityType: "api-key",
        limit: 10,
        remaining: 0,
        retryAfterSeconds: 30,
      },
      occurredAt,
    });

    expect(prisma.apiRejectedEvent.create).toHaveBeenCalledWith({
      data: {
        requestId: "req_3",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 429,
        rejectionReason: "RATE_LIMIT_EXCEEDED",
        apiKeyAuthSource: "env",
        apiKeyId: undefined,
        consumerId: undefined,
        metadata: {
          identityType: "api-key",
          limit: 10,
          remaining: 0,
          retryAfterSeconds: 30,
        },
        occurredAt,
      },
    });
  });
});