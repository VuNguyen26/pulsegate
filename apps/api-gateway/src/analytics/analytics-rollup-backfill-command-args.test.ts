import { describe, expect, it } from "vitest";

import {
  ANALYTICS_ROLLUP_BACKFILL_COMMAND_USAGE,
  parseAnalyticsRollupBackfillCommandArgs,
} from "./analytics-rollup-backfill-command-args.js";

describe("parseAnalyticsRollupBackfillCommandArgs", () => {
  it("should parse required and optional command arguments", () => {
    expect(
      parseAnalyticsRollupBackfillCommandArgs([
        "--from",
        "2026-07-05T00:00:00.000Z",
        "--to",
        "2026-07-06T00:00:00.000Z",
        "--granularity",
        "hour",
        "--source",
        "usage",
        "--mode",
        "execute",
        "--max-buckets",
        "24",
        "--event-limit",
        "500",
      ]),
    ).toEqual({
      from: "2026-07-05T00:00:00.000Z",
      to: "2026-07-06T00:00:00.000Z",
      granularity: "hour",
      source: "usage",
      mode: "execute",
      maxBuckets: 24,
      eventLimit: 500,
    });
  });

  it("should parse equals-style command arguments", () => {
    expect(
      parseAnalyticsRollupBackfillCommandArgs([
        "--from=2026-07-05T00:00:00.000Z",
        "--to=2026-07-06T00:00:00.000Z",
        "--granularity=day",
        "--source=both",
        "--mode=dry-run",
      ]),
    ).toEqual({
      from: "2026-07-05T00:00:00.000Z",
      to: "2026-07-06T00:00:00.000Z",
      granularity: "day",
      source: "both",
      mode: "dry-run",
      maxBuckets: undefined,
      eventLimit: undefined,
    });
  });

  it("should keep source and mode optional so the plan parser can apply safe defaults", () => {
    expect(
      parseAnalyticsRollupBackfillCommandArgs([
        "--from",
        "2026-07-05T00:00:00.000Z",
        "--to",
        "2026-07-06T00:00:00.000Z",
        "--granularity",
        "hour",
      ]),
    ).toEqual({
      from: "2026-07-05T00:00:00.000Z",
      to: "2026-07-06T00:00:00.000Z",
      granularity: "hour",
      source: undefined,
      mode: undefined,
      maxBuckets: undefined,
      eventLimit: undefined,
    });
  });

  it("should reject missing required arguments", () => {
    expect(() =>
      parseAnalyticsRollupBackfillCommandArgs([
        "--from",
        "2026-07-05T00:00:00.000Z",
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject unknown arguments", () => {
    expect(() =>
      parseAnalyticsRollupBackfillCommandArgs([
        "--from",
        "2026-07-05T00:00:00.000Z",
        "--to",
        "2026-07-06T00:00:00.000Z",
        "--granularity",
        "hour",
        "--unsafe",
        "true",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject missing argument values", () => {
    expect(() =>
      parseAnalyticsRollupBackfillCommandArgs([
        "--from",
        "2026-07-05T00:00:00.000Z",
        "--to",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupBackfillCommandArgs([
        "--from=",
        "--to",
        "2026-07-06T00:00:00.000Z",
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject invalid integer options", () => {
    expect(() =>
      parseAnalyticsRollupBackfillCommandArgs([
        "--from",
        "2026-07-05T00:00:00.000Z",
        "--to",
        "2026-07-06T00:00:00.000Z",
        "--granularity",
        "hour",
        "--event-limit",
        "0",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupBackfillCommandArgs([
        "--from",
        "2026-07-05T00:00:00.000Z",
        "--to",
        "2026-07-06T00:00:00.000Z",
        "--granularity",
        "hour",
        "--max-buckets",
        "1.5",
      ]),
    ).toThrow(RangeError);
  });

  it("should expose usage text for command failures", () => {
    expect(ANALYTICS_ROLLUP_BACKFILL_COMMAND_USAGE).toContain(
      "analytics:rollup:backfill",
    );
    expect(ANALYTICS_ROLLUP_BACKFILL_COMMAND_USAGE).toContain("--mode execute");
  });
});
