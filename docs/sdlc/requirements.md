# PulseGate Requirements

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.52.0

## Latest Completed Sprint

Sprint 51 - Command Execute Runtime Wiring with strict guardrails

---

## Document Scope

This file tracks current and future requirements compactly.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Product Vision

PulseGate should grow from a backend learning project into a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

Long-term target:

- API Gateway runtime
- Admin APIs
- Admin Dashboard later
- Developer Portal later
- API consumers
- API keys
- Usage plans
- Quotas
- Usage analytics
- Successful usage event investigation
- Rejected request tracking and drilldown
- Analytics retention and rollups
- Observability
- CI/CD
- Cloud/Kubernetes deployment later

---

## Current Functional Requirements

### FR-001 Health and Metrics

PulseGate shall expose GET /health and GET /metrics.

Status:

Implemented.

---

### FR-002 Product Service Proxy

PulseGate shall proxy Product Service endpoints through the gateway.

Current endpoints:

- GET /api/product-service/health
- GET /api/products

Status:

Implemented.

---

### FR-003 API Key Authentication

PulseGate shall protect selected routes with DB-backed issued API keys or env fallback API_KEYS.

Status:

Implemented.

---

### FR-004 JWT Authentication

PulseGate shall protect selected routes with JWT authentication.

Status:

Implemented.

---

### FR-005 Rate Limiting

PulseGate shall support route-level Redis-backed rate limiting.

Status:

Implemented.

---

### FR-006 Response Caching

PulseGate shall support route-level Redis response caching with HIT, MISS, and BYPASS statuses.

Status:

Implemented.

---

### FR-007 Route Policies

PulseGate shall support auth, timeout, cache, rateLimit, requestTransform, responseTransform, and retry policies.

Status:

Implemented as foundation.

---

### FR-008 Dynamic Route Configuration

PulseGate shall support PostgreSQL-backed route configuration, internal/admin route management, and runtime registry reload.

Status:

Implemented.

---

### FR-009 Catch-All Dynamic Router

