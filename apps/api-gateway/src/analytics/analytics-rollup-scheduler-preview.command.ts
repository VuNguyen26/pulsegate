import { pathToFileURL } from "node:url";

import type { AnalyticsRollupBackfillService } from "./analytics-rollup-backfill-service.js";
import { buildAnalyticsRollupBackgroundSchedulerOutput } from "./analytics-rollup-background-scheduler-output.js";
import {
  createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviews,
  invokeAnalyticsRollupSchedulerBackfillServiceDryRunAdapters,
  invokeAnalyticsRollupSchedulerBackfillServiceExecuteAdapters,
  type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationResult,
  type AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview,
  type AnalyticsRollupSchedulerBackfillServiceExecuteAdapterInvocationResult,
} from "./analytics-rollup-scheduler-backfill-service-adapter.js";
import {
  mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs,
  mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs,
  type AnalyticsRollupSchedulerBackfillServiceDryRunMapping,
  type AnalyticsRollupSchedulerBackfillServiceExecuteMapping,
} from "./analytics-rollup-scheduler-backfill-request-mapper.js";
import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import {
  parseAnalyticsRollupSchedulerPreviewArgs,
  type AnalyticsRollupSchedulerPreviewCommandOptions,
} from "./analytics-rollup-scheduler-preview-args.js";
import { createAnalyticsRollupSchedulerExecutionDecision } from "./analytics-rollup-scheduler-execution-decision.js";
import {
  createAnalyticsRollupSchedulerRunnerPlan,
  type AnalyticsRollupSchedulerRunnerPlan,
} from "./analytics-rollup-scheduler-runner.js";

