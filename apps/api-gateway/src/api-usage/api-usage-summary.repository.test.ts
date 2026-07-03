import type { PrismaClient } from "../generated/prisma/index.js";
import { describe, expect, it, vi } from "vitest";

import { createPrismaApiUsageSummaryRepository } from "./api-usage-summary.repository.js";

function createMockPrisma(options: {
  countResults: number[];
  averageDurationMs: number | null;
  lastRequestAt: Date | null;
}) {
  const count = vi.fn();

  for (const result of options.countResults) {
    count.mockResolvedValueOnce(result);
  }

  const aggregate = vi.fn().mockResolvedValue({
    _avg: {
      durationMs: options.averageDurationMs,
    },
  });

  const findFirst = vi.fn().mockResolvedValue(
    options.lastRequestAt
      ? {
          occurredAt: options.lastRequestAt,
        }
      : null,
  );

  return {
    prisma: {
      apiUsageEvent: {
        count,
        aggregate,
        findFirst,
      },
    } as unknown as PrismaClient,
    count,
    aggregate,
    findFirst,
  };
}

describe("createPrismaApiUsageSummaryRepository", () => {
  it("should build a consumer usage summary", async () => {
    const lastRequestAt = new Date("2026-07-03T16:00:00.000Z");
    const { prisma, count, aggregate, findFirst } = createMockPrisma({
      countResults: [10, 8, 2, 3, 4, 3],
      averageDurationMs: 42.6,
      lastRequestAt,
    });

    const repository = createPrismaApiUsageSummaryRepository(prisma);

    await expect(
      repository.getConsumerUsageSummary("consumer_1"),
    ).resolves.toEqual({
      subjectType: "consumer",
      subjectId: "consumer_1",
      totalRequests: 10,
      successfulRequests: 8,
      errorRequests: 2,
      averageDurationMs: 43,
      cacheHits: 3,
      cacheMisses: 4,
      cacheBypasses: 3,
      lastRequestAt,
    });

    expect(count).toHaveBeenNthCalledWith(1, {
      where: {
        consumerId: "consumer_1",
      },
    });

    expect(count).toHaveBeenNthCalledWith(2, {
      where: {
        consumerId: "consumer_1",
        statusCode: {
          gte: 200,
          lt: 400,
        },
      },
    });

    expect(count).toHaveBeenNthCalledWith(3, {
      where: {
        consumerId: "consumer_1",
        statusCode: {
          gte: 400,
        },
      },
    });

    expect(count).toHaveBeenNthCalledWith(4, {
      where: {
        consumerId: "consumer_1",
        cacheStatus: "HIT",
      },
    });

    expect(count).toHaveBeenNthCalledWith(5, {
      where: {
        consumerId: "consumer_1",
        cacheStatus: "MISS",
      },
    });

    expect(count).toHaveBeenNthCalledWith(6, {
      where: {
        consumerId: "consumer_1",
        cacheStatus: "BYPASS",
      },
    });

    expect(aggregate).toHaveBeenCalledWith({
      where: {
        consumerId: "consumer_1",
      },
      _avg: {
        durationMs: true,
      },
    });

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        consumerId: "consumer_1",
      },
      orderBy: {
        occurredAt: "desc",
      },
      select: {
        occurredAt: true,
      },
    });
  });

  it("should build an empty API key usage summary", async () => {
    const { prisma } = createMockPrisma({
      countResults: [0, 0, 0, 0, 0, 0],
      averageDurationMs: null,
      lastRequestAt: null,
    });

    const repository = createPrismaApiUsageSummaryRepository(prisma);

    await expect(repository.getApiKeyUsageSummary("key_1")).resolves.toEqual({
      subjectType: "apiKey",
      subjectId: "key_1",
      totalRequests: 0,
      successfulRequests: 0,
      errorRequests: 0,
      averageDurationMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheBypasses: 0,
      lastRequestAt: null,
    });
  });
});