PulseGate shall dispatch dynamic /api/* routes through a stable catch-all route for GET, POST, PUT, PATCH, and DELETE.

Status:

Implemented.

---

### FR-010 API Consumer Management

PulseGate shall support API consumer management.

Status:

Implemented.

---

### FR-011 API Key Lifecycle

PulseGate shall support issuing, listing, revoking, and assigning usage plans to DB-backed API keys.

Status:

Implemented.

---

### FR-012 API Usage Tracking

PulseGate shall record usage events for successful proxy/cache responses into gateway.api_usage_events.

Status:

Implemented.

---

### FR-013 Admin Usage Summary

PulseGate shall expose consumer and API key usage summaries over gateway.api_usage_events.

Current endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Status:

Implemented.

---

### FR-014 Usage Plans

PulseGate shall support usage plans with DAILY and MONTHLY quota windows.

Status:

Implemented.

---

### FR-015 API Key Usage Plan Assignment

PulseGate shall allow assigning a usage plan to an API key.

Current endpoint:

- PATCH /internal/admin/api-keys/:id/usage-plan

Status:

Implemented.

---

### FR-016 Runtime Quota Enforcement

PulseGate shall enforce usage plan quotas for DB-backed API keys using gateway.api_usage_events as the source of truth.

Status:

Implemented.

---

### FR-017 API Key Quota State

PulseGate shall expose quota state for one API key.

Current endpoint:

- GET /internal/admin/api-keys/:id/quota

Status:

Implemented.

---

### FR-018 Usage Plan Usage Summary

PulseGate shall expose usage summary for one usage plan.

Current endpoint:

- GET /internal/admin/usage-plans/:id/usage-summary

Status:

Implemented.

---

### FR-019 Quota Exceeded Metadata

PulseGate shall include quota metadata in 429 QUOTA_EXCEEDED responses.

Status:

Implemented.

---

### FR-020 API Rejection Tracking

PulseGate shall record failed auth, rate-limited, and quota-denied requests into gateway.api_rejected_events, not gateway.api_usage_events.

Status:

Implemented.

---

### FR-021 API Rejected Event Drilldown

PulseGate shall expose rejected event summary and raw rejected event listing for admin investigation.

Current endpoints:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Status:

Implemented.

---

### FR-022 Usage Analytics Retention and Rollup Design

PulseGate shall keep a clear design path for high-volume analytics storage lifecycle.

Status:

Designed. Rollup calculation, persistence, manual backfill, read model, schedule preview, scheduler runner preview, retention dry-run, retention execution guardrail, retention repository safety, and retention execution service preview foundations and scheduler command dry-run design review, scheduler command dry-run invocation contract review, scheduler command dry-run readiness review, scheduler command dry-run invocation design review, and scheduler command dry-run service invocation contract review, and scheduler command dry-run service invocation implementation design, scheduler command dry-run service invocation wiring readiness review, scheduler command dry-run service invocation fail-closed error model, scheduler command dry-run service invocation wiring contract, scheduler command dry-run service invocation request mapper design, scheduler command dry-run service adapter boundary design, scheduler command dry-run service adapter preview output integration, and scheduler command dry-run runtime service invocation, scheduler command execute contract review, scheduler command execute readiness review, scheduler command execute operator output review, and scheduler command execute wiring preview are implemented.

---

### FR-023 Successful Usage Event Listing

PulseGate shall expose raw successful usage events for admin investigation.

Current endpoint:

- GET /internal/admin/usage/events

Status:

Implemented.

---

### FR-024 Event Listing Cursor Pagination

PulseGate shall support cursor pagination for raw successful usage events and raw rejected events to improve investigation on larger event datasets.

Current endpoints:

- GET /internal/admin/usage/events
- GET /internal/admin/api-rejections/events

Status:

Implemented.

---

### FR-025 Analytics Rollup Calculation Foundation

PulseGate shall provide safe code-level foundations for future analytics rollups.

Status:

Implemented.

---

### FR-026 Analytics Rollup Persistence Foundation

PulseGate shall provide persistence foundations for future analytics rollup backfill and long-range analytics.

Required safety:

- Must keep successful usage and rejected/security traffic separate.
- Must not change quota counting.
- Must not change usage or rejected event recorders.
- Must not switch runtime summary APIs to rollup reads until explicitly designed.
- Must not delete raw events.

Status:

Implemented as foundation.

---

### FR-027 Analytics Rollup Manual Backfill

PulseGate shall provide a controlled manual command for analytics rollup backfill.

Current command:

- npm run analytics:rollup:backfill --workspace api-gateway -- --from <iso> --to <iso> --granularity <hour|day>

Required safety:

- Dry-run by default.
- Execute mode must be explicit.
- Usage and rejected sources must remain separate.
- Event limit guardrail must prevent partial persistence.
- No quota counting change.
- No retention deletion.

Status:

Implemented.

---

### FR-028 Analytics Rollup Read Model

PulseGate shall expose read-only analytics rollup rows for admin investigation.

Current endpoint:

- GET /internal/admin/analytics/rollups

Status:

Implemented.

---

### FR-029 Analytics Retention Dry-Run Foundation

PulseGate shall provide a safe dry-run foundation for future retention of raw analytics events.

Current command:

- npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source <usage|rejected|both> --usage-retention-days <n> --rejected-retention-days <n>

Required behavior:

- Default to disabled dry-run planning.
- Support source=usage, source=rejected, and source=both.
- Support separate usage and rejected retention day windows.
- Enforce positive integer and minimum retention day guardrails.
- Count candidate rows older than computed cutoffs.
- Return dryRunOnly=true and deleteAllowed=false.
- Reject execute mode.
- Do not delete raw events.
- Do not change quota counting.
- Do not switch summary APIs to rollup reads.

Status:

Implemented as dry-run foundation.

---

### FR-030 Analytics Retention Execution Guardrails

PulseGate shall provide guardrail foundations for future analytics retention execution without deleting raw analytics events yet.

Current command:

- npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --usage-retention-days <n> --rejected-retention-days <n> --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit <n>

Required behavior:

- Dry-run must remain the safe default.
- Execute preview must require explicit confirmation phrase.
- Execute preview must require a hard delete limit.
- Delete batch planning must require candidate recheck.
- Hard delete limit must apply as one total cap across selected sources.
- Execution preview must report deleteImplementationAvailable=false.
- No operator-facing raw event deletion is exposed by this requirement.
- No quota counting change.
- No usage or rejected recorder change.
- No summary API switch to rollup reads.

Status:

Implemented as guardrail foundation.

---

### FR-031 Analytics Retention Delete Repository Safety Foundation

PulseGate shall provide repository-level safety primitives for future analytics retention execution without exposing destructive operator controls yet.

Required behavior:

- Repository safety must require an allowed delete batch plan.
- Repository safety must require candidate recheck before delete.
- Repository safety must keep usage and rejected sources separate.
- Repository safety must require valid cutoff and positive requested limit.
- Requested limit must not exceed the hard delete limit, source max delete count, or rechecked candidates.
- Prisma delete repository must select bounded candidate IDs before deleting.
- Prisma delete repository must delete by selected IDs only, not by an unbounded cutoff delete.
- Current execution preview command must continue to report deleteImplementationAvailable=false.
- No retention execute command, API, scheduled job, or quota path may use this repository until explicitly designed.

Status:

Implemented as repository safety foundation.

---

### FR-032 Analytics Retention Execution Service Orchestration Preview

PulseGate shall provide a service-level orchestration preview for future analytics retention execution without exposing destructive operator controls.

Required behavior:

- Compose retention policy, retention plan, execution args, execution guard, delete batch plan, and delete operation plan.
- Support count-only candidate loading through the existing candidate read repository.
- Keep usage and rejected candidate counts separate.
- Support optional repository prepare operation for candidate recheck preview.
- Produce a compact service summary model for future operator preview output.
- Do not call deleteCandidates.
- Do not expose a retention execute command, delete API, scheduled job, or quota path.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Status:

Implemented as non-destructive service orchestration preview foundation.

---

### FR-033 Analytics Retention Operator Preview Command

PulseGate shall provide a non-destructive operator-facing analytics retention preview command that reads DB-backed candidate counts and returns a safe JSON planning output.

Current command:

- npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --usage-retention-days <n> --rejected-retention-days <n>

Required behavior:

- Read candidate counts from PostgreSQL through the Prisma candidate read repository.
- Use count-only candidate reads.
- Preserve usage and rejected source separation.
- Return operator safety fields including commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
- Support dry-run preview and execute-preview arguments for guard inspection.
- Validate execution arguments before DB-backed candidate reads so invalid execute-only flags fail fast.
- Do not call deleteCandidates.
- Do not wire the Prisma delete repository into the command.
- Do not expose a retention execute command, delete API, scheduled job, or quota path.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Status:

Implemented as non-destructive DB-backed operator preview command.

---

### FR-034 Analytics Retention Operator Preview Hardening

PulseGate shall harden the operator preview command contract before any destructive retention execution is designed.

Required behavior:

- Preserve explicit non-destructive JSON safety fields across dry-run and execute-preview modes.
- Validate unsupported or unsafe execution arguments before reading candidate counts from PostgreSQL.
- Keep usage text clear and test-covered for supported options and non-destructive behavior.
- Do not call deleteCandidates.
- Do not wire the Prisma delete repository into the operator preview command.
- Do not expose a retention execute command, delete API, scheduled job, or quota path.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Status:

Implemented.

---

### FR-035 Analytics Rollup Scheduling Foundation

PulseGate shall provide a non-destructive scheduling foundation for future analytics rollup automation.

Current command:

- npm run analytics:rollup:schedule-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --lookback-buckets <n>

Required behavior:

- Provide a schedule plan contract for hourly or daily rollup windows.
- Support source=usage, source=rejected, and source=both while preserving source separation.
- Support lookback bucket, safety delay, and max bucket guardrails.
- Provide a preview summary contract with explicit safety fields.
- Expose an operator-facing preview command that prints JSON only.
- Do not create scheduled/background jobs.
- Do not read raw events.
- Do not persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduling foundation.

---


### FR-036 Analytics Rollup Scheduler Runner Design

PulseGate shall provide a non-destructive scheduler runner boundary for future analytics rollup automation.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --lookback-buckets <n>

Required behavior:

- Convert a schedule plan into dry-run backfill request contracts.
- Preserve usage and rejected source separation.
- Expose a DB-free operator-facing preview command that prints JSON only.
- Report explicit safety fields including previewOnly=true, createsScheduledJob=false, invokesBackfillService=false, executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service.
- Do not execute backfill.
- Do not read raw events.
- Do not persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler runner design foundation.

---
### FR-037 Analytics Rollup Scheduler Execution Wiring Review

PulseGate shall keep future scheduler execution wiring explicit, reviewable, and non-destructive before any command dry-run, command execute, process-local scheduler, or external scheduler execution is wired.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode <preview|dry-run|execute>

Required behavior:

- Support scheduler preview args in both --option value and --option=value forms.
- Preserve command-triggered preview as the only allowed execution capability.
- Distinguish dry-run mode blocking from execute mode blocking.
- Block dry-run mode with backfill-service-invocation-not-wired until backfill service invocation is explicitly designed.
- Block execute mode with backfill-execution-not-wired until command dry-run is safely designed first.
- Keep process-local and external-scheduler triggers blocked with automatic-trigger-not-wired.
- Expose wiringReview with currentCapability=command-preview-only and recommended next steps.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service.
- Do not execute backfill.
- Do not read raw events.
- Do not persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler execution wiring review foundation.

---

### FR-038 Analytics Rollup Scheduler Command Dry-Run Design Review

PulseGate shall expose command-triggered scheduler dry-run design requirements without invoking the backfill service yet.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run

Required behavior:

- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Expose dryRunDesignReview only for command:dry-run requests.
- Report currentlyWired=false for command dry-run backfill service invocation.
- Require explicit command invocation, backfill service dry-run contract, source separation, event limit guardrail, and Docker/PostgreSQL runtime validation before wiring.
- Preserve previewOnly=true, createsScheduledJob=false, invokesBackfillService=false, executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service.
- Do not execute backfill.
- Do not read raw events.
- Do not persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Status:

Implemented as non-destructive command dry-run design review foundation.

---
### FR-039 Analytics Rollup Scheduler Command Dry-Run Invocation Contract Design

PulseGate shall expose a reviewable command dry-run invocation contract and readiness model before any backfill service invocation is wired.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run

Required behavior:

- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Expose dryRunInvocationContract under dryRunDesignReview for command:dry-run requests.
- Expose dryRunInvocationReadiness under dryRunDesignReview for command:dry-run requests.
- Derive plannedBackfillRequestCount, plannedSources, and plannedGranularity from the scheduler runner plan.
- Report backfillRequestsDerivedFromRunnerPlan=true.
- Report allPlannedRequestsDryRunOnly=true only when planned backfill requests remain dry-run-only and non-invoking.
- Keep canInvokeBackfillService=false, canReadEvents=false, and canPersistRollups=false.
- Keep serviceInvocationCurrentlyAllowed=false, eventReadCurrentlyAllowed=false, rollupPersistenceCurrentlyAllowed=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- For skipped runner plans, report scheduler-runner-not-ready readiness and zero planned backfill requests.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service.
- Do not execute backfill.
- Do not read raw events.
- Do not persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Status:

Implemented as non-destructive command dry-run invocation contract design foundation.

---
### FR-040 Analytics Rollup Scheduler Command Dry-Run Invocation Design Review

PulseGate shall expose a command dry-run invocation design review before any backfill service dry-run invocation is wired.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run

Required behavior:

- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Expose dryRunInvocationDesignReview under dryRunDesignReview for command:dry-run requests.
- Document the future command-to-backfill-service dry-run boundary.
- Keep commandTriggerRequired=true and automaticTriggerAllowed=false.
- Keep executionModeAllowed=false so execute mode remains separate.
- Allow only future dry-run service invocation after explicit wiring and validation.
- Keep dryRunMayReadEvents=false, dryRunMayPersistRollups=false, dryRunMayAffectQuotaCounting=false, and dryRunMayDeleteRawEvents=false.
- Require per-source invocation, source separation, event limit guardrails, max bucket guardrails, and Docker/PostgreSQL runtime validation before future wiring.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service yet.
- Do not execute backfill.
- Do not read raw events.
- Do not persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Status:

Implemented as non-destructive command dry-run invocation design review foundation.

---
---
### FR-041 Analytics Rollup Scheduler Command Dry-Run Service Invocation Contract Review

PulseGate shall expose a command dry-run service invocation contract review before any scheduler command invokes the rollup backfill service.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run

Required behavior:

- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Expose dryRunServiceInvocationContractReview under dryRunDesignReview for command:dry-run requests.
- Document serviceBoundary=scheduler-command-to-rollup-backfill-service.
- Keep currentServiceInvocationState=not-wired.
- Allow only trigger=command and required backfill mode=dry-run for any future service invocation design.
- Require per-source backfill request invocation from scheduler-runner-backfill-requests.
- Require ready runner plan, dry-run request mode, non-invoking preview before wiring, event limit guardrails, max bucket guardrails, source separation, and Docker/PostgreSQL runtime validation.
- Keep serviceInvocationCurrentlyAllowed=false, dryRunServiceMayReadEvents=false, dryRunServiceMayPersistRollups=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Document failureBehavior=fail-closed-before-service-invocation.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service yet.
- Do not execute backfill.
- Do not read events.
- Do not persist rollups.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler command dry-run service invocation contract review output.

---
### FR-042 Analytics Rollup Scheduler Command Dry-Run Service Invocation Implementation Design

PulseGate shall expose a command dry-run service invocation implementation design before any scheduler command invokes the rollup backfill service.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run

Required behavior:

- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Expose dryRunServiceInvocationImplementationDesign under dryRunDesignReview for command:dry-run requests.
- Document implementationBoundary=scheduler-command-dry-run-to-rollup-backfill-service.
- Keep currentImplementationState=not-implemented.
- Keep targetTrigger=command and targetBackfillMode=dry-run.
- Keep requestSource=scheduler-runner-backfill-requests and plannedInvocationCardinality=per-source-backfill-request.
- Keep targetDryRunBehavior=service-dry-run-plan-only until service dry-run semantics are explicitly wired and validated.
- Require serviceAdapterRequired=true and requestMapperRequired=true before future wiring.
- Require ready runner plan, dry-run request mode, non-invoking preview before invocation, per-source invocation, source separation, event limit guardrails, max bucket guardrails, operator safety output, fail-closed service errors, and Docker/PostgreSQL runtime validation.
- Keep implementationCurrentlyAllowed=false and serviceInvocationCurrentlyAllowed=false.
- Keep dryRunServiceMayReadEvents=false, dryRunServiceMayPersistRollups=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service yet.
- Do not execute backfill.
- Do not read events.
- Do not persist rollups.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler command dry-run service invocation implementation design output.


---
### FR-043 Analytics Rollup Scheduler Command Dry-Run Service Invocation Request Mapper Design

PulseGate shall expose and test a request mapper boundary before any scheduler command invokes the rollup backfill service.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run

Required behavior:

- Add a mapper from scheduler runner dry-run backfill request contracts to dry-run AnalyticsRollupBackfillRunInput contracts.
- Preserve one mapped service input per planned source.
- Require a ready scheduler runner plan before runner-level mapping.
- Require dry-run request mode.
- Require non-invoking request contracts before mapping.
- Require explicit positive eventLimit guardrail.
- Map maxBuckets from the scheduler request bucketCount to avoid widening the planned window.
- Expose dryRunServiceInvocationRequestMapperDesign under dryRunDesignReview for command:dry-run requests.
- Keep mapperCurrentlyAllowed=true but serviceInvocationCurrentlyAllowed=false.
- Keep mapperMayInvokeBackfillService=false, mapperMayReadEvents=false, mapperMayPersistRollups=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service yet.
- Do not execute backfill.
- Do not read events.
- Do not persist rollups.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler command dry-run service invocation request mapper design output.

---
### FR-044 Analytics Rollup Scheduler Command Dry-Run Service Adapter Boundary Design

PulseGate shall expose and test a service adapter boundary before any scheduler command invokes the rollup backfill service.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run

Required behavior:

- Expose dryRunServiceAdapterBoundaryDesign under dryRunDesignReview for command:dry-run requests.
- Add a contract-model-only adapter boundary from mapped dry-run AnalyticsRollupBackfillRunInput contracts to planned rollup backfill service dry-run result previews.
- Require mapped input safety to remain non-invoking.
- Require plan.mode=dry-run.
- Require one mapped service input per planned source.
- Require plan.source to match the mapped source.
- Require explicit positive eventLimit guardrail.
- Require positive planned bucket count.
- Reject duplicate mapped sources before adapter preview creation.
- Keep adapterCurrentlyAllowed=false.
- Keep serviceInvocationCurrentlyAllowed=false.
- Keep adapterMayInvokeBackfillService=false, adapterMayReadEvents=false, adapterMayPersistRollups=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service yet.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Do not execute backfill.
- Do not read events.
- Do not persist rollups.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler command dry-run service adapter boundary design output.

---
### FR-045 Analytics Rollup Scheduler Command Dry-Run Service Adapter Preview Output Integration

PulseGate shall expose source-separated scheduler command dry-run service adapter preview output before any scheduler command invokes the rollup backfill service.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run --event-limit <n>

Required behavior:

- Parse --event-limit in both --option value and --option=value forms.
- Require --event-limit to be a positive integer when provided.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Expose dryRunServiceAdapterPreviews under dryRunDesignReview for command:dry-run requests when --event-limit is provided.
- Keep dryRunServiceAdapterPreviews=null for command:dry-run requests when --event-limit is not provided.
- Produce one adapter preview per mapped source.
- Preserve usage and rejected source separation.
- Preserve planned dry-run service result output only.
- Keep adapter preview safety fields non-invoking: invokesBackfillService=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, deletesRawEvents=false, and serviceInvocationCurrentlyAllowed=false.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null, even when --event-limit is provided.
- Reject invalid --event-limit values before printing output.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service yet.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Do not execute backfill.
- Do not read events.
- Do not persist rollups.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler command dry-run service adapter preview output integration.

---
### FR-046 Analytics Rollup Scheduler Command Dry-Run Service Invocation Wiring Readiness Review

PulseGate shall expose and test a command dry-run service invocation wiring readiness review before any scheduler command invokes the rollup backfill service.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run --event-limit <n>

Required behavior:

- Expose dryRunServiceInvocationWiringReadinessReview under dryRunDesignReview for command:dry-run requests.
- Keep currentWiringState=not-wired.
- Keep readyForServiceInvocationWiring=false.
- Keep serviceInvocationCurrentlyAllowed=false.
- Keep targetTrigger=command, targetBackfillMode=dry-run, and targetServiceMethod=runBackfill.
- Require ready runner plan, mapped dry-run service inputs, adapter previews before wiring, per-source invocation, source separation, event limit guardrails, max bucket guardrails, operator safety output, fail-closed service errors, and Docker/PostgreSQL runtime validation.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service yet.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Do not execute backfill.
- Do not read events.
- Do not persist rollups.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler command dry-run service invocation wiring readiness review output.


---
### FR-047 Analytics Rollup Scheduler Command Dry-Run Service Invocation Fail-Closed Error Model

PulseGate shall expose and test a command dry-run service invocation fail-closed error model before any scheduler command invokes the rollup backfill service.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run --event-limit <n>

Required behavior:

- Expose dryRunServiceInvocationFailClosedErrorModel under dryRunDesignReview for command:dry-run requests.
- Keep currentServiceInvocationState=not-wired.
- Keep failureState=blocked.
- Keep blockedReason=backfill-service-invocation-not-wired.
- Keep targetTrigger=command, targetBackfillMode=dry-run, and targetServiceMethod=runBackfill.
- Require operator-visible fail-closed service error review output.
- Require source-scoped error output.
- Require safety flags on failure.
- Require no partial persistence, no quota mutation, and no raw event deletion before future wiring.
- Keep serviceInvocationCurrentlyAllowed=false.
- Keep partialPersistenceAllowed=false.
- Keep quotaCountingChangeAllowed=false.
- Keep rawEventDeletionAllowed=false.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service yet.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Do not execute backfill.
- Do not read events.
- Do not persist rollups.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler command dry-run service invocation fail-closed error model output.

---
### FR-048 Analytics Rollup Scheduler Command Dry-Run Service Invocation Wiring Contract

PulseGate shall expose and test a command dry-run service invocation wiring contract before any scheduler command invokes the rollup backfill service.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --execution-mode dry-run --event-limit <n>

Required behavior:

- Expose dryRunServiceInvocationWiringContract under dryRunDesignReview for command:dry-run requests.
- Keep currentWiringState=not-wired.
- Keep backfillServiceInvocationWired=false.
- Keep serviceInvocationCurrentlyAllowed=false.
- Keep targetTrigger=command, targetBackfillMode=dry-run, and targetServiceMethod=runBackfill.
- Define the future request contract from mapped dry-run service inputs.
- Require command-only, dry-run-only, per-source mapped run inputs.
- Require a ready runner plan, source-separated inputs, explicit eventLimit, and max bucket bound.
- Define the future response contract with operator-visible command dry-run output, source-scoped result summaries, per-source safety flags, dry-run service plan output, and partial failure output.
- Define validation requirements for missing event limit, unbounded bucket count, non-command triggers, execute mode, and Docker/PostgreSQL runtime validation before future wiring.
- Require operator output for service invocation state, blocked reason, source-scoped result summary, safety flags, no quota mutation, and no raw event deletion.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep process-local:dry-run and external-scheduler:dry-run blocked as automatic-trigger-not-wired with dryRunDesignReview=null.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service yet.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Do not execute backfill.
- Do not read events.
- Do not persist rollups.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as non-destructive scheduler command dry-run service invocation wiring contract output.

---
### FR-049 Analytics Rollup Scheduler Command Dry-Run Runtime Service Invocation

PulseGate shall wire direct CLI command dry-run to call AnalyticsRollupBackfillService.runBackfill in dry-run mode only.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --lookback-buckets <n> --max-buckets <n> --execution-mode dry-run --event-limit <n>

Required behavior:

- Invoke the rollup backfill service only for direct command-triggered dry-run requests.
- Require explicit positive --event-limit.
- Preserve one mapped dry-run service invocation per planned source.
- Preserve usage and rejected source separation.
- Use AnalyticsRollupBackfillService.runBackfill with plan.mode=dry-run only.
- Expose dryRunServiceInvocationResults with source-scoped service-dry-run-invoked results.
- Expose runtimeConsistency with status=runtime-dry-run-service-invocation-wired.
- Keep process-local and external-scheduler dry-run blocked with automatic-trigger-not-wired.
- Keep execute mode blocked with backfill-execution-not-wired.
- Keep dry-run without --event-limit blocked with backfill-service-invocation-not-wired.
- Do not create scheduled/background jobs.
- Do not execute backfill.
- Do not read events through service dry-run.
- Do not persist rollups through service dry-run.
- Do not affect quota counting.
- Do not delete raw events.
- Require Docker/PostgreSQL runtime validation.

Status:

Implemented as command-only, dry-run-only runtime service invocation.

---
### FR-050 Analytics Rollup Scheduler Command Execute Contract Review

PulseGate shall expose command execute contract, readiness, and operator output review before any scheduler command can execute rollup backfill work.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --lookback-buckets <n> --max-buckets <n> --execution-mode execute --event-limit <n>

Required behavior:

- Keep command execute blocked with backfill-execution-not-wired.
- Expose commandExecuteContractReview for command:execute requests.
- Expose commandExecuteReadinessReview for command:execute requests.
- Expose commandExecuteOperatorOutputReview for command:execute requests.
- Require explicit operator confirmation before any future execute wiring.
- Require ready runner plan, prior dry-run runtime validation, explicit event limit, max bucket bound, bounded bucket count, and source-separated execution before any future execute wiring.
- Scope future persistence to rollup-tables-only.
- Require rollbackExpectation=bounded-idempotent-rollup-upsert-or-fail-closed-before-execution.
- Include operator output for confirmation requirement, blocked reason, readiness status, contract review status, persistence scope, rollback expectation, source-scoped planned requests, safety flags, no quota mutation, and no raw event deletion.
- Keep process-local and external scheduler execution blocked.
- Do not create scheduled/background jobs.
- Do not invoke execute backfill.
- Do not call AnalyticsRollupBackfillService.runBackfill in execute mode.
- Do not read events from scheduler execute.
- Do not persist rollups from scheduler execute.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as DB-free, non-destructive command execute contract review output.

---
### FR-051 Analytics Rollup Scheduler Command Execute Wiring Preview Blocked-by-default

PulseGate shall expose a blocked-by-default command execute wiring preview before any scheduler command can execute rollup backfill work.

Current command:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --run-at <iso> --granularity <hour|day> --lookback-buckets <n> --max-buckets <n> --execution-mode execute --event-limit <n>

Required behavior:

- Keep command execute blocked with backfill-execution-not-wired for ready runner plans.
- Expose commandExecuteWiringPreview for command:execute requests.
- Report status=execute-wiring-preview-blocked and currentWiringState=blocked-not-wired.
- Report confirmationState=not-confirmed and requiredConfirmation=explicit-operator-confirmation.
- Include plannedBackfillRequestCount, plannedSources, plannedGranularity, and sourceScopedPlannedExecutions.
- Mark sourceScopedPlannedExecutions requestedMode=execute while keeping willInvokeBackfillService=false, willExecuteBackfill=false, willReadEvents=false, and willPersistRollups=false.
- Keep skipped runner plans blocked with scheduler-runner-not-ready and zero source-scoped planned executions.
- Keep process-local and external-scheduler execute requests blocked with automatic-trigger-not-wired and without commandExecuteWiringPreview.
- Keep executeRuntimeCurrentlyAllowed=false, backfillExecutionWired=false, serviceInvocationCurrentlyAllowed=false, eventReadCurrentlyAllowed=false, rollupPersistenceCurrentlyAllowed=false, quotaCountingChangeAllowed=false, rawEventDeletionAllowed=false, processLocalExecutionAllowed=false, externalSchedulerExecutionAllowed=false, and scheduledJobCreationAllowed=false.
- Do not create scheduled/background jobs.
- Do not invoke execute backfill.
- Do not call AnalyticsRollupBackfillService.runBackfill in execute mode.
- Do not read events from scheduler execute.
- Do not persist rollups from scheduler execute.
- Do not affect quota counting.
- Do not delete raw events.

Status:

Implemented as DB-free, non-destructive, blocked-by-default command execute wiring preview output.

### FR - Analytics Rollup Scheduler Command Execute Runtime

Current command:

```bash
npm run analytics:rollup:scheduler-preview --workspace api-gateway -- \
  --enabled true \
  --source both \
  --run-at 2026-07-06T13:07:00.000Z \
  --granularity hour \
  --lookback-buckets 1 \
  --safety-delay-ms 300000 \
  --max-buckets 1 \
  --execution-mode execute \
  --event-limit 500 \
  --confirm-execute true
```

Current behavior:

- Direct CLI command execute can return executionDecision.status=execute-ready only with strict guardrails.
- Required guardrails are command trigger, execute mode, ready runner plan, explicit --confirm-execute true, explicit --event-limit, bounded max buckets, source separation, and runtime gate open.
- Runtime execute invokes the analytics rollup backfill service in execute mode.
- Runtime execute may read usage and rejected events.
- Runtime execute may persist analytics rollup tables only.
- Runtime execute must not mutate quota counting.
- Runtime execute must not delete raw events.
- process-local execute, external scheduler execute, and scheduled/background execute remain unwired.

## Current Non-Functional Requirements

### NFR-001 Type Safety

Validation:

- npm run typecheck

Status:

Implemented.

---

### NFR-002 Automated Tests

Current result:

- 105 test files passed
- 773 tests passed

Validation:

- npm run test

Status:

Implemented.

---

### NFR-003 Build Stability

Validation:

- npm run build

Status:

Implemented.

---

### NFR-004 Docker Local Runtime

Latest validation:

- Sprint 51 final automated validation passed with 110 test files and 812 tests.
- npm run typecheck passed.
- npm run build passed.
- Docker/PostgreSQL runtime validation was not required for Sprint 50 because the sprint only added DB-free command execute wiring preview model/output/usage documentation and tests.
- Command execute remained blocked with backfill-execution-not-wired.
- Scheduler preview exposed commandExecuteContractReview, commandExecuteReadinessReview, commandExecuteOperatorOutputReview, and commandExecuteWiringPreview for command:execute.
- Scheduler output preserved no scheduled jobs, no execute runtime, no service execute invocation, no event reads, no rollup persistence, no quota mutation, and no raw event deletion.

Status:

Implemented.

---
### NFR-005 Observability

Current signals include request IDs, structured logs, Prometheus metrics, Grafana dashboard, usage event tables, rejected event tables, usage summary APIs, usage event listing API, quota observability APIs, rejected event APIs, rollup persistence foundations, rollup read API, retention dry-run candidate previews, retention execution guard previews, retention repository safety tests, and retention execution service preview tests, retention operator preview command tests, retention operator preview fail-fast/usage contract tests, and rollup schedule preview command tests, scheduler runner contract tests, scheduler execution decision tests, scheduler preview args tests, scheduler preview command tests, and scheduler preview safety contract tests, scheduler preview args contract tests, scheduler execution blocked reason tests, and scheduler execution wiring review tests, scheduler command dry-run design review tests, scheduler command dry-run invocation contract tests, scheduler command dry-run readiness tests, scheduler command dry-run invocation design review tests, scheduler command dry-run service invocation contract review tests, scheduler command dry-run service invocation implementation design tests, scheduler command dry-run service invocation wiring readiness review tests, scheduler command dry-run service invocation fail-closed error model tests, scheduler command dry-run service invocation wiring contract tests, scheduler command dry-run wiring contract command output tests, scheduler command dry-run backfill request mapper tests, scheduler command dry-run request mapper design tests, scheduler command dry-run service adapter boundary design tests, scheduler command dry-run service adapter contract tests, scheduler command dry-run adapter preview output tests, scheduler command dry-run runtime service invocation tests, runtime consistency output tests, blocked runtime path tests, automatic dry-run boundary tests, scheduler dry-run runtime failure output tests, runtime factory failure output tests, runtime output field visibility tests, scheduler command execute contract review tests, scheduler command execute readiness review tests, scheduler command execute operator output review tests, command execute wiring preview tests, command execute blocked-path tests, command execute command output tests, and command execute usage text tests.

Status:

Implemented as foundation.

---

### NFR-006 Secure API Key Storage

Raw API keys shall not be persisted.

Status:

Implemented.

---

## Important Current Limitations

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any operator-facing execute command, API, scheduled job, or quota path yet.
- No retention delete job is implemented yet.
- Rollup schedule and scheduler preview commands exist, direct command dry-run runtime service invocation is wired and validated, and command execute contract/readiness/operator output/wiring preview is implemented, but no scheduled/background rollup job, process-local scheduler, external scheduler, or execute runtime exists yet.
- No per-consumer Grafana dashboard yet.
- No per-key Grafana dashboard yet.
- No quota usage Grafana dashboard yet.
- Env fallback API keys are not quota-enforced.
- Admin Dashboard is not implemented yet.
- Developer Portal is not implemented yet.
- Admin auth is still local admin API key based.
- Admin RBAC is not implemented yet.
- Dynamic router supports exact method + exact path matching only.
- Path parameters are not implemented yet.
- Wildcard upstream path forwarding is not implemented yet.
- Host-based routing is not implemented yet.
- Weighted upstreams are not implemented yet.
- Service discovery is not implemented yet.
- CI does not run full Docker Compose runtime validation yet.
- Kubernetes/cloud deployment is planned later.
- Kafka/RabbitMQ event streaming is planned later.

---

## Future Requirements Backlog

Recommended next:

- Wire command execute runtime only behind strict guardrails, explicit operator confirmation, and Docker/PostgreSQL runtime validation.
- Keep retention execution explicit, limited, and blocked from operator-facing delete until approved.
- Switch selected long-range analytics reads to rollups later after explicit design.
- Add Grafana panels for quota, usage, rejected traffic, rollups, and retention dry-run candidates later.
- Add Admin Dashboard later.
- Add Developer Portal later.
- Add service discovery later.
- Add Kubernetes/cloud deployment later.