export const ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE = [
  "Usage:",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at <iso> --granularity <hour|day> [--enabled <true|false>] [--source <usage|rejected|both>] [--lookback-buckets <n>] [--safety-delay-ms <n>] [--max-buckets <n>] [--execution-trigger <command|process-local|external-scheduler>] [--execution-mode <preview|dry-run|execute>] [--event-limit <n>] [--confirm-execute <true|false>]",
  "",
  "Examples:",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at 2026-07-06T13:07:00.000Z --granularity hour",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-mode execute --event-limit 500 --confirm-execute true",
  "  npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-mode dry-run --event-limit 500",
  "",
  "Safety:",
  "  Background scheduler output is exposed as backgroundScheduler in command JSON; it is operator-visible contract data only and does not start scheduled jobs or open process-local/external scheduler runtime execution.",
  "  Preview only mode is non-invoking, prints an execution boundary decision, and does not invoke backfill service. Direct CLI command dry-run with --event-limit may invoke the backfill service in dry-run mode only; Does not create scheduled jobs, execute backfill, read events, persist rollups, affect quota counting, or delete raw events.",
  "  Command dry-run requests currently remain blocked unless runtime dry-run service invocation is explicitly wired; blocked review output exposes dryRunDesignReview, dryRunInvocationReadiness, dryRunInvocationDesignReview, dryRunServiceInvocationContractReview, dryRunServiceInvocationImplementationDesign, dryRunServiceInvocationWiringReadinessReview, dryRunServiceInvocationFailClosedErrorModel, dryRunServiceInvocationWiringContract, dryRunServiceInvocationRequestMapperDesign, dryRunServiceAdapterBoundaryDesign, dryRunServiceAdapterPreviews, and dryRunInvocationContract only. Runtime dry-run output also exposes dryRunServiceInvocationResults.",
  "  The dry-run invocation contract remains review-only for automatic triggers and execute mode; direct CLI command dry-run is command-triggered, dry-run-only, per-source, event-limit and max-bucket guarded.",
  "  Dry-run backfill service invocation requires explicit implementation design, wiring readiness review, request mapper design, service adapter boundary design, source separation, event limit guardrails, fail-closed service errors, operator safety output, and Docker/PostgreSQL runtime validation before wiring.",
  "  Fail-closed dry-run service error modeling remains operator-review-only and requires blocked output, safety flags, source-scoped error output, no partial persistence, no quota mutation, and no raw event deletion before future wiring.",
  "  The dry-run service invocation wiring contract is non-invoking: command-only, dry-run request/response contract, source-scoped result summary, event-limit guardrail, max-bucket bound, no quota mutation, and no raw event deletion until explicit wiring.",
  "  Command execute requests remain blocked and expose commandExecuteContractReview, commandExecuteReadinessReview, commandExecuteOperatorOutputReview, and commandExecuteWiringPreview; execute wiring preview remains operator-visible and blocked-by-default until explicit operator confirmation, ready runner plan, prior dry-run runtime validation, event-limit guardrail, max-bucket bound, bounded bucket count, source-separated execution, operator safety output, and Docker/PostgreSQL runtime validation before future wiring.",
  "  --confirm-execute true records explicit operator confirmation in command execute wiring preview only; it does not wire execute runtime, invoke backfill service, read events, persist rollups, affect quota counting, or delete raw events by itself.",
  "  Command execute preflight output exposes commandExecutePreflightGuardrailReview so operators can verify ready runner plan, confirmation, event-limit, max-bucket, bounded-bucket, source separation, and prior dry-run validation guardrails before any future execute wiring.",
  "  Command execute runtime blocker output exposes commandExecuteRuntimeInvocationBlockerReview so operators can verify execute service invocation, event reads, rollup persistence, quota impact, raw-event deletion, and Docker/PostgreSQL runtime validation remain blocked until explicit future wiring.",
  "  Command execute persistence barrier output exposes commandExecutePersistenceBarrierReview so operators can verify rollup writes, quota mutations, raw-event deletion, summary read switching, retention delete execution, scheduled jobs, and automatic execute triggers remain blocked.",
  "  Command execute runtime wiring seam output exposes commandExecuteRuntimeWiringSeamReview so operators can verify the execute mapper, execute adapter, explicit execute runtime gate, runtime factory, and Docker/PostgreSQL validation are still required before invoking runBackfill in execute mode.",
  "  Command execute service request mapper contract is model-only: it maps source-scoped runner requests to execute run inputs with explicit operator confirmation and event-limit guardrails, but still does not invoke runBackfill, read events, persist rollups, mutate quota, or delete raw events.",
  "  Command execute service adapter contract is model-only: it validates source-scoped execute run inputs and planned runBackfill boundaries, but still does not invoke the service, read events, persist rollups, mutate quota, or delete raw events.",
  "  Command execute runtime gate contract exposes commandExecuteRuntimeGateReview: the gate remains closed by default, records confirmation/event-limit/mapper/adapter checks, and still does not invoke runBackfill, read events, persist rollups, mutate quota, or delete raw events.",
  "  Command execute injected invocation seam is test-harness-only: it requires an injected backfill service plus explicit dependency opt-in, and direct CLI remains blocked/non-invoking until Docker/PostgreSQL runtime validation.",
  "  Execute contract review scopes future persistence to rollup-tables-only, requires bounded-idempotent-rollup-upsert-or-fail-closed-before-execution rollback expectation, no quota mutation, no raw event deletion, no process-local/external scheduler execution, and no scheduled job creation until explicit wiring.",
  "  --event-limit enables a DB-free command dry-run service adapter preview and, for direct CLI runtime dry-run, gates the backfill service dry-run invocation.",
].join("\n");

export type AnalyticsRollupSchedulerPreviewCommandRuntimeBackfillService = {
  backfillService: AnalyticsRollupBackfillService;
  dispose?: () => Promise<void>;
};

export type AnalyticsRollupSchedulerPreviewCommandDependencies = {
  backfillService?: AnalyticsRollupBackfillService;
  createRuntimeBackfillService?: () =>
    | AnalyticsRollupSchedulerPreviewCommandRuntimeBackfillService
    | Promise<AnalyticsRollupSchedulerPreviewCommandRuntimeBackfillService>;
  allowDryRunServiceInvocation?: boolean;
  allowExecuteServiceInvocation?: boolean;
};

export type AnalyticsRollupSchedulerPreviewCommandRuntimeCleanupError = {
  name: string;
  message: string;
};

export type AnalyticsRollupSchedulerPreviewCommandRuntimeFactoryError = {
  name: string;
  message: string;
};

type AnalyticsRollupSchedulerPreviewCommandDryRunInvocationOutput = {
  dryRunServiceInvocationResults:
    | AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationResult[]
    | null;
  dryRunRuntimeCleanupError: AnalyticsRollupSchedulerPreviewCommandRuntimeCleanupError | null;
  dryRunRuntimeFactoryError: AnalyticsRollupSchedulerPreviewCommandRuntimeFactoryError | null;
};

