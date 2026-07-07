import { pathToFileURL } from "node:url";

import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import { parseAnalyticsRollupSchedulerPreviewArgs } from "./analytics-rollup-scheduler-preview-args.js";
import { createAnalyticsRollupSchedulerExecutionDecision } from "./analytics-rollup-scheduler-execution-decision.js";
import { createAnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

export const ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE = [
  "Usage:",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at <iso> --granularity <hour|day> [--enabled <true|false>] [--source <usage|rejected|both>] [--lookback-buckets <n>] [--safety-delay-ms <n>] [--max-buckets <n>] [--execution-trigger <command|process-local|external-scheduler>] [--execution-mode <preview|dry-run|execute>]",
  "",
  "Examples:",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at 2026-07-06T13:07:00.000Z --granularity hour",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-mode execute",
  "",
  "Safety:",
  "  Preview only. Prints an execution boundary decision. Does not create scheduled jobs, invoke backfill service, execute backfill, read events, persist rollups, affect quota counting, or delete raw events.",
  "  Command dry-run requests currently remain blocked and expose dryRunDesignReview, dryRunInvocationReadiness, dryRunInvocationDesignReview, dryRunServiceInvocationContractReview, and dryRunInvocationContract only.",
  "  The dry-run invocation contract is review-only: command-triggered, dry-run-only, per-source, event-limit and max-bucket guarded before any future wiring.",
  "  Dry-run backfill service invocation requires explicit design, source separation, event limit guardrails, and Docker/PostgreSQL runtime validation before wiring.",
].join("\n");

export async function runAnalyticsRollupSchedulerPreviewCommand(
  argv = process.argv.slice(2),
): Promise<void> {
  const options = parseAnalyticsRollupSchedulerPreviewArgs(argv);
  const schedulePlan = createAnalyticsRollupSchedulePlan(options.schedule);
  const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);
  const executionDecision = createAnalyticsRollupSchedulerExecutionDecision(
    runnerPlan,
    options.executionDecision,
  );

  console.log(JSON.stringify({ ...runnerPlan, executionDecision }, null, 2));
}

function isDirectRun(): boolean {
  const entrypoint = process.argv[1];

  return (
    entrypoint !== undefined &&
    import.meta.url === pathToFileURL(entrypoint).href
  );
}

if (isDirectRun()) {
  runAnalyticsRollupSchedulerPreviewCommand().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(message);
    console.error("");
    console.error(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE);
    process.exitCode = 1;
  });
}