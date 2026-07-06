# Decision Record: Analytics Retention Delete Repository Safety

Date: 2026-07-06

## Status

Accepted.

## Context

PulseGate now has retention dry-run planning and execution guard previews.

Raw analytics retention is destructive because it can remove source-of-truth rows from:

- gateway.api_usage_events
- gateway.api_rejected_events

The usage event table is also the source of truth for quota counting. Rejected events are intentionally separated from successful usage events to protect quota correctness and security observability.

Sprint 27 added execution guardrails and delete batch planning but intentionally avoided any delete repository.

## Decision

Sprint 28 adds repository-level delete primitives behind guardrails, but does not expose them through any command, API, job, or runtime path.

The implementation adds:

- A repository safety contract.
- A repository port and executor.
- A delete operation planner.
- A Prisma delete repository implementation.

The Prisma repository must:

- Keep usage and rejected sources separate.
- Recheck candidates before prepared delete execution.
- Refuse blocked safety decisions.
- Refuse source, cutoff, or limit mismatches.
- Refuse invalid candidate recheck counts.
- Select bounded candidate IDs first.
- Delete by selected IDs only.
- Avoid unbounded cutoff-based deleteMany.

The existing execution preview command must continue to report:

    deleteImplementationAvailable=false

## Consequences

Positive:

- Future retention execution has a safer repository foundation.
- Delete behavior can be unit tested without exposing operator controls.
- Usage and rejected event separation remains explicit.
- Quota correctness remains protected.

Tradeoffs:

- There is now code capable of deleting raw analytics rows if imported directly.
- Because of that, it must remain unexposed until a service-level orchestration and runtime validation plan are explicitly designed.
- More integration work is required before an execute command can be safely considered.

## Still Not Implemented

- No retention execute command.
- No retention delete API.
- No scheduled/background retention delete job.
- No quota integration.
- No summary API switch to rollup reads.
- No migration or schema change.

## Validation

Sprint 28 final validation:

- npm run test -> 89 test files / 621 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- PostgreSQL migration deploy -> 7 migrations found, no pending migrations
- Retention dry-run DB-backed validation -> dryRunOnly=true, deleteAllowed=false
- Retention execution preview validation -> deleteImplementationAvailable=false
