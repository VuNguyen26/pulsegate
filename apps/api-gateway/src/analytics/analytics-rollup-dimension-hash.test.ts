import { describe, expect, it } from "vitest";
import {
  ApiRejectionReason,
  GatewayRouteMethod,
} from "../generated/prisma/index.js";
import type { AnalyticsRejectedRollupAggregate } from "./analytics-rejected-rollup-aggregate.js";
import {
  buildAnalyticsRejectedRollupDimensionHash,
  buildAnalyticsUsageRollupDimensionHash,
} from "./analytics-rollup-dimension-hash.js";
import type { AnalyticsUsageRollupAggregate } from "./analytics-usage-rollup-aggregate.js";

const usageAggregate = {
  granularity: "hour",
  bucketStart: new Date("2026-07-05T14:00:00.000Z"),
  bucketEnd: new Date("2026-07-05T15:00:00.000Z"),
  consumerId: "consumer-1",
  apiKeyId: "api-key-1",
  routePath: "/api/products",
  routeMethod: GatewayRouteMethod.GET,
  statusClass: "2xx",
  cacheStatus: "HIT",
  apiKeyAuthSource: "DATABASE",
  totalRequests: 10,
  successfulRequests: 10,
  errorRequests: 0,
  totalDurationMs: 1200,
  averageDurationMs: 120,
  cacheHits: 10,
  cacheMisses: 0,
  cacheBypasses: 0,
  lastRequestAt: new Date("2026-07-05T14:59:00.000Z"),
} satisfies AnalyticsUsageRollupAggregate;

const rejectedAggregate = {
  granularity: "hour",
  bucketStart: new Date("2026-07-05T14:00:00.000Z"),
  bucketEnd: new Date("2026-07-05T15:00:00.000Z"),
  consumerId: "consumer-1",
  apiKeyId: "api-key-1",
  routePath: "/api/products",
  routeMethod: GatewayRouteMethod.GET,
  rejectionReason: ApiRejectionReason.API_KEY_INVALID,
  statusCode: 401,
  apiKeyAuthSource: "DATABASE",
  totalRejectedRequests: 3,
  lastRejectedAt: new Date("2026-07-05T14:30:00.000Z"),
} satisfies AnalyticsRejectedRollupAggregate;

describe("analytics rollup dimension hash", () => {
  it("should build a stable SHA-256 hash for usage rollup dimensions", () => {
    const firstHash = buildAnalyticsUsageRollupDimensionHash(usageAggregate);
    const secondHash = buildAnalyticsUsageRollupDimensionHash({
      ...usageAggregate,
    });

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should ignore usage rollup metrics when building the hash", () => {
    const baseHash = buildAnalyticsUsageRollupDimensionHash(usageAggregate);
    const metricsChangedAggregate = {
      ...usageAggregate,
      totalRequests: 999,
      successfulRequests: 998,
      errorRequests: 1,
      totalDurationMs: 99999,
      averageDurationMs: 100,
      cacheHits: 998,
      lastRequestAt: new Date("2026-07-05T14:59:59.000Z"),
    } satisfies AnalyticsUsageRollupAggregate;

    const metricsChangedHash = buildAnalyticsUsageRollupDimensionHash(
      metricsChangedAggregate,
    );

    expect(metricsChangedHash).toBe(baseHash);
  });

  it("should change usage rollup hash when a dimension changes", () => {
    const baseHash = buildAnalyticsUsageRollupDimensionHash(usageAggregate);
    const changedHash = buildAnalyticsUsageRollupDimensionHash({
      ...usageAggregate,
      cacheStatus: "MISS",
    });

    expect(changedHash).not.toBe(baseHash);
  });

  it("should distinguish usage rollup null dimensions from empty strings", () => {
    const nullHash = buildAnalyticsUsageRollupDimensionHash({
      ...usageAggregate,
      apiKeyAuthSource: null,
    });
    const emptyStringHash = buildAnalyticsUsageRollupDimensionHash({
      ...usageAggregate,
      apiKeyAuthSource: "",
    });

    expect(emptyStringHash).not.toBe(nullHash);
  });

  it("should build a stable SHA-256 hash for rejected rollup dimensions", () => {
    const firstHash = buildAnalyticsRejectedRollupDimensionHash(rejectedAggregate);
    const secondHash = buildAnalyticsRejectedRollupDimensionHash({
      ...rejectedAggregate,
    });

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should ignore rejected rollup metrics when building the hash", () => {
    const baseHash = buildAnalyticsRejectedRollupDimensionHash(rejectedAggregate);
    const metricsChangedAggregate = {
      ...rejectedAggregate,
      totalRejectedRequests: 999,
      lastRejectedAt: new Date("2026-07-05T14:59:59.000Z"),
    } satisfies AnalyticsRejectedRollupAggregate;

    const metricsChangedHash = buildAnalyticsRejectedRollupDimensionHash(
      metricsChangedAggregate,
    );

    expect(metricsChangedHash).toBe(baseHash);
  });

  it("should change rejected rollup hash when a dimension changes", () => {
    const baseHash = buildAnalyticsRejectedRollupDimensionHash(rejectedAggregate);
    const changedHash = buildAnalyticsRejectedRollupDimensionHash({
      ...rejectedAggregate,
      rejectionReason: ApiRejectionReason.RATE_LIMIT_EXCEEDED,
    });

    expect(changedHash).not.toBe(baseHash);
  });

  it("should reject invalid bucketStart dates", () => {
    expect(() =>
      buildAnalyticsUsageRollupDimensionHash({
        ...usageAggregate,
        bucketStart: new Date("invalid"),
      }),
    ).toThrow(RangeError);

    expect(() =>
      buildAnalyticsRejectedRollupDimensionHash({
        ...rejectedAggregate,
        bucketStart: new Date("invalid"),
      }),
    ).toThrow(RangeError);
  });
});
