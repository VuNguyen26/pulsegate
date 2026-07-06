import { describe, expect, it, vi } from 'vitest';

import type { PrismaClient } from '../generated/prisma/index.js';
import {
  createPrismaAnalyticsRetentionDeleteRepository,
  type AnalyticsRetentionDeleteRepositoryDeleteInput,
} from './analytics-retention-delete.repository.js';
import type { AnalyticsRetentionDeleteRepositorySafetyDecision } from './analytics-retention-delete-repository-safety.js';

function createAllowedSafetyDecision(
  overrides: Partial<AnalyticsRetentionDeleteRepositorySafetyDecision> = {},
): AnalyticsRetentionDeleteRepositorySafetyDecision {
  return {
    source: 'usage',
    cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
    requestedLimit: 10,
    candidateCountBeforeDelete: 10,
    deletedCount: 0,
    candidateRecheckRequired: true,
    deleteAllowed: true,
    blockedReasons: [],
    ...overrides,
  };
}

function createDeleteInput(
  overrides: Partial<AnalyticsRetentionDeleteRepositoryDeleteInput> = {},
): AnalyticsRetentionDeleteRepositoryDeleteInput {
  const safetyDecision =
    overrides.safetyDecision ?? createAllowedSafetyDecision();

  return {
    source: safetyDecision.source,
    cutoffExclusive: safetyDecision.cutoffExclusive,
    limit: safetyDecision.requestedLimit,
    safetyDecision,
    ...overrides,
  };
}

function createMockPrisma(options: {
  readonly usageCount?: number;
  readonly rejectedCount?: number;
  readonly usageFindManyResult?: readonly { readonly id: string }[];
  readonly rejectedFindManyResult?: readonly { readonly id: string }[];
  readonly usageDeletedCount?: number;
  readonly rejectedDeletedCount?: number;
} = {}) {
  const usageCount = vi.fn().mockResolvedValue(options.usageCount ?? 0);
  const rejectedCount = vi.fn().mockResolvedValue(options.rejectedCount ?? 0);

  const usageFindMany = vi
    .fn()
    .mockResolvedValue(options.usageFindManyResult ?? []);
  const rejectedFindMany = vi
    .fn()
    .mockResolvedValue(options.rejectedFindManyResult ?? []);

  const usageDeleteMany = vi
    .fn()
    .mockResolvedValue({ count: options.usageDeletedCount ?? 0 });
  const rejectedDeleteMany = vi
    .fn()
    .mockResolvedValue({ count: options.rejectedDeletedCount ?? 0 });

  return {
    prisma: {
      apiUsageEvent: {
        count: usageCount,
        findMany: usageFindMany,
        deleteMany: usageDeleteMany,
      },
      apiRejectedEvent: {
        count: rejectedCount,
        findMany: rejectedFindMany,
        deleteMany: rejectedDeleteMany,
      },
    } as unknown as PrismaClient,
    usageCount,
    rejectedCount,
    usageFindMany,
    rejectedFindMany,
    usageDeleteMany,
    rejectedDeleteMany,
  };
}

