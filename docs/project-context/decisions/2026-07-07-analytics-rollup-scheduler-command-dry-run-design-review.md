# Analytics Rollup Scheduler Command Dry-Run Design Review

Date:

- 2026-07-07

Sprint:

- Sprint 36 - Rollup Scheduler Command Dry-Run Design Review

## Decision

Keep analytics rollup scheduler command dry-run blocked while exposing explicit design requirements in the scheduler preview output.

Specifically:

- Add executionDecision.wiringReview.dryRunDesignReview for command:dry-run requests.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Report currentlyWired=false.
- Require command dry-run to remain non-destructive.
- Require explicit command invocation before wiring.
- Require a backfill service dry-run contract before wiring.
- Require event limit guardrails before wiring.
- Require usage/rejected source separation before wiring.
- Require Docker/PostgreSQL runtime validation before wiring.
- Require quota counting to remain unchanged.
- Forbid raw event deletion.
- Keep process-local:dry-run and external-scheduler:dry-run separate from command dry-run design review.
- Keep process-local:dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- Keep execute mode blocked.

## Rationale

Command dry-run is the next safest review boundary after the scheduler execution wiring review, but it still represents a potential future service invocation path.

The scheduler preview must not silently start invoking the backfill service, reading raw events, or persisting rollups.

Making dryRunDesignReview explicit lets reviewers see the exact requirements that must be satisfied before command-triggered dry-run invocation can be wired.

Keeping automatic trigger dry-run requests blocked separately prevents process-local or external scheduler semantics from being accidentally treated as command-only dry-run behavior.

## Current Runtime Behavior

The command remains:

- DB-free.
- Preview-only.
- Non-destructive.

It does not:

- Create scheduled/background jobs.
- Invoke the backfill service.
- Execute backfill.
- Read raw usage events.
- Read raw rejected events.
- Persist usage rollups.
- Persist rejected rollups.
- Affect quota counting.
- Delete raw events.

## Validation

Sprint 36 final validation:

- npm run test -> 103 test files passed, 712 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.
- Runtime command validation passed for command dry-run design review.
- Runtime command validation passed for process-local dry-run blocked boundary.

No Docker/PostgreSQL validation was required because no DB interaction or backfill service invocation was introduced.

## Follow-Up

Before command dry-run is wired to the backfill service, a future sprint must explicitly design:

- command semantics
- service dry-run contract
- event read behavior
- event limit guardrails
- source separation
- operator output
- failure behavior
- Docker/PostgreSQL validation
- quota safety

Execute mode must remain blocked until command dry-run invocation is safely designed and validated.