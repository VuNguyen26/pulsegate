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

  it("should apply usage summary filters to repository queries", async () => {
    const from = new Date("2026-07-04T00:00:00.000Z");
    const to = new Date("2026-07-05T00:00:00.000Z");
    const lastRequestAt = new Date("2026-07-04T12:00:00.000Z");

    const { prisma, count, aggregate, findFirst } = createMockPrisma({
      countResults: [6, 5, 1, 6],
      averageDurationMs: 31.2,
      lastRequestAt,
    });

    const repository = createPrismaApiUsageSummaryRepository(prisma);

    await expect(
      repository.getApiKeyUsageSummary("key_1", {
        from,
        to,
        routePath: "/api/products",
        routeMethod: "GET",
        cacheStatus: "MISS",
        apiKeyAuthSource: "database",
      }),
    ).resolves.toEqual({
      subjectType: "apiKey",
      subjectId: "key_1",
      totalRequests: 6,
      successfulRequests: 5,
      errorRequests: 1,
      averageDurationMs: 31,
      cacheHits: 0,
      cacheMisses: 6,
      cacheBypasses: 0,
      lastRequestAt,
    });

    const filteredWhere = {
      apiKeyId: "key_1",
      occurredAt: {
        gte: from,
        lte: to,
      },
      routePath: "/api/products",
      routeMethod: "GET",
      cacheStatus: "MISS",
      apiKeyAuthSource: "database",
    };

    expect(count).toHaveBeenCalledTimes(4);

    expect(count).toHaveBeenNthCalledWith(1, {
      where: filteredWhere,
    });

    expect(count).toHaveBeenNthCalledWith(2, {
      where: {
        ...filteredWhere,
        statusCode: {
          gte: 200,
          lt: 400,
        },
      },
    });

    expect(count).toHaveBeenNthCalledWith(3, {
      where: {
        ...filteredWhere,
        statusCode: {
          gte: 400,
        },
      },
    });

    expect(count).toHaveBeenNthCalledWith(4, {
      where: filteredWhere,
    });

    expect(aggregate).toHaveBeenCalledWith({
      where: filteredWhere,
      _avg: {
        durationMs: true,
      },
    });

    expect(findFirst).toHaveBeenCalledWith({
      where: filteredWhere,
      orderBy: {
        occurredAt: "desc",
      },
      select: {
        occurredAt: true,
      },
    });
  });

  it("should keep successful request count at zero when filtering by an error status code", async () => {
    const { prisma, count } = createMockPrisma({
      countResults: [2, 2, 1, 1, 0],
      averageDurationMs: 12,
      lastRequestAt: null,
    });

    const repository = createPrismaApiUsageSummaryRepository(prisma);

    await expect(
      repository.getConsumerUsageSummary("consumer_1", {
        statusCode: 404,
      }),
    ).resolves.toMatchObject({
      totalRequests: 2,
      successfulRequests: 0,
      errorRequests: 2,
      cacheHits: 1,
      cacheMisses: 1,
      cacheBypasses: 0,
    });

    expect(count).toHaveBeenNthCalledWith(1, {
      where: {
        consumerId: "consumer_1",
        statusCode: 404,
      },
    });

    expect(count).toHaveBeenNthCalledWith(2, {
      where: {
        consumerId: "consumer_1",
        statusCode: 404,
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
