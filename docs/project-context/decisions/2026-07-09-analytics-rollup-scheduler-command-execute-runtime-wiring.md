# Decision: Analytics Rollup Scheduler Command Execute Runtime Wiring

Date: 2026-07-09

## Context

Sprint 50 exposed a blocked-by-default command execute wiring preview. Sprint 51 moved command execute from model-only previews to direct CLI runtime wiring with strict guardrails.

Command execute is higher risk than preview and dry-run because it may read usage and rejected event sources and persist analytics rollup rows.

## Decision

Wire scheduler command execute runtime for direct CLI command usage only.

Command execute may run only when all of these are satisfied:

- trigger is command
- requested mode is execute
- runner plan is ready
- operator passes explicit --confirm-execute true
- operator passes explicit --event-limit
- max bucket count is bounded
- source-separated execute mappings are produced
- runtime gate opens
- runtime backfill service is available

When allowed, command execute invokes AnalyticsRollupBackfillService.runBackfill in execute mode through the scheduler execute adapter.

## Safety Boundaries

Allowed:

- read api_usage_events through the rollup backfill event reader
- read api_rejected_events through the rollup backfill event reader
- upsert analytics usage rollups
- upsert analytics rejected rollups

Not allowed:

- quota counting mutation
- raw event deletion
- retention delete execution
- summary API read switch
- scheduled/background execute
- process-local execute
- external scheduler execute

## Validation

Final validation before Sprint 51 docs:

- 110 test files passed
- 812 tests passed
- typecheck passed
- build passed
- git diff --check passed

Docker/PostgreSQL runtime execute validation passed:

- PostgreSQL healthy
- Prisma generate passed
- Prisma migrate deploy passed with no pending migrations
- direct CLI execute returned executionDecision.status=execute-ready
- backfillExecutionWired=true
- command execute runtime gate opened
- runtimeInvocationAllowed=true
- executeServiceInvocationResults returned usage and rejected source results
- empty validation database produced 0 input events, 0 aggregates, and 0 upserts for both sources

## Consequences

Operators now have a direct CLI execute path for bounded rollup backfill execution.

Sprint 52 can proceed to Rollup Summary API Switch Preview without adding scheduled/background execute or changing retention delete behavior.
