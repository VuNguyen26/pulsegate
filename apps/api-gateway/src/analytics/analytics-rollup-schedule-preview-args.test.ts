import { describe, expect, it } from "vitest";

import {
  ANALYTICS_ROLLUP_SCHEDULE_PREVIEW_COMMAND_USAGE,
  parseAnalyticsRollupSchedulePreviewArgs,
} from "./analytics-rollup-schedule-preview-args.js";

describe("analytics rollup schedule preview args", () => {
  it("should parse the required run timestamp and granularity with safe defaults", () => {
    const parsed = parseAnalyticsRollupSchedulePreviewArgs([
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
    ]);

    expect(parsed.enabled).toBe(false);
    expect(parsed.runAt.toISOString()).toBe("2026-07-06T13:07:00.000Z");
    expect(parsed.granularity).toBe("hour");
    expect(parsed.source).toBeUndefined();
    expect(parsed.lookbackBuckets).toBeUndefined();
    expect(parsed.safetyDelayMs).toBeUndefined();
    expect(parsed.maxBuckets).toBeUndefined();
  });

  it("should parse all supported schedule preview options", () => {
    const parsed = parseAnalyticsRollupSchedulePreviewArgs([
      "--enabled",
      "true",
      "--source",
      "both",
      "--granularity",
      "day",
      "--run-at",
      "2026-07-06T01:00:00.000Z",
      "--lookback-buckets",
      "2",
      "--safety-delay-ms",
      "0",
      "--max-buckets",
      "2",
    ]);

    expect(parsed.enabled).toBe(true);
    expect(parsed.source).toBe("both");
    expect(parsed.granularity).toBe("day");
    expect(parsed.runAt.toISOString()).toBe("2026-07-06T01:00:00.000Z");
    expect(parsed.lookbackBuckets).toBe(2);
    expect(parsed.safetyDelayMs).toBe(0);
    expect(parsed.maxBuckets).toBe(2);
  });

  it("should parse usage-only and rejected-only sources", () => {
    expect(
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--source",
        "usage",
      ]).source,
    ).toBe("usage");

    expect(
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--source",
        "rejected",
      ]).source,
    ).toBe("rejected");
  });

  it("should reject missing required options", () => {
    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject unknown options and missing values", () => {
    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--mode",
        "preview",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject invalid booleans, source, granularity, and dates", () => {
    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--enabled",
        "yes",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--source",
        "security",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "minute",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "invalid-date",
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject invalid numeric guardrails", () => {
    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--lookback-buckets",
        "0",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--safety-delay-ms",
        "-1",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--max-buckets",
        "1.5",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject duplicate options", () => {
    expect(() =>
      parseAnalyticsRollupSchedulePreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--run-at",
        "2026-07-06T14:07:00.000Z",
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);
  });

  it("should expose usage text for command failures", () => {
    expect(ANALYTICS_ROLLUP_SCHEDULE_PREVIEW_COMMAND_USAGE).toContain(
      "analytics:rollup:schedule-preview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULE_PREVIEW_COMMAND_USAGE).toContain(
      "--run-at <iso>",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULE_PREVIEW_COMMAND_USAGE).toContain(
      "Preview only",
    );
  });
});
