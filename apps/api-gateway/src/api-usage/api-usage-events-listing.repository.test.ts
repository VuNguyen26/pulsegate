import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../generated/prisma/index.js";
import { createPrismaApiUsageEventsListingRepository } from "./api-usage-events-listing.repository.js";
import type {
  ApiUsageEventListItemReadModel,
  ApiUsageEventsListingQuery,
} from "./api-usage-events-listing.types.js";

function createMockPrisma(options: {
  total: number;
  items: ApiUsageEventListItemReadModel[];
}) {
  const count = vi.fn().mockResolvedValue(options.total);
  const findMany = vi.fn().mockResolvedValue(options.items);

  return {
    prisma: {
      apiUsageEvent: {
        count,
        findMany,
      },
    } as unknown as PrismaClient,
    count,
    findMany,
  };
}

describe("createPrismaApiUsageEventsListingRepository", () => {
  it("should list usage events with filters and pagination", async () => {
    const from = new Date("2026-07-04T00:00:00.000Z");
    const to = new Date("2026-07-05T00:00:00.000Z");
    const occurredAt = new Date("2026-07-04T11:00:00.000Z");

    const items: ApiUsageEventListItemReadModel[] = [
      {
        id: "usage_event_1",
        requestId: "request_1",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        durationMs: 42,
        cacheStatus: "HIT",
        apiKeyAuthSource: "database",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
        occurredAt,
      },
    ];

    const query: ApiUsageEventsListingQuery = {
      limit: 10,
      offset: 20,
      filters: {
        from,
        to,
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "HIT",
        apiKeyAuthSource: "database",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    };

    const { prisma, count, findMany } = createMockPrisma({
      total: 31,
      items,
    });

    const repository = createPrismaApiUsageEventsListingRepository(prisma);

    await expect(repository.listEvents(query)).resolves.toEqual({
      items,
      pagination: {
        limit: 10,
        offset: 20,
        total: 31,
        hasNextPage: true,
      },
      filters: query.filters,
    });

    const expectedWhere = {
      occurredAt: {
        gte: from,
        lte: to,
      },
      routePath: "/api/products",
      routeMethod: "GET",
      statusCode: 200,
      cacheStatus: "HIT",
      apiKeyAuthSource: "database",
      apiKeyId: "api_key_1",
      consumerId: "consumer_1",
    };

    expect(count).toHaveBeenCalledWith({
      where: expectedWhere,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: expectedWhere,
      orderBy: [
        {
          occurredAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      skip: 20,
      take: 10,
      select: {
        id: true,
        requestId: true,
        routePath: true,
        routeMethod: true,
        statusCode: true,
        durationMs: true,
        cacheStatus: true,
        apiKeyAuthSource: true,
        apiKeyId: true,
        consumerId: true,
        occurredAt: true,
      },
    });
  });

  it("should list usage events without filters and detect the last page", async () => {
    const items: ApiUsageEventListItemReadModel[] = [
      {
        id: "usage_event_1",
        requestId: "request_1",
        routePath: "/api/product-service/health",
        routeMethod: "GET",
        statusCode: 200,
        durationMs: 12,
        cacheStatus: null,
        apiKeyAuthSource: null,
        apiKeyId: null,
        consumerId: null,
        occurredAt: new Date("2026-07-04T10:00:00.000Z"),
      },
    ];

    const query: ApiUsageEventsListingQuery = {
      limit: 20,
      offset: 0,
      filters: {},
    };

    const { prisma, count, findMany } = createMockPrisma({
      total: 1,
      items,
    });

    const repository = createPrismaApiUsageEventsListingRepository(prisma);

    await expect(repository.listEvents(query)).resolves.toEqual({
      items,
      pagination: {
        limit: 20,
        offset: 0,
        total: 1,
        hasNextPage: false,
      },
      filters: {},
    });

    expect(count).toHaveBeenCalledWith({
      where: {},
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 20,
      }),
    );
  });
});
