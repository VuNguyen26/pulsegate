# Decision Record: Analytics Rollup Scheduling Foundation

## Date

2026-07-06

## Status

Accepted

## Context

PulseGate already had analytics rollup calculation, persistence, manual backfill, and read-model foundations.

The next production-oriented step was to start scheduling foundations, but adding a real background job too early would risk silently reading raw events or persisting rollups without a reviewed scheduler boundary.

Quota correctness also requires that rollup work stay separate from gateway.api_usage_events quota counting.

## Decision

Sprint 32 introduced a non-destructive rollup scheduling foundation:

- Add a schedule plan model for hourly and daily rollup windows.
- Add a schedule preview output model with explicit safety fields.
- Add a schedule preview args parser.
- Expose npm run analytics:rollup:schedule-preview as an operator-facing preview command.
- Keep the command DB-free.
- Keep the command preview-only.
- Do not create scheduled/background jobs.
- Do not read raw usage or rejected events.
- Do not persist rollups.
- Do not change quota counting.
- Do not change usage or rejected recorders.
- Do not switch summary APIs to rollup reads.
- Do not delete raw events.

## Safety Contract

The schedule preview command must report:

- previewOnly=true
- commandCreatesScheduledJob=false
- commandExecutesBackfill=false
- readsEvents=false
- persistsRollups=false
- affectsQuotaCounting=false
- deletesRawEvents=false

## Consequences

Operators can preview future scheduled rollup windows without changing data.

Future scheduler work must explicitly decide:

- How a scheduler runner is invoked.
- Whether it is command-triggered, process-local, or external scheduler driven.
- How it composes with the existing backfill service.
- What runtime validation is required.
- How to prevent accidental quota or summary API behavior changes.

## Validation

Sprint 32 validation:

- npm run test -> 99 test files / 683 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.
- npm run analytics:rollup:schedule-preview runtime validation passed.
- Docker/PostgreSQL validation was not required because the new command is DB-free and preview-only.
