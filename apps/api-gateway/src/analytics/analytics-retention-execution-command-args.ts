import type { AnalyticsRetentionExecutionMode } from './analytics-retention-execution-guard.js';

export const ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE =
  'I_UNDERSTAND_ANALYTICS_RETENTION_DELETE';

export interface AnalyticsRetentionExecutionCommandArgs {
  readonly mode: AnalyticsRetentionExecutionMode;
  readonly confirmExecute?: boolean;
  readonly hardDeleteLimit?: number;
}

interface MutableExecutionCommandArgs {
  mode?: AnalyticsRetentionExecutionMode;
  confirmExecute?: boolean;
  hardDeleteLimit?: number;
}

type ExecutionOptionName = '--mode' | '--confirm-execute' | '--hard-delete-limit';

const SUPPORTED_OPTIONS = new Set<ExecutionOptionName>([
  '--mode',
  '--confirm-execute',
  '--hard-delete-limit',
]);

export function parseAnalyticsRetentionExecutionCommandArgs(
  args: readonly string[],
): AnalyticsRetentionExecutionCommandArgs {
  const parsed: MutableExecutionCommandArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const option = parseOption(args[index]);

    if (!isSupportedOption(option.name)) {
      throw new Error(`Unknown analytics retention execution argument: ${option.name}`);
    }

    const value =
      option.valueFromEquals ??
      readRequiredOptionValue(args, index, option.name);

    if (option.valueFromEquals === undefined) {
      index += 1;
    }

    applyOption(parsed, option.name, value);
  }

  const mode = parsed.mode ?? 'dry-run';

  if (mode === 'dry-run') {
    if (parsed.confirmExecute === true) {
      throw new Error('--confirm-execute can only be used with --mode execute');
    }

    if (parsed.hardDeleteLimit !== undefined) {
      throw new Error('--hard-delete-limit can only be used with --mode execute');
    }
  }

  return {
    mode,
    ...(parsed.confirmExecute === undefined
      ? {}
      : { confirmExecute: parsed.confirmExecute }),
    ...(parsed.hardDeleteLimit === undefined
      ? {}
      : { hardDeleteLimit: parsed.hardDeleteLimit }),
  };
}

function parseOption(rawArg: string): {
  readonly name: string;
  readonly valueFromEquals?: string;
} {
  if (!rawArg.startsWith('--')) {
    throw new Error(`Unexpected analytics retention execution argument: ${rawArg}`);
  }

  const equalsIndex = rawArg.indexOf('=');

  if (equalsIndex === -1) {
    return {
      name: rawArg,
    };
  }

  const name = rawArg.slice(0, equalsIndex);
  const valueFromEquals = rawArg.slice(equalsIndex + 1);

  if (valueFromEquals.length === 0) {
    throw new Error(`Missing value for analytics retention execution argument: ${name}`);
  }

  return {
    name,
    valueFromEquals,
  };
}

function isSupportedOption(name: string): name is ExecutionOptionName {
  return SUPPORTED_OPTIONS.has(name as ExecutionOptionName);
}

function readRequiredOptionValue(
  args: readonly string[],
  optionIndex: number,
  optionName: ExecutionOptionName,
): string {
  const value = args[optionIndex + 1];

  if (value === undefined || value.startsWith('--')) {
    throw new Error(`Missing value for analytics retention execution argument: ${optionName}`);
  }

  return value;
}

function applyOption(
  parsed: MutableExecutionCommandArgs,
  optionName: ExecutionOptionName,
  value: string,
): void {
  switch (optionName) {
    case '--mode':
      setMode(parsed, value);
      return;
    case '--confirm-execute':
      setConfirmExecute(parsed, value);
      return;
    case '--hard-delete-limit':
      setHardDeleteLimit(parsed, value);
      return;
  }
}

function setMode(parsed: MutableExecutionCommandArgs, value: string): void {
  ensureOptionNotSet(parsed.mode, '--mode');

  if (value !== 'dry-run' && value !== 'execute') {
    throw new Error('analytics retention execution mode must be dry-run or execute');
  }

  parsed.mode = value;
}

function setConfirmExecute(
  parsed: MutableExecutionCommandArgs,
  value: string,
): void {
  ensureOptionNotSet(parsed.confirmExecute, '--confirm-execute');

  if (value !== ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE) {
    throw new Error(
      `--confirm-execute must equal ${ANALYTICS_RETENTION_EXECUTE_CONFIRMATION_VALUE}`,
    );
  }

  parsed.confirmExecute = true;
}

function setHardDeleteLimit(
  parsed: MutableExecutionCommandArgs,
  value: string,
): void {
  ensureOptionNotSet(parsed.hardDeleteLimit, '--hard-delete-limit');

  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error('--hard-delete-limit must be a positive integer');
  }

  const parsedValue = Number(value);

  if (!Number.isSafeInteger(parsedValue)) {
    throw new Error('--hard-delete-limit must be a safe positive integer');
  }

  parsed.hardDeleteLimit = parsedValue;
}

function ensureOptionNotSet(
  currentValue: unknown,
  optionName: ExecutionOptionName,
): void {
  if (currentValue !== undefined) {
    throw new Error(`Duplicate analytics retention execution argument: ${optionName}`);
  }
}
