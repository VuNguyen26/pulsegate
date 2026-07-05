import type { AnalyticsRetentionPolicyInput } from "./analytics-retention-policy.js";

export const ANALYTICS_RETENTION_DRY_RUN_COMMAND_USAGE = [
  "Usage:",
  "  npm run analytics:retention:dry-run --workspace api-gateway -- [--enabled <true|false>] [--source <usage|rejected|both>] [--mode <dry-run>] [--usage-retention-days <n>] [--rejected-retention-days <n>]",
  "",
  "Examples:",
  "  npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90",
  "  npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source usage --usage-retention-days 30",
].join("\n");

export type AnalyticsRetentionDryRunCommandOptions =
  AnalyticsRetentionPolicyInput;

type MutableAnalyticsRetentionDryRunCommandOptions = {
  enabled?: boolean;
  mode?: string;
  source?: string;
  usageRetentionDays?: number;
  rejectedRetentionDays?: number;
};

const OPTION_NAME_MAP = {
  enabled: "enabled",
  source: "source",
  mode: "mode",
  "usage-retention-days": "usageRetentionDays",
  "rejected-retention-days": "rejectedRetentionDays",
} as const;

type RawOptionName = keyof typeof OPTION_NAME_MAP;

function isRawOptionName(value: string): value is RawOptionName {
  return value in OPTION_NAME_MAP;
}

function parseBoolean(value: string, name: string): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new RangeError(`${name} must be true or false`);
}

function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }

  return parsed;
}

function parseSource(value: string): string {
  if (value === "usage" || value === "rejected" || value === "both") {
    return value;
  }

  throw new RangeError("source must be usage, rejected, or both");
}

function parseMode(value: string): string {
  if (value === "dry-run") {
    return value;
  }

  throw new RangeError("mode currently only supports dry-run");
}

function assignOption(
  options: MutableAnalyticsRetentionDryRunCommandOptions,
  rawName: string,
  rawValue: string,
): void {
  if (!isRawOptionName(rawName)) {
    throw new RangeError(`unknown option --${rawName}`);
  }

  const optionName = OPTION_NAME_MAP[rawName];

  if (optionName === "enabled") {
    options.enabled = parseBoolean(rawValue, rawName);
    return;
  }

  if (optionName === "usageRetentionDays") {
    options.usageRetentionDays = parsePositiveInteger(rawValue, rawName);
    return;
  }

  if (optionName === "rejectedRetentionDays") {
    options.rejectedRetentionDays = parsePositiveInteger(rawValue, rawName);
    return;
  }

  if (optionName === "source") {
    options.source = parseSource(rawValue);
    return;
  }

  options.mode = parseMode(rawValue);
}

export function parseAnalyticsRetentionDryRunCommandArgs(
  argv: string[],
): AnalyticsRetentionDryRunCommandOptions {
  const options: MutableAnalyticsRetentionDryRunCommandOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      throw new RangeError(`unexpected argument ${token}`);
    }

    const optionToken = token.slice(2);
    const equalsIndex = optionToken.indexOf("=");

    if (equalsIndex >= 0) {
      const rawName = optionToken.slice(0, equalsIndex);
      const rawValue = optionToken.slice(equalsIndex + 1);

      if (rawValue === "") {
        throw new RangeError(`--${rawName} requires a value`);
      }

      assignOption(options, rawName, rawValue);
      continue;
    }

    const rawName = optionToken;
    const rawValue = argv[index + 1];

    if (rawValue === undefined || rawValue.startsWith("--")) {
      throw new RangeError(`--${rawName} requires a value`);
    }

    assignOption(options, rawName, rawValue);
    index += 1;
  }

  return {
    enabled: options.enabled,
    mode: options.mode,
    source: options.source,
    usageRetentionDays: options.usageRetentionDays,
    rejectedRetentionDays: options.rejectedRetentionDays,
  };
}
