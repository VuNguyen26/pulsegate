import { pathToFileURL } from "node:url";

import { disconnectGatewayPrisma, gatewayPrisma } from "../database/gateway-prisma.js";
import { createPrismaAnalyticsRejectedRollupRepository } from "./analytics-rejected-rollup.repository.js";
import {
  ANALYTICS_ROLLUP_BACKFILL_COMMAND_USAGE,
  parseAnalyticsRollupBackfillCommandArgs,
} from "./analytics-rollup-backfill-command-args.js";
import { createPrismaAnalyticsRollupBackfillEventReader } from "./analytics-rollup-backfill-event-reader.js";
import { createAnalyticsRollupBackfillPlan } from "./analytics-rollup-backfill-plan.js";
import { createAnalyticsRollupBackfillService } from "./analytics-rollup-backfill-service.js";
import { createAnalyticsRollupPersistenceService } from "./analytics-rollup-persistence-service.js";
import { createPrismaAnalyticsUsageRollupRepository } from "./analytics-usage-rollup.repository.js";

export async function runAnalyticsRollupBackfillCommand(
  argv = process.argv.slice(2),
): Promise<void> {
  const options = parseAnalyticsRollupBackfillCommandArgs(argv);
  const plan = createAnalyticsRollupBackfillPlan({
    from: options.from,
    to: options.to,
    granularity: options.granularity,
    source: options.source,
    mode: options.mode,
    maxBuckets: options.maxBuckets,
  });

  const usageRollupRepository =
    createPrismaAnalyticsUsageRollupRepository(gatewayPrisma);
  const rejectedRollupRepository =
    createPrismaAnalyticsRejectedRollupRepository(gatewayPrisma);
  const persistenceService = createAnalyticsRollupPersistenceService({
    usageRollupRepository,
    rejectedRollupRepository,
  });
  const eventReader =
    createPrismaAnalyticsRollupBackfillEventReader(gatewayPrisma);
  const backfillService = createAnalyticsRollupBackfillService({
    eventReader,
    persistenceService,
  });

  try {
    const summary = await backfillService.runBackfill({
      plan,
      eventLimit: options.eventLimit,
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
  runAnalyticsRollupBackfillCommand().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(message);
    console.error("");
    console.error(ANALYTICS_ROLLUP_BACKFILL_COMMAND_USAGE);
    process.exitCode = 1;
  });
}
