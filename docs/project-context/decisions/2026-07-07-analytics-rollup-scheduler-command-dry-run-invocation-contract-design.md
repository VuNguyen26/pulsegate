# Analytics Rollup Scheduler Command Dry-Run Invocation Contract Design

## Date

2026-07-07

## Status

Accepted.

---

## Context

Sprint 36 exposed dryRunDesignReview for command:dry-run requests while keeping scheduler execution preview-only and DB-free.

The next risk boundary is whether command-triggered dry-run should ever invoke the backfill service. Before any real service invocation is wired, operators and reviewers need a clear output contract that explains what would be required and what is still not allowed.

---

## Decision

Keep npm run analytics:rollup:scheduler-preview as a DB-free, non-destructive preview command.

For command:dry-run requests:

- Keep executionDecision.status=blocked.
- Keep executionDecision.allowed=false.
- Keep blockedReason=backfill-service-invocation-not-wired.
- Expose dryRunDesignReview.
- Add dryRunInvocationContract under dryRunDesignReview.
- Add dryRunInvocationReadiness under dryRunDesignReview.

The dry-run invocation contract must state that future wiring is:

- command-only
- dry-run-only
- sourced from scheduler runner plan backfill requests
- per-source
- source-separated
- guarded by event limits
- guarded by max bucket limits
- subject to Docker/PostgreSQL runtime validation

Current invocation permissions remain false:

- serviceInvocationCurrentlyAllowed=false
- eventReadCurrentlyAllowed=false
- rollupPersistenceCurrentlyAllowed=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false

The dry-run invocation readiness must expose:

- status=not-ready
- reason=backfill-service-invocation-not-wired for ready runner plans
- reason=scheduler-runner-not-ready for skipped runner plans
- plannedBackfillRequestCount
- plannedSources
- plannedGranularity
- backfillRequestsDerivedFromRunnerPlan=true
- allPlannedRequestsDryRunOnly
- canInvokeBackfillService=false
- canReadEvents=false
- canPersistRollups=false

Process-local and external-scheduler dry-run requests must remain blocked with automatic-trigger-not-wired and dryRunDesignReview=null.

---

## Non-Goals

This decision does not:

- Wire the backfill service.
- Execute backfill.
- Read raw events.
- Persist rollups.
- Create scheduled/background jobs.
- Wire process-local scheduler execution.
- Wire external scheduler execution.
- Wire execute mode.
- Change quota counting.
- Change usage or rejected event recording.
- Switch summary APIs to rollup reads.
- Delete raw events.
- Touch retention execution/delete paths.

---

## Rationale

Command dry-run invocation is higher risk than preview output because invoking the backfill service may require PostgreSQL access, raw event reads, event limits, and persistence decisions.

Making dryRunInvocationContract explicit prevents future work from silently introducing service calls or event reads.

Making dryRunInvocationReadiness source-aware lets reviewers inspect what the scheduler runner currently plans without treating the output as execution.

Keeping the command DB-free preserves lightweight validation until real service invocation semantics are separately designed and approved.

---

## Validation

Sprint 37 validation:

- npm run test -> 103 test files / 714 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime command validation:

- command:dry-run stayed blocked with backfill-service-invocation-not-wired.
- command:dry-run exposed dryRunInvocationReadiness and dryRunInvocationContract.
- source=both exposed plannedSources=["usage","rejected"] and plannedBackfillRequestCount=2.
- process-local:dry-run stayed blocked with automatic-trigger-not-wired and dryRunDesignReview=null.

No Docker/PostgreSQL validation was required because the command remained DB-free and did not invoke the backfill service.

---

## Future Work

Before command dry-run invokes the backfill service, a future sprint must define:

- exact service dry-run semantics
- event read permissions
- event limit guardrails
- max bucket guardrails
- source separation guarantees
- operator output contract
- Docker/PostgreSQL runtime validation
- failure behavior
- confirmation that quota counting remains on gateway.api_usage_events