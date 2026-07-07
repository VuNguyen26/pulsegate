# Sprint 37 - Rollup Scheduler Command Dry-Run Invocation Contract Design

## Status

Done.

## Version

v0.38.0

## Date

2026-07-07

---

## Summary

Sprint 37 continued the analytics rollup scheduler safety path after Sprint 36.

The sprint made command-triggered dry-run invocation requirements visible in operator JSON output without wiring real backfill service invocation. It added a dry-run invocation contract, source-aware readiness output, and skipped-runner regression coverage while keeping scheduler execution DB-free, preview-only, and non-destructive.

---

## Commits

- c3c2d6d feat(gateway): add rollup scheduler dry-run invocation contract
- 15d467e feat(gateway): add rollup scheduler dry-run readiness review
- 9974fd8 test(gateway): harden rollup scheduler dry-run readiness boundary

---

## Checkpoints

### Checkpoint 37.1 - Command Dry-Run Invocation Contract Metadata

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Added dryRunInvocationContract under dryRunDesignReview for command:dry-run requests.
- Kept command dry-run blocked with backfill-service-invocation-not-wired.
- Made the future invocation boundary explicit:
  - command-only
  - dry-run-only
  - scheduler-runner-plan sourced
  - per-source invocation required
  - source separation required
  - event limit guardrail required
  - max bucket guardrail required
  - Docker/PostgreSQL runtime validation required
- Kept all current invocation permissions false:
  - serviceInvocationCurrentlyAllowed=false
  - eventReadCurrentlyAllowed=false
  - rollupPersistenceCurrentlyAllowed=false
  - quotaCountingChangeAllowed=false
  - rawEventDeletionAllowed=false

### Checkpoint 37.2 - Source-Aware Dry-Run Invocation Readiness

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Added dryRunInvocationReadiness under dryRunDesignReview for command:dry-run requests.
- Derived readiness from the scheduler runner plan.
- Exposed:
  - plannedBackfillRequestCount
  - plannedSources
  - plannedGranularity
  - backfillRequestsDerivedFromRunnerPlan=true
  - allPlannedRequestsDryRunOnly
  - canInvokeBackfillService=false
  - canReadEvents=false
  - canPersistRollups=false
- Confirmed usage and rejected source separation remains visible for source=both.

### Checkpoint 37.3 - Disabled Command Dry-Run Readiness Regression

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts

Behavior:

- Added regression coverage for command:dry-run when the scheduler runner plan is skipped.
- Confirmed skipped runner plans report:
  - blockedReason=scheduler-runner-not-ready
  - backfillRequestCount=0
  - dryRunInvocationReadiness.reason=scheduler-runner-not-ready
  - plannedBackfillRequestCount=0
- Preserved non-destructive safety fields.

---

## Final Validation

Automated validation:

- npm run test -> 103 test files / 714 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime command validation:

- analytics:rollup:scheduler-preview command dry-run readiness validation passed.
- analytics:rollup:scheduler-preview process-local dry-run blocked boundary validation passed.

Runtime command dry-run output confirmed:

- executionDecision.status=blocked
- executionDecision.allowed=false
- executionDecision.blockedReason=backfill-service-invocation-not-wired
- dryRunDesignReview.status=design-required
- dryRunInvocationReadiness.status=not-ready
- dryRunInvocationReadiness.reason=backfill-service-invocation-not-wired
- dryRunInvocationReadiness.plannedBackfillRequestCount=2 for source=both
- dryRunInvocationReadiness.plannedSources=["usage","rejected"]
- dryRunInvocationReadiness.allPlannedRequestsDryRunOnly=true
- dryRunInvocationReadiness.canInvokeBackfillService=false
- dryRunInvocationReadiness.canReadEvents=false
- dryRunInvocationReadiness.canPersistRollups=false
- dryRunInvocationContract.currentInvocationState=not-wired
- dryRunInvocationContract.triggerBoundary=command-only
- dryRunInvocationContract.requiredBackfillMode=dry-run
- dryRunInvocationContract.serviceInvocationCurrentlyAllowed=false
- dryRunInvocationContract.eventReadCurrentlyAllowed=false
- dryRunInvocationContract.rollupPersistenceCurrentlyAllowed=false
- dryRunInvocationContract.quotaCountingChangeAllowed=false
- dryRunInvocationContract.rawEventDeletionAllowed=false

Runtime process-local dry-run output confirmed:

- executionDecision.status=blocked
- executionDecision.allowed=false
- executionDecision.blockedReason=automatic-trigger-not-wired
- executionDecision.wiringReview.requestedCapability=process-local:dry-run
- executionDecision.wiringReview.recommendedNextStep=keep-automatic-triggers-unwired
- executionDecision.wiringReview.dryRunDesignReview=null

No Docker/PostgreSQL validation was required because Sprint 37 stayed DB-free, preview-only, and non-destructive.

---

## Safety Boundaries Preserved

Sprint 37 did not:

- Create a scheduled/background rollup job.
- Wire process-local execution.
- Wire external scheduler execution.
- Invoke the backfill service.
- Execute backfill.
- Read raw usage events.
- Read raw rejected events.
- Persist usage rollups.
- Persist rejected rollups.
- Change quota counting.
- Change the usage recorder.
- Change the rejected event recorder.
- Switch summary APIs to rollup reads.
- Delete raw events.
- Touch retention execution/delete paths.

---

## Next Recommended Direction

Sprint 38 can choose one of two safe directions:

1. Rollup Scheduler Command Dry-Run Invocation Design Review
   - Decide whether command-triggered dry-run may invoke the backfill service.
   - Define service dry-run semantics, source separation, event limit guardrails, max bucket guardrails, operator output, and Docker/PostgreSQL runtime validation before wiring.
   - Keep execute mode blocked.

2. Analytics Retention Execution Design Review
   - Keep destructive execution unavailable.
   - Define command/API semantics, operator controls, hard delete limit behavior, candidate recheck, rollback expectations, and runtime validation before wiring deleteCandidates.