type AnalyticsRollupSchedulerPreviewCommandExecuteInvocationOutput = {
  executeServiceInvocationResults:
    | AnalyticsRollupSchedulerBackfillServiceExecuteAdapterInvocationResult[]
    | null;
};

function createRuntimeCleanupError(
  error: unknown,
): AnalyticsRollupSchedulerPreviewCommandRuntimeCleanupError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: "Error",
    message: String(error),
  };
}

function createRuntimeFactoryError(
  error: unknown,
): AnalyticsRollupSchedulerPreviewCommandRuntimeFactoryError {
  const runtimeError = createRuntimeCleanupError(error);

  return {
    name: runtimeError.name,
    message: runtimeError.message,
  };
}

async function disposeRuntimeBackfillService(
  runtimeBackfillService:
    | AnalyticsRollupSchedulerPreviewCommandRuntimeBackfillService
    | undefined,
): Promise<AnalyticsRollupSchedulerPreviewCommandRuntimeCleanupError | null> {
  try {
    await runtimeBackfillService?.dispose?.();

    return null;
  } catch (error: unknown) {
    return createRuntimeCleanupError(error);
  }
}

function createExecuteServiceMappingsForCommandExecute(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  options: AnalyticsRollupSchedulerPreviewCommandOptions,
): AnalyticsRollupSchedulerBackfillServiceExecuteMapping[] | null {
  const trigger = options.executionDecision.trigger ?? "command";
  const requestedMode = options.executionDecision.mode ?? "preview";
  const eventLimit = options.dryRunServiceAdapterPreview.eventLimit;
  const commandExecuteOperatorConfirmed =
    options.executionDecision.commandExecuteOperatorConfirmed === true;

  if (
    trigger !== "command" ||
    requestedMode !== "execute" ||
    runnerPlan.status !== "ready" ||
    eventLimit === undefined ||
    commandExecuteOperatorConfirmed !== true
  ) {
    return null;
  }

  return mapAnalyticsRollupSchedulerRunnerPlanToExecuteServiceInputs(
    runnerPlan,
    {
      eventLimit,
      commandExecuteOperatorConfirmed,
    },
  );
}

async function invokeExecuteServiceAdaptersForCommandExecute(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  options: AnalyticsRollupSchedulerPreviewCommandOptions,
  dependencies: AnalyticsRollupSchedulerPreviewCommandDependencies,
): Promise<AnalyticsRollupSchedulerPreviewCommandExecuteInvocationOutput | null> {
  if (dependencies.allowExecuteServiceInvocation !== true) return null;

  const mappings = createExecuteServiceMappingsForCommandExecute(runnerPlan, options);
  if (mappings === null) return null;

  const runtime =
    dependencies.backfillService === undefined &&
    dependencies.createRuntimeBackfillService !== undefined
      ? await dependencies.createRuntimeBackfillService()
      : null;

  try {
    const backfillService = dependencies.backfillService ?? runtime?.backfillService;
    if (backfillService === undefined) return null;

    const executeServiceInvocationResults =
      await invokeAnalyticsRollupSchedulerBackfillServiceExecuteAdapters(
        mappings,
        backfillService,
      );

    return { executeServiceInvocationResults };
  } finally {
    await runtime?.dispose?.();
  }
}

function createDryRunServiceMappingsForCommandDryRun(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  options: AnalyticsRollupSchedulerPreviewCommandOptions,
): AnalyticsRollupSchedulerBackfillServiceDryRunMapping[] | null {
  const trigger = options.executionDecision.trigger ?? "command";
  const requestedMode = options.executionDecision.mode ?? "preview";
  const eventLimit = options.dryRunServiceAdapterPreview.eventLimit;

  if (
    trigger !== "command" ||
    requestedMode !== "dry-run" ||
    runnerPlan.status !== "ready" ||
    eventLimit === undefined
  ) {
    return null;
  }

  return mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(
    runnerPlan,
    { eventLimit },
  );
}

function createDryRunServiceAdapterPreviewsForCommandDryRun(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  options: AnalyticsRollupSchedulerPreviewCommandOptions,
): AnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreview[] | null {
  const mappings = createDryRunServiceMappingsForCommandDryRun(
    runnerPlan,
    options,
  );

  if (mappings === null) {
    return null;
  }

  return createAnalyticsRollupSchedulerBackfillServiceDryRunAdapterPreviews(
    mappings,
  );
}

