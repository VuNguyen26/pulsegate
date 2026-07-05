export const ANALYTICS_ROLLUP_BACKFILL_COMMAND_USAGE = [
  "Usage:",
  "  npm run analytics:rollup:backfill --workspace api-gateway -- --from <iso> --to <iso> --granularity <hour|day> [--source <usage|rejected|both>] [--mode <dry-run|execute>] [--max-buckets <n>] [--event-limit <n>]",
  "",
  "Examples:",
  "  npm run analytics:rollup:backfill --workspace api-gateway -- --from 2026-07-05T00:00:00.000Z --to 2026-07-06T00:00:00.000Z --granularity hour",
  "  npm run analytics:rollup:backfill --workspace api-gateway -- --from 2026-07-05T00:00:00.000Z --to 2026-07-06T00:00:00.000Z --granularity hour --source usage --mode execute",
].join("\n");

export type AnalyticsRollupBackfillCommandOptions = {
  from: string;
  to: string;
  granularity: string;
  source?: string;
  mode?: string;
  maxBuckets?: number;
  eventLimit?: number;
};

type MutableAnalyticsRollupBackfillCommandOptions = Partial<
  AnalyticsRollupBackfillCommandOptions
>;

const OPTION_NAME_MAP = {
  from: "from",
  to: "to",
  granularity: "granularity",
  source: "source",
  mode: "mode",
  "max-buckets": "maxBuckets",
  "event-limit": "eventLimit",
} as const;

type RawOptionName = keyof typeof OPTION_NAME_MAP;

function isRawOptionName(value: string): value is RawOptionName {
  return value in OPTION_NAME_MAP;
}

function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }

  return parsed;
}

function assignOption(
  options: MutableAnalyticsRollupBackfillCommandOptions,
  rawName: string,
  rawValue: string,
): void {
  if (!isRawOptionName(rawName)) {
    throw new RangeError(`unknown option --${rawName}`);
  }

  const optionName = OPTION_NAME_MAP[rawName];

  if (optionName === "maxBuckets" || optionName === "eventLimit") {
    options[optionName] = parsePositiveInteger(rawValue, rawName);
    return;
  }

  options[optionName] = rawValue;
}

function assertRequiredOption(
  options: MutableAnalyticsRollupBackfillCommandOptions,
  name: "from" | "to" | "granularity",
): asserts options is MutableAnalyticsRollupBackfillCommandOptions &
  Pick<AnalyticsRollupBackfillCommandOptions, typeof name> {
  if (options[name] === undefined || options[name].trim() === "") {
    throw new RangeError(`--${name} is required`);
  }
}

export function parseAnalyticsRollupBackfillCommandArgs(
  argv: string[],
): AnalyticsRollupBackfillCommandOptions {
  const options: MutableAnalyticsRollupBackfillCommandOptions = {};

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

  assertRequiredOption(options, "from");
  assertRequiredOption(options, "to");
  assertRequiredOption(options, "granularity");

  return {
    from: options.from,
    to: options.to,
    granularity: options.granularity,
    source: options.source,
    mode: options.mode,
    maxBuckets: options.maxBuckets,
    eventLimit: options.eventLimit,
  };
}
