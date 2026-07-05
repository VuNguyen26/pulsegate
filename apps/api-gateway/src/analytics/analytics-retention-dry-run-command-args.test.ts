import { describe, expect, it } from "vitest";

import {
  ANALYTICS_RETENTION_DRY_RUN_COMMAND_USAGE,
  parseAnalyticsRetentionDryRunCommandArgs,
} from "./analytics-retention-dry-run-command-args.js";

describe("parseAnalyticsRetentionDryRunCommandArgs", () => {
  it("should parse retention dry-run command arguments", () => {
    expect(
      parseAnalyticsRetentionDryRunCommandArgs([
        "--enabled",
        "true",
        "--source",
        "both",
        "--mode",
        "dry-run",
        "--usage-retention-days",
        "30",
        "--rejected-retention-days",
        "45",
      ]),
    ).toEqual({
      enabled: true,
      mode: "dry-run",
      source: "both",
      usageRetentionDays: 30,
      rejectedRetentionDays: 45,
    });
  });

  it("should parse equals-style command arguments", () => {
    expect(
      parseAnalyticsRetentionDryRunCommandArgs([
        "--enabled=true",
        "--source=usage",
        "--mode=dry-run",
        "--usage-retention-days=90",
      ]),
    ).toEqual({
      enabled: true,
      mode: "dry-run",
      source: "usage",
      usageRetentionDays: 90,
      rejectedRetentionDays: undefined,
    });
  });

  it("should keep all arguments optional so the policy parser can apply safe defaults", () => {
    expect(parseAnalyticsRetentionDryRunCommandArgs([])).toEqual({
      enabled: undefined,
      mode: undefined,
      source: undefined,
      usageRetentionDays: undefined,
      rejectedRetentionDays: undefined,
    });
  });

  it("should reject unknown arguments", () => {
    expect(() =>
      parseAnalyticsRetentionDryRunCommandArgs([
        "--enabled",
        "true",
        "--unsafe",
        "true",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject missing argument values", () => {
    expect(() =>
      parseAnalyticsRetentionDryRunCommandArgs(["--enabled"]),
    ).toThrow(RangeError);

    expect(() =>
      parseAnalyticsRetentionDryRunCommandArgs([
        "--enabled=",
        "--source",
        "both",
      ]),
    ).toThrow(RangeError);
  });

  it("should reject invalid boolean, source, and mode values", () => {
    expect(() =>
      parseAnalyticsRetentionDryRunCommandArgs(["--enabled", "yes"]),
    ).toThrow(/true or false/);

    expect(() =>
      parseAnalyticsRetentionDryRunCommandArgs(["--source", "all"]),
    ).toThrow(/source/);

    expect(() =>
      parseAnalyticsRetentionDryRunCommandArgs(["--mode", "execute"]),
    ).toThrow(/dry-run/);
  });

  it("should reject invalid retention day values", () => {
    expect(() =>
      parseAnalyticsRetentionDryRunCommandArgs([
        "--usage-retention-days",
        "0",
      ]),
    ).toThrow(/positive integer/);

    expect(() =>
      parseAnalyticsRetentionDryRunCommandArgs([
        "--rejected-retention-days",
        "1.5",
      ]),
    ).toThrow(/positive integer/);
  });

  it("should expose usage text for future command failures", () => {
    expect(ANALYTICS_RETENTION_DRY_RUN_COMMAND_USAGE).toContain(
      "analytics:retention:dry-run",
    );
    expect(ANALYTICS_RETENTION_DRY_RUN_COMMAND_USAGE).toContain(
      "--mode <dry-run>",
    );
  });
});
