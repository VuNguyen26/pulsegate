# Analytics Rollup Scheduler Command Dry-Run Invocation Design Review

## Date

2026-07-07

## Status

Accepted.

---

## Context

Sprint 37 exposed dryRunInvocationContract and dryRunInvocationReadiness for command:dry-run requests while keeping scheduler execution preview-only and DB-free.

The next risk boundary is the exact shape of a future command-triggered dry-run service invocation. Before wiring any real backfill service call, operators and reviewers need a design review field that describes the proposed command-to-service boundary and confirms which actions remain disallowed.

---

## Decision

Keep npm run analytics:rollup:scheduler-preview as a DB-free, non-destructive preview command.

For command:dry-run requests:

- Keep executionDecision.status=blocked.
- Keep executionDecision.allowed=false.
- Keep blockedReason=backfill-service-invocation-not-wired.
- Expose dryRunDesignReview.
- Keep dryRunInvocationReadiness under dryRunDesignReview.
- Add dryRunInvocationDesignReview under dryRunDesignReview.
- Keep dryRunInvocationContract under dryRunDesignReview.

The dry-run invocation design review must state:

- status=review-required-before-wiring
- proposedInvocationBoundary=command-to-backfill-service-dry-run
- proposedBackfillMode=dry-run
- invocationSource=scheduler-runner-backfill-requests
- commandTriggerRequired=true
- automaticTriggerAllowed=false
- executionModeAllowed=false
- dryRunMayInvokeBackfillServiceAfterExplicitWiring=true
- dryRunMayReadEvents=false
- dryRunMayPersistRollups=false
- dryRunMayAffectQuotaCounting=false
- dryRunMayDeleteRawEvents=false
- requiresPerSourceInvocation=true
- requiresSourceSeparation=true
- requiresEventLimitGuardrail=true
- requiresMaxBucketGuardrail=true
- requiresDockerPostgresRuntimeValidation=true

Current invocation permissions remain false through dryRunInvocationContract:

- serviceInvocationCurrentlyAllowed=false
- eventReadCurrentlyAllowed=false
- rollupPersistenceCurrentlyAllowed=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false

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

A command dry-run service call is higher risk than a preview-only contract because it may introduce PostgreSQL access, event reads, event limit behavior, persistence decisions, and operator-visible failure modes.

Adding dryRunInvocationDesignReview makes the future boundary explicit before implementation. It clarifies that only command-triggered dry-run service invocation may be considered next, while automatic triggers and execute mode remain separate blocked concerns.

Keeping event reads, persistence, quota changes, and raw event deletion explicitly false prevents accidental widening of scheduler preview behavior.

Keeping the command DB-free preserves lightweight validation until real service invocation semantics are separately designed and approved.

---

## Validation

Sprint 38 validation:

- npm run test -> 103 test files / 716 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime command validation:

- command:dry-run stayed blocked with backfill-service-invocation-not-wired.
- command:dry-run exposed dryRunInvocationReadiness, dryRunInvocationDesignReview, and dryRunInvocationContract.
- source=both exposed plannedSources=["usage","rejected"] and plannedBackfillRequestCount=2.
- dryRunInvocationDesignReview exposed proposedInvocationBoundary=command-to-backfill-service-dry-run.
- dryRunInvocationDesignReview kept dryRunMayReadEvents=false, dryRunMayPersistRollups=false, dryRunMayAffectQuotaCounting=false, and dryRunMayDeleteRawEvents=false.
- process-local:dry-run stayed blocked with automatic-trigger-not-wired and dryRunDesignReview=null.

No Docker/PostgreSQL validation was required because the command remained DB-free and did not invoke the backfill service.

---

## Future Work

Before command dry-run invokes the backfill service, a future sprint must define:

- exact service dry-run input contract
- source-separated per-request invocation behavior
- event read permissions
- event limit guardrails
- max bucket guardrails
- operator output contract
- failure behavior
- Docker/PostgreSQL runtime validation
- confirmation that quota counting remains on gateway.api_usage_events
- confirmation that execute mode remains blocked until dry-run invocation is safely wired and validated