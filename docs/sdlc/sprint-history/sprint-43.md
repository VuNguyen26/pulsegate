# Sprint 43 - Rollup Scheduler Command Dry-Run Service Adapter Preview Output Integration

Date: 2026-07-08

Status: Complete

Version: v0.44.0

## Goal

Expose source-separated command dry-run service adapter preview output through the scheduler preview command before wiring any real rollup backfill service invocation.

Sprint 43 continued the safe rollup scheduler execution path from Sprint 42. It stayed DB-free, preview-only, command-output-only, and non-destructive.

## Changes

### Checkpoint 43.1 - Adapter Preview Output Integration

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview-args.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview-args.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Added --event-limit parsing to scheduler preview args.
- Exposed dryRunServiceAdapterPreviews under dryRunDesignReview for command:dry-run requests when --event-limit is provided.
- Mapped ready scheduler runner backfill requests into dry-run AnalyticsRollupBackfillRunInput contracts before adapter preview creation.
- Produced source-separated adapter previews for usage and rejected mapped inputs.
- Produced planned dry-run service result output without calling AnalyticsRollupBackfillService.runBackfill.
- Kept command dry-run blocked with backfill-service-invocation-not-wired.
- Kept adapter previews non-invoking with invokesBackfillService=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, deletesRawEvents=false, and serviceInvocationCurrentlyAllowed=false.
- Kept process-local dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.

Validation:

- Targeted tests -> 5 test files / 48 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- Full test -> 105 test files / 735 tests passed
- Runtime command validation passed for command:dry-run adapter previews with --event-limit=500.
- Runtime command validation passed for process-local:dry-run remaining blocked without dryRunDesignReview.

Commit:

- 5e87175 feat(gateway): expose rollup scheduler dry-run adapter previews

### Checkpoint 43.2 - Adapter Preview Fail-Closed Boundary Hardening

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview-args.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Hardened equals-style --event-limit parsing.
- Locked command dry-run behavior when --event-limit is omitted: dryRunServiceAdapterPreviews remains null.
- Locked invalid --event-limit fail-fast behavior before printing command output.
- Kept runtime behavior unchanged.

Validation:

- Targeted tests -> 2 test files / 27 tests passed
- Full test -> 105 test files / 738 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Commit:

- 1acf4ea test(gateway): harden rollup scheduler dry-run adapter preview output

## Runtime Command Validation

Validated command dry-run adapter preview output:

- executionDecision.status=blocked
- executionDecision.allowed=false
- executionDecision.blockedReason=backfill-service-invocation-not-wired
- executionDecision.wiringReview.requestedCapability=command:dry-run
- dryRunServiceAdapterPreviews count=2
- usage adapter preview eventLimit=500
- rejected adapter preview eventLimit=500
- adapter preview safety invokesBackfillService=false
- adapter preview safety readsEvents=false
- adapter preview safety persistsRollups=false
- adapter preview safety affectsQuotaCounting=false
- adapter preview safety deletesRawEvents=false
- executionDecision.safety.invokesBackfillService=false
- executionDecision.safety.readsEvents=false
- executionDecision.safety.persistsRollups=false
- executionDecision.safety.affectsQuotaCounting=false
- executionDecision.safety.deletesRawEvents=false

Validated process-local dry-run boundary:

- executionDecision.status=blocked
- executionDecision.allowed=false
- executionDecision.blockedReason=automatic-trigger-not-wired
- executionDecision.wiringReview.requestedCapability=process-local:dry-run
- dryRunDesignReview=null
- executionDecision.safety.invokesBackfillService=false
- executionDecision.safety.readsEvents=false
- executionDecision.safety.persistsRollups=false
- executionDecision.safety.affectsQuotaCounting=false
- executionDecision.safety.deletesRawEvents=false

## Safety Boundaries Preserved

Sprint 43 did not:

- create a scheduled/background rollup job
- invoke the backfill service
- call AnalyticsRollupBackfillService.runBackfill from scheduler preview
- execute backfill
- read raw usage events
- read raw rejected events
- persist usage rollups
- persist rejected rollups
- affect quota counting
- delete raw events
- change usage recorder behavior
- change rejected event recorder behavior
- change rollup read APIs
- switch summary APIs to rollup reads
- touch retention delete execution paths

## Final Validation

Automated validation:

- npm run test -> 105 test files / 738 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime command validation:

- analytics:rollup:scheduler-preview command:dry-run adapter previews with --event-limit=500 -> passed
- analytics:rollup:scheduler-preview process-local:dry-run blocked boundary with --event-limit=500 -> passed

Docker/PostgreSQL validation:

- Not required for Sprint 43 because the scheduler command dry-run adapter preview output integration stayed DB-free, preview-only, command-output-only, and non-destructive.

## Commits

- 5e87175 feat(gateway): expose rollup scheduler dry-run adapter previews
- 1acf4ea test(gateway): harden rollup scheduler dry-run adapter preview output
