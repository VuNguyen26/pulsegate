# Decision: Analytics Rollup Scheduler Command Dry-Run Service Invocation Request Mapper Design

Date: 2026-07-08

Status: Accepted

## Context

Sprint 40 made the command dry-run service invocation implementation boundary visible while keeping scheduler execution DB-free, preview-only, and non-destructive.

Before any scheduler command can invoke the rollup backfill service, PulseGate needs a request mapper boundary that is explicit, source-separated, guarded, and test-covered.

## Decision

Add a mapper-only request mapping boundary for scheduler command dry-run service invocation design.

The mapper:

- Accepts scheduler runner dry-run backfill request contracts.
- Produces dry-run AnalyticsRollupBackfillRunInput contracts.
- Preserves one mapped input per planned source.
- Requires a ready scheduler runner plan before runner-level mapping.
- Requires dry-run request mode.
- Requires non-invoking request contracts.
- Requires an explicit positive eventLimit.
- Maps maxBuckets from the scheduler request bucketCount.
- Fails closed before service invocation when request safety is invalid.

Expose dryRunServiceInvocationRequestMapperDesign under dryRunDesignReview for command:dry-run scheduler preview output.

## Safety Constraints

Sprint 41 keeps:

- command dry-run blocked with backfill-service-invocation-not-wired
- process-local dry-run blocked with automatic-trigger-not-wired
- serviceInvocationCurrentlyAllowed=false
- mapperMayInvokeBackfillService=false
- mapperMayReadEvents=false
- mapperMayPersistRollups=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false

Sprint 41 does not:

- create scheduled/background jobs
- invoke the backfill service
- execute backfill
- read raw usage events
- read raw rejected events
- persist rollups
- change quota counting
- delete raw events
- wire retention delete execution

## Consequences

Future scheduler command dry-run service invocation must still define the service adapter boundary and failure behavior before any real service call is wired.

Docker/PostgreSQL runtime validation is still required before future wiring that invokes the backfill service, reads events, or persists rollups.

## Validation

- npm run test -> 104 test files / 725 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- analytics:rollup:scheduler-preview command dry-run runtime validation -> passed
- analytics:rollup:scheduler-preview process-local dry-run runtime validation -> passed

Docker/PostgreSQL validation was not required because this decision stayed DB-free, mapper-only, preview-only, and non-destructive.