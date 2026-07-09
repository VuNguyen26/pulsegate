import { describe, expect, it } from "vitest";

import { parseAnalyticsRollupSchedulerPreviewArgs } from "./analytics-rollup-scheduler-preview-args.js";

describe("analytics rollup scheduler preview args", () => {
  it("should parse schedule options with command preview execution defaults", () => {
    const parsed = parseAnalyticsRollupSchedulerPreviewArgs([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--lookback-buckets",
      "1",
      "--safety-delay-ms",
      "300000",
      "--max-buckets",
      "1",
    ]);

    expect(parsed.schedule.enabled).toBe(true);
    expect(parsed.schedule.source).toBe("both");
    expect(parsed.schedule.runAt.toISOString()).toBe(
      "2026-07-06T13:07:00.000Z",
    );
    expect(parsed.schedule.granularity).toBe("hour");
    expect(parsed.schedule.lookbackBuckets).toBe(1);
    expect(parsed.schedule.safetyDelayMs).toBe(300000);
    expect(parsed.schedule.maxBuckets).toBe(1);
    expect(parsed.executionDecision).toEqual({});
    expect(parsed.dryRunServiceAdapterPreview).toEqual({});
  });

  it("should parse explicit command dry-run adapter preview event limit", () => {
    const parsed = parseAnalyticsRollupSchedulerPreviewArgs([
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
      "--event-limit",
      "500",
    ]);

    expect(parsed.executionDecision).toEqual({
      mode: "dry-run",
    });
    expect(parsed.dryRunServiceAdapterPreview).toEqual({
      eventLimit: 500,
    });
  });

  it("should parse equals-style command dry-run adapter preview event limit", () => {
    const parsed = parseAnalyticsRollupSchedulerPreviewArgs([
      "--run-at=2026-07-06T13:07:00.000Z",
      "--granularity=hour",
      "--execution-mode=dry-run",
      "--event-limit=500",
    ]);

    expect(parsed.executionDecision).toEqual({
      mode: "dry-run",
    });
    expect(parsed.dryRunServiceAdapterPreview).toEqual({
      eventLimit: 500,
    });
  });

  it("should parse process-local dry-run execution preview options", () => {
    const parsed = parseAnalyticsRollupSchedulerPreviewArgs([
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-trigger",
      "process-local",
      "--execution-mode",
      "dry-run",
    ]);

    expect(parsed.executionDecision).toEqual({
      trigger: "process-local",
      mode: "dry-run",
    });
  });

  it("should parse external scheduler execute preview options", () => {
    const parsed = parseAnalyticsRollupSchedulerPreviewArgs([
      "--execution-trigger",
      "external-scheduler",
      "--execution-mode",
      "execute",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
    ]);

    expect(parsed.executionDecision).toEqual({
      trigger: "external-scheduler",
      mode: "execute",
    });
  });

  it("should parse explicit command execute operator confirmation", () => {
    const parsed = parseAnalyticsRollupSchedulerPreviewArgs([
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "execute",
      "--event-limit",
      "500",
      "--confirm-execute",
      "true",
    ]);

    expect(parsed.executionDecision).toEqual({
      mode: "execute",
      commandExecuteOperatorConfirmed: true,
    });
    expect(parsed.dryRunServiceAdapterPreview).toEqual({
      eventLimit: 500,
    });

    const equalsParsed = parseAnalyticsRollupSchedulerPreviewArgs([
      "--run-at=2026-07-06T13:07:00.000Z",
      "--granularity=hour",
      "--execution-mode=execute",
      "--confirm-execute=false",
    ]);

    expect(equalsParsed.executionDecision).toEqual({
      mode: "execute",
      commandExecuteOperatorConfirmed: false,
    });
  });

  it("should reject invalid execution trigger and mode values", () => {
    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--execution-trigger",
        "cron",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--execution-mode",
        "force",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--execution-mode",
        "execute",
        "--confirm-execute",
        "yes",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject duplicate scheduler execution options", () => {
    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--execution-mode",
        "preview",
        "--execution-mode",
        "execute",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject invalid adapter preview event limits", () => {
    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "0",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--execution-mode",
        "dry-run",
        "--event-limit",
        "1.5",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject unknown options and missing values before creating output", () => {
    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--mode",
        "execute",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--run-at",
        "2026-07-06T13:07:00.000Z",
        "--granularity",
        "hour",
        "--execution-trigger",
      ]),
    ).toThrow(RangeError);
  });

  it("should still require schedule run timestamp and granularity", () => {
    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--execution-mode",
        "preview",
        "--granularity",
        "hour",
      ]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRollupSchedulerPreviewArgs([
        "--execution-mode",
        "preview",
        "--run-at",
        "2026-07-06T13:07:00.000Z",
      ]),
    ).toThrow(RangeError);
  });
});