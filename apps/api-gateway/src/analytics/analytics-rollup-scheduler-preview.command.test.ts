import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE,
  runAnalyticsRollupSchedulerPreviewCommand,
} from "./analytics-rollup-scheduler-preview.command.js";

describe("analytics rollup scheduler preview command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print a scheduler runner preview JSON without executing rollup work", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
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
    ]);

    expect(consoleLog).toHaveBeenCalledOnce();

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output).toMatchObject({
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      enabled: true,
      status: "ready",
      scheduleStatus: "planned",
      skipReason: null,
      source: "both",
      sources: ["usage", "rejected"],
      granularity: "hour",
      runAt: "2026-07-06T13:07:00.000Z",
      effectiveTo: "2026-07-06T13:00:00.000Z",
      bucketCount: 1,
      backfillRequests: [
        {
          source: "usage",
          mode: "dry-run",
          from: "2026-07-06T12:00:00.000Z",
          to: "2026-07-06T13:00:00.000Z",
          granularity: "hour",
          bucketCount: 1,
          willInvokeBackfillService: false,
          willReadEvents: false,
          willPersistRollups: false,
        },
        {
          source: "rejected",
          mode: "dry-run",
          from: "2026-07-06T12:00:00.000Z",
          to: "2026-07-06T13:00:00.000Z",
          granularity: "hour",
          bucketCount: 1,
          willInvokeBackfillService: false,
          willReadEvents: false,
          willPersistRollups: false,
        },
      ],
      safety: {
        previewOnly: true,
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
    expect(output.executionDecision).toMatchObject({
      kind: "analytics-rollup-scheduler-execution-decision",
      status: "preview-ready",
      allowed: true,
      blockedReason: null,
      runnerStatus: "ready",
      scheduleStatus: "planned",
      source: "both",
      sources: ["usage", "rejected"],
      granularity: "hour",
      runAt: "2026-07-06T13:07:00.000Z",
      effectiveTo: "2026-07-06T13:00:00.000Z",
      bucketCount: 1,
      backfillRequestCount: 2,
      boundary: {
        trigger: "command",
        requestedMode: "preview",
        allowedMode: "preview",
        commandTriggeredOnly: true,
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      safety: {
        previewOnly: true,
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should print a skipped scheduler preview for a disabled schedule", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--source",
      "usage",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output).toMatchObject({
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      enabled: false,
      status: "skipped",
      scheduleStatus: "disabled",
      skipReason: "schedule-disabled",
      source: "usage",
      sources: ["usage"],
      effectiveTo: null,
      bucketCount: 0,
      backfillRequests: [],
      safety: {
        previewOnly: true,
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
    expect(output.executionDecision).toMatchObject({
      kind: "analytics-rollup-scheduler-execution-decision",
      status: "blocked",
      allowed: false,
      blockedReason: "scheduler-runner-not-ready",
      runnerStatus: "skipped",
      scheduleStatus: "disabled",
      backfillRequestCount: 0,
      boundary: {
        trigger: "command",
        requestedMode: "preview",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      safety: {
        previewOnly: true,
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should print a blocked execution decision for unwired automatic scheduler triggers", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-trigger",
      "process-local",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.status).toBe("ready");
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "process-local",
        requestedMode: "preview",
        allowedMode: "preview",
        commandTriggeredOnly: true,
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
      },
      safety: {
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
      },
    });
  });

  it("should keep automatic dry-run command requests blocked before command dry-run design review", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-trigger",
      "process-local",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.status).toBe("ready");
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "automatic-trigger-not-wired",
      boundary: {
        trigger: "process-local",
        requestedMode: "dry-run",
        allowedMode: "preview",
        commandTriggeredOnly: true,
        processLocalExecutionWired: false,
        externalSchedulerExecutionWired: false,
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      wiringReview: {
        requestedCapability: "process-local:dry-run",
        recommendedNextStep: "keep-automatic-triggers-unwired",
        dryRunDesignReview: null,
        automaticTriggersRemainUnwired: true,
      },
      safety: {
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should print a blocked execution decision for unwired backfill service dry-run mode", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.status).toBe("ready");
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "dry-run",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      safety: {
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should print a blocked execution decision for unwired backfill execution modes", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "execute",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.status).toBe("ready");
    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "execute",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      safety: {
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should accept equals-style args while keeping scheduler execution preview-only", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled=true",
      "--source=usage",
      "--run-at=2026-07-06T13:07:00.000Z",
      "--granularity=hour",
      "--execution-mode=execute",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output).toMatchObject({
      kind: "analytics-rollup-scheduler-runner",
      mode: "preview",
      status: "ready",
      source: "usage",
      sources: ["usage"],
      safety: {
        previewOnly: true,
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
    expect(output.executionDecision).toMatchObject({
      kind: "analytics-rollup-scheduler-execution-decision",
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-execution-not-wired",
      boundary: {
        trigger: "command",
        requestedMode: "execute",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
      safety: {
        previewOnly: true,
        createsScheduledJob: false,
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose scheduler execution wiring review without wiring execution", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      wiringReview: {
        currentCapability: "command-preview-only",
        requestedCapability: "command:dry-run",
        recommendedNextStep: "design-command-dry-run-backfill-service-invocation",
        requiresExplicitDesignBeforeWiring: true,
        requiresDockerPostgresValidationBeforeWiring: true,
        dryRunDesignReview: {
          status: "design-required",
          requestedCapability: "command:dry-run",
          invocationBoundary: "backfill-service-dry-run-invocation",
          currentlyWired: false,
          mustRemainNonDestructive: true,
          requiresExplicitCommandInvocation: true,
          requiresBackfillServiceDryRunContract: true,
          requiresEventLimitGuardrail: true,
          requiresSourceSeparation: true,
          requiresDockerPostgresRuntimeValidation: true,
          quotaCountingMustRemainUnchanged: true,
          rawEventDeletionForbidden: true,
          dryRunInvocationReadiness: {
            status: "not-ready",
            reason: "backfill-service-invocation-not-wired",
            plannedBackfillRequestCount: 1,
            plannedSources: ["usage"],
            plannedGranularity: "hour",
            backfillRequestsDerivedFromRunnerPlan: true,
            allPlannedRequestsDryRunOnly: true,
            canInvokeBackfillService: false,
            canReadEvents: false,
            canPersistRollups: false,
          },
          dryRunInvocationContract: {
            status: "contract-required-before-wiring",
            currentInvocationState: "not-wired",
            triggerBoundary: "command-only",
            requiredBackfillMode: "dry-run",
            backfillRequestSource: "scheduler-runner-plan",
            perSourceInvocationRequired: true,
            sourceSeparationRequired: true,
            eventLimitGuardrailRequired: true,
            maxBucketGuardrailRequired: true,
            dockerPostgresRuntimeValidationRequired: true,
            serviceInvocationCurrentlyAllowed: false,
            eventReadCurrentlyAllowed: false,
            rollupPersistenceCurrentlyAllowed: false,
            quotaCountingChangeAllowed: false,
            rawEventDeletionAllowed: false,
          },
        },
        automaticTriggersRemainUnwired: true,
        executeRemainsUnwired: true,
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });

  it("should expose command dry-run invocation design review in command output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "both",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
      "--execution-mode",
      "dry-run",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.executionDecision).toMatchObject({
      status: "blocked",
      allowed: false,
      blockedReason: "backfill-service-invocation-not-wired",
      wiringReview: {
        requestedCapability: "command:dry-run",
        dryRunDesignReview: {
          currentlyWired: false,
          dryRunInvocationDesignReview: {
            status: "review-required-before-wiring",
            proposedInvocationBoundary: "command-to-backfill-service-dry-run",
            proposedBackfillMode: "dry-run",
            invocationSource: "scheduler-runner-backfill-requests",
            commandTriggerRequired: true,
            automaticTriggerAllowed: false,
            executionModeAllowed: false,
            dryRunMayInvokeBackfillServiceAfterExplicitWiring: true,
            dryRunMayReadEvents: false,
            dryRunMayPersistRollups: false,
            dryRunMayAffectQuotaCounting: false,
            dryRunMayDeleteRawEvents: false,
            requiresPerSourceInvocation: true,
            requiresSourceSeparation: true,
            requiresEventLimitGuardrail: true,
            requiresMaxBucketGuardrail: true,
            requiresDockerPostgresRuntimeValidation: true,
          },
          dryRunInvocationReadiness: {
            plannedBackfillRequestCount: 2,
            plannedSources: ["usage", "rejected"],
            allPlannedRequestsDryRunOnly: true,
            canInvokeBackfillService: false,
            canReadEvents: false,
            canPersistRollups: false,
          },
          dryRunServiceInvocationContractReview: {
            status: "review-required-before-service-invocation",
            serviceBoundary: "scheduler-command-to-rollup-backfill-service",
            currentServiceInvocationState: "not-wired",
            allowedTrigger: "command",
            allowedBackfillMode: "dry-run",
            requestSource: "scheduler-runner-backfill-requests",
            invocationCardinality: "per-source-backfill-request",
            requiresReadyRunnerPlan: true,
            requiresDryRunRequestMode: true,
            requiresNonInvokingPreviewBeforeWiring: true,
            requiresEventLimitGuardrail: true,
            requiresMaxBucketGuardrail: true,
            requiresSourceSeparation: true,
            requiresDockerPostgresRuntimeValidation: true,
            serviceInvocationCurrentlyAllowed: false,
            dryRunServiceMayReadEvents: false,
            dryRunServiceMayPersistRollups: false,
            quotaCountingChangeAllowed: false,
            rawEventDeletionAllowed: false,
            failureBehavior: "fail-closed-before-service-invocation",
          },
        },
      },
      safety: {
        invokesBackfillService: false,
        executesBackfill: false,
        readsEvents: false,
        persistsRollups: false,
        affectsQuotaCounting: false,
        deletesRawEvents: false,
      },
    });
  });
  it("should reject invalid args before printing output", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await expect(
      runAnalyticsRollupSchedulerPreviewCommand([
        "--run-at",
        "invalid-date",
        "--granularity",
        "hour",
      ]),
    ).rejects.toThrow(RangeError);

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("should document scheduler preview safety boundaries in usage text", () => {
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "analytics:rollup:scheduler-preview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "--execution-trigger <command|process-local|external-scheduler>",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "--execution-mode <preview|dry-run|execute>",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Preview only",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "execution boundary decision",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Does not create scheduled jobs",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "invoke backfill service",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "execute backfill",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "read events",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "persist rollups",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "affect quota counting",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "delete raw events",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Command dry-run requests currently remain blocked",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunDesignReview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunInvocationReadiness",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunInvocationDesignReview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunServiceInvocationContractReview",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "dryRunInvocationContract",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "review-only",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "max-bucket",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "source separation",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "event limit guardrails",
    );
    expect(ANALYTICS_ROLLUP_SCHEDULER_PREVIEW_COMMAND_USAGE).toContain(
      "Docker/PostgreSQL runtime validation",
    );
  });

  it("should expose only non-executing dry-run backfill request contracts", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await runAnalyticsRollupSchedulerPreviewCommand([
      "--enabled",
      "true",
      "--source",
      "usage",
      "--run-at",
      "2026-07-06T13:07:00.000Z",
      "--granularity",
      "hour",
    ]);

    const output = JSON.parse(consoleLog.mock.calls[0]?.[0] as string);

    expect(output.backfillRequests).toHaveLength(1);
    expect(output.backfillRequests[0]).toMatchObject({
      source: "usage",
      mode: "dry-run",
      willInvokeBackfillService: false,
      willReadEvents: false,
      willPersistRollups: false,
    });
    expect(output.executionDecision).toMatchObject({
      status: "preview-ready",
      allowed: true,
      boundary: {
        trigger: "command",
        requestedMode: "preview",
        allowedMode: "preview",
        backfillServiceInvocationWired: false,
        backfillExecutionWired: false,
      },
    });
    expect(output.safety).toEqual({
      previewOnly: true,
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
    expect(output.executionDecision.safety).toEqual({
      previewOnly: true,
      createsScheduledJob: false,
      invokesBackfillService: false,
      executesBackfill: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
    });
  });
});