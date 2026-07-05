import { pathToFileURL } from "node:url";

import {
  disconnectGatewayPrisma,
  gatewayPrisma,
} from "../database/gateway-prisma.js";
import { createPrismaAnalyticsRetentionCandidateReadRepository } from "./analytics-retention-candidate-read.repository.js";
import {
  ANALYTICS_RETENTION_DRY_RUN_COMMAND_USAGE,
  parseAnalyticsRetentionDryRunCommandArgs,
} from "./analytics-retention-dry-run-command-args.js";
import { createAnalyticsRetentionDryRunService } from "./analytics-retention-dry-run-service.js";

export async function runAnalyticsRetentionDryRunCommand(
  argv = process.argv.slice(2),
): Promise<void> {
  const policyInput = parseAnalyticsRetentionDryRunCommandArgs(argv);

  const candidateReadRepository =
    createPrismaAnalyticsRetentionCandidateReadRepository(gatewayPrisma);
  const dryRunService = createAnalyticsRetentionDryRunService(
    candidateReadRepository,
  );

  try {
    const summary = await dryRunService.previewRetention({
      policyInput,
    });

    console.log(JSON.stringify(summary, null, 2));
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
  runAnalyticsRetentionDryRunCommand().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(message);
    console.error("");
    console.error(ANALYTICS_RETENTION_DRY_RUN_COMMAND_USAGE);
    process.exitCode = 1;
  });
}
