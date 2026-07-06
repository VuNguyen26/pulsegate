import { pathToFileURL } from "node:url";

import {
  ANALYTICS_ROLLUP_SCHEDULE_PREVIEW_COMMAND_USAGE,
  parseAnalyticsRollupSchedulePreviewArgs,
} from "./analytics-rollup-schedule-preview-args.js";
import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import { createAnalyticsRollupSchedulePreview } from "./analytics-rollup-schedule-preview.js";

export async function runAnalyticsRollupSchedulePreviewCommand(
  argv = process.argv.slice(2),
): Promise<void> {
  const options = parseAnalyticsRollupSchedulePreviewArgs(argv);
  const plan = createAnalyticsRollupSchedulePlan(options);
  const preview = createAnalyticsRollupSchedulePreview(plan);

  console.log(JSON.stringify(preview, null, 2));
}

function isDirectRun(): boolean {
  const entrypoint = process.argv[1];

  return (
    entrypoint !== undefined &&
    import.meta.url === pathToFileURL(entrypoint).href
  );
}

if (isDirectRun()) {
  runAnalyticsRollupSchedulePreviewCommand().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(message);
    console.error("");
    console.error(ANALYTICS_ROLLUP_SCHEDULE_PREVIEW_COMMAND_USAGE);
    process.exitCode = 1;
  });
}
