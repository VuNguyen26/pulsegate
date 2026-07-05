import type { AnalyticsRollupGranularity } from "./analytics-rollup-time-bucket.js";
import {
  createAnalyticsRollupWindowPlan,
  type AnalyticsRollupWindowPlan,
} from "./analytics-rollup-window-plan.js";

export const DEFAULT_ANALYTICS_ROLLUP_BACKFILL_MAX_BUCKETS = 744;

export type AnalyticsRollupBackfillSource = "usage" | "rejected";
export type AnalyticsRollupBackfillSourceInput =
  | AnalyticsRollupBackfillSource
  | "both";
export type AnalyticsRollupBackfillMode = "dry-run" | "execute";

export type AnalyticsRollupBackfillPlanInput = {
  from: string;
  to: string;
  granularity: string;
  source?: string;
  mode?: string;
  maxBuckets?: number;
};

export type AnalyticsRollupBackfillPlan = {
  source: AnalyticsRollupBackfillSourceInput;
  sources: AnalyticsRollupBackfillSource[];
  mode: AnalyticsRollupBackfillMode;
  windowPlan: AnalyticsRollupWindowPlan;
};

function parseRequiredDate(value: string, name: string): Date {
  if (value.trim() === "") {
    throw new RangeError(`${name} must be a non-empty date string`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError(`${name} must be a valid date string`);
  }

  return parsed;
}

function parseGranularity(value: string): AnalyticsRollupGranularity {
  if (value === "hour" || value === "day") {
    return value;
  }

  throw new RangeError("granularity must be hour or day");
}

function parseSource(
  value: string | undefined,
): AnalyticsRollupBackfillSourceInput {
  if (value === undefined) {
    return "both";
  }

  if (value === "usage" || value === "rejected" || value === "both") {
    return value;
  }

  throw new RangeError("source must be usage, rejected, or both");
}

function expandSources(
  source: AnalyticsRollupBackfillSourceInput,
): AnalyticsRollupBackfillSource[] {
  if (source === "both") {
    return ["usage", "rejected"];
  }

  return [source];
}

function parseMode(value: string | undefined): AnalyticsRollupBackfillMode {
  if (value === undefined) {
    return "dry-run";
  }

  if (value === "dry-run" || value === "execute") {
    return value;
  }

  throw new RangeError("mode must be dry-run or execute");
}

export function createAnalyticsRollupBackfillPlan(
  input: AnalyticsRollupBackfillPlanInput,
): AnalyticsRollupBackfillPlan {
  const from = parseRequiredDate(input.from, "from");
  const to = parseRequiredDate(input.to, "to");
  const granularity = parseGranularity(input.granularity);
  const source = parseSource(input.source);
  const mode = parseMode(input.mode);

  return {
    source,
    sources: expandSources(source),
    mode,
    windowPlan: createAnalyticsRollupWindowPlan({
      from,
      to,
      granularity,
      maxBuckets:
        input.maxBuckets ?? DEFAULT_ANALYTICS_ROLLUP_BACKFILL_MAX_BUCKETS,
    }),
  };
}
