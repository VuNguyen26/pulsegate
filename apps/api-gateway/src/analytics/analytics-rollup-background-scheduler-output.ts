import {
  buildAnalyticsRollupBackgroundSchedulerRunnerPlan,
  type AnalyticsRollupBackgroundSchedulerPreviewPlan,
  type AnalyticsRollupBackgroundSchedulerRunnerPlan,
  type AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason,
  type AnalyticsRollupBackgroundSchedulerRunnerPlanRequest,
  type AnalyticsRollupBackgroundSchedulerRunnerPlanStatus,
} from './analytics-rollup-background-scheduler-runner-plan.js';

import type { AnalyticsRollupBackgroundSchedulerSafetyFlags } from './analytics-rollup-background-scheduler-contract.js';

export type AnalyticsRollupBackgroundSchedulerOutputStatus =
  | 'command-runtime-preserved'
  | 'background-runner-blocked'
  | 'background-preview-ready'
  | 'background-runtime-blocked';

export interface AnalyticsRollupBackgroundSchedulerOutputSummary {
  readonly status: AnalyticsRollupBackgroundSchedulerOutputStatus;
  readonly runnerStatus: AnalyticsRollupBackgroundSchedulerRunnerPlanStatus;
  readonly blockedReason: AnalyticsRollupBackgroundSchedulerRunnerPlanBlockedReason | null;
  readonly ready: boolean;
  readonly backgroundRunnerSelected: boolean;
  readonly backgroundRunnerPlanAllowed: boolean;
  readonly backgroundRuntimeInvocationAllowed: boolean;
  readonly directCommandRuntimePreserved: boolean;
}

export interface AnalyticsRollupBackgroundSchedulerOutputReview {
  readonly separatesCommandFromBackgroundSemantics: boolean;
  readonly preservesDirectCommandDryRunAndExecute: boolean;
  readonly backgroundRuntimeStillClosed: boolean;
  readonly processLocalExecutionStillClosed: boolean;
  readonly externalSchedulerExecutionStillClosed: boolean;
  readonly previewOnlyWhenReady: boolean;
}

export interface AnalyticsRollupBackgroundSchedulerOutput {
  readonly summary: AnalyticsRollupBackgroundSchedulerOutputSummary;
  readonly previewPlan: AnalyticsRollupBackgroundSchedulerPreviewPlan | null;
  readonly safety: AnalyticsRollupBackgroundSchedulerSafetyFlags;
  readonly review: AnalyticsRollupBackgroundSchedulerOutputReview;
  readonly operatorNotes: readonly string[];
}

function mapOutputStatus(
  plan: AnalyticsRollupBackgroundSchedulerRunnerPlan,
): AnalyticsRollupBackgroundSchedulerOutputStatus {
  if (plan.status === 'command-trigger-skipped') {
    return 'command-runtime-preserved';
  }

  if (plan.status === 'background-preview-plan-ready') {
    return 'background-preview-ready';
  }

  if (plan.status === 'background-runtime-invocation-blocked') {
    return 'background-runtime-blocked';
  }

  return 'background-runner-blocked';
}

export function buildAnalyticsRollupBackgroundSchedulerOutput(
  request: AnalyticsRollupBackgroundSchedulerRunnerPlanRequest,
): AnalyticsRollupBackgroundSchedulerOutput {
  const plan = buildAnalyticsRollupBackgroundSchedulerRunnerPlan(request);
  const outputStatus = mapOutputStatus(plan);

  return {
    summary: {
      status: outputStatus,
      runnerStatus: plan.status,
      blockedReason: plan.blockedReason,
      ready: plan.ready,
      backgroundRunnerSelected: plan.contract.backgroundRunnerSelected,
      backgroundRunnerPlanAllowed: plan.contract.backgroundRunnerPlanAllowed,
      backgroundRuntimeInvocationAllowed: plan.contract.backgroundRuntimeInvocationAllowed,
      directCommandRuntimePreserved: plan.contract.directCommandRuntimePreserved,
    },
    previewPlan: plan.previewPlan,
    safety: plan.safety,
    review: {
      separatesCommandFromBackgroundSemantics: true,
      preservesDirectCommandDryRunAndExecute:
        request.trigger === 'command'
          ? plan.contract.directCommandRuntimePreserved
          : true,
      backgroundRuntimeStillClosed: !plan.contract.backgroundRuntimeInvocationAllowed,
      processLocalExecutionStillClosed:
        request.trigger !== 'process-local' ||
        plan.contract.backgroundRuntimeInvocationAllowed === false,
      externalSchedulerExecutionStillClosed:
        request.trigger !== 'external-scheduler' ||
        plan.contract.backgroundRuntimeInvocationAllowed === false,
      previewOnlyWhenReady:
        plan.ready === true
          ? plan.previewPlan !== null && plan.previewPlan.runtimeInvocationAllowed === false
          : plan.previewPlan === null,
    },
    operatorNotes: [
      ...plan.contract.operatorNotes,
      ...plan.operatorNotes,
      'Background scheduler output is operator-visible contract data only; it does not start a scheduled job.',
    ],
  };
}