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

export interface AnalyticsRetentionExecuteContractReviewExpectationDetail {
  required: true;
  status: AnalyticsRetentionExecuteGuardrailStatus;
  reviewOnly: true;
  destructiveExecutionAllowed: false;
  operatorExpectation: string;
  readyEvidence: string | null;
  missingReason: string | null;
}

export interface AnalyticsRetentionExecuteContractReviewExpectations {
  candidateRecheckExpectation: AnalyticsRetentionExecuteContractReviewExpectationDetail & {
    planned: boolean;
    sourceScopedRecheckRequired: true;
    immediateBeforeDeleteRequired: true;
  };
  rollbackExpectation: AnalyticsRetentionExecuteContractReviewExpectationDetail & {
    documented: boolean;
    rollbackPlanRequiredBeforeExecution: true;
    destructiveFailureHandlingRequired: true;
  };
  auditOutputExpectation: AnalyticsRetentionExecuteContractReviewExpectationDetail & {
    planned: boolean;
    candidateAndDeleteLimitOutputRequired: true;
    reviewModeMustReportNoDeletion: true;
  };
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
  expectations: AnalyticsRetentionExecuteContractReviewExpectations;
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
    expectations: buildAnalyticsRetentionExecuteReviewExpectations({
      candidateRecheckPlanned,
      rollbackExpectationDocumented,
      auditOutputPlanned,
    }),
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

interface BuildAnalyticsRetentionExecuteReviewExpectationsInput {
  candidateRecheckPlanned: boolean;
  rollbackExpectationDocumented: boolean;
  auditOutputPlanned: boolean;
}

function buildAnalyticsRetentionExecuteReviewExpectations(
  input: BuildAnalyticsRetentionExecuteReviewExpectationsInput,
): AnalyticsRetentionExecuteContractReviewExpectations {
  const candidateRecheckStatus: AnalyticsRetentionExecuteGuardrailStatus =
    input.candidateRecheckPlanned ? 'ready' : 'missing';
  const rollbackExpectationStatus: AnalyticsRetentionExecuteGuardrailStatus =
    input.rollbackExpectationDocumented ? 'ready' : 'missing';
  const auditOutputStatus: AnalyticsRetentionExecuteGuardrailStatus =
    input.auditOutputPlanned ? 'ready' : 'missing';

  return {
    candidateRecheckExpectation: {
      required: true,
      planned: input.candidateRecheckPlanned,
      status: candidateRecheckStatus,
      reviewOnly: true,
      destructiveExecutionAllowed: false,
      sourceScopedRecheckRequired: true,
      immediateBeforeDeleteRequired: true,
      operatorExpectation:
        'Re-read source-scoped candidate counts immediately before any future retention delete operation.',
      readyEvidence: input.candidateRecheckPlanned
        ? 'candidate-recheck-preview-planned'
        : null,
      missingReason: input.candidateRecheckPlanned
        ? null
        : 'candidate-recheck-not-planned',
    },
    rollbackExpectation: {
      required: true,
      documented: input.rollbackExpectationDocumented,
      status: rollbackExpectationStatus,
      reviewOnly: true,
      destructiveExecutionAllowed: false,
      rollbackPlanRequiredBeforeExecution: true,
      destructiveFailureHandlingRequired: true,
      operatorExpectation:
        'Document rollback and failure-handling expectations before any future destructive retention execution path.',
      readyEvidence: input.rollbackExpectationDocumented
        ? 'rollback-expectation-documented'
        : null,
      missingReason: input.rollbackExpectationDocumented
        ? null
        : 'rollback-expectation-not-documented',
    },
    auditOutputExpectation: {
      required: true,
      planned: input.auditOutputPlanned,
      status: auditOutputStatus,
      reviewOnly: true,
      destructiveExecutionAllowed: false,
      candidateAndDeleteLimitOutputRequired: true,
      reviewModeMustReportNoDeletion: true,
      operatorExpectation:
        'Emit audit-friendly output with candidate counts, delete limits, operation previews, and explicit no-deletion review-mode status.',
      readyEvidence: input.auditOutputPlanned
        ? 'audit-output-preview-planned'
        : null,
      missingReason: input.auditOutputPlanned
        ? null
        : 'audit-output-not-planned',
    },
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