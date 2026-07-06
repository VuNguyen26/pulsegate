import { pathToFileURL } from 'node:url';

import { buildAnalyticsRetentionExecutionPreview } from './analytics-retention-execution-preview.js';

export const ANALYTICS_RETENTION_EXECUTION_PREVIEW_COMMAND_USAGE = [
  'Usage:',
  '  npm run analytics:retention:execution-preview --workspace api-gateway -- [--enabled <true|false>] [--source <usage|rejected|both>] [--mode <dry-run|execute>] [--usage-retention-days <n>] [--rejected-retention-days <n>] [--confirm-execute <confirmation>] [--hard-delete-limit <n>]',
  '',
  'Examples:',
  '  npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90',
  '  npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100',
  '',
  'Safety:',
  '  This command only builds an execution preview. It does not connect to the database and does not delete analytics events.',
].join('\n');

type PolicyArgName =
  | '--enabled'
  | '--source'
  | '--usage-retention-days'
  | '--rejected-retention-days';

type ExecutionArgName = '--mode' | '--confirm-execute' | '--hard-delete-limit';

const POLICY_ARG_NAMES = new Set<PolicyArgName>([
  '--enabled',
  '--source',
  '--usage-retention-days',
  '--rejected-retention-days',
]);

const EXECUTION_ARG_NAMES = new Set<ExecutionArgName>([
  '--mode',
  '--confirm-execute',
  '--hard-delete-limit',
]);

interface SplitCommandArgs {
  readonly policy: {
    enabled?: boolean;
    source?: string;
    usageRetentionDays?: number;
    rejectedRetentionDays?: number;
  };
  readonly executionArgs: readonly string[];
}

export function runAnalyticsRetentionExecutionPreviewCommand(
  argv = process.argv.slice(2),
): void {
  const splitArgs = splitAnalyticsRetentionExecutionPreviewCommandArgs(argv);
  const preview = buildAnalyticsRetentionExecutionPreview({
    policy: splitArgs.policy,
    executionArgs: splitArgs.executionArgs,
  });

  console.log(JSON.stringify(preview, null, 2));
}

export function splitAnalyticsRetentionExecutionPreviewCommandArgs(
  argv: readonly string[],
): SplitCommandArgs {
  const policy: SplitCommandArgs['policy'] = {};
  const executionArgs: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      throw new RangeError(`unexpected argument ${token}`);
    }

    const option = parseCommandOption(token);
    const name = option.name;

    if (!isSupportedArgName(name)) {
      throw new RangeError(`unknown option ${name}`);
    }

    const value =
      option.valueFromEquals ??
      readRequiredCommandArgValue(argv, index, name);

    if (option.valueFromEquals === undefined) {
      index += 1;
    }

    if (isPolicyArgName(name)) {
      assignPolicyOption(policy, name, value);
      continue;
    }

    executionArgs.push(name, value);
  }

  return {
    policy,
    executionArgs,
  };
}

function parseCommandOption(token: string): {
  readonly name: string;
  readonly valueFromEquals?: string;
} {
  const equalsIndex = token.indexOf('=');

  if (equalsIndex === -1) {
    return {
      name: token,
    };
  }

  const name = token.slice(0, equalsIndex);
  const valueFromEquals = token.slice(equalsIndex + 1);

  if (valueFromEquals.length === 0) {
    throw new RangeError(`${name} requires a value`);
  }

  return {
    name,
    valueFromEquals,
  };
}

function isSupportedArgName(
  value: string,
): value is PolicyArgName | ExecutionArgName {
  return isPolicyArgName(value) || isExecutionArgName(value);
}

function isPolicyArgName(value: string): value is PolicyArgName {
  return POLICY_ARG_NAMES.has(value as PolicyArgName);
}

function isExecutionArgName(value: string): value is ExecutionArgName {
  return EXECUTION_ARG_NAMES.has(value as ExecutionArgName);
}

function readRequiredCommandArgValue(
  argv: readonly string[],
  optionIndex: number,
  optionName: string,
): string {
  const value = argv[optionIndex + 1];

  if (value === undefined || value.startsWith('--')) {
    throw new RangeError(`${optionName} requires a value`);
  }

  return value;
}

function assignPolicyOption(
  policy: SplitCommandArgs['policy'],
  name: PolicyArgName,
  value: string,
): void {
  switch (name) {
    case '--enabled':
      ensurePolicyOptionNotSet(policy.enabled, name);
      policy.enabled = parseBoolean(value, name);
      return;
    case '--source':
      ensurePolicyOptionNotSet(policy.source, name);
      policy.source = value;
      return;
    case '--usage-retention-days':
      ensurePolicyOptionNotSet(policy.usageRetentionDays, name);
      policy.usageRetentionDays = parsePositiveInteger(value, name);
      return;
    case '--rejected-retention-days':
      ensurePolicyOptionNotSet(policy.rejectedRetentionDays, name);
      policy.rejectedRetentionDays = parsePositiveInteger(value, name);
      return;
  }
}

function parseBoolean(value: string, name: string): boolean {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new RangeError(`${name} must be true or false`);
}

function parsePositiveInteger(value: string, name: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new RangeError(`${name} must be a positive integer`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new RangeError(`${name} must be a safe positive integer`);
  }

  return parsed;
}

function ensurePolicyOptionNotSet(
  currentValue: unknown,
  name: PolicyArgName,
): void {
  if (currentValue !== undefined) {
    throw new RangeError(`duplicate option ${name}`);
  }
}

function isDirectRun(): boolean {
  const entrypoint = process.argv[1];

  return (
    entrypoint !== undefined &&
    import.meta.url === pathToFileURL(entrypoint).href
  );
}

if (isDirectRun()) {
  try {
    runAnalyticsRetentionExecutionPreviewCommand();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(message);
    console.error('');
    console.error(ANALYTICS_RETENTION_EXECUTION_PREVIEW_COMMAND_USAGE);
    process.exitCode = 1;
  }
}