async function invokeDryRunServiceAdaptersForCommandDryRun(
  runnerPlan: AnalyticsRollupSchedulerRunnerPlan,
  options: AnalyticsRollupSchedulerPreviewCommandOptions,
  dependencies: AnalyticsRollupSchedulerPreviewCommandDependencies,
): Promise<AnalyticsRollupSchedulerPreviewCommandDryRunInvocationOutput | null> {
  if (dependencies.allowDryRunServiceInvocation !== true) {
    return null;
  }

  const mappings = createDryRunServiceMappingsForCommandDryRun(
    runnerPlan,
    options,
  );

  if (mappings === null) {
    return null;
  }

  let runtimeBackfillService:
    | AnalyticsRollupSchedulerPreviewCommandRuntimeBackfillService
    | undefined;

  if (dependencies.backfillService === undefined) {
    try {
      runtimeBackfillService =
        await dependencies.createRuntimeBackfillService?.();
    } catch (error: unknown) {
      return {
        dryRunServiceInvocationResults: null,
        dryRunRuntimeCleanupError: null,
        dryRunRuntimeFactoryError: createRuntimeFactoryError(error),
      };
    }
  }

  const backfillService =
    dependencies.backfillService ?? runtimeBackfillService?.backfillService;

  if (backfillService === undefined) {
    return null;
  }

  let dryRunServiceInvocationResults:
    | AnalyticsRollupSchedulerBackfillServiceDryRunAdapterInvocationResult[]
    | null = null;
  let invocationError: unknown = null;

  try {
    dryRunServiceInvocationResults =
      await invokeAnalyticsRollupSchedulerBackfillServiceDryRunAdapters(
        mappings,
        backfillService,
      );
  } catch (error: unknown) {
    invocationError = error;
  }

  const dryRunRuntimeCleanupError = await disposeRuntimeBackfillService(
    runtimeBackfillService,
  );

  if (invocationError !== null) {
    throw invocationError;
  }

  if (dryRunServiceInvocationResults === null) {
    throw new Error("scheduler dry-run service invocation did not produce results");
  }

  return {
    dryRunServiceInvocationResults,
    dryRunRuntimeCleanupError,
    dryRunRuntimeFactoryError: null,
  };
}

async function createRuntimeAnalyticsRollupSchedulerDryRunBackfillService(): Promise<AnalyticsRollupSchedulerPreviewCommandRuntimeBackfillService> {
  const [
    databaseModule,
    rejectedRollupRepositoryModule,
    eventReaderModule,
    persistenceServiceModule,
    backfillServiceModule,
    usageRollupRepositoryModule,
  ] = await Promise.all([
    import("../database/gateway-prisma.js"),
    import("./analytics-rejected-rollup.repository.js"),
    import("./analytics-rollup-backfill-event-reader.js"),
    import("./analytics-rollup-persistence-service.js"),
    import("./analytics-rollup-backfill-service.js"),
    import("./analytics-usage-rollup.repository.js"),
  ]);

  const usageRollupRepository =
    usageRollupRepositoryModule.createPrismaAnalyticsUsageRollupRepository(
      databaseModule.gatewayPrisma,
    );
  const rejectedRollupRepository =
    rejectedRollupRepositoryModule.createPrismaAnalyticsRejectedRollupRepository(
      databaseModule.gatewayPrisma,
    );
  const persistenceService =
    persistenceServiceModule.createAnalyticsRollupPersistenceService({
      usageRollupRepository,
      rejectedRollupRepository,
    });
  const eventReader =
    eventReaderModule.createPrismaAnalyticsRollupBackfillEventReader(
      databaseModule.gatewayPrisma,
    );
  const backfillService = backfillServiceModule.createAnalyticsRollupBackfillService({
    eventReader,
    persistenceService,
  });

  return {
    backfillService,
    dispose: databaseModule.disconnectGatewayPrisma,
  };
}

type AnalyticsRollupSchedulerPreviewBackgroundSource =
  | "usage"
  | "rejected"
  | "both";

function resolveBackgroundSchedulerSource(
  source: string | undefined,
): AnalyticsRollupSchedulerPreviewBackgroundSource {
  if (source === "usage" || source === "rejected" || source === "both") {
    return source;
  }

  return "both";
}