describe('createPrismaAnalyticsRetentionDeleteRepository', () => {
  it('should count usage candidates without touching rejected events', async () => {
    const cutoffExclusive = new Date('2026-01-01T00:00:00.000Z');
    const { prisma, usageCount, rejectedCount } = createMockPrisma({
      usageCount: 12,
    });
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.countCandidatesBeforeDelete({
        source: 'usage',
        cutoffExclusive,
      }),
    ).resolves.toBe(12);

    expect(usageCount).toHaveBeenCalledWith({
      where: {
        occurredAt: {
          lt: cutoffExclusive,
        },
      },
    });
    expect(rejectedCount).not.toHaveBeenCalled();
  });

  it('should count rejected candidates without touching usage events', async () => {
    const cutoffExclusive = new Date('2026-01-01T00:00:00.000Z');
    const { prisma, usageCount, rejectedCount } = createMockPrisma({
      rejectedCount: 7,
    });
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.countCandidatesBeforeDelete({
        source: 'rejected',
        cutoffExclusive,
      }),
    ).resolves.toBe(7);

    expect(rejectedCount).toHaveBeenCalledWith({
      where: {
        occurredAt: {
          lt: cutoffExclusive,
        },
      },
    });
    expect(usageCount).not.toHaveBeenCalled();
  });

  it('should return zero when counting with an invalid cutoff', async () => {
    const { prisma, usageCount, rejectedCount } = createMockPrisma();
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.countCandidatesBeforeDelete({
        source: 'usage',
        cutoffExclusive: new Date('invalid'),
      }),
    ).resolves.toBe(0);

    expect(usageCount).not.toHaveBeenCalled();
    expect(rejectedCount).not.toHaveBeenCalled();
  });

  it('should refuse to delete when the safety decision is blocked', async () => {
    const safetyDecision = createAllowedSafetyDecision({
      deleteAllowed: false,
      blockedReasons: ['DELETE_BATCH_PLAN_BLOCKED'],
    });
    const { prisma, usageFindMany, usageDeleteMany } = createMockPrisma({
      usageFindManyResult: [{ id: 'usage-1' }],
      usageDeletedCount: 1,
    });
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.deleteCandidates(createDeleteInput({ safetyDecision })),
    ).resolves.toBe(0);

    expect(usageFindMany).not.toHaveBeenCalled();
    expect(usageDeleteMany).not.toHaveBeenCalled();
  });

  it('should refuse to delete when source or limit does not match the safety decision', async () => {
    const safetyDecision = createAllowedSafetyDecision({
      source: 'usage',
      requestedLimit: 10,
    });
    const { prisma, usageFindMany, rejectedFindMany } = createMockPrisma();
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.deleteCandidates(
        createDeleteInput({
          source: 'rejected',
          limit: 10,
          safetyDecision,
        }),
      ),
    ).resolves.toBe(0);

    await expect(
      repository.deleteCandidates(
        createDeleteInput({
          source: 'usage',
          limit: 11,
          safetyDecision,
        }),
      ),
    ).resolves.toBe(0);

    expect(usageFindMany).not.toHaveBeenCalled();
    expect(rejectedFindMany).not.toHaveBeenCalled();
  });

  it('should delete usage candidates by bounded selected IDs only', async () => {
    const cutoffExclusive = new Date('2026-01-01T00:00:00.000Z');
    const safetyDecision = createAllowedSafetyDecision({
      source: 'usage',
      cutoffExclusive,
      requestedLimit: 2,
      candidateCountBeforeDelete: 5,
    });
    const { prisma, usageFindMany, usageDeleteMany, rejectedFindMany } =
      createMockPrisma({
        usageFindManyResult: [{ id: 'usage-1' }, { id: 'usage-2' }],
        usageDeletedCount: 2,
      });
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.deleteCandidates(
        createDeleteInput({
          source: 'usage',
          cutoffExclusive,
          limit: 2,
          safetyDecision,
        }),
      ),
    ).resolves.toBe(2);

    expect(usageFindMany).toHaveBeenCalledWith({
      where: {
        occurredAt: {
          lt: cutoffExclusive,
        },
      },
      orderBy: [
        {
          occurredAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      select: {
        id: true,
      },
      take: 2,
    });
    expect(usageDeleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['usage-1', 'usage-2'],
        },
      },
    });
    expect(rejectedFindMany).not.toHaveBeenCalled();
  });

  it('should delete rejected candidates by bounded selected IDs only', async () => {
    const cutoffExclusive = new Date('2026-01-01T00:00:00.000Z');
    const safetyDecision = createAllowedSafetyDecision({
      source: 'rejected',
      cutoffExclusive,
      requestedLimit: 2,
      candidateCountBeforeDelete: 5,
    });
    const {
      prisma,
      usageFindMany,
      rejectedFindMany,
      rejectedDeleteMany,
    } = createMockPrisma({
      rejectedFindManyResult: [{ id: 'rejected-1' }, { id: 'rejected-2' }],
      rejectedDeletedCount: 2,
    });
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.deleteCandidates(
        createDeleteInput({
          source: 'rejected',
          cutoffExclusive,
          limit: 2,
          safetyDecision,
        }),
      ),
    ).resolves.toBe(2);

    expect(rejectedFindMany).toHaveBeenCalledWith({
      where: {
        occurredAt: {
          lt: cutoffExclusive,
        },
      },
      orderBy: [
        {
          occurredAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      select: {
        id: true,
      },
      take: 2,
    });
    expect(rejectedDeleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['rejected-1', 'rejected-2'],
        },
      },
    });
    expect(usageFindMany).not.toHaveBeenCalled();
  });

  it('should not call deleteMany when the bounded candidate selection is empty', async () => {
    const safetyDecision = createAllowedSafetyDecision();
    const { prisma, usageFindMany, usageDeleteMany } = createMockPrisma({
      usageFindManyResult: [],
      usageDeletedCount: 1,
    });
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.deleteCandidates(createDeleteInput({ safetyDecision })),
    ).resolves.toBe(0);

    expect(usageFindMany).toHaveBeenCalledTimes(1);
    expect(usageDeleteMany).not.toHaveBeenCalled();
  });

  it('should refuse to delete when cutoff does not match the safety decision', async () => {
    const safetyDecision = createAllowedSafetyDecision({
      cutoffExclusive: new Date('2026-01-01T00:00:00.000Z'),
    });
    const { prisma, usageFindMany, usageDeleteMany } = createMockPrisma({
      usageFindManyResult: [{ id: 'usage-1' }],
      usageDeletedCount: 1,
    });
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.deleteCandidates(
        createDeleteInput({
          cutoffExclusive: new Date('2026-01-02T00:00:00.000Z'),
          safetyDecision,
        }),
      ),
    ).resolves.toBe(0);

    expect(usageFindMany).not.toHaveBeenCalled();
    expect(usageDeleteMany).not.toHaveBeenCalled();
  });

  it('should refuse to delete when the safety decision has an invalid rechecked candidate count', async () => {
    const safetyDecision = createAllowedSafetyDecision({
      candidateCountBeforeDelete: 1.5,
    });
    const { prisma, usageFindMany, usageDeleteMany } = createMockPrisma({
      usageFindManyResult: [{ id: 'usage-1' }],
      usageDeletedCount: 1,
    });
    const repository = createPrismaAnalyticsRetentionDeleteRepository(prisma);

    await expect(
      repository.deleteCandidates(createDeleteInput({ safetyDecision })),
    ).resolves.toBe(0);

    expect(usageFindMany).not.toHaveBeenCalled();
    expect(usageDeleteMany).not.toHaveBeenCalled();
  });});
