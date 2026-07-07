# Decision: Analytics Rollup Scheduler Execution Boundary Design

## Date

2026-07-07

## Status

Accepted.

## Context

Sprint 33 added a DB-free scheduler runner contract and an operator-facing scheduler preview command.

That preview command could convert a schedule plan into dry-run backfill request contracts, but it did not yet make the future execution boundary explicit.

Before wiring any real scheduler execution, PulseGate needs to show which execution modes and triggers are allowed or blocked.

---

## Decision

Add a scheduler execution decision boundary before any real rollup scheduler execution exists.

The decision model supports trigger visibility:

- command
- process-local
- external-scheduler

The decision model supports requested mode visibility:

- preview
- dry-run
- execute

Current allowed behavior:

- command + preview is allowed.

Current blocked behavior:

- skipped scheduler runner plans are blocked with scheduler-runner-not-ready.
- process-local and external-scheduler triggers are blocked with automatic-trigger-not-wired.
- dry-run and execute modes are blocked with backfill-execution-not-wired.

The scheduler preview command now prints executionDecision while preserving the existing top-level scheduler runner output.

The scheduler preview command accepts:

- --execution-trigger <command|process-local|external-scheduler>
- --execution-mode <preview|dry-run|execute>

These args are for boundary preview only.

---

## Safety Requirements

The scheduler execution boundary must remain non-destructive.

It must not:

- Create scheduled/background jobs.
- Invoke the backfill service.
- Execute backfill.
- Read raw usage events.
- Read raw rejected events.
- Persist usage rollups.
- Persist rejected rollups.
- Affect quota counting.
- Delete raw events.
- Connect to PostgreSQL.
- Use Prisma.

---

## Reasoning

Future scheduler execution needs an explicit contract before wiring command-triggered or automatic execution.

Showing blocked decisions for unwired triggers and modes prevents operators from confusing preview output with actual rollup execution.

Keeping the decision DB-free preserves the safe validation model used by the schedule preview and scheduler runner preview foundations.

---

## Consequences

Positive:

- Scheduler execution boundaries are visible in JSON output.
- Future command-triggered execution can be designed against an explicit contract.
- Process-local and external scheduler execution remain intentionally blocked.
- Backfill service invocation remains intentionally blocked.
- Quota correctness and usage/rejected source separation are preserved.

Tradeoffs:

- The scheduler preview command now has more output fields.
- The command still does not rebuild rollups.
- Future execution wiring will need a separate design and runtime validation.

---

## Validation

Sprint 34 validation:

- npm run test -> 103 test files / 706 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- Runtime scheduler preview default validation passed.
- Runtime blocked execute decision validation passed.
- Runtime blocked process-local decision validation passed.

Docker/PostgreSQL validation was not required because the scheduler execution boundary preview is DB-free and non-destructive.