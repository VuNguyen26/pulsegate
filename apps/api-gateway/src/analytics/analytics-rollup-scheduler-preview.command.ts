import { pathToFileURL } from "node:url";

import { parseAnalyticsRollupSchedulePreviewArgs } from "./analytics-rollup-schedule-preview-args.js";
import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import { createAnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

export const ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE = [
  "Usage:",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at <iso> --granularity <hour|day> [--enabled <true|false>] [--source <usage|rejected|both>] [--lookback-buckets <n>] [--safety-delay-ms <n>] [--max-buckets <n>]",
  "",
  "Examples:",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at 2026-07-06T13:07:00.000Z --granularity hour",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1",
  "",
  "Safety:",
  "  Preview only. Does not create scheduled jobs, invoke backfill service, execute backfill, read events, persist rollups, affect quota counting, or delete raw events.",
].join("\n");

export async function runAnalyticsRollupSchedulerPreviewCommand(
  argv = process.argv.slice(2),
): Promise<void> {
  const options = parseAnalyticsRollupSchedulePreviewArgs(argv);
  const schedulePlan = createAnalyticsRollupSchedulePlan(options);
  const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

  console.log(JSON.stringify(runnerPlan, null, 2));
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