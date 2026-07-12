# PulseGate Architecture Overview

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v1.8.0

## Current Status

Sprint 68 - Weighted routing foundation Complete

Current validation:

- API Gateway: 147 test files / 1059 tests passed.
- Admin Dashboard: 53 test files / 243 tests passed.
- Developer Portal: 2 test files / 7 tests passed.
- Root tests, typecheck, production build, Prisma validation, Compose validation, and Git diff checks passed.
- PostgreSQL migration and bounded weighted-routing runtime validation passed.
- Private npm workspace versions remain 0.1.0.
- Protected annotated tag v1.0.0 remains unchanged.PulseGate is a local-first API Gateway, API Management, and Observability Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

PulseGate demonstrates backend engineering around API Gateway routing, dynamic route configuration, API consumer management, DB-backed API keys, usage plans, quota enforcement, successful usage analytics, rejected request analytics, observability, analytics rollup foundations, analytics retention dry-run, execution guardrail, repository safety foundations, service-level retention execution preview orchestration, DB-backed non-destructive retention operator preview hardening, non-destructive rollup schedule preview planning, non-destructive rollup scheduler runner preview planning, non-destructive rollup scheduler execution boundary preview planning, non-destructive rollup scheduler execution wiring review, non-destructive rollup scheduler command dry-run design review, non-destructive rollup scheduler command dry-run invocation contract and readiness review, non-destructive rollup scheduler command dry-run invocation design review, non-destructive rollup scheduler command dry-run service invocation contract review, non-destructive rollup scheduler command dry-run service invocation implementation design, non-destructive rollup scheduler command dry-run service invocation wiring readiness review, non-destructive rollup scheduler command dry-run service invocation fail-closed error model, non-destructive rollup scheduler command dry-run service invocation wiring contract, non-destructive rollup scheduler command dry-run service invocation request mapper design, non-destructive rollup scheduler command dry-run service adapter boundary design, non-destructive rollup scheduler command dry-run service adapter preview output integration, command dry-run runtime service invocation, runtime consistency output, blocked-path runtime tests, non-destructive rollup scheduler command execute contract review, non-destructive command execute readiness review, non-destructive command execute operator output review, non-destructive blocked-by-default command execute wiring preview, selected summary runtime rollup read switching behind explicit flag with raw-summary fallback, and CI/CD.

---

## Current High-Level Architecture

