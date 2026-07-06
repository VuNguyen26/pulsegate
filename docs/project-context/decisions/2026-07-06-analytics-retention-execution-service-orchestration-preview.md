# Analytics Retention Execution Service Orchestration Preview

## Date

2026-07-06

## Status

Accepted.

## Context

Sprint 28 added repository-level safety primitives and a bounded Prisma delete repository behind guardrails.

That repository can delete bounded selected IDs if called directly by future code, so the next step needed to be service-level orchestration preview rather than an operator-facing destructive command.

## Decision

Sprint 29 adds a non-destructive service-level analytics retention execution preview foundation.

The service layer composes:

- Retention policy and plan.
- Execution args and execution guard.
- Delete batch plan.
- Delete operation plan.
- Count-only candidate read loading.
- Optional repository prepare operation for candidate recheck preview.
- Compact service summary output.

Sprint 29 does not add:

- Retention execute command.
- Retention delete API.
- Scheduled/background retention delete job.
- Migration or schema change.
- Operator-facing call to deleteCandidates.
- Quota checker change.
- Usage recorder change.
- Rejected event recorder change.
- Summary API switch to rollup reads.

## Rationale

Retention deletion is destructive and must be introduced behind layered safety checks.

A service preview layer gives a future command or API a safer orchestration contract before any destructive behavior is exposed.

Candidate-read preview composition allows count-backed planning while preserving read-only behavior.

The summary model gives future operator output a compact contract without leaking destructive execution behavior.

## Consequences

Current positive outcomes:

- Future retention execution work now has a service-level preview foundation.
- Candidate count loading can reuse the existing read-only candidate repository.
- Source separation between usage and rejected events is preserved.
- deleteCandidates remains unavailable from operator-facing flows.
- Existing retention execution preview command remains DB-free and reports deleteImplementationAvailable=false.

Current limitations:

- No operator-facing service preview command exists yet.
- No retention execute command exists yet.
- No retention delete API or scheduled job exists yet.
- No raw analytics events are deleted by Sprint 29 behavior.
