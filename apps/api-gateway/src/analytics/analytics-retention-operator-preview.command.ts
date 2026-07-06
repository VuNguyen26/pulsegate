import { pathToFileURL } from 'node:url';

import {
  disconnectGatewayPrisma,
  gatewayPrisma,
} from '../database/gateway-prisma.js';
import {
  createPrismaAnalyticsRetentionCandidateReadRepository,
  type AnalyticsRetentionCandidateReadRepository,
} from './analytics-retention-candidate-read.repository.js';
import {
  buildAnalyticsRetentionExecutionServiceCandidateReadPreview,
} from './analytics-retention-execution-service-candidate-read-preview.js';
import {
  splitAnalyticsRetentionExecutionPreviewCommandArgs,
} from './analytics-retention-execution-preview.command.js';
import {
  buildAnalyticsRetentionOperatorPreviewOutput,
  type AnalyticsRetentionOperatorPreviewOutput,
} from './analytics-retention-operator-preview-output.js';

export const ANALYTICS_RETENTION_OPERATOR_PREVIEW_COMMAND_USAGE = [
  'Usage:',
  '  npm run analytics:retention:operator-preview --workspace api-gateway -- [--enabled <true|false>] [--source <usage|rejected|both>] [--mode <dry-run|execute>] [--usage-retention-days <n>] [--rejected-retention-days <n>] [--confirm-execute <confirmation>] [--hard-delete-limit <n>]',
  '',
  'Examples:',
  '  npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled false',
  '  npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90',
  '  npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source rejected --rejected-retention-days 90',
  '  npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120',
  '  npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100',
  '',
  'Safety:',
  '  This command reads retention candidate counts from PostgreSQL through the candidate read repository.',
  '  It prints an operator preview only. It does not call deleteCandidates and does not delete analytics events.',
].join('\n');

export interface AnalyticsRetentionOperatorPreviewCommandLogger {
  readonly log: (message: string) => void;
}

export interface AnalyticsRetentionOperatorPreviewCommandInput {
  readonly argv?: readonly string[];
  readonly now?: Date;
  readonly candidateReadRepository: AnalyticsRetentionCandidateReadRepository;
  readonly logger?: AnalyticsRetentionOperatorPreviewCommandLogger;
}

export async function runAnalyticsRetentionOperatorPreviewCommand(
  input: AnalyticsRetentionOperatorPreviewCommandInput,
): Promise<AnalyticsRetentionOperatorPreviewOutput> {
  const splitArgs = splitAnalyticsRetentionExecutionPreviewCommandArgs(
    input.argv ?? process.argv.slice(2),
  );

  const preview =
    await buildAnalyticsRetentionExecutionServiceCandidateReadPreview({
      policy: splitArgs.policy,
      executionArgs: splitArgs.executionArgs,
      ...(input.now === undefined ? {} : { now: input.now }),
      candidateReadRepository: input.candidateReadRepository,
    });

  const output = buildAnalyticsRetentionOperatorPreviewOutput(preview);
  const logger = input.logger ?? console;

  logger.log(JSON.stringify(output, null, 2));

  return output;
}

export async function runAnalyticsRetentionOperatorPreviewPrismaCommand(
  argv = process.argv.slice(2),
): Promise<AnalyticsRetentionOperatorPreviewOutput> {
  const candidateReadRepository =
    createPrismaAnalyticsRetentionCandidateReadRepository(gatewayPrisma);

  try {
    return await runAnalyticsRetentionOperatorPreviewCommand({
      argv,
      candidateReadRepository,
    });
  } finally {
    await disconnectGatewayPrisma();
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
  runAnalyticsRetentionOperatorPreviewPrismaCommand().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(message);
    console.error('');
    console.error(ANALYTICS_RETENTION_OPERATOR_PREVIEW_COMMAND_USAGE);
    process.exitCode = 1;
  });
}
