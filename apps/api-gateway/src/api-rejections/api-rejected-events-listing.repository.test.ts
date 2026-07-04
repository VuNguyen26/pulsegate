import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../generated/prisma/index.js";
import { createPrismaApiRejectedEventsListingRepository } from "./api-rejected-events-listing.repository.js";
import type {
  ApiRejectedEventListItemReadModel,
  ApiRejectedEventsListingQuery,
} from "./api-rejected-events-listing.types.js";

function createMockPrisma(options: {
  total: number;
  items: ApiRejectedEventListItemReadModel[];
}) {
  const count = vi.fn().mockResolvedValue(options.total);
  const findMany = vi.fn().mockResolvedValue(options.items);

  return {
    prisma: {
      apiRejectedEvent: {
        count,
        findMany,
      },
    } as unknown as PrismaClient,
    count,
    findMany,
  };
}

describe("createPrismaApiRejectedEventsListingRepository", () => {
  it("should list rejected events with filters and pagination", async () => {
    const from = new Date("2026-07-04T00:00:00.000Z");
    const to = new Date("2026-07-05T00:00:00.000Z");
    const occurredAt = new Date("2026-07-04T11:00:00.000Z");

    const items: ApiRejectedEventListItemReadModel[] = [
      {
        id: "rejected_event_1",
        requestId: "request_1",
        routePath: "/api/products",
        routeMethod: "GET",
        statusCode: 429,
        rejectionReason: "QUOTA_EXCEEDED",
        apiKeyAuthSource: "database",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
        metadata: {
          quotaLimit: 1,
          quotaWindow: "DAILY",
        },
        occurredAt,
      },
    ];

    const query: ApiRejectedEventsListingQuery = {
      limit: 10,
      offset: 20,
      filters: {
        from,
        to,
        rejectionReason: "QUOTA_EXCEEDED",
        statusCode: 429,
        routePath: "/api/products",
        routeMethod: "GET",
        apiKeyAuthSource: "database",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    };

    const { prisma, count, findMany } = createMockPrisma({
      total: 31,
      items,
    });

    const repository = createPrismaApiRejectedEventsListingRepository(prisma);

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
      rejectionReason: "QUOTA_EXCEEDED",
      statusCode: 429,
      routePath: "/api/products",
      routeMethod: "GET",
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
        rejectionReason: true,
        apiKeyAuthSource: true,
        apiKeyId: true,
        consumerId: true,
        metadata: true,
        occurredAt: true,
      },
    });
  });

  it("should list rejected events without filters and detect the last page", async () => {
    const items: ApiRejectedEventListItemReadModel[] = [
      {
        id: "rejected_event_1",
        requestId: "request_1",
        routePath: null,
        routeMethod: null,
        statusCode: 401,
        rejectionReason: "API_KEY_MISSING",
        apiKeyAuthSource: null,
        apiKeyId: null,
        consumerId: null,
        metadata: null,
        occurredAt: new Date("2026-07-04T10:00:00.000Z"),
      },
    ];

    const query: ApiRejectedEventsListingQuery = {
      limit: 20,
      offset: 0,
      filters: {},
    };

    const { prisma, count, findMany } = createMockPrisma({
      total: 1,
      items,
    });

    const repository = createPrismaApiRejectedEventsListingRepository(prisma);

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
