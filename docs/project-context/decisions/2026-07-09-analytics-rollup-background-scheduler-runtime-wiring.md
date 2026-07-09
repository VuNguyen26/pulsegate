# Decision: Analytics Rollup Background Scheduler Runtime Wiring

## Date

2026-07-09

## Status

Accepted

## Context

Sprint 54 introduced a DB-free background scheduler contract/runner boundary. Sprint 55 needed to move one step further by wiring a runtime path while keeping background execution guarded, explicit, bounded, and non-destructive.

The main risk was accidentally opening automatic/background execution, external scheduler execution, execute mode, quota mutation, raw event deletion, or retention execution.

## Decision

Wire only the direct CLI `process-local` + `dry-run` path behind explicit guardrails.

The runtime path is allowed only when:

- Trigger is `process-local`.
- Requested mode is `dry-run`.
- Runner plan is ready.
- Event limit is present.
- Bucket bounds are valid.
- Internal runtime opt-in is enabled.
- Runtime service factory resolution is explicit.
- Backfill service is invoked only in dry-run mode.

## Consequences

- `backgroundScheduler.runtimeGate` is operator-visible in scheduler preview command output.
- `backgroundScheduler.summary.status` can become `background-runtime-ready` for the guarded process-local dry-run path.
- `processLocalDryRunServiceInvocationResults` reports source-separated dry-run service invocation results.
- External scheduler execution remains closed.
- Execute mode remains closed for background paths.
- Scheduled/background job creation remains closed.
- Dry-run invocation remains non-destructive.
- Runtime validation with Docker/PostgreSQL is required for this sprint.

## Validation

Validation passed with:

- 129 test files / 940 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime validation passed.
- Prisma migrate deploy applied 7 migrations successfully.
- Runtime command produced 2 `service-dry-run-invoked` results for `usage` and `rejected`.

## Boundaries

This decision does not authorize:

- Scheduled/background rollup jobs.
- External scheduler runtime execution.
- Background execute.
- Retention execution.
- Quota mutation.
- Raw event deletion.
- Admin UI.
- Product/platform expansion.