import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../generated/prisma/index.js";
import { createPrismaApiRejectedEventsSummaryRepository } from "./api-rejected-events-summary.repository.js";

function createMockPrisma() {
  return {
    apiRejectedEvent: {
      count: vi.fn().mockResolvedValue(4),
      groupBy: vi
        .fn()
        .mockResolvedValueOnce([
          {
            rejectionReason: "API_KEY_MISSING",
            _count: {
              _all: 2,
            },
          },
          {
            rejectionReason: "RATE_LIMIT_EXCEEDED",
            _count: {
              _all: 2,
            },
          },
        ])
        .mockResolvedValueOnce([
          {
            statusCode: 401,
            _count: {
              _all: 2,
            },
          },
          {
            statusCode: 429,
            _count: {
              _all: 2,
            },
          },
        ]),
      findFirst: vi.fn().mockResolvedValue({
        occurredAt: new Date("2026-07-04T10:00:00.000Z"),
      }),
    },
  } as unknown as PrismaClient;
}

describe("createPrismaApiRejectedEventsSummaryRepository", () => {
  it("should return rejected events summary with filters", async () => {
    const prisma = createMockPrisma();
    const repository = createPrismaApiRejectedEventsSummaryRepository(prisma);

    const from = new Date("2026-07-04T00:00:00.000Z");
    const to = new Date("2026-07-05T00:00:00.000Z");

    const filters = {
      from,
      to,
      rejectionReason: "RATE_LIMIT_EXCEEDED" as const,
      statusCode: 429,
      routePath: "/api/products",
      routeMethod: "GET" as const,
      apiKeyAuthSource: "env",
      apiKeyId: "api_key_1",
      consumerId: "consumer_1",
    };

    const summary = await repository.getSummary(filters);

    expect(summary).toEqual({
      totalRejectedRequests: 4,
      byReason: [
        {
          rejectionReason: "API_KEY_MISSING",
          count: 2,
        },
        {
          rejectionReason: "RATE_LIMIT_EXCEEDED",
          count: 2,
        },
      ],
      byStatusCode: [
        {
          statusCode: 401,
          count: 2,
        },
        {
          statusCode: 429,
          count: 2,
        },
      ],
      lastRejectedAt: new Date("2026-07-04T10:00:00.000Z"),
      filters,
    });

    const expectedWhere = {
      occurredAt: {
        gte: from,
        lte: to,
      },
      rejectionReason: "RATE_LIMIT_EXCEEDED",
      statusCode: 429,
      routePath: "/api/products",
      routeMethod: "GET",
      apiKeyAuthSource: "env",
      apiKeyId: "api_key_1",
      consumerId: "consumer_1",
    };

    expect(prisma.apiRejectedEvent.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });

    expect(prisma.apiRejectedEvent.groupBy).toHaveBeenCalledWith({
      by: ["rejectionReason"],
      where: expectedWhere,
      _count: {
        _all: true,
      },
      orderBy: {
        rejectionReason: "asc",
      },
    });

    expect(prisma.apiRejectedEvent.groupBy).toHaveBeenCalledWith({
      by: ["statusCode"],
      where: expectedWhere,
      _count: {
        _all: true,
      },
      orderBy: {
        statusCode: "asc",
      },
    });

    expect(prisma.apiRejectedEvent.findFirst).toHaveBeenCalledWith({
      where: expectedWhere,
      orderBy: {
        occurredAt: "desc",
      },
      select: {
        occurredAt: true,
      },
    });
  });

  it("should return rejected events summary without filters", async () => {
    const prisma = createMockPrisma();
    const repository = createPrismaApiRejectedEventsSummaryRepository(prisma);

    const summary = await repository.getSummary();

    expect(summary.filters).toEqual({});
    expect(prisma.apiRejectedEvent.count).toHaveBeenCalledWith({
      where: {},
    });
  });
});
