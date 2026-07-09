import { describe, expect, it } from 'vitest';

import type { AnalyticsRetentionDeletePlanSource } from './analytics-retention-delete-batch-plan.js';
import {
  createAnalyticsRetentionDeleteRepositoryExecutor,
  type AnalyticsRetentionDeleteRepositoryPort,
} from './analytics-retention-delete.repository.js';
import {
  ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
} from './analytics-retention-execution-command-args.js';
import {
  buildAnalyticsRetentionExecutionServicePreview,
  type AnalyticsRetentionDeleteRepositoryPreparationExecutor,
} from './analytics-retention-execution-service.js';

const NOW = new Date('2026-07-09T00:00:00.000Z');

describe('analytics retention execution service execute contract review', () => {
  it('propagates blocked execute contract review on dry-run service preview', async () => {
    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      now: NOW,
      usageCandidateCount: 12,
    });

    expect(preview.executeContractReview.summary).toEqual({
      status: 'retention-execute-contract-review-blocked',
      allowed: false,
      blockedReason: 'retention-execute-contract-review-only',
      reviewOnly: true,
      destructiveExecutionAllowed: false,
    });
    expect(preview.executeContractReview.guardrails).toMatchObject({
      operatorConfirmationStatus: 'missing',
      hardDeleteLimit: null,
      boundedHardDeleteLimit: false,
      hardDeleteLimitStatus: 'missing',
      candidateRecheckPlanned: false,
      candidateRecheckStatus: 'missing',
      rollbackExpectationStatus: 'missing',
      auditOutputStatus: 'missing',
    });
    expect(preview.executeContractReview.expectations).toMatchObject({
      candidateRecheckExpectation: {
        planned: false,
        status: 'missing',
        reviewOnly: true,
        destructiveExecutionAllowed: false,
        missingReason: 'candidate-recheck-not-planned',
      },
      rollbackExpectation: {
        documented: false,
        status: 'missing',
        reviewOnly: true,
        destructiveExecutionAllowed: false,
        missingReason: 'rollback-expectation-not-documented',
      },
      auditOutputExpectation: {
        planned: false,
        status: 'missing',
        reviewOnly: true,
        destructiveExecutionAllowed: false,
        missingReason: 'audit-output-not-planned',
      },
    });
    expect(preview.executeContractReview.safety).toMatchObject({
      deleteCandidatesWired: false,
      prismaDeleteRepositoryWiredToOperatorFlow: false,
      deletesRawEvents: false,
      affectsQuotaCounting: false,
      createsBackgroundJob: false,
      runsDestructiveExecution: false,
      runsRetentionExecution: false,
    });
    expect(preview.executionResults).toEqual([]);
    expect(preview.destructiveExecutionPerformed).toBe(false);
  });

  it('propagates ready review guardrails without executing deleteCandidates', async () => {
    const fakeRepository = createFakeDeleteRepository({
      usage: 12,
    });

    const preview = await buildAnalyticsRetentionExecutionServicePreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      executionArgs: [
        '--mode',
        'execute',
        '--confirm-execute',
        ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
        '--hard-delete-limit',
        '12',
      ],
      now: NOW,
      usageCandidateCount: 12,
      deleteRepositoryExecutor: fakeRepository.executor,
    });

    expect(preview.executeContractReview.guardrails).toMatchObject({
      operatorConfirmationProvided: true,
      operatorConfirmationStatus: 'ready',
      hardDeleteLimit: 12,
      boundedHardDeleteLimit: true,
      hardDeleteLimitStatus: 'ready',
      candidateRecheckPlanned: true,
      candidateRecheckStatus: 'ready',
      rollbackExpectationStatus: 'missing',
      auditOutputStatus: 'missing',
    });
    expect(preview.executeContractReview.expectations).toMatchObject({
      candidateRecheckExpectation: {
        planned: true,
        status: 'ready',
        reviewOnly: true,
        destructiveExecutionAllowed: false,
        readyEvidence: 'candidate-recheck-preview-planned',
        missingReason: null,
      },
      rollbackExpectation: {
        documented: false,
        status: 'missing',
        reviewOnly: true,
        destructiveExecutionAllowed: false,
        missingReason: 'rollback-expectation-not-documented',
      },
      auditOutputExpectation: {
        planned: false,
        status: 'missing',
        reviewOnly: true,
        destructiveExecutionAllowed: false,
        missingReason: 'audit-output-not-planned',
      },
    });
    expect(preview.executeContractReview.summary.allowed).toBe(false);
    expect(preview.executeContractReview.summary.destructiveExecutionAllowed).toBe(
      false,
    );
    expect(preview.executeContractReview.safety.deleteCandidatesWired).toBe(
      false,
    );
    expect(preview.executeContractReview.safety.deletesRawEvents).toBe(false);
    expect(preview.executeContractReview.safety.affectsQuotaCounting).toBe(false);
    expect(preview.preparedOperations).toHaveLength(1);
    expect(preview.executionResults).toEqual([]);
    expect(preview.destructiveExecutionPerformed).toBe(false);
    expect(fakeRepository.getDeleteCallCount()).toBe(0);
  });
});

function createFakeDeleteRepository(
  recheckedCounts: Partial<Record<AnalyticsRetentionDeletePlanSource, number>>,
): {
  readonly executor: AnalyticsRetentionDeleteRepositoryPreparationExecutor;
  readonly getDeleteCallCount: () => number;
} {
  let deleteCallCount = 0;

  const repository: AnalyticsRetentionDeleteRepositoryPort = {
    async countCandidatesBeforeDelete(input) {
      return recheckedCounts[input.source] ?? 0;
    },
    async deleteCandidates() {
      deleteCallCount += 1;
      return 0;
    },
  };

  return {
    executor: createAnalyticsRetentionDeleteRepositoryExecutor(repository),
    getDeleteCallCount: () => deleteCallCount,
  };
}