import type { AnalyticsRollupBackfillSourceInput } from "./analytics-rollup-backfill-plan.js";
import type { AnalyticsRollupSchedulePlanInput } from "./analytics-rollup-schedule-plan.js";
import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";

type SchedulePreviewOption =
  | "--enabled"
  | "--source"
  | "--granularity"
  | "--run-at"
  | "--lookback-buckets"
  | "--safety-delay-ms"
  | "--max-buckets";

const KNOWN_OPTIONS = new Set<string>([
  "--enabled",
  "--source",
  "--granularity",
  "--run-at",
  "--lookback-buckets",
  "--safety-delay-ms",
  "--max-buckets",
]);

function assertKnownOption(option: string): asserts option is SchedulePreviewOption {
  if (!KNOWN_OPTIONS.has(option)) {
    throw new RangeError(`unknown option: ${option}`);
  }
}

function readRequiredValue(
  args: string[],
  index: number,
  option: SchedulePreviewOption,
): string {
  const value = args[index + 1];

  if (value === undefined || value.startsWith("--")) {
    throw new RangeError(`${option} requires a value`);
  }

  return value;
}

function parseBoolean(value: string, option: SchedulePreviewOption): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new RangeError(`${option} must be true or false`);
}

function parseSource(value: string): AnalyticsRollupBackfillSourceInput {
  if (value === "usage" || value === "rejected" || value === "both") {
    return value;
  }

  throw new RangeError("--source must be usage, rejected, or both");
}

function parseGranularity(value: string): AnalyticsRollupGranularity {
  if (value === "hour" || value === "day") {
    return value;
  }

  throw new RangeError("--granularity must be hour or day");
}

function parseRequiredDate(value: string, option: SchedulePreviewOption): Date {
  if (value.trim() === "") {
    throw new RangeError(`${option} must be a non-empty date string`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError(`${option} must be a valid date string`);
  }

  return parsed;
}

function parsePositiveInteger(
  value: string,
  option: SchedulePreviewOption,
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new RangeError(`${option} must be a positive integer`);
  }

  return parsed;
}

function parseNonNegativeInteger(
  value: string,
  option: SchedulePreviewOption,
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new RangeError(`${option} must be a non-negative integer`);
  }

  return parsed;
}

function assertNotDuplicate(
  seenOptions: Set<string>,
  option: SchedulePreviewOption,
): void {
  if (seenOptions.has(option)) {
    throw new RangeError(`duplicate option: ${option}`);
  }

  seenOptions.add(option);
}

export function parseAnalyticsRollupSchedulePreviewArgs(
  args: string[],
): AnalyticsRollupSchedulePlanInput {
  const seenOptions = new Set<string>();
  const parsed: Partial<AnalyticsRollupSchedulePlanInput> = {};

  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];

    if (option === undefined) {
      continue;
    }

    assertKnownOption(option);
    assertNotDuplicate(seenOptions, option);

    const value = readRequiredValue(args, index, option);

    if (option === "--enabled") {
      parsed.enabled = parseBoolean(value, option);
    } else if (option === "--source") {
      parsed.source = parseSource(value);
    } else if (option === "--granularity") {
      parsed.granularity = parseGranularity(value);
    } else if (option === "--run-at") {
      parsed.runAt = parseRequiredDate(value, option);
    } else if (option === "--lookback-buckets") {
      parsed.lookbackBuckets = parsePositiveInteger(value, option);
    } else if (option === "--safety-delay-ms") {
      parsed.safetyDelayMs = parseNonNegativeInteger(value, option);
    } else {
      parsed.maxBuckets = parsePositiveInteger(value, option);
    }
  }

  if (parsed.runAt === undefined) {
    throw new RangeError("--run-at is required");
  }

  if (parsed.granularity === undefined) {
    throw new RangeError("--granularity is required");
  }

  return {
    enabled: parsed.enabled ?? false,
    runAt: parsed.runAt,
    granularity: parsed.granularity,
    source: parsed.source,
    lookbackBuckets: parsed.lookbackBuckets,
    safetyDelayMs: parsed.safetyDelayMs,
    maxBuckets: parsed.maxBuckets,
  };
}
