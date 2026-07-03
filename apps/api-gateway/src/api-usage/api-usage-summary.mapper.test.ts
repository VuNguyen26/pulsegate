import { describe, expect, it } from "vitest";

import { mapApiUsageSummaryReadModelToResponse } from "./api-usage-summary.mapper.js";
import type { ApiUsageSummaryReadModel } from "./api-usage-summary.types.js";

describe("api usage summary mapper", () => {
  it("should map usage summary read model to response", () => {
    const lastRequestAt = new Date("2026-07-03T15:30:00.000Z");

    const summary: ApiUsageSummaryReadModel = {
      subjectType: "consumer",
      subjectId: "consumer_1",
      totalRequests: 10,
      successfulRequests: 8,
      errorRequests: 2,
      averageDurationMs: 42,
      cacheHits: 3,
      cacheMisses: 4,
      cacheBypasses: 3,
      lastRequestAt,
    };

    expect(mapApiUsageSummaryReadModelToResponse(summary)).toEqual({
      subjectType: "consumer",
      subjectId: "consumer_1",
      totalRequests: 10,
      successfulRequests: 8,
      errorRequests: 2,
      averageDurationMs: 42,
      cacheHits: 3,
      cacheMisses: 4,
      cacheBypasses: 3,
      lastRequestAt: "2026-07-03T15:30:00.000Z",
    });
  });

  it("should map null lastRequestAt to null", () => {
    expect(
      mapApiUsageSummaryReadModelToResponse({
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
      }),
    ).toMatchObject({
      lastRequestAt: null,
    });
  });
});
