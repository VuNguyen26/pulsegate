export type AnalyticsRetentionExecuteContractReviewStatus =
  | 'retention-execute-contract-review-blocked';

export type AnalyticsRetentionExecuteContractReviewBlockedReason =
  | 'retention-execute-contract-review-only';

export type AnalyticsRetentionExecuteGuardrailStatus = 'ready' | 'missing';

export interface AnalyticsRetentionExecuteContractReviewInput {
  confirmationProvided?: boolean;
  hardDeleteLimit?: number | null;
  candidateRecheckPlanned?: boolean;
  rollbackExpectationDocumented?: boolean;
  auditOutputPlanned?: boolean;
}

export interface AnalyticsRetentionExecuteContractReviewSummary {
  status: AnalyticsRetentionExecuteContractReviewStatus;
  allowed: false;
  blockedReason: AnalyticsRetentionExecuteContractReviewBlockedReason;
  reviewOnly: true;
  destructiveExecutionAllowed: false;
}

export interface AnalyticsRetentionExecuteContractReviewGuardrails {
  operatorConfirmationRequired: true;
  operatorConfirmationProvided: boolean;
  operatorConfirmationStatus: AnalyticsRetentionExecuteGuardrailStatus;
  hardDeleteLimitRequired: true;
  hardDeleteLimit: number | null;
  boundedHardDeleteLimit: boolean;
  hardDeleteLimitStatus: AnalyticsRetentionExecuteGuardrailStatus;
  candidateRecheckRequired: true;
  candidateRecheckPlanned: boolean;
  candidateRecheckStatus: AnalyticsRetentionExecuteGuardrailStatus;
  rollbackExpectationRequired: true;
  rollbackExpectationDocumented: boolean;
  rollbackExpectationStatus: AnalyticsRetentionExecuteGuardrailStatus;
  auditOutputRequired: true;
  auditOutputPlanned: boolean;
  auditOutputStatus: AnalyticsRetentionExecuteGuardrailStatus;
}

export interface AnalyticsRetentionExecuteContractReviewSafety {
  deleteCandidatesWired: false;
  prismaDeleteRepositoryWiredToOperatorFlow: false;
  deletesRawEvents: false;
  affectsQuotaCounting: false;
  createsBackgroundJob: false;
  runsDestructiveExecution: false;
  readsEventsForDeletion: false;
  executesUnboundedDelete: false;
  runsRetentionExecution: false;
}

export interface AnalyticsRetentionExecuteContractReview {
  summary: AnalyticsRetentionExecuteContractReviewSummary;
  guardrails: AnalyticsRetentionExecuteContractReviewGuardrails;
  safety: AnalyticsRetentionExecuteContractReviewSafety;
  operatorGuidance: string[];
}

export function buildAnalyticsRetentionExecuteContractReview(
  input: AnalyticsRetentionExecuteContractReviewInput = {},
): AnalyticsRetentionExecuteContractReview {
  const hardDeleteLimit = normalizeHardDeleteLimit(input.hardDeleteLimit);
  const operatorConfirmationProvided = input.confirmationProvided === true;
  const candidateRecheckPlanned = input.candidateRecheckPlanned === true;
  const rollbackExpectationDocumented =
    input.rollbackExpectationDocumented === true;
  const auditOutputPlanned = input.auditOutputPlanned === true;

  return {
    summary: {
      status: 'retention-execute-contract-review-blocked',
      allowed: false,
      blockedReason: 'retention-execute-contract-review-only',
      reviewOnly: true,
      destructiveExecutionAllowed: false,
    },
    guardrails: {
      operatorConfirmationRequired: true,
      operatorConfirmationProvided,
      operatorConfirmationStatus: operatorConfirmationProvided
        ? 'ready'
        : 'missing',
      hardDeleteLimitRequired: true,
      hardDeleteLimit,
      boundedHardDeleteLimit: hardDeleteLimit !== null,
      hardDeleteLimitStatus: hardDeleteLimit !== null ? 'ready' : 'missing',
      candidateRecheckRequired: true,
      candidateRecheckPlanned,
      candidateRecheckStatus: candidateRecheckPlanned ? 'ready' : 'missing',
      rollbackExpectationRequired: true,
      rollbackExpectationDocumented,
      rollbackExpectationStatus: rollbackExpectationDocumented
        ? 'ready'
        : 'missing',
      auditOutputRequired: true,
      auditOutputPlanned,
      auditOutputStatus: auditOutputPlanned ? 'ready' : 'missing',
    },
    safety: {
      deleteCandidatesWired: false,
      prismaDeleteRepositoryWiredToOperatorFlow: false,
      deletesRawEvents: false,
      affectsQuotaCounting: false,
      createsBackgroundJob: false,
      runsDestructiveExecution: false,
      readsEventsForDeletion: false,
      executesUnboundedDelete: false,
      runsRetentionExecution: false,
    },
    operatorGuidance: [
      'Sprint 56 reviews retention execute semantics only.',
      'Do not wire deleteCandidates into operator-facing command, API, or background job.',
      'Do not wire the Prisma retention delete repository into destructive runtime execution.',
      'Require explicit confirmation, bounded hard delete limit, candidate recheck, rollback expectation, and audit output before any future execute path.',
      'Retention execute must not affect quota counting or analytics rollup behavior.',
    ],
  };
}

function normalizeHardDeleteLimit(value: number | null | undefined): number | null {
  if (typeof value !== 'number') {
    return null;
  }

  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}