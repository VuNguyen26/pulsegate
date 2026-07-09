
import { describe, expect, it, vi } from "vitest";

import { runAnalyticsRollupSchedulerPreviewCommand } from "./analytics-rollup-scheduler-preview.command.js";

const confirmedExecuteArgs = [
  "--enabled",
  "true",
  "--source",
  "both",
  "--run-at",
  "2026-07-06T13:07:00.000Z",
  "--granularity",
  "hour",
  "--lookback-buckets",
  "1",
  "--safety-delay-ms",
  "300000",
  "--max-buckets",
  "1",
  "--execution-mode",
  "execute",
  "--event-limit",
  "500",
  "--confirm-execute",
  "true",
];

async function runCommand(argv: string[], dependencies: Record<string, unknown> = {}) {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

  try {
    await runAnalyticsRollupSchedulerPreviewCommand(argv, dependencies);
    expect(logSpy).toHaveBeenCalledTimes(1);

    return JSON.parse(String(logSpy.mock.calls[0]?.[0]));
  } finally {
    logSpy.mockRestore();
  }
}

function createRuntimeBackfillServiceFactory() {
  const runBackfill = vi.fn(async (input: any) => {
    const { plan } = input;

    return {
      mode: plan.mode,
      source: plan.source,
      sources: plan.sources,
      granularity: plan.windowPlan.granularity,
      requestedFrom: plan.windowPlan.requestedFrom,
      requestedTo: plan.windowPlan.requestedTo,
      rebuildFrom: plan.windowPlan.rebuildFrom,
      rebuildTo: plan.windowPlan.rebuildTo,
      bucketCount: plan.windowPlan.bucketCount,
      sourceResults: plan.sources.map((source: string) => ({
        source,
        status: "executed",
        inputEventCount: 0,
        aggregateCount: 0,
        upsertedCount: 0,
      })),
      totalInputEventCount: 0,
      totalAggregateCount: 0,
      totalUpsertedCount: 0,
    };
  });
  const dispose = vi.fn(async () => undefined);
  const createRuntimeBackfillService = vi.fn(async () => ({
    backfillService: {
      runBackfill,
    },
    dispose,
  }));

  return {
    createRuntimeBackfillService,
    dispose,
    runBackfill,
  };
}

describe("analytics rollup scheduler preview command execute runtime safety", () => {
  it("should resolve the runtime execute backfill service factory only for confirmed command execute", async () => {
    const runtime = createRuntimeBackfillServiceFactory();

    const output = await runCommand(confirmedExecuteArgs, {
      allowExecuteServiceInvocation: true,
      createRuntimeBackfillService: runtime.createRuntimeBackfillService,
    });

    expect(runtime.createRuntimeBackfillService).toHaveBeenCalledTimes(1);
    expect(runtime.runBackfill).toHaveBeenCalledTimes(2);
    expect(runtime.dispose).toHaveBeenCalledTimes(1);
    expect(output.executionDecision).toMatchObject({
      status: "execute-ready",
      blockedReason: null,
      boundary: {
        backfillExecutionWired: true,
      },
      wiringReview: {
        commandExecuteRuntimeGateReview: {
          status: "runtime-gate-open",
          gateDecision: {
            runtimeInvocationAllowed: true,
            willInvokeBackfillService: true,
            willExecuteBackfill: true,
            willReadEvents: true,
            willPersistRollups: true,
            willMutateQuotaCounting: false,
            willDeleteRawEvents: false,
          },
        },
      },
      safety: {
        invokesBackfillService: true,
        executesBackfill: true,
        readsEvents: true,
        persistsRollups: true,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
    expect(output.executeServiceInvocationResults).toHaveLength(2);
    expect(output.executeServiceInvocationResults.map((result: any) => result.source)).toEqual([
      "usage",
      "rejected",
    ]);
  });

  it("should not resolve the runtime execute factory when operator confirmation is missing", async () => {
    const runtime = createRuntimeBackfillServiceFactory();
    const args = confirmedExecuteArgs.filter((arg, index, all) => {
      return arg !== "--confirm-execute" && all[index - 1] !== "--confirm-execute";
    });

    const output = await runCommand(args, {
      allowExecuteServiceInvocation: true,
      createRuntimeBackfillService: runtime.createRuntimeBackfillService,
    });

    expect(runtime.createRuntimeBackfillService).not.toHaveBeenCalled();
    expect(runtime.runBackfill).not.toHaveBeenCalled();
    expect(runtime.dispose).not.toHaveBeenCalled();
    expect(output.executeServiceInvocationResults).toBeUndefined();
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      blockedReason: "backfill-execution-not-wired",
      boundary: {
        backfillExecutionWired: false,
      },
      wiringReview: {
        commandExecuteRuntimeGateReview: {
          status: "runtime-gate-closed",
          gateDecision: {
            runtimeInvocationAllowed: false,
            willInvokeBackfillService: false,
            willExecuteBackfill: false,
            willReadEvents: false,
            willPersistRollups: false,
          },
        },
      },
    });
  });

  it("should not resolve the runtime execute factory when event limit is missing", async () => {
    const runtime = createRuntimeBackfillServiceFactory();
    const args = confirmedExecuteArgs.filter((arg, index, all) => {
      return arg !== "--event-limit" && all[index - 1] !== "--event-limit";
    });

    const output = await runCommand(args, {
      allowExecuteServiceInvocation: true,
      createRuntimeBackfillService: runtime.createRuntimeBackfillService,
    });

    expect(runtime.createRuntimeBackfillService).not.toHaveBeenCalled();
    expect(runtime.runBackfill).not.toHaveBeenCalled();
    expect(runtime.dispose).not.toHaveBeenCalled();
    expect(output.executeServiceInvocationResults).toBeUndefined();
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      blockedReason: "backfill-execution-not-wired",
      boundary: {
        backfillExecutionWired: false,
      },
      wiringReview: {
        commandExecuteRuntimeGateReview: {
          status: "runtime-gate-closed",
          gateChecks: {
            explicitEventLimit: {
              required: true,
              satisfied: false,
            },
          },
          gateDecision: {
            runtimeInvocationAllowed: false,
            willInvokeBackfillService: false,
            willExecuteBackfill: false,
            willReadEvents: false,
            willPersistRollups: false,
          },
        },
      },
    });
  });

  it("should keep execute non-invoking unless execute service invocation is explicitly enabled", async () => {
    const runtime = createRuntimeBackfillServiceFactory();

    const output = await runCommand(confirmedExecuteArgs, {
      createRuntimeBackfillService: runtime.createRuntimeBackfillService,
    });

    expect(runtime.createRuntimeBackfillService).not.toHaveBeenCalled();
    expect(runtime.runBackfill).not.toHaveBeenCalled();
    expect(runtime.dispose).not.toHaveBeenCalled();
    expect(output.executeServiceInvocationResults).toBeUndefined();
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      blockedReason: "backfill-execution-not-wired",
      boundary: {
        backfillExecutionWired: false,
      },
    });
  });
});
