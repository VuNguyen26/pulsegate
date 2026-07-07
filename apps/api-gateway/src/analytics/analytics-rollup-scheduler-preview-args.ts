import type { AnalyticsRollupSchedulePlanInput } from "./analytics-rollup-schedule-plan.js";
import { parseAnalyticsRollupSchedulePreviewArgs } from "./analytics-rollup-schedule-preview-args.js";
import type {
  AnalyticsRollupSchedulerExecutionDecisionInput,
  AnalyticsRollupSchedulerExecutionMode,
  AnalyticsRollupSchedulerExecutionTrigger,
} from "./analytics-rollup-scheduler-execution-decision.js";

export type AnalyticsRollupSchedulerPreviewCommandOptions = {
  schedule: AnalyticsRollupSchedulePlanInput;
  executionDecision: AnalyticsRollupSchedulerExecutionDecisionInput;
};

type SchedulerPreviewOption =
  | "--enabled"
  | "--source"
  | "--granularity"
  | "--run-at"
  | "--lookback-buckets"
  | "--safety-delay-ms"
  | "--max-buckets"
  | "--execution-trigger"
  | "--execution-mode";

const SCHEDULE_PREVIEW_OPTIONS = new Set<string>([
  "--enabled",
  "--source",
  "--granularity",
  "--run-at",
  "--lookback-buckets",
  "--safety-delay-ms",
  "--max-buckets",
]);

const KNOWN_OPTIONS = new Set<string>([
  ...SCHEDULE_PREVIEW_OPTIONS,
  "--execution-trigger",
  "--execution-mode",
]);

function assertKnownOption(option: string): asserts option is SchedulerPreviewOption {
  if (!KNOWN_OPTIONS.has(option)) {
    throw new RangeError(`unknown option: ${option}`);
  }
}

function readRequiredValue(
  args: string[],
  index: number,
  option: SchedulerPreviewOption,
): string {
  const value = args[index + 1];

  if (value === undefined || value.startsWith("--")) {
    throw new RangeError(`${option} requires a value`);
  }

  return value;
}

function assertNotDuplicate(
  seenOptions: Set<string>,
  option: SchedulerPreviewOption,
): void {
  if (seenOptions.has(option)) {
    throw new RangeError(`duplicate option: ${option}`);
  }

  seenOptions.add(option);
}

function parseExecutionTrigger(
  value: string,
): AnalyticsRollupSchedulerExecutionTrigger {
  if (
    value === "command" ||
    value === "process-local" ||
    value === "external-scheduler"
  ) {
    return value;
  }

  throw new RangeError(
    "--execution-trigger must be command, process-local, or external-scheduler",
  );
}

function parseExecutionMode(
  value: string,
): AnalyticsRollupSchedulerExecutionMode {
  if (value === "preview" || value === "dry-run" || value === "execute") {
    return value;
  }

  throw new RangeError("--execution-mode must be preview, dry-run, or execute");
}

export function parseAnalyticsRollupSchedulerPreviewArgs(
  args: string[],
): AnalyticsRollupSchedulerPreviewCommandOptions {
  const seenOptions = new Set<string>();
  const scheduleArgs: string[] = [];
  const executionDecision: AnalyticsRollupSchedulerExecutionDecisionInput = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (token === undefined) {
      continue;
    }

    if (!token.startsWith("--")) {
      throw new RangeError(`unexpected argument ${token}`);
    }

    const equalsIndex = token.indexOf("=");
    const option = equalsIndex >= 0 ? token.slice(0, equalsIndex) : token;

    assertKnownOption(option);
    assertNotDuplicate(seenOptions, option);

    const value =
      equalsIndex >= 0
        ? token.slice(equalsIndex + 1)
        : readRequiredValue(args, index, option);

    if (value === "") {
      throw new RangeError(`${option} requires a value`);
    }

    if (SCHEDULE_PREVIEW_OPTIONS.has(option)) {
      scheduleArgs.push(option, value);
    } else if (option === "--execution-trigger") {
      executionDecision.trigger = parseExecutionTrigger(value);
    } else {
      executionDecision.mode = parseExecutionMode(value);
    }

    if (equalsIndex < 0) {
      index += 1;
    }
  }

  return {
    schedule: parseAnalyticsRollupSchedulePreviewArgs(scheduleArgs),
    executionDecision,
  };
}
