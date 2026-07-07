# Analytics Rollup Scheduler Execution Wiring Review

Date: 2026-07-07

## Status

Accepted.

## Context

Sprint 34 added a DB-free scheduler execution decision boundary to the analytics rollup scheduler preview command.

That boundary made command preview visible and blocked dry-run, execute, process-local, and external-scheduler requests.

Before wiring any real work, Sprint 35 reviewed the next execution boundary risk:

- command dry-run and command execute should not share the same blocked reason.
- command dry-run may eventually invoke the backfill service without persisting rollups.
- command execute is higher risk and should not be wired before dry-run semantics are designed.
- process-local and external-scheduler triggers should remain blocked until automatic execution semantics exist.
- operators need an output field that explains current capability and the next safe wiring step.

## Decision

Keep analytics rollup scheduler execution command-preview-only in Sprint 35.

Add explicit wiring review output to executionDecision:

- currentCapability=command-preview-only
- requestedCapability=<trigger>:<mode>
- recommendedNextStep
- requiresExplicitDesignBeforeWiring
- requiresDockerPostgresValidationBeforeWiring
- automaticTriggersRemainUnwired=true
- executeRemainsUnwired=true

Split blocked reasons:

- dry-run mode is blocked with backfill-service-invocation-not-wired.
- execute mode is blocked with backfill-execution-not-wired.
- process-local and external-scheduler triggers remain blocked with automatic-trigger-not-wired.
- skipped runner plans remain blocked with scheduler-runner-not-ready.

Harden CLI parsing:

- scheduler preview accepts both --option value and --option=value forms.

## Safety Boundaries

Sprint 35 does not:

- create scheduled/background jobs.
- invoke the backfill service.
- execute backfill.
- read raw usage events.
- read raw rejected events.
- persist usage rollups.
- persist rejected rollups.
- affect quota counting.
- delete raw events.
- change usage recorder behavior.
- change rejected event recorder behavior.
- switch summary APIs to rollup reads.
- wire retention execution.

## Consequences

Future command dry-run work must explicitly design:

- command semantics.
- whether invoking the backfill service in dry-run is acceptable.
- source separation.
- event read behavior.
- persistence guarantees.
- runtime validation with Docker/PostgreSQL if backfill service or DB interaction is introduced.

Future command execute work must not skip command dry-run design.

Future process-local or external scheduler execution must remain blocked until automatic execution semantics, scheduling lifecycle, runtime validation, and rollback expectations are designed.