import { describe, expect, it, vi } from "vitest";
import type {
  AnalyticsRetentionCandidateReadRepository,
  AnalyticsRetentionCandidateReadResult,
} from "./analytics-retention-candidate-read.repository.js";
import { createAnalyticsRetentionDryRunService } from "./analytics-retention-dry-run-service.js";

function createMockCandidateReadRepository(
  result: AnalyticsRetentionCandidateReadResult,
) {
  const summarizeCandidates = vi.fn().mockResolvedValue(result);

  return {
    repository: {
      summarizeCandidates,
    } satisfies AnalyticsRetentionCandidateReadRepository,
    summarizeCandidates,
  };
}

describe("createAnalyticsRetentionDryRunService", () => {
  it("should parse policy, create plan, and summarize retention candidates", async () => {
    const candidateResult = {
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
    } satisfies AnalyticsRetentionCandidateReadResult;

    const { repository, summarizeCandidates } =
      createMockCandidateReadRepository(candidateResult);

    const service = createAnalyticsRetentionDryRunService(repository);

    await expect(
      service.previewRetention({
        policyInput: {
          enabled: true,
          source: "both",
          usageRetentionDays: 30,
          rejectedRetentionDays: 45,
        },
        now: new Date("2026-07-05T00:00:00.000Z"),
      }),
    ).resolves.toEqual({
      policy: {
        enabled: true,
        mode: "dry-run",
        source: "both",
        usage: {
          source: "usage",
          retentionDays: 30,
          minRetentionDays: 7,
        },
        rejected: {
          source: "rejected",
          retentionDays: 45,
          minRetentionDays: 7,
        },
      },
      plan: {
        enabled: true,
        mode: "dry-run",
        source: "both",
        generatedAt: new Date("2026-07-05T00:00:00.000Z"),
        usage: {
          source: "usage",
          retentionDays: 30,
          cutoffExclusive: new Date("2026-06-05T00:00:00.000Z"),
          dryRunOnly: true,
          deleteAllowed: false,
        },
        rejected: {
          source: "rejected",
          retentionDays: 45,
          cutoffExclusive: new Date("2026-05-21T00:00:00.000Z"),
          dryRunOnly: true,
          deleteAllowed: false,
        },
      },
      candidates: candidateResult,
      dryRunOnly: true,
      deleteAllowed: false,
    });

    expect(summarizeCandidates).toHaveBeenCalledWith({
      enabled: true,
      mode: "dry-run",
      source: "both",
      generatedAt: new Date("2026-07-05T00:00:00.000Z"),
      usage: {
        source: "usage",
        retentionDays: 30,
        cutoffExclusive: new Date("2026-06-05T00:00:00.000Z"),
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: {
        source: "rejected",
        retentionDays: 45,
        cutoffExclusive: new Date("2026-05-21T00:00:00.000Z"),
        dryRunOnly: true,
        deleteAllowed: false,
      },
    });
  });

  it("should support disabled retention previews without delete permission", async () => {
    const candidateResult = {
      enabled: false,
      generatedAt: new Date("2026-07-05T00:00:00.000Z"),
      usage: null,
      rejected: null,
    } satisfies AnalyticsRetentionCandidateReadResult;

    const { repository, summarizeCandidates } =
      createMockCandidateReadRepository(candidateResult);

    const service = createAnalyticsRetentionDryRunService(repository);

    const result = await service.previewRetention({
      policyInput: {
        enabled: false,
      },
      now: new Date("2026-07-05T00:00:00.000Z"),
    });

    expect(result.deleteAllowed).toBe(false);
    expect(result.dryRunOnly).toBe(true);
    expect(result.plan.enabled).toBe(false);
    expect(result.candidates).toEqual(candidateResult);
    expect(summarizeCandidates).toHaveBeenCalledTimes(1);
  });

  it("should reject invalid policy before reading candidates", async () => {
    const candidateResult = {
      enabled: false,
      generatedAt: new Date("2026-07-05T00:00:00.000Z"),
      usage: null,
      rejected: null,
    } satisfies AnalyticsRetentionCandidateReadResult;

    const { repository, summarizeCandidates } =
      createMockCandidateReadRepository(candidateResult);

    const service = createAnalyticsRetentionDryRunService(repository);

    await expect(
      service.previewRetention({
        policyInput: {
          enabled: true,
          source: "usage",
          rejectedRetentionDays: 30,
        },
        now: new Date("2026-07-05T00:00:00.000Z"),
      }),
    ).rejects.toThrow(/rejectedRetentionDays/);

    expect(summarizeCandidates).not.toHaveBeenCalled();
  });

  it("should reject invalid plan clock before reading candidates", async () => {
    const candidateResult = {
      enabled: false,
      generatedAt: new Date("2026-07-05T00:00:00.000Z"),
      usage: null,
      rejected: null,
    } satisfies AnalyticsRetentionCandidateReadResult;

    const { repository, summarizeCandidates } =
      createMockCandidateReadRepository(candidateResult);

    const service = createAnalyticsRetentionDryRunService(repository);

    await expect(
      service.previewRetention({
        policyInput: {
          enabled: true,
        },
        now: new Date("invalid"),
      }),
    ).rejects.toThrow(/valid Date/);

    expect(summarizeCandidates).not.toHaveBeenCalled();
  });
});
