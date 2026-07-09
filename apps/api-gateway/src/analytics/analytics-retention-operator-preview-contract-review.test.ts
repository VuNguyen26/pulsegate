import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
} from './analytics-retention-execution-command-args.js';
import { buildAnalyticsRetentionExecutionServiceCandidateReadPreview } from './analytics-retention-execution-service-candidate-read-preview.js';
import { buildAnalyticsRetentionOperatorPreviewOutput } from './analytics-retention-operator-preview-output.js';
import type {
  AnalyticsRetentionCandidateReadRepository,
} from './analytics-retention-candidate-read.repository.js';

function createCandidateReadRepository(): AnalyticsRetentionCandidateReadRepository {
  return {
    async summarizeCandidates() {
      return {
        enabled: true,
        generatedAt: new Date('2026-07-09T00:00:00.000Z'),
        usage: {
          source: 'usage',
          retentionDays: 90,
          cutoffExclusive: new Date('2026-04-10T00:00:00.000Z'),
          candidateCount: 12,
          dryRunOnly: true,
          deleteAllowed: false,
        },
        rejected: {
          source: 'rejected',
          retentionDays: 120,
          cutoffExclusive: new Date('2026-03-11T00:00:00.000Z'),
          candidateCount: 7,
          dryRunOnly: true,
          deleteAllowed: false,
        },
      };
    },
  };
}

describe('buildAnalyticsRetentionOperatorPreviewOutput execute contract review', () => {
  it('exposes blocked execute contract review while keeping operator preview non-destructive', async () => {
    const preview =
      await buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
        policy: {
          enabled: true,
          source: 'both',
          usageRetentionDays: 90,
          rejectedRetentionDays: 120,
        },
        executionArgs: [
          '--mode',
          'execute',
          '--confirm-execute',
          ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
          '--hard-delete-limit',
          '100',
        ],
        now: new Date('2026-07-09T00:00:00.000Z'),
        candidateReadRepository: createCandidateReadRepository(),
      });

    const output = buildAnalyticsRetentionOperatorPreviewOutput(preview);

    expect(output.executeContractReview.summary).toEqual({
      status: 'retention-execute-contract-review-blocked',
      allowed: false,
      blockedReason: 'retention-execute-contract-review-only',
      reviewOnly: true,
      destructiveExecutionAllowed: false,
    });
    expect(output.executeContractReview.guardrails).toMatchObject({
      operatorConfirmationProvided: true,
      operatorConfirmationStatus: 'ready',
      hardDeleteLimit: 100,
      boundedHardDeleteLimit: true,
      hardDeleteLimitStatus: 'ready',
      candidateRecheckStatus: 'missing',
      rollbackExpectationStatus: 'missing',
      auditOutputStatus: 'missing',
    });
    expect(output.executeContractReview.safety).toMatchObject({
      deleteCandidatesWired: false,
      prismaDeleteRepositoryWiredToOperatorFlow: false,
      deletesRawEvents: false,
      affectsQuotaCounting: false,
      createsBackgroundJob: false,
      runsDestructiveExecution: false,
      runsRetentionExecution: false,
    });
    expect(output.safety).toEqual({
      commandDeletesEvents: false,
      candidateReadOnly: true,
      deleteRepositoryExecuted: false,
      deleteAllowed: false,
      destructiveExecutionPerformed: false,
      deleteImplementationAvailable: false,
      servicePreviewDeleteAllowed: false,
    });
    expect(output.deleteAllowed).toBe(false);
    expect(output.destructiveExecutionPerformed).toBe(false);
  });

  it('keeps dry-run operator preview review-only with missing execute guardrails', async () => {
    const preview =
      await buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
        policy: {
          enabled: true,
          source: 'usage',
          usageRetentionDays: 90,
        },
        now: new Date('2026-07-09T00:00:00.000Z'),
        candidateReadRepository: createCandidateReadRepository(),
      });

    const output = buildAnalyticsRetentionOperatorPreviewOutput(preview);

    expect(output.executeContractReview.summary.allowed).toBe(false);
    expect(output.executeContractReview.guardrails).toMatchObject({
      operatorConfirmationStatus: 'missing',
      hardDeleteLimit: null,
      boundedHardDeleteLimit: false,
      hardDeleteLimitStatus: 'missing',
      candidateRecheckStatus: 'missing',
      rollbackExpectationStatus: 'missing',
      auditOutputStatus: 'missing',
    });
    expect(output.executeContractReview.safety.deletesRawEvents).toBe(false);
    expect(output.executeContractReview.safety.affectsQuotaCounting).toBe(false);
    expect(output.executeContractReview.safety.runsDestructiveExecution).toBe(
      false,
    );
  });
});