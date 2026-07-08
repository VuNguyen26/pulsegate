# Decision: Analytics Rollup Scheduler Command Dry-Run Service Adapter Preview Output Integration

Date: 2026-07-08

## Status

Accepted.

## Context

Sprint 42 added a contract-model-only scheduler dry-run service adapter boundary.

The next safe step was to expose adapter preview output through the command dry-run scheduler preview path without invoking the rollup backfill service.

The risky boundary remains the future transition from preview output to real command-triggered dry-run service invocation.

## Decision

PulseGate exposes dryRunServiceAdapterPreviews under executionDecision.wiringReview.dryRunDesignReview for command:dry-run scheduler preview requests when --event-limit is provided.

The scheduler preview command now parses --event-limit in both --option value and --option=value forms.

The adapter previews are created from mapped dry-run AnalyticsRollupBackfillRunInput contracts and remain command-output-only.

Command dry-run remains blocked with backfill-service-invocation-not-wired.

Command dry-run without --event-limit keeps dryRunServiceAdapterPreviews=null.

Process-local and external scheduler dry-run requests remain blocked with automatic-trigger-not-wired and dryRunDesignReview=null, even when --event-limit is provided.

Invalid --event-limit values fail before printing command output.

## Safety Rules

The scheduler preview command must not:

- create scheduled/background jobs
- invoke the backfill service
- call AnalyticsRollupBackfillService.runBackfill
- execute backfill
- read raw usage events
- read raw rejected events
- persist usage rollups
- persist rejected rollups
- affect quota counting
- delete raw events
- change usage recorder behavior
- change rejected event recorder behavior
- switch summary APIs to rollup reads
- touch retention delete execution paths

Adapter preview safety remains:

- adapterOnly=true
- adapterCurrentlyAllowed=false
- invokesBackfillService=false
- readsEvents=false
- persistsRollups=false
- affectsQuotaCounting=false
- deletesRawEvents=false
- sourceSeparationPreserved=true
- eventLimitGuardrailApplied=true
- maxBucketGuardrailApplied=true
- serviceInvocationCurrentlyAllowed=false

## Consequences

Operators can inspect the planned per-source service result shape before service invocation wiring exists.

Future command dry-run service invocation still requires explicit design, implementation approval, fail-closed service error handling, operator safety output, source separation, event limit guardrails, max bucket guardrails, and Docker/PostgreSQL runtime validation.

Execute mode remains blocked until command dry-run invocation is safely wired and validated first.

Automatic triggers remain blocked until process-local and external scheduler execution semantics are explicitly designed.
