import { describe, expect, it } from 'vitest';
import { buildAnalyticsRetentionExecuteContractReview } from './analytics-retention-execute-contract-review.js';

describe('buildAnalyticsRetentionExecuteContractReview', () => {
  it('keeps retention execute blocked by default during contract review', () => {
    const review = buildAnalyticsRetentionExecuteContractReview();

    expect(review.summary).toEqual({
      status: 'retention-execute-contract-review-blocked',
      allowed: false,
      blockedReason: 'retention-execute-contract-review-only',
      reviewOnly: true,
      destructiveExecutionAllowed: false,
    });

    expect(review.safety).toEqual({
      deleteCandidatesWired: false,
      prismaDeleteRepositoryWiredToOperatorFlow: false,
      deletesRawEvents: false,
      affectsQuotaCounting: false,
      createsBackgroundJob: false,
      runsDestructiveExecution: false,
      readsEventsForDeletion: false,
      executesUnboundedDelete: false,
      runsRetentionExecution: false,
    });
  });

  it('marks required execute guardrails as missing when not provided', () => {
    const review = buildAnalyticsRetentionExecuteContractReview();

    expect(review.guardrails).toMatchObject({
      operatorConfirmationRequired: true,
      operatorConfirmationProvided: false,
      operatorConfirmationStatus: 'missing',
      hardDeleteLimitRequired: true,
      hardDeleteLimit: null,
      boundedHardDeleteLimit: false,
      hardDeleteLimitStatus: 'missing',
      candidateRecheckRequired: true,
      candidateRecheckPlanned: false,
      candidateRecheckStatus: 'missing',
      rollbackExpectationRequired: true,
      rollbackExpectationDocumented: false,
      rollbackExpectationStatus: 'missing',
      auditOutputRequired: true,
      auditOutputPlanned: false,
      auditOutputStatus: 'missing',
    });
  });

  it('can review ready guardrails without allowing destructive execution', () => {
    const review = buildAnalyticsRetentionExecuteContractReview({
      confirmationProvided: true,
      hardDeleteLimit: 500,
      candidateRecheckPlanned: true,
      rollbackExpectationDocumented: true,
      auditOutputPlanned: true,
    });

    expect(review.guardrails).toMatchObject({
      operatorConfirmationStatus: 'ready',
      hardDeleteLimit: 500,
      boundedHardDeleteLimit: true,
      hardDeleteLimitStatus: 'ready',
      candidateRecheckStatus: 'ready',
      rollbackExpectationStatus: 'ready',
      auditOutputStatus: 'ready',
    });

    expect(review.summary.allowed).toBe(false);
    expect(review.summary.destructiveExecutionAllowed).toBe(false);
    expect(review.safety.deleteCandidatesWired).toBe(false);
    expect(review.safety.prismaDeleteRepositoryWiredToOperatorFlow).toBe(false);
    expect(review.safety.deletesRawEvents).toBe(false);
    expect(review.safety.runsDestructiveExecution).toBe(false);
    expect(review.safety.runsRetentionExecution).toBe(false);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'treats invalid hard delete limit %s as unbounded and missing',
    (hardDeleteLimit) => {
      const review = buildAnalyticsRetentionExecuteContractReview({
        hardDeleteLimit,
      });

      expect(review.guardrails.hardDeleteLimit).toBeNull();
      expect(review.guardrails.boundedHardDeleteLimit).toBe(false);
      expect(review.guardrails.hardDeleteLimitStatus).toBe('missing');
      expect(review.safety.executesUnboundedDelete).toBe(false);
    },
  );

  it('documents operator guidance for future retention execute hardening', () => {
    const review = buildAnalyticsRetentionExecuteContractReview();

    expect(review.operatorGuidance).toEqual(
      expect.arrayContaining([
        'Do not wire deleteCandidates into operator-facing command, API, or background job.',
        'Do not wire the Prisma retention delete repository into destructive runtime execution.',
        'Require explicit confirmation, bounded hard delete limit, candidate recheck, rollback expectation, and audit output before any future execute path.',
        'Retention execute must not affect quota counting or analytics rollup behavior.',
      ]),
    );
  });
});