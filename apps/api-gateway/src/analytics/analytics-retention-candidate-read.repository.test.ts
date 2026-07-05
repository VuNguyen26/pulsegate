import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../generated/prisma/index.js";
import {
  createAnalyticsRetentionPlan,
  parseAnalyticsRetentionPolicy,
  type AnalyticsRetentionPlan,
} from "./analytics-retention-policy.js";
import { createPrismaAnalyticsRetentionCandidateReadRepository } from "./analytics-retention-candidate-read.repository.js";

function createMockPrisma(options: {
  readonly usageCandidateCount?: number;
  readonly rejectedCandidateCount?: number;
} = {}) {
  const usageCount = vi.fn().mockResolvedValue(options.usageCandidateCount ?? 0);
  const rejectedCount = vi
    .fn()
    .mockResolvedValue(options.rejectedCandidateCount ?? 0);

  return {
    prisma: {
      apiUsageEvent: {
        count: usageCount,
      },
      apiRejectedEvent: {
        count: rejectedCount,
      },
    } as unknown as PrismaClient,
    usageCount,
    rejectedCount,
  };
}

describe("createPrismaAnalyticsRetentionCandidateReadRepository", () => {
  it("should return empty candidate summaries when retention is disabled", async () => {
    const plan = createAnalyticsRetentionPlan(
      parseAnalyticsRetentionPolicy({
        enabled: false,
        source: "both",
        usageRetentionDays: 30,
        rejectedRetentionDays: 45,
      }),
      new Date("2026-07-05T00:00:00.000Z"),
    );

    const { prisma, usageCount, rejectedCount } = createMockPrisma();
    const repository =
      createPrismaAnalyticsRetentionCandidateReadRepository(prisma);

    await expect(repository.summarizeCandidates(plan)).resolves.toEqual({
      enabled: false,
      generatedAt: new Date("2026-07-05T00:00:00.000Z"),
      usage: null,
      rejected: null,
    });

    expect(usageCount).not.toHaveBeenCalled();
    expect(rejectedCount).not.toHaveBeenCalled();
  });

  it("should count usage and rejected events older than their retention cutoffs", async () => {
    const plan = createAnalyticsRetentionPlan(
      parseAnalyticsRetentionPolicy({
        enabled: true,
        source: "both",
        usageRetentionDays: 30,
        rejectedRetentionDays: 45,
      }),
      new Date("2026-07-05T00:00:00.000Z"),
    );

    const { prisma, usageCount, rejectedCount } = createMockPrisma({
      usageCandidateCount: 12,
      rejectedCandidateCount: 34,
    });

    const repository =
      createPrismaAnalyticsRetentionCandidateReadRepository(prisma);

    await expect(repository.summarizeCandidates(plan)).resolves.toEqual({
      enabled: true,
      generatedAt: new Date("2026-07-05T00:00:00.000Z"),
      usage: {
        source: "usage",
        cutoffExclusive: new Date("2026-06-05T00:00:00.000Z"),
        retentionDays: 30,
        candidateCount: 12,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: {
        source: "rejected",
        cutoffExclusive: new Date("2026-05-21T00:00:00.000Z"),
        retentionDays: 45,
        candidateCount: 34,
        dryRunOnly: true,
        deleteAllowed: false,
      },
    });

    expect(usageCount).toHaveBeenCalledWith({
      where: {
        occurredAt: {
          lt: new Date("2026-06-05T00:00:00.000Z"),
        },
      },
    });

    expect(rejectedCount).toHaveBeenCalledWith({
      where: {
        occurredAt: {
          lt: new Date("2026-05-21T00:00:00.000Z"),
        },
      },
    });
  });

  it("should only count usage events for usage-only plans", async () => {
    const plan = createAnalyticsRetentionPlan(
      parseAnalyticsRetentionPolicy({
        enabled: true,
        source: "usage",
        usageRetentionDays: 30,
      }),
      new Date("2026-07-05T00:00:00.000Z"),
    );

    const { prisma, usageCount, rejectedCount } = createMockPrisma({
      usageCandidateCount: 7,
    });

    const repository =
      createPrismaAnalyticsRetentionCandidateReadRepository(prisma);

    await expect(repository.summarizeCandidates(plan)).resolves.toMatchObject({
      enabled: true,
      usage: {
        source: "usage",
        candidateCount: 7,
      },
      rejected: null,
    });

    expect(usageCount).toHaveBeenCalledTimes(1);
    expect(rejectedCount).not.toHaveBeenCalled();
  });

  it("should only count rejected events for rejected-only plans", async () => {
    const plan = createAnalyticsRetentionPlan(
      parseAnalyticsRetentionPolicy({
        enabled: true,
        source: "rejected",
        rejectedRetentionDays: 60,
      }),
      new Date("2026-07-05T00:00:00.000Z"),
    );

    const { prisma, usageCount, rejectedCount } = createMockPrisma({
      rejectedCandidateCount: 9,
    });

    const repository =
      createPrismaAnalyticsRetentionCandidateReadRepository(prisma);

    await expect(repository.summarizeCandidates(plan)).resolves.toMatchObject({
      enabled: true,
      usage: null,
      rejected: {
        source: "rejected",
        candidateCount: 9,
      },
    });

    expect(usageCount).not.toHaveBeenCalled();
    expect(rejectedCount).toHaveBeenCalledTimes(1);
  });

  it("should reject non dry-run plans defensively", async () => {
    const plan = {
      ...createAnalyticsRetentionPlan(
        parseAnalyticsRetentionPolicy({
          enabled: true,
        }),
        new Date("2026-07-05T00:00:00.000Z"),
      ),
      mode: "execute",
    } as unknown as AnalyticsRetentionPlan;

    const { prisma, usageCount, rejectedCount } = createMockPrisma();
    const repository =
      createPrismaAnalyticsRetentionCandidateReadRepository(prisma);

    await expect(repository.summarizeCandidates(plan)).rejects.toThrow(
      /dry-run/,
    );

    expect(usageCount).not.toHaveBeenCalled();
    expect(rejectedCount).not.toHaveBeenCalled();
  });
});