function createBackgroundSchedulerOutputForCommandOptions(
  options: AnalyticsRollupSchedulerPreviewCommandOptions,
) {
  return buildAnalyticsRollupBackgroundSchedulerOutput({
    trigger: options.executionDecision.trigger ?? "command",
    requestedMode: options.executionDecision.mode ?? "preview",
    backgroundRunnerContractEnabled: true,
    schedulerEnabled: options.schedule.enabled === true,
    runAtIso: options.schedule.runAt.toISOString(),
    granularity: options.schedule.granularity,
    source: resolveBackgroundSchedulerSource(options.schedule.source),
    lookbackBuckets: options.schedule.lookbackBuckets ?? 1,
    maxBuckets:
      options.schedule.maxBuckets ?? options.schedule.lookbackBuckets ?? 1,
    safetyDelayMs: options.schedule.safetyDelayMs ?? 5 * 60 * 1000,
  });
}
export async function runAnalyticsRollupSchedulerPreviewCommand(
  argv = process.argv.slice(2),
  dependencies: AnalyticsRollupSchedulerPreviewCommandDependencies = {},
): Promise<void> {
  const options = parseAnalyticsRollupSchedulerPreviewArgs(argv);
  const schedulePlan = createAnalyticsRollupSchedulePlan(options.schedule);
  const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);
  const dryRunServiceAdapterPreviews =
    createDryRunServiceAdapterPreviewsForCommandDryRun(runnerPlan, options);
  const dryRunServiceInvocationOutput =
    await invokeDryRunServiceAdaptersForCommandDryRun(
      runnerPlan,
      options,
      dependencies,
    );
  const dryRunServiceInvocationResults =
    dryRunServiceInvocationOutput?.dryRunServiceInvocationResults ?? null;
  const dryRunRuntimeCleanupError =
    dryRunServiceInvocationOutput?.dryRunRuntimeCleanupError ?? null;
  const dryRunRuntimeFactoryError =
    dryRunServiceInvocationOutput?.dryRunRuntimeFactoryError ?? null;
  const executeServiceInvocationOutput =
    await invokeExecuteServiceAdaptersForCommandExecute(
      runnerPlan,
      options,
      dependencies,
    );
  const executeServiceInvocationResults =
    executeServiceInvocationOutput?.executeServiceInvocationResults ?? null;
  const executionDecision = createAnalyticsRollupSchedulerExecutionDecision(
    runnerPlan,
    {
      ...options.executionDecision,
      commandExecuteEventLimit: options.dryRunServiceAdapterPreview.eventLimit,
      dryRunServiceAdapterPreviews,
      backfillServiceInvocationWired: dryRunServiceInvocationResults !== null,
      backfillExecutionWired: executeServiceInvocationResults !== null,
    },
  );

  const baseCommandOutput =
    dryRunServiceInvocationResults === null
      ? dryRunRuntimeFactoryError === null
        ? { ...runnerPlan, executionDecision }
        : { ...runnerPlan, executionDecision, dryRunRuntimeFactoryError }
      : dryRunRuntimeCleanupError === null
        ? { ...runnerPlan, executionDecision, dryRunServiceInvocationResults }
        : {
            ...runnerPlan,
            executionDecision,
            dryRunServiceInvocationResults,
            dryRunRuntimeCleanupError,
          };
  const commandOutputWithoutBackgroundScheduler =
    executeServiceInvocationResults === null
      ? baseCommandOutput
      : { ...baseCommandOutput, executeServiceInvocationResults };
  const backgroundScheduler =
    createBackgroundSchedulerOutputForCommandOptions(options);
  const commandOutput = {
    ...commandOutputWithoutBackgroundScheduler,
    backgroundScheduler,
  };

  console.log(JSON.stringify(commandOutput, null, 2));
}

function isDirectRun(): boolean {
  const entrypoint = process.argv[1];

  return (
    entrypoint !== undefined &&
    import.meta.url === pathToFileURL(entrypoint).href
  );
}

if (isDirectRun()) {
  runAnalyticsRollupSchedulerPreviewCommand(process.argv.slice(2), {
    allowDryRunServiceInvocation: true,
    allowExecuteServiceInvocation: true,
    createRuntimeBackfillService:
      createRuntimeAnalyticsRollupSchedulerDryRunBackfillService,
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(message);
    console.error("");
    console.error(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE);
    process.exitCode = 1;
  });
}
