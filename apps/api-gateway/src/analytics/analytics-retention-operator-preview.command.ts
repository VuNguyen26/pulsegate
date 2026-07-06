import type {
  AnalyticsRetentionCandidateReadRepository,
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
