import { describe, expect, it } from "vitest";

import { createAnalyticsRollupSchedulePlan } from "./analytics-rollup-schedule-plan.js";
import {
  mapAnalyticsRollupSchedulerBackfillRequestToDryRunServiceInput,
  mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs,
} from "./analytics-rollup-scheduler-backfill-request-mapper.js";
import type { AnalyticsRollupSchedulerBackfillRequest } from "./analytics-rollup-scheduler-runner.js";
import { createAnalyticsRollupSchedulerRunnerPlan } from "./analytics-rollup-scheduler-runner.js";

describe("analytics rollup scheduler backfill request mapper", () => {
  it("should map a ready scheduler request to a non-invoking dry-run service input", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const mappings = mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(
      runnerPlan,
      { eventLimit: 5000 },
    );

    expect(mappings).toHaveLength(1);
    expect(mappings[0]?.source).toBe("usage");
    expect(mappings[0]?.runInput.eventLimit).toBe(5000);
    expect(mappings[0]?.runInput.plan.source).toBe("usage");
    expect(mappings[0]?.runInput.plan.sources).toEqual(["usage"]);
    expect(mappings[0]?.runInput.plan.mode).toBe("dry-run");
    expect(mappings[0]?.runInput.plan.windowPlan.granularity).toBe("hour");
    expect(mappings[0]?.runInput.plan.windowPlan.requestedFrom).toEqual(
      new Date("2026-07-06T12:00:00.000Z"),
    );
    expect(mappings[0]?.runInput.plan.windowPlan.requestedTo).toEqual(
      new Date("2026-07-06T13:00:00.000Z"),
    );
    expect(mappings[0]?.runInput.plan.windowPlan.bucketCount).toBe(1);
    expect(mappings[0]?.safety).toEqual({
      mapperOnly: true,
      invokesBackfillService: false,
      readsEvents: false,
      persistsRollups: false,
      affectsQuotaCounting: false,
      deletesRawEvents: false,
      sourceSeparationPreserved: true,
      eventLimitGuardrailApplied: true,
      maxBucketGuardrailApplied: true,
      serviceInvocationCurrentlyAllowed: false,
    });
  });

  it("should preserve source separation by creating one dry-run input per planned source", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "both",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    const mappings = mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(
      runnerPlan,
      { eventLimit: 5000 },
    );

    expect(mappings.map((mapping) => mapping.source)).toEqual([
      "usage",
      "rejected",
    ]);
    expect(mappings.map((mapping) => mapping.runInput.plan.source)).toEqual([
      "usage",
      "rejected",
    ]);
    expect(mappings.map((mapping) => mapping.runInput.plan.sources)).toEqual([
      ["usage"],
      ["rejected"],
    ]);
    expect(
      mappings.every((mapping) => mapping.runInput.plan.mode === "dry-run"),
    ).toBe(true);
    expect(
      mappings.every(
        (mapping) =>
          mapping.safety.mapperOnly === true &&
          mapping.safety.invokesBackfillService === false &&
          mapping.safety.readsEvents === false &&
          mapping.safety.persistsRollups === false,
      ),
    ).toBe(true);
  });

  it("should fail closed when the scheduler runner plan is not ready", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: false,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    expect(() =>
      mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(runnerPlan, {
        eventLimit: 5000,
      }),
    ).toThrow(
      "scheduler runner plan must be ready before mapping dry-run service inputs",
    );
  });

  it("should fail closed before mapping an unsafe scheduler request", () => {
    const unsafeRequest = {
      source: "usage",
      mode: "dry-run",
      from: new Date("2026-07-06T12:00:00.000Z"),
      to: new Date("2026-07-06T13:00:00.000Z"),
      granularity: "hour",
      bucketCount: 1,
      willInvokeBackfillService: false,
      willReadEvents: true,
      willPersistRollups: false,
    } as unknown as AnalyticsRollupSchedulerBackfillRequest;

    expect(() =>
      mapAnalyticsRollupSchedulerBackfillRequestToDryRunServiceInput(
        unsafeRequest,
        { eventLimit: 5000 },
      ),
    ).toThrow(
      "scheduler backfill service mapper requires a non-invoking request contract",
    );
  });

  it("should require an explicit positive event limit guardrail", () => {
    const schedulePlan = createAnalyticsRollupSchedulePlan({
      enabled: true,
      runAt: new Date("2026-07-06T13:07:00.000Z"),
      granularity: "hour",
      source: "usage",
    });
    const runnerPlan = createAnalyticsRollupSchedulerRunnerPlan(schedulePlan);

    expect(() =>
      mapAnalyticsRollupSchedulerRunnerPlanToDryRunServiceInputs(runnerPlan, {
        eventLimit: 0,
      }),
    ).toThrow("eventLimit must be a positive integer");
  });
});