Dashboard administration flow:

    Operator Browser
      -> Admin Dashboard :3003
        -> fixed GET-only BFF resources
          -> /api/admin/runtime-status
          -> /api/admin/consumers and scoped API-key metadata
          -> /api/admin/usage-plans
          -> /api/admin/routes and runtime registry
          -> /api/admin/usage/* successful usage and quota reads
          -> /api/admin/api-rejections/* rejected/security reads
        -> server-only configuration
        -> fixed read-only Admin API clients
        -> API Gateway :3000
          -> fixed /internal/admin GET resources
          -> full-access/read-only Admin authorization middleware
          -> bounded response contracts

Dashboard security properties:

- The browser does not call protected Gateway Admin APIs directly.
- The browser never receives the Admin credential.
- The Dashboard uses only `ADMIN_READ_ONLY_API_KEY`.
- The Dashboard does not receive full-access `ADMIN_API_KEY`.
- The Dashboard exposes no generic Admin API proxy.
- Sprint 63 adds no Dashboard mutation path.
Runtime flow:

    Client / API Consumer
      -> API Gateway :3000
        -> Request ID
        -> Structured access log timer
        -> Metrics timer
        -> Security headers
        -> Request size limit
        -> Runtime route registry lookup
        -> Route policy resolution
        -> DB-backed API key auth or env API key fallback
        -> Redis-backed rate limit when enabled
        -> JWT auth when required
        -> Usage quota check when DB-backed key has an enabled usage plan
        -> Rejected event recording when auth, rate limit, or quota rejects the request
        -> Redis response cache when enabled
        -> Shared downstream proxy pipeline
        -> API usage recorder after successful proxy/cache response
      -> Product Service :3001
      -> PostgreSQL / Redis / Prometheus / Grafana

Analytics rollup flow:

    Raw usage/rejected event tables
      -> manual backfill command
      -> UTC time bucket helper
      -> rollup window planner
      -> usage or rejected aggregate builder
      -> dimension hash builder
      -> usage or rejected rollup repository
      -> rollup tables
      -> read-only internal/admin rollup endpoint

Analytics rollup schedule preview flow:

    CLI args
      -> schedule preview args parser
      -> schedule plan
      -> schedule preview summary
      -> JSON safety output

Analytics rollup scheduler preview flow:

    CLI args
      -> scheduler preview args parser
      -> schedule plan
      -> scheduler runner contract
      -> dry-run backfill request contracts
      -> optional mapped dry-run service inputs
      -> optional command dry-run service adapter previews
      -> optional direct command dry-run service invocation
      -> source-separated dryRunServiceInvocationResults
      -> execution boundary decision
      -> execution wiring review with runtimeConsistency
      -> command execute contract/readiness/operator output/wiring preview for blocked execute requests
      -> JSON safety output

The schedule preview flow and default/blocked scheduler preview flows stay DB-free and do not create scheduled jobs, execute backfill, read events, persist rollups, affect quota counting, or delete raw events. Direct command dry-run with --event-limit resolves a Prisma-backed runtime service factory and invokes AnalyticsRollupBackfillService.runBackfill in dry-run mode only; the service dry-run remains plan-only and does not read events or persist rollups. The scheduler preview also exposes wiringReview, command dryRunDesignReview, dryRunInvocationReadiness, dryRunInvocationDesignReview, dryRunServiceInvocationContractReview, dryRunServiceInvocationImplementationDesign, dryRunServiceInvocationWiringReadinessReview, dryRunServiceInvocationFailClosedErrorModel, dryRunServiceInvocationWiringContract, dryRunServiceInvocationRequestMapperDesign, dryRunServiceAdapterBoundaryDesign, dryRunServiceAdapterPreviews, dryRunInvocationContract, commandExecuteContractReview, commandExecuteReadinessReview, commandExecuteOperatorOutputReview, and commandExecuteWiringPreview so future wiring steps stay explicit.

Analytics retention dry-run flow:

    CLI args
      -> retention dry-run args parser
      -> retention policy parser
      -> dry-run retention plan
      -> read-only candidate count repository
      -> dry-run JSON preview

Analytics retention repository safety flow:

    Retention plan and execution guard
      -> delete batch plan
      -> delete operation planner
      -> repository candidate recheck
      -> repository safety decision
      -> bounded Prisma repository delete by selected IDs only

Analytics retention service orchestration preview flow:

    Retention policy input and execution args
      -> retention policy and plan
      -> count-only candidate read loader
      -> execution guard
      -> delete batch plan
      -> delete operation plan
      -> optional repository prepare operation
      -> service preview summary

Analytics retention operator preview flow:

    CLI args
      -> retention policy and execution arg split
      -> fail-fast execution arg validation
      -> Prisma candidate read repository
      -> count-only usage/rejected candidate counts
      -> candidate-read execution service preview
      -> operator preview output
      -> JSON safety summary

The repository safety flow exists as a backend foundation only. The operator preview command reads candidate counts and builds safety output, but it is not an execute command and is not wired to deleteCandidates, a delete API, a scheduled job, or a quota path.

Rollup tables, retention dry-run, and retention repository primitives are not used by quota counting. Summary APIs still default to raw-event summary, while selected bounded consumer usage, API key usage, and rejected summary reads can opt in to rollup read models with `rollupSummaryRuntimeRead=true` and raw-summary fallback.

---

## Current Infrastructure

Docker Compose services:

- api-gateway
- admin-dashboard
- product-service
- postgres
- redis
- prometheus
- grafana
- k6 under the optional `tools` profile

Ports:

- API Gateway -> 3000
- Product Service -> 3001
- Grafana -> 3002
- PostgreSQL -> 5432
- Redis -> 6379
- Prometheus -> 9090

---

## Observability Architecture

Runtime signal flow:

    API Gateway request
      -> request ID and structured access log
      -> `http_requests_total`
      -> `http_request_duration_seconds`
      -> optional `http_response_cache_total`
      -> Prometheus scrape on `/metrics`
      -> provisioned Grafana datasource and dashboard

Metric label boundaries:

- Matched requests use Fastify route templates.
- Unmatched requests use the fixed `__unmatched__` route label.
- Request IDs, API keys, admin actor values, raw unmatched paths, timestamps, and free-form error messages are not metric labels.
- Cache outcomes remain allowlisted to `HIT`, `MISS`, and `BYPASS`.

Dashboard boundary:

- The gateway dashboard contains request rate, request count by route, p95 latency by route, cache outcomes, and five-minute 5xx responses.
- General request and latency panels exclude Prometheus `/metrics` scrape traffic.
- Panels use existing Prometheus metrics and do not create new business semantics.

Validation boundary:

- `npm run test:k6:smoke` runs a bounded `GET /health` smoke through the Docker Compose `tools` profile.
- The smoke is limited to 1 VU, 10 iterations, 30 seconds, a 5-second graceful stop, and 2-second request timeouts.
- This is a local portfolio/demo smoke check, not a production load-test platform.

Source-of-truth boundary:

- Prometheus and Grafana are operational signals only.
- `gateway.api_usage_events` remains the source of truth for successful usage analytics and quota counting.
- `gateway.api_rejected_events` remains the source of truth for rejected/security traffic.
- Rollup tables and metrics are not used for quota enforcement.

---

## Data Ownership

Product Service owns:

- public.products
- public._prisma_migrations

API Gateway owns:

- gateway.gateway_routes
- gateway.api_consumers
- gateway.api_keys
- gateway.usage_plans
- gateway.api_usage_events
- gateway.api_rejected_events
- gateway.api_usage_rollups
- gateway.api_rejected_rollups
- gateway._prisma_migrations

---

## API Gateway Responsibilities

API Gateway currently handles:

- Public health and metrics endpoints.
- Product Service proxy routes.
- Catch-all dynamic dispatcher for /api/*.
- Startup route config loading and runtime reload.
- Shared downstream proxy pipeline.
- DB-backed issued API key verification.
- Env API_KEYS fallback.
- JWT authentication.
- Usage plan management and API key assignment.
- Event-based quota evaluation and runtime quota enforcement.
- API key quota state and usage plan usage summary.
- Redis-backed rate limiting and response caching.
- API usage event recording.
- API rejected event recording.
- Consumer and API key usage summaries with filters.
- Successful usage event raw listing with filters, offset pagination, and cursor pagination.
- Rejected events summary and raw listing with filters, offset pagination, and cursor pagination.
- Analytics rollup calculation, persistence, manual backfill, read model, schedule plan, schedule preview, scheduler runner contract, scheduler execution decision boundary, scheduler execution blocked reason review, scheduler execution wiring review output, scheduler command dry-run design review output, scheduler command dry-run invocation contract/readiness/design review output, scheduler command dry-run service invocation review/design/wiring/fail-closed/mapper/adapter output, scheduler command dry-run runtime service invocation, runtime consistency output, blocked-path runtime tests, scheduler command execute contract review output, scheduler command execute readiness review output, scheduler command execute operator output review, scheduler command execute wiring preview output, schedule preview command, and scheduler preview command foundations.
- Analytics retention dry-run policy, candidate count, service, args parser, and command foundations.
- Analytics retention execution guard, execution args parser, execution preview command, delete batch plan model, repository safety contract, operation planner, Prisma delete repository foundation, execution service preview, summary model, candidate count loader, candidate-read preview composition, operator preview output, DB-backed operator preview command, and operator preview fail-fast CLI hardening.
- Internal/admin route, consumer, API key, usage plan, usage analytics, rejected event, quota, and rollup APIs.
- Structured access logs, bounded Prometheus metric labels, provisioned Grafana panels, and bounded Docker-based k6 smoke validation.

---

## API Usage Tracking and Analytics Architecture

Usage table:

    gateway.api_usage_events

Usage event fields:

- requestId
- routePath
- routeMethod
- statusCode
- durationMs
- cacheStatus
- apiKeyAuthSource
- apiKeyId
- consumerId
- occurredAt

Usage recorder behavior:

- Records successful downstream proxy/cache handler responses.
- Records DB-backed API key traffic with apiKeyId and consumerId.
- Records env fallback traffic without apiKeyId and consumerId.
- Records cache status HIT, MISS, or BYPASS.
- Records response status code and durationMs.
- Usage recorder failure does not fail the client response.

Admin usage analytics endpoints:

- GET /internal/admin/usage/events
- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Usage event listing behavior:

- Returns raw successful usage event rows from gateway.api_usage_events.
- Supports offset pagination with limit, offset, total, and hasNextPage.
- Supports cursor pagination with nextCursor for large event investigation.
- Sorts by occurredAt desc and id desc.
- Supports filters by from, to, routePath, routeMethod, statusCode, cacheStatus, apiKeyAuthSource, apiKeyId, and consumerId.
- Invalid query values return 400 INVALID_QUERY_PARAMETER.
- Does not expose raw API keys, JWTs, or Authorization headers.

Usage summary behavior:

- Summaries still read from gateway.api_usage_events.
- Supported filters include from, to, routePath, routeMethod, statusCode, cacheStatus, and apiKeyAuthSource.
- Invalid query values return 400 INVALID_QUERY_PARAMETER.

---

## API Rejected Event Architecture

Rejected event table:

    gateway.api_rejected_events

Tracked rejection reasons:

- API_KEY_MISSING
- API_KEY_INVALID
- JWT_TOKEN_MISSING
- JWT_TOKEN_INVALID
- RATE_LIMIT_EXCEEDED
- QUOTA_EXCEEDED

Admin rejected event endpoints:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Rejected listing behavior:

- Returns raw rejected event rows.
- Supports offset pagination with limit, offset, total, and hasNextPage.
- Supports cursor pagination with nextCursor for large rejected event investigation.
- Supports filters by from, to, rejectionReason, statusCode, routePath, routeMethod, apiKeyAuthSource, apiKeyId, and consumerId.
- Sorts by occurredAt desc and id desc.
- Rejected events summary rejects cursor because cursor is only meaningful for raw event listing.
- Rejects invalid query values with 400 INVALID_QUERY_PARAMETER.
- Does not write rejected requests into gateway.api_usage_events.

---

## Analytics Rollup Architecture

Rollup tables:

    gateway.api_usage_rollups
    gateway.api_rejected_rollups

Current files:

- apps/api-gateway/src/analytics/
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts

Current behavior:

- Rollup buckets are calculated in UTC.
- Supported granularities are hour and day.
- Window planner expands partial ranges to full bucket rebuild windows.
- Window planner supports maxBuckets guardrails.
- Usage aggregate builder groups raw usage events by bucket, consumer, API key, route, method, status class, cache status, and auth source.
- Rejected aggregate builder groups rejected events by bucket, consumer, API key, route, method, rejection reason, status code, and auth source.
- Dimension hashes are SHA-256 values built from stable rollup dimensions and exclude metrics.
- Usage and rejected rollups have separate repositories and separate persistence tables.
- Persistence uses upsert by dimensionHash to support idempotent rebuild behavior.
- Manual backfill command can plan or execute controlled rebuilds.
- Schedule preview command can plan the next rollup window without executing rollup work.
- Scheduler preview command default mode can convert a planned schedule window into dry-run backfill request contracts without invoking backfill service.
- Scheduler preview command exposes executionDecision output for command, process-local, and external-scheduler triggers; preview is allowed by default and command dry-run is allowed only when runtime service invocation is explicitly wired.
- Scheduler preview command exposes executionDecision.wiringReview with currentCapability=command-preview-only and recommended next steps for preview, dry-run, execute, and automatic trigger requests.
- Scheduler execution decision blocks dry-run mode with backfill-service-invocation-not-wired unless direct command dry-run runtime service invocation is explicitly wired; execute mode remains blocked with backfill-execution-not-wired.
- Scheduler command execute review exposes commandExecuteContractReview for command:execute requests, requiring explicit operator confirmation, prior dry-run runtime validation, explicit event limit, max bucket bound, bounded bucket count, source-separated execution, rollup-tables-only persistence scope, rollback expectation, operator safety output, no quota mutation, and no raw event deletion before any future execute wiring.
- Scheduler command execute readiness review exposes commandExecuteReadinessReview with plannedBackfillRequestCount, plannedSources, plannedGranularity, runner-plan derivation, required confirmation/event-limit/max-bucket/source-separation guardrails, and canInvokeBackfillService=false, canExecuteBackfill=false, canReadEvents=false, canPersistRollups=false, canAffectQuotaCounting=false, and canDeleteRawEvents=false.
- Scheduler command execute operator output review exposes commandExecuteOperatorOutputReview with confirmation requirement, blocked reason, readiness status, contract status, persistence scope, rollback expectation, source-scoped planned requests, safety flags, no quota mutation, and no raw event deletion while keeping executeRuntimeCurrentlyAllowed=false.
- Scheduler command execute wiring preview exposes commandExecuteWiringPreview for command:execute requests with currentWiringState=blocked-not-wired, confirmationState=not-confirmed, source-scoped planned execute requests, guardrails, safety flags, and all runtime permissions false.
- Scheduler execution wiring review exposes dryRunDesignReview for command:dry-run requests with currentlyWired=false, non-destructive requirements, source separation, event limit guardrail, Docker/PostgreSQL validation, quota safety, and raw event deletion prohibition.
- Scheduler command dry-run review exposes dryRunInvocationContract for future command-only, dry-run-only, per-source backfill service invocation while keeping serviceInvocationCurrentlyAllowed=false, eventReadCurrentlyAllowed=false, rollupPersistenceCurrentlyAllowed=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Scheduler command dry-run review exposes dryRunInvocationReadiness from the runner plan, including plannedBackfillRequestCount, plannedSources, plannedGranularity, backfillRequestsDerivedFromRunnerPlan, allPlannedRequestsDryRunOnly, canInvokeBackfillService=false, canReadEvents=false, and canPersistRollups=false.
- Scheduler command dry-run review exposes dryRunInvocationDesignReview for the future command-to-backfill-service dry-run boundary while keeping automatic triggers, execute mode, event reads, persistence, quota changes, and raw event deletion disallowed.
- Scheduler command dry-run review exposes dryRunServiceInvocationImplementationDesign for the future scheduler-command-dry-run-to-rollup-backfill-service implementation boundary while keeping implementation, service invocation, event reads, persistence, quota changes, and raw event deletion disallowed.
- Scheduler command dry-run review exposes dryRunServiceInvocationWiringReadinessReview for future service invocation wiring while keeping currentWiringState=not-wired, readyForServiceInvocationWiring=false, serviceInvocationCurrentlyAllowed=false, quota changes disallowed, and raw event deletion disallowed.
- Scheduler command dry-run review exposes dryRunServiceInvocationFailClosedErrorModel for future service invocation errors while keeping failureState=blocked, serviceInvocationCurrentlyAllowed=false, partialPersistenceAllowed=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Scheduler command dry-run review exposes dryRunServiceInvocationWiringContract for future command-only dry-run service invocation while keeping currentWiringState=not-wired, serviceInvocationCurrentlyAllowed=false, source-scoped results required, event-limit and max-bucket guardrails required, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Scheduler dry-run backfill request mapper maps ready runner backfill requests into dry-run AnalyticsRollupBackfillRunInput contracts with explicit eventLimit and maxBuckets guardrails, without invoking the backfill service.
- Scheduler command dry-run review exposes dryRunServiceInvocationRequestMapperDesign for the mapper-only scheduler-backfill-request-to-backfill-service-run-input boundary while keeping service invocation, event reads, persistence, quota changes, and raw event deletion disallowed.
- Scheduler command dry-run review exposes dryRunServiceAdapterBoundaryDesign for the mapped-backfill-run-input-to-rollup-backfill-service-dry-run boundary while keeping adapter invocation, service invocation, event reads, persistence, quota changes, and raw event deletion disallowed.
- Scheduler command dry-run review exposes dryRunServiceAdapterPreviews when --event-limit is provided, with source-separated planned service-result previews for mapped dry-run service inputs.
- Scheduler dry-run service adapter boundary validates mapped dry-run service inputs and produces planned dry-run service result previews without calling AnalyticsRollupBackfillService.runBackfill.
- Direct command dry-run with --event-limit invokes AnalyticsRollupBackfillService.runBackfill in dry-run mode only and emits dryRunServiceInvocationResults.
- Runtime command dry-run output reports service-dry-run-invoked for each mapped source, serviceResult.mode=dry-run, and zero input/aggregate/upsert counts.
- Runtime consistency output reports runtime-dry-run-service-invocation-wired for direct command dry-run while keeping automatic triggers and execute mode unwired.
- Scheduler execution decision keeps process-local:dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- Schedule preview output explicitly reports previewOnly=true, commandCreatesScheduledJob=false, commandExecutesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- Scheduler preview default and blocked-path output explicitly reports previewOnly=true, createsScheduledJob=false, invokesBackfillService=false, executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false. Direct command dry-run output reports invokesBackfillService=true only for the dry-run service invocation boundary while still reporting executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- Scheduler execution decision output blocks unwired process-local/external-scheduler triggers and dry-run/execute modes.
- Scheduler execution wiring review output keeps command dry-run and execute wiring separate and explicit.
- Read repositories expose rollup rows without changing existing summary APIs.
- GET /internal/admin/analytics/rollups reads usage or rejected rollups with admin API key protection.

Rollup read endpoint:

- Requires source=usage or source=rejected.
- Requires from, to, and granularity.
- Supports limit.
- Supports routePath, routeMethod, statusCode, apiKeyAuthSource, apiKeyId, and consumerId.
- Supports cacheStatus for usage rollups only.
- Supports rejectionReason for rejected rollups only.
- Maps statusCode to statusClass for usage rollup reads.
- Uses exact statusCode for rejected rollup reads.
- Rejects invalid query values with 400 INVALID_QUERY_PARAMETER.

---

## Analytics Retention Architecture

Current files:

- apps/api-gateway/src/analytics/analytics-retention-policy.ts
- apps/api-gateway/src/analytics/analytics-retention-candidate-read.repository.ts
- apps/api-gateway/src/analytics/analytics-retention-dry-run-service.ts
- apps/api-gateway/src/analytics/analytics-retention-dry-run-command-args.ts
- apps/api-gateway/src/analytics/analytics-retention-dry-run.command.ts
- apps/api-gateway/src/analytics/analytics-retention-execution-guard.ts
- apps/api-gateway/src/analytics/analytics-retention-execution-command-args.ts
- apps/api-gateway/src/analytics/analytics-retention-execution-preview.ts
- apps/api-gateway/src/analytics/analytics-retention-execution-preview.command.ts
- apps/api-gateway/src/analytics/analytics-retention-delete-batch-plan.ts
- apps/api-gateway/src/analytics/analytics-retention-delete-repository-safety.ts
- apps/api-gateway/src/analytics/analytics-retention-delete.repository.ts
- apps/api-gateway/src/analytics/analytics-retention-delete-operation-plan.ts
- apps/api-gateway/src/analytics/analytics-retention-execution-service.ts
- apps/api-gateway/src/analytics/analytics-retention-execution-service-summary.ts
- apps/api-gateway/src/analytics/analytics-retention-execution-candidate-count-loader.ts
- apps/api-gateway/src/analytics/analytics-retention-execution-service-candidate-read-preview.ts
- apps/api-gateway/src/analytics/analytics-retention-operator-preview-output.ts
- apps/api-gateway/src/analytics/analytics-retention-operator-preview.command.ts

Current commands:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90

    npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120

Current behavior:

- Defaults to disabled dry-run planning.
- Supports source=usage, source=rejected, or source=both.
- Supports separate usage and rejected retention day windows.
- Enforces minimum retention day guardrails.
- Counts candidate rows older than computed cutoffs.
- Dry-run command returns JSON preview with candidateCount, dryRunOnly=true, and deleteAllowed=false.
- Existing dry-run command still rejects execute mode.
- Execution preview command models explicit execute guardrails without DB access.
- Execution preview reports deleteImplementationAvailable=false.
- Delete batch plan model requires candidate recheck and one total hard delete limit.
- Delete repository safety model requires source, cutoff, limit, candidate recheck, and batch-plan safety checks.
- Delete operation planner derives repository requests from retention plans and batch plans.
- Prisma delete repository counts candidates by source and can delete only bounded selected IDs after safety checks.
- Execution service preview composes policy, plan, execution guard, delete batch plan, delete operation plan, optional repository preparation, and safe output flags.
- Execution service summary maps rich preview output into a compact non-destructive summary contract.
- Candidate count loader normalizes count-only candidate read repository output for execution planning.
- Candidate-read execution preview composes existing read-only candidate counts into the service preview.
- Operator preview command reads candidate counts from PostgreSQL through the Prisma candidate read repository.
- Operator preview command validates execution args before DB-backed candidate reads, so invalid execute-only flags fail fast before touching the candidate repository.
- Operator preview output reports commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
- Service previews and operator previews do not call deleteCandidates.
- The existing execution preview command remains DB-free and reports deleteImplementationAvailable=false.
- No operator-facing raw event deletion is exposed.
- No retention execute command is implemented yet.

---

## Current Important Files

Analytics foundation:

- apps/api-gateway/src/analytics/
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts

API usage analytics:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/api-usage/
- apps/api-gateway/src/routes/admin-api-usage.route.ts

Rejected events:

- apps/api-gateway/src/api-rejections/
- apps/api-gateway/src/routes/admin-api-rejection.route.ts

Core:

- apps/api-gateway/src/app.ts
- apps/api-gateway/src/server.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts
- apps/api-gateway/src/routes/
- apps/api-gateway/src/runtime/
- apps/api-gateway/src/api-consumers/
- apps/api-gateway/src/api-keys/
- apps/api-gateway/src/usage-plans/

---

## Current Limitations

- Summary APIs default to raw-event reads; selected bounded consumer usage, API key usage, and rejected summaries may opt into rollup reads with raw-summary fallback.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any operator-facing execute command, API, scheduled job, or quota path yet.
- No retention delete job is implemented yet.
- Direct command execute and guarded process-local dry-run runtime paths exist, but no autonomous scheduler loop, external scheduler runtime, scheduled/background execute, or retention execution exists.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
- The Admin Dashboard now includes read-only consumers, consumer-scoped API keys, usage plans, persisted/runtime routes, quota state, successful usage analytics, and rejected-event investigation; rollup, scheduler, and retention panels remain assigned to Sprint 64.
- Developer Portal foundation is implemented as a public static-first application; API documentation and API-key self-service boundaries remain assigned to Sprint 66.
- Admin authorization remains a local full-access/read-only API key boundary; database-backed administrator identities and general platform RBAC are not implemented yet.
- Dynamic routing supports exact method/path plus an optional exact host condition; path parameters are not implemented.
- Path parameters are not implemented yet.
- Wildcard upstream mapping is not implemented yet.
- Exact host-based routing is implemented; wildcard hosts and host analytics dimensions are not implemented.
- Bounded route-level weighted upstream routing is implemented; service discovery and health-based failover are not implemented.
- Service discovery is not implemented yet.
- OpenTelemetry tracing is not implemented yet.
- Loki centralized logging is not implemented yet.
- Only bounded local k6 health smoke validation is implemented; a production-scale load-test platform is not.
- Kafka and RabbitMQ are not implemented yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Architecture Step

Sprint 64 - Dashboard rollup/retention/scheduler panels.

Rationale:

- Sprint 63 established bounded analytics filters, cursor navigation, strict DTO validation, and fixed same-origin Admin read URLs.
- Sprint 64 should reuse those boundaries for rollup, scheduler, and retention inspection.
- Scheduler and retention views must remain observational unless a later roadmap item explicitly approves execution.
- Quota counting must remain based on raw successful usage events.
- Raw-event deletion must remain blocked.

## Selected Summary Runtime Rollup Reads

Sprint 53 adds an explicit runtime-read switch for selected admin summary APIs.

Default behavior remains unchanged:

~~~text
summary API request
  -> parsed filters
  -> raw-event summary repository
  -> existing summary response shape
~~~

Opt-in runtime rollup behavior:

~~~text
summary API request with rollupSummaryRuntimeRead=true
  -> parsed filters
  -> runtime read decision
  -> rollup read query mapper
  -> analytics rollup read service
  -> usage or rejected rollup read repository
  -> read-model adapter
  -> existing summary response shape
~~~

Fallback behavior:

~~~text
unsupported, unbounded, missing, empty, failed, or source-mismatched rollup read
  -> raw-event summary repository
  -> existing summary response shape
~~~

Selected targets:

- `GET /internal/admin/usage/consumers/:consumerId/summary`
- `GET /internal/admin/usage/api-keys/:apiKeyId/summary`
- `GET /internal/admin/api-rejections/summary`

The runtime flag does not change quota counting, raw event retention, scheduler/background execution, retention execution, or Admin UI behavior.

## Background Scheduler Contract/Runner Boundary

Sprint 54 adds an explicit background scheduler contract/runner boundary without opening background runtime execution.

Current background scheduler behavior:

- backgroundScheduler is exposed in scheduler preview command JSON as operator-visible contract data.
- command trigger remains owned by the direct CLI runtime path.
- process-local and external-scheduler preview can produce background preview contract output when the scheduler plan is ready.
- process-local and external-scheduler dry-run/execute remain runtime-blocked with background-runtime-execution-not-wired.
- Disabled or invalid background runner plans are blocked without preview plans.
- Background scheduler output reports safety flags for no scheduled job creation, no backfill service invocation, no backfill execution, no event reads, no rollup persistence, no quota counting change, no raw event deletion, and no retention execution.
- Direct command dry-run and execute behavior from previous sprints remains separate and unchanged.

Sprint 54 still does not implement a scheduled/background rollup job, process-local runner loop, external scheduler integration, retention execution, quota mutation, or raw event deletion.

## Sprint 55 Background Scheduler Runtime Wiring Boundary

Sprint 55 opens one guarded runtime path for analytics rollup scheduling: direct CLI `process-local` + `dry-run`.

This path may resolve the runtime backfill service factory and invoke `runBackfill` in dry-run mode only after explicit guardrails pass.

Allowed:

- `process-local`
- `dry-run`
- bounded runner plan
- source-separated dry-run service invocation
- event-limit guardrail
- max-bucket guardrail
- Docker/PostgreSQL validated runtime service invocation

Still blocked:

- scheduled/background rollup job creation
- external scheduler runtime execution
- background execute
- quota mutation
- raw event deletion
- retention execution
- Admin UI expansion

## Sprint 58 Minimal Admin/RBAC Hardening Boundary

Sprint 58 adds a bounded administration authorization layer without introducing a full identity or enterprise IAM platform.

Admin route registration boundary:

- The exact `/internal/admin` route and every `/internal/admin/*` descendant must register marked admin API key authentication middleware.
- Application startup fails when a protected admin route is registered without that middleware.
- Similar but unrelated paths such as `/internal/administrator` are not implicitly classified as admin routes.
- This boundary protects future route additions from accidentally omitting admin authentication.

Minimal role boundary:

- `ADMIN_API_KEY` remains the full-access local administration credential.
- `ADMIN_READ_ONLY_API_KEY` is optional and disabled when blank or absent.
- The read-only credential may call only `GET`, `HEAD`, and `OPTIONS`.
- Read-only mutation attempts return `403 ADMIN_API_KEY_READ_ONLY`.
- Full-access and read-only credentials must be different; identical configuration fails during middleware creation.

Secret verification:

- Admin credentials are no longer compared directly with raw string equality.
- Configured keys are hashed once when the middleware is created.
- Request keys are verified through the existing `verifyApiKeyHash` helper.
- `verifyApiKeyHash` uses SHA-256 and Node.js `timingSafeEqual`.
- Prefix-like, suffix-extended, and different-length invalid keys remain rejected.

Actor attribution:

- Admin mutation routes use a shared `getAdminActor` helper.
- `x-admin-actor` is trimmed and limited to 64 characters.
- Allowed attribution characters are letters, digits, `.`, `_`, `:`, `@`, and `-`.
- Missing, duplicated, blank, unsafe, or oversized values fall back to `admin-api-key`.
- Actor attribution remains audit metadata and is not treated as an authenticated principal.

Runtime configuration:

- Docker Compose exposes `ADMIN_API_KEY_HEADER`, `ADMIN_API_KEY`, and optional `ADMIN_READ_ONLY_API_KEY`.
- `.env.example` documents the optional read-only credential.
- Existing deployments that do not configure `ADMIN_READ_ONLY_API_KEY` preserve the previous full-access-only behavior.

Scope remains intentionally narrow:

- no Admin Dashboard UI
- no database-backed admin user or role tables
- no organization or multi-tenant authorization model
- no database migration
- no API management persistence contract change
- no quota counting change
- no analytics rollup scheduler change
- no retention execution
- no raw event deletion

## Sprint 57 Retention Execute Preview Hardening Boundary

Sprint 57 hardens the non-destructive retention execute preview boundary created in Sprint 56.

New output behavior:

- `executeContractReview.expectations.candidateRecheckExpectation`
- `executeContractReview.expectations.rollbackExpectation`
- `executeContractReview.expectations.auditOutputExpectation`
- `preparedOperationErrors` on retention execution service preview summaries
- per-source `preparedOperationError` output on service/operator summaries
- fail-closed candidate recheck preparation errors before any future destructive delete path

Safety remains unchanged:

- `executeContractReview.summary.allowed=false`
- `executeContractReview.summary.destructiveExecutionAllowed=false`
- service/operator previews do not call `deleteCandidates`
- Prisma delete repository preparation can be previewed, but destructive delete execution is not wired to an operator command, API, scheduled job, or quota path
- raw events are not deleted
- quota counting remains based on raw successful usage events
- no Admin UI behavior changes

Sprint 57 remains preview hardening only. It does not introduce a retention execute command, delete API, scheduled delete job, runtime retention execution path, quota mutation, or raw event deletion.

## Sprint 56 Retention Execute Contract Review Boundary

Sprint 56 adds a review-only retention execute contract boundary.

`executeContractReview` is now exposed through:

- `analytics:retention:execution-preview`
- retention execution service preview
- `analytics:retention:operator-preview`

The review output covers:

- operator confirmation
- hard delete limit
- candidate recheck expectation
- rollback expectation
- audit output expectation
- safety flags for delete wiring, raw event deletion, quota mutation, background jobs, and retention execution

The boundary remains non-destructive:

- `executeContractReview.summary.allowed=false`
- no retention execute command exists
- no delete API exists
- no scheduled retention delete job exists
- operator preview does not call `deleteCandidates`
- Prisma retention delete repository is not wired into command/API/job execution
- quota counting remains unchanged
- raw event deletion remains blocked

## Sprint 63 Dashboard Analytics Read Boundary

Sprint 63 extends the Dashboard with bounded quota, successful usage, and rejected-event reads. It does not change Gateway persistence, quota enforcement, event recording, rollup behavior, scheduler execution, retention execution, or database schema.

### Browser pages

```txt
/usage-analytics
/rejected-events
```

### Fixed Dashboard BFF resources

```txt
GET /api/admin/usage/consumers/:consumerId/summary
GET /api/admin/usage/api-keys/:apiKeyId/summary
GET /api/admin/api-keys/:apiKeyId/quota
GET /api/admin/usage-plans/:usagePlanId/usage-summary
GET /api/admin/usage/events
GET /api/admin/api-rejections/summary
GET /api/admin/api-rejections/events
```

### Fixed Gateway resources

```txt
GET /internal/admin/usage/consumers/:consumerId/summary
GET /internal/admin/usage/api-keys/:apiKeyId/summary
GET /internal/admin/api-keys/:apiKeyId/quota
GET /internal/admin/usage-plans/:usagePlanId/usage-summary
GET /internal/admin/usage/events
GET /internal/admin/api-rejections/summary
GET /internal/admin/api-rejections/events
```

### Query boundary

- Unknown and duplicate query keys fail closed.
- Date windows are bounded to at most 31 days.
- Event pages default to 20 rows and allow at most 100 rows.
- The Dashboard exposes opaque cursor navigation only.
- Offset pagination is not exposed.
- Rollup summary flags are not exposed.
- IDs, methods, status codes, cache states, rejection reasons, route paths, and cursors are allowlisted and bounded.

### Response boundary

- Browser and server DTOs validate exact keys, safe identities, timestamps, pagination state, and summary consistency.
- Successful usage and rejected/security events use separate DTOs and pages.
- Rejected-event metadata is accepted only at the upstream validation boundary, checked for sensitive fields, removed before the BFF result, and never rendered.
- Errors are normalized and responses use `cache-control: no-store`.
- The browser never receives an Admin credential.

### Source-of-truth boundary

- `gateway.api_usage_events` remains the source of truth for successful usage analytics and quota counting.
- `gateway.api_rejected_events` remains the source of truth for rejected/security traffic.
- The Dashboard does not merge those datasets.
- Rollups and metrics remain outside quota enforcement.

## Sprint 62 Dashboard Resource Read Boundary

Sprint 62 extends the Dashboard through explicit fixed read resources. It does not introduce a generic proxy or a mutation-capable administration client.

### Browser pages

```txt
/consumers
/api-keys
/usage-plans
/routes
```

### Fixed Dashboard BFF resources

```txt
GET /api/admin/consumers
GET /api/admin/consumers/:consumerId
GET /api/admin/consumers/:consumerId/api-keys
GET /api/admin/usage-plans
GET /api/admin/usage-plans/:usagePlanId
GET /api/admin/routes
GET /api/admin/routes/:routeId
GET /api/admin/routes/runtime
```

### Fixed Gateway resources

```txt
GET /internal/admin/consumers
GET /internal/admin/consumers/:consumerId
GET /internal/admin/consumers/:consumerId/api-keys
GET /internal/admin/usage-plans
GET /internal/admin/usage-plans/:usagePlanId
GET /internal/admin/routes
GET /internal/admin/routes/:routeId
GET /internal/admin/routes/runtime
```

### Shared read-resource flow

```txt
Operator Browser
  -> fixed Dashboard page
  -> fixed GET-only Dashboard BFF route
  -> server-only read-resource boundary
  -> ADMIN_READ_ONLY_API_KEY
  -> fixed Gateway Admin GET endpoint
  -> strict bounded DTO validation
  -> no-store response
```

Shared UI states include loading, empty, error, retry, and bounded table rendering. Browser and server contracts reject invalid identities, malformed payloads, inconsistent list/detail data, and unbounded resource arrays.

### Resource boundaries

Consumers:

- list and detail data remain read-only
- missing consumers map to bounded not-found responses
- no create, update, deactivate, or delete controls

API keys:

- listing is scoped to one selected consumer
- only safe metadata such as prefix, status, expiry, use timestamps, and usage-plan identity is rendered
- raw issued key material is never returned or stored by the Dashboard
- no issue, revoke, or usage-plan assignment controls

Usage plans:

- list and detail views display quota window, quota limit, enabled state, description, and audit metadata
- the Dashboard does not create or update plans
- the Dashboard does not change quota enforcement

Routes:

- persisted route configuration and runtime registry are separate resources
- route policies are validated and rendered as bounded data
- the Dashboard does not create, update, delete, reload, or proxy to downstream URLs

### Security boundary

- Only `ADMIN_READ_ONLY_API_KEY` is available to the Dashboard server.
- Full-access `ADMIN_API_KEY` is absent from the Dashboard process and container.
- Browser code receives no Admin credential.
- Browser input cannot select arbitrary Gateway methods, paths, hosts, or headers.
- Dashboard BFF mutation methods are unavailable.
- Gateway read-only mutation attempts remain rejected with `ADMIN_API_KEY_READ_ONLY`.

### Preserved platform behavior

Sprint 62 changes Dashboard reads only. It does not change API management persistence, quota counting, event recording, rollup behavior, scheduler execution, retention execution, raw-event deletion, or database schema.

## Sprint 61 Admin Dashboard Architecture Boundary

Sprint 61 adds the first PulseGate product-facing Admin Dashboard while preserving the existing Gateway administration and data safety boundaries.

### Application boundary

The Dashboard is a separate workspace:

```txt
apps/admin-dashboard
```

Technology:

- Next.js `16.2.10`
- React `19.2.4`
- TypeScript
- App Router
- plain CSS

Runtime:

- local and Docker port `3003`
- production Node.js 20 image
- multi-stage Docker build
- non-root `node` runtime user
- Docker-internal Gateway origin `http://api-gateway:3000`

Product/documentation version is `v1.1.0`.

Private npm workspace package versions remain `0.1.0`.

The existing annotated `v1.0.0` Git tag remains unchanged.

### Browser and server boundary

Browser-facing endpoint:

```txt
GET /api/admin/runtime-status
```

Server-only Gateway endpoint:

```txt
GET /internal/admin/routes/runtime
```

The browser calls only the Dashboard BFF.

The Dashboard server adds the configured Admin header only when calling the fixed Gateway runtime-status endpoint.

No generic Gateway Admin API forwarding route exists.

### Configuration boundary

Required server-only variables:

```txt
PULSEGATE_GATEWAY_BASE_URL
ADMIN_READ_ONLY_API_KEY
```

Optional variables:

```txt
ADMIN_API_KEY_HEADER
ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS
```

Defaults:

```txt
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS=3000
```

The Gateway base URL accepts only an HTTP or HTTPS origin without credentials, path components, query strings, or fragments.

Missing or invalid configuration fails closed.

### Credential boundary

The Dashboard receives:

```txt
ADMIN_READ_ONLY_API_KEY
```

The Dashboard must not receive:

```txt
ADMIN_API_KEY
```

Admin credentials must remain absent from:

- `NEXT_PUBLIC_*` variables
- HTML
- client bundles
- browser requests to the Gateway
- browser local storage
- browser session storage
- query strings
- BFF responses
- logs
- Docker image configuration

### Runtime response boundary

The Overview panel displays only safe runtime registry metadata:

- access mode
- runtime registry mode
- availability
- loaded version
- loaded timestamp
- registered route count
- safe registered route metadata

Gateway and configuration failures are normalized into bounded Dashboard error responses.

A safe Gateway `requestId` may be preserved.

Raw exception content and credentials are not returned.

### Mutation boundary

Sprint 61 adds no Dashboard mutation controls.

It does not change:

- consumer persistence
- API key persistence
- usage-plan persistence
- route persistence
- quota enforcement
- successful usage recording
- rejected-event recording
- rollup scheduling
- retention execution
- raw-event deletion

### Extension boundary

Sprints 62-64 may extend the Dashboard using explicit fixed BFF resources.

Future Dashboard work must not replace this fixed-resource model with a generic Admin API proxy.

Any approved mutation path must preserve:

- full-access Admin authorization
- read-only mutation rejection
- sanitized `x-admin-actor` attribution
- existing validation and audit behavior
- explicit roadmap scope

## Sprint 60 Release Architecture Boundary

Sprint 60 adds release and demonstration tooling without changing the production architecture:

- `npm run validate:release` validates tests, typecheck, build, Git diffs, clean-tree state, and `origin/main` synchronization.
- `npm run demo:runtime` validates the existing Docker Compose Gateway, Prometheus, Grafana, Admin authorization, bounded metrics, and k6 surfaces.
- The runtime demo does not invoke retention deletion, raw-event deletion, background execute, or external scheduler execution.
- Prometheus metrics and analytics rollups remain outside quota source-of-truth behavior.
- Git/product documentation uses `v1.0.0`; private npm workspace packages remain `0.1.0`.
- No new production service, database model, migration, queue, or autonomous job was added.

## Sprint 59 Observability Boundary

Sprint 59 keeps observability lightweight and reproducible:

- bounded matched and unmatched route labels
- existing Prometheus metric families only
- provisioned five-panel Grafana gateway dashboard
- bounded Docker-based k6 health smoke
- no quota-source changes
- no event-recorder changes
- no scheduler execute expansion
- no retention execution
- no raw event deletion
- no OpenTelemetry, Loki, Kubernetes, or Admin UI scope

<!-- pulsegate:sprint-64:start -->
## Sprint 64 â€” Admin analytics operations read model

Sprint 64 extends the Admin Dashboard with three source-separated, read-only analytics operations paths:

1. **Rollup inspection:** browser â†’ Dashboard BFF GET /api/admin/analytics/rollups â†’ Gateway GET /internal/admin/analytics/rollups â†’ existing rollup read service/repositories.
2. **Scheduler preview:** browser â†’ Dashboard BFF GET /api/admin/analytics/scheduler-preview â†’ Gateway pure preview builder. The path does not start jobs, resolve runtime factories, invoke adapters, or execute backfill.
3. **Retention preview:** browser â†’ Dashboard BFF GET /api/admin/analytics/retention-preview â†’ Gateway fixed dry-run service â†’ existing candidate-count repository. The path imports no delete repository and performs no retention execution.

All three Dashboard DTO boundaries use strict allowlists and fail closed on extra or unsafe fields. Browser-supplied execution, deletion, scheduler, or policy controls are rejected.
<!-- pulsegate:sprint-64:end -->

<!-- SPRINT-65-ARCHITECTURE-START -->
## Sprint 65 — Developer Portal application boundary

Sprint 65 introduces `apps/developer-portal` as a separate public application boundary.

### Runtime topology

- Framework: Next.js 16.2.10 with React 19.2.4 and TypeScript.
- Local development command: `npm run dev:portal`.
- Local and container port: `3004`.
- Docker Compose service: `developer-portal`.
- Production runtime uses a dedicated multi-stage Dockerfile.
- The application currently has no database, Redis, Gateway, Product Service, or Admin Dashboard dependency.
- No environment variable carries Admin credentials or internal Admin route configuration into the Portal.

### Route boundary

- `/` — public Portal overview.
- `/getting-started` — current public onboarding boundary and supported-scope explanation.
- `/api-docs` — honest Sprint 66 placeholder.
- `/api-keys` — honest Sprint 66 placeholder.
- `loading.tsx`, `error.tsx`, and `not-found.tsx` provide application boundaries.

All Sprint 65 pages are statically generated. No Portal BFF route, public account model, session, credential issuance path, billing surface, or organization model is introduced.

### Security boundary

Portal tests recursively inspect production source and reject:

- Admin API-key environment names.
- Internal Admin endpoint paths.
- Admin Dashboard BFF paths.
- `localStorage` or `sessionStorage` credential/session persistence.

This separation prevents the public Portal from reusing privileged Admin Dashboard boundaries.

### Next architecture step

Sprint 66 may add bounded API documentation and API-key self-service foundation/mock behavior. It must not silently expose `/internal/admin/*`, reuse Admin credentials, or convert placeholders into fake production capabilities.
<!-- SPRINT-65-ARCHITECTURE-END -->

<!-- SPRINT-66-ARCHITECTURE-START -->
## Sprint 66 - Developer Portal documentation and key-foundation boundaries

Sprint 66 preserves the public Portal as a static, unprivileged application while adding real developer-facing content.

### API documentation architecture

The `/api-docs` route is a statically generated curated reference. It is based on verified runtime configuration, middleware, handlers, and tests rather than a generated specification.

Current documented public-facing contracts:

- `GET /health`
- `GET /api/product-service/health`
- `GET /api/products`

The protected product route requires the configured API-key header, currently `x-api-key`, and an `Authorization: Bearer` token. The reference documents request correlation, cache status, route rate limiting, quota rejection, and downstream error envelopes.

The reference deliberately excludes:

- `/internal/admin/*`
- Admin Dashboard `/api/admin/*` BFF routes
- Dynamic route-registry inventory not explicitly published as a public contract
- API-key lifecycle management
- Invented OpenAPI schemas or downstream response bodies

No OpenAPI renderer, documentation dependency, backend route, environment variable, or runtime service was added.

### API-key foundation architecture

The `/api-keys` route is a static non-operational foundation. It exposes no forms, buttons, inputs, client mutation code, fetch calls, credential storage, or generated secrets.

Real self-service remains blocked because the platform currently has:

- No public developer identity.
- No developer-to-consumer ownership mapping.
- No browser-safe public API-key lifecycle endpoint.
- Only privileged administrative key-management routes.

Any future activation requires explicit developer authentication, ownership authorization, mutation protection, one-time secret handling, and audit attribution. The Portal must not reuse Admin credentials or privileged Admin APIs.

### Runtime impact

Sprint 66 changes only statically generated Portal pages, navigation metadata, CSS, and tests. The existing Developer Portal image and Compose service on port `3004` remain unchanged. No Gateway, Product Service, database, Redis, migration, billing, marketplace, or host-routing behavior changed.
<!-- SPRINT-66-ARCHITECTURE-END -->

## Host-based routing foundation (Sprint 67)

The runtime registry resolves requests using method, pathname, and normalized direct Host identity. Exact host-specific matches win before path-only fallback. A valid unknown host may use the path-only route; missing or malformed host input does not.

Fastify proxy trust remains disabled. `X-Forwarded-Host` and `Forwarded` do not participate in route selection. Configured hosts are bounded canonical values and never become downstream URLs.

Fastify registration remains deduplicated by method and path. Host selection occurs inside the shared resolver, preserving one authentication, quota, rate-limit, cache, transform, retry, timeout, analytics, and metrics pipeline.

Persistence uses nullable `gateway_routes.request_host`. Null means path-only. The legacy database uniqueness on method and gateway path was removed because Sprint 67 identity includes host-or-null. Active and disabled non-deleted records reserve identity; soft-deleted records release it. Admin conflict checks enforce the application-level identity contract.

Cache and route-level rate-limit keys include configured host identity. Analytics remains method/path based, so host-specific routes sharing a method/path intentionally aggregate together.

<!-- SPRINT-68-ARCHITECTURE-START -->
## Weighted routing foundation (Sprint 68)

Weighted routing is route-level metadata layered after the existing route identity decision.

Runtime order:

```text
request
  -> normalize direct Host
  -> resolve exact host route or path-only fallback
  -> authentication, authorization, quota, rate limit
  -> cache lookup
  -> select one configured weighted upstream on cache miss
  -> shared transform, timeout, retry, proxy, analytics, and metrics pipeline
```

Contract:

- `downstreamUrl` remains the primary and legacy single-upstream target.
- `weightedUpstreams` is optional.
- When present, it contains 2-8 entries.
- Each entry contains `downstreamUrl` and a relative integer `weight` from 1 through 1000.
- The sum is not required to equal 100.
- URLs must be unique HTTP or HTTPS targets.
- The primary `downstreamUrl` must occur exactly once.
- Invalid runtime or persisted configuration fails closed.

Selection:

- Selection uses a bounded cumulative relative-weight algorithm.
- The random source is injectable for deterministic tests.
- No request header, query value, request ID, API key, consumer, or client-controlled value participates.
- Selection occurs once per proxy execution after a cache miss.
- Retries reuse the selected target and do not provide failover.
- A cache hit does not select or fetch an upstream.

Persistence and management:

- `gateway.gateway_routes.weighted_upstreams` is nullable JSONB.
- SQL `NULL` represents legacy single-upstream behavior.
- Admin create omission or `null` persists legacy mode.
- Admin update omission preserves current metadata.
- Admin update `null` clears weighted mode.
- Admin update with an array replaces the full weighted set.
- Runtime reload validates the full active route snapshot before atomic registry replacement.

Dashboard:

- The Dashboard remains read-only.
- It validates the same bounded URL, cardinality, uniqueness, weight, and primary-target rules.
- It renders `Single upstream` or `Weighted routing (N targets)` and lists each target with its weight.
- No route mutation or traffic-control UI was added.

Security and operational boundaries:

- Weighted routing does not create an open proxy or allow arbitrary client target selection.
- Host conditions remain route identity only and are not converted into upstream URLs.
- Authentication, quota, rate-limit, cache, transform, timeout, retry, analytics, and metrics behavior remains shared.
- Raw upstream URLs are not added as Prometheus labels.
- Service discovery is deferred to Sprint 69.
- Health checks and automatic failover are deferred to Sprint 70.
- Sticky routing, distributed coordination, Kubernetes traffic splitting, billing allocation, and experimentation platforms are not implemented.
<!-- SPRINT-68-ARCHITECTURE-END -->
