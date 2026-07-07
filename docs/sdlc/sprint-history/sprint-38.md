# Sprint 38 - Rollup Scheduler Command Dry-Run Invocation Design Review

## Status

Done.

## Version

v0.39.0

## Date

2026-07-07

---

## Summary

Sprint 38 continued the analytics rollup scheduler safety path after Sprint 37.

The sprint added a command dry-run invocation design review to the scheduler execution decision output. It documents the future command-to-backfill-service dry-run boundary before any real backfill service invocation is wired.

Sprint 38 stayed DB-free, preview-only, and non-destructive.

---

## Commits

- 2a203f5 feat(gateway): add rollup scheduler dry-run invocation design review
- 33b8b6d test(gateway): document rollup scheduler dry-run invocation design review

---

## Checkpoints

### Checkpoint 38.1 - Command Dry-Run Invocation Design Review Output

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts

Behavior:

- Added dryRunInvocationDesignReview under dryRunDesignReview for command:dry-run requests.
- Documented the future command-to-backfill-service dry-run boundary.
- Kept command dry-run blocked with backfill-service-invocation-not-wired.
- Kept current invocation state not wired.
- Kept commandTriggerRequired=true.
- Kept automaticTriggerAllowed=false.
- Kept executionModeAllowed=false.
- Kept dryRunMayReadEvents=false.
- Kept dryRunMayPersistRollups=false.
- Kept dryRunMayAffectQuotaCounting=false.
- Kept dryRunMayDeleteRawEvents=false.
- Required per-source invocation, source separation, event limit guardrails, max bucket guardrails, and Docker/PostgreSQL runtime validation before future wiring.

### Checkpoint 38.2 - Command Output Contract Coverage

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Added command-level JSON output coverage for dryRunInvocationDesignReview.
- Confirmed command:dry-run remains blocked.
- Confirmed source=both keeps planned usage and rejected dry-run request contracts separate.
- Confirmed safety fields remain non-destructive:
  - invokesBackfillService=false
  - executesBackfill=false
  - readsEvents=false
  - persistsRollups=false
  - affectsQuotaCounting=false
  - deletesRawEvents=false

### Checkpoint 38.3 - Usage Text Contract Update

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Updated scheduler preview usage text to mention:
  - dryRunInvocationReadiness
  - dryRunInvocationDesignReview
  - dryRunInvocationContract
- Added usage text assertions so operator-facing docs stay aligned with command output.

---

## Final Validation

Automated validation:

- npm run test -> 103 test files / 716 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime command validation:

- analytics:rollup:scheduler-preview command dry-run invocation design review validation passed.
- analytics:rollup:scheduler-preview process-local dry-run blocked boundary validation passed.

No Docker/PostgreSQL validation was required because Sprint 38 stayed DB-free, preview-only, and non-destructive.

---

## Safety Boundaries Preserved

Sprint 38 did not:

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

Sprint 39 can choose one of two safe directions:

1. Rollup Scheduler Command Dry-Run Service Invocation Contract Review
   - Decide whether command-triggered dry-run may invoke the backfill service.
   - Define the exact service dry-run contract, source separation, event limit guardrails, max bucket guardrails, operator output, failure behavior, and Docker/PostgreSQL runtime validation before wiring.
   - Keep execute mode blocked.

2. Analytics Retention Execution Design Review
   - Keep destructive execution unavailable.
   - Define command/API semantics, operator controls, hard delete limit behavior, candidate recheck, rollback expectations, and runtime validation before wiring deleteCandidates.