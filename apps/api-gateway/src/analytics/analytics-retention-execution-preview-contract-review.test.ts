import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE,
} from './analytics-retention-execution-command-args.js';
import { buildAnalyticsRetentionExecutionPreview } from './analytics-retention-execution-preview.js';

describe('buildAnalyticsRetentionExecutionPreview execute contract review', () => {
  it('exposes blocked retention execute contract review on dry-run preview output', () => {
    const preview = buildAnalyticsRetentionExecutionPreview({
      policy: {
        enabled: true,
        source: 'usage',
        usageRetentionDays: 90,
      },
      now: new Date('2026-07-09T00:00:00.000Z'),
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
    expect(preview.deleteImplementationAvailable).toBe(false);
  });

  it('reviews execute guardrails without allowing destructive execution', () => {
    const preview = buildAnalyticsRetentionExecutionPreview({
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
    });

    expect(preview.executionArgs).toEqual({
      mode: 'execute',
      confirmExecute: true,
      hardDeleteLimit: 100,
    });
    expect(preview.executeContractReview.guardrails).toMatchObject({
      operatorConfirmationProvided: true,
      operatorConfirmationStatus: 'ready',
      hardDeleteLimit: 100,
      boundedHardDeleteLimit: true,
      hardDeleteLimitStatus: 'ready',
      candidateRecheckPlanned: false,
      candidateRecheckStatus: 'missing',
      rollbackExpectationDocumented: false,
      rollbackExpectationStatus: 'missing',
      auditOutputPlanned: false,
      auditOutputStatus: 'missing',
    });
    expect(preview.executeContractReview.expectations).toMatchObject({
      candidateRecheckExpectation: {
        planned: false,
        status: 'missing',
        reviewOnly: true,
        destructiveExecutionAllowed: false,
      },
      rollbackExpectation: {
        documented: false,
        status: 'missing',
        reviewOnly: true,
        destructiveExecutionAllowed: false,
      },
      auditOutputExpectation: {
        planned: false,
        status: 'missing',
        reviewOnly: true,
        destructiveExecutionAllowed: false,
      },
    });
    expect(preview.executeContractReview.summary.allowed).toBe(false);
    expect(
      preview.executeContractReview.summary.destructiveExecutionAllowed,
    ).toBe(false);
    expect(preview.executeContractReview.safety.deleteCandidatesWired).toBe(
      false,
    );
    expect(
      preview.executeContractReview.safety
        .prismaDeleteRepositoryWiredToOperatorFlow,
    ).toBe(false);
    expect(preview.executeContractReview.safety.deletesRawEvents).toBe(false);
    expect(preview.executeContractReview.safety.affectsQuotaCounting).toBe(
      false,
    );
    expect(preview.deleteImplementationAvailable).toBe(false);
  });
});