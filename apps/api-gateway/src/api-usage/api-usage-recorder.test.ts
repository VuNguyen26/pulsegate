import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../generated/prisma/index.js";
import { createPrismaApiUsageRecorder } from "./api-usage-recorder.js";

function createMockPrisma() {
  return {
    apiUsageEvent: {
      create: vi.fn().mockResolvedValue({
        id: "usage_event_1",
      }),
    },
  } as unknown as PrismaClient;
}

describe("createPrismaApiUsageRecorder", () => {
  it("should persist an API usage event", async () => {
    const prisma = createMockPrisma();
    const recorder = createPrismaApiUsageRecorder(prisma);

    await recorder.record({
      requestId: "req_1",
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 200,
      durationMs: 123,
      cacheStatus: "MISS",
      apiKeyAuthSource: "database",
      apiKeyId: "key_1",
      consumerId: "consumer_1",
    });

    expect(prisma.apiUsageEvent.create).toHaveBeenCalledWith({
      data: {
        requestId: "req_1",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        durationMs: 123,
        cacheStatus: "MISS",
        apiKeyAuthSource: "database",
        apiKeyId: "key_1",
        consumerId: "consumer_1",
      },
    });
  });

  it("should support env fallback traffic without apiKeyId or consumerId", async () => {
    const prisma = createMockPrisma();
    const recorder = createPrismaApiUsageRecorder(prisma);

    await recorder.record({
      requestId: "req_2",
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 200,
      durationMs: 55,
      cacheStatus: "BYPASS",
      apiKeyAuthSource: "env",
    });

    expect(prisma.apiUsageEvent.create).toHaveBeenCalledWith({
      data: {
        requestId: "req_2",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        durationMs: 55,
        cacheStatus: "BYPASS",
        apiKeyAuthSource: "env",
        apiKeyId: undefined,
        consumerId: undefined,
      },
    });
  });

  it("should persist occurredAt when provided", async () => {
    const prisma = createMockPrisma();
    const recorder = createPrismaApiUsageRecorder(prisma);
    const occurredAt = new Date("2026-07-03T15:00:00.000Z");

    await recorder.record({
      requestId: "req_3",
      routePath: "/api/product-service/health",
      routeMethod: "GET",
      statusCode: 200,
      durationMs: 10,
      cacheStatus: "BYPASS",
      occurredAt,
    });

    expect(prisma.apiUsageEvent.create).toHaveBeenCalledWith({
      data: {
        requestId: "req_3",
        routePath: "/api/product-service/health",
        routeMethod: "GET",
        statusCode: 200,
        durationMs: 10,
        cacheStatus: "BYPASS",
        apiKeyAuthSource: undefined,
        apiKeyId: undefined,
        consumerId: undefined,
        occurredAt,
      },
    });
  });
});
