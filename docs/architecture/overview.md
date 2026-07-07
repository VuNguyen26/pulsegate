# PulseGate Architecture Overview

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.37.0

## Current Status

Sprint 36 - Rollup Scheduler Command Dry-Run Design Review Complete

Current validation:

- 103 test files passed
- 712 tests passed
- npm run typecheck passed
- npm run build passed
- Runtime command validation passed for analytics:rollup:scheduler-preview command dry-run design review and process-local dry-run blocked boundary cases
- Scheduler preview output preserved previewOnly=true, createsScheduledJob=false, invokesBackfillService=false, executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false
- No Docker/PostgreSQL validation was required for Sprint 36 because the scheduler command dry-run design review is DB-free and preview-only

---

## Architecture Scope

This document describes the current architecture only.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Product Goal

PulseGate is a local-first API Gateway, API Management, and Observability Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

PulseGate demonstrates backend engineering around API Gateway routing, dynamic route configuration, API consumer management, DB-backed API keys, usage plans, quota enforcement, successful usage analytics, rejected request analytics, observability, analytics rollup foundations, analytics retention dry-run, execution guardrail, repository safety foundations, service-level retention execution preview orchestration, DB-backed non-destructive retention operator preview hardening, non-destructive rollup schedule preview planning, non-destructive rollup scheduler runner preview planning, non-destructive rollup scheduler execution boundary preview planning, non-destructive rollup scheduler execution wiring review, non-destructive rollup scheduler command dry-run design review, and CI/CD.

---

## Current High-Level Architecture

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
      -> execution boundary decision
      -> execution wiring review
      -> JSON safety output

The schedule and scheduler preview flows are DB-free and do not create scheduled jobs, invoke backfill service, execute backfill, read events, persist rollups, affect quota counting, or delete raw events. The scheduler preview also exposes wiringReview and command dryRunDesignReview so future wiring steps stay explicit.

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

Rollup tables, retention dry-run, and retention repository primitives are not used by quota counting or existing summary APIs.

---

## Current Infrastructure

Docker Compose services:

- api-gateway
- product-service
- postgres
- redis
- prometheus
- grafana

Ports:

- API Gateway -> 3000
- Product Service -> 3001
- Grafana -> 3002
- PostgreSQL -> 5432
- Redis -> 6379
- Prometheus -> 9090

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
- Analytics rollup calculation, persistence, manual backfill, read model, schedule plan, schedule preview, scheduler runner contract, scheduler execution decision boundary, scheduler execution blocked reason review, scheduler execution wiring review output, scheduler command dry-run design review output, schedule preview command, and scheduler preview command foundations.
- Analytics retention dry-run policy, candidate count, service, args parser, and command foundations.
- Analytics retention execution guard, execution args parser, execution preview command, delete batch plan model, repository safety contract, operation planner, Prisma delete repository foundation, execution service preview, summary model, candidate count loader, candidate-read preview composition, operator preview output, DB-backed operator preview command, and operator preview fail-fast CLI hardening.
- Internal/admin route, consumer, API key, usage plan, usage analytics, rejected event, quota, and rollup APIs.
- Structured access logs and Prometheus metrics.

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
- Scheduler preview command can convert a planned schedule window into dry-run backfill request contracts without invoking backfill service.
- Scheduler preview command exposes executionDecision output for command, process-local, and external-scheduler triggers, with preview as the only allowed mode.
- Scheduler preview command exposes executionDecision.wiringReview with currentCapability=command-preview-only and recommended next steps for preview, dry-run, execute, and automatic trigger requests.
- Scheduler execution decision blocks dry-run mode with backfill-service-invocation-not-wired and execute mode with backfill-execution-not-wired.
- Scheduler execution wiring review exposes dryRunDesignReview for command:dry-run requests with currentlyWired=false, non-destructive requirements, source separation, event limit guardrail, Docker/PostgreSQL validation, quota safety, and raw event deletion prohibition.
- Scheduler execution decision keeps process-local:dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- Schedule preview output explicitly reports previewOnly=true, commandCreatesScheduledJob=false, commandExecutesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- Scheduler preview output explicitly reports previewOnly=true, createsScheduledJob=false, invokesBackfillService=false, executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
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

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any operator-facing execute command, API, scheduled job, or quota path yet.
- No retention delete job is implemented yet.
- Rollup schedule and scheduler preview commands exist, and scheduler preview exposes execution boundary decisions, wiring review output, and command dry-run design review output, but no scheduled/background rollup job yet.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
- Admin Dashboard is not implemented yet.
- Developer Portal is not implemented yet.
- Stronger admin auth and RBAC are not implemented yet.
- Dynamic router supports exact method + exact path matching only.
- Path parameters are not implemented yet.
- Wildcard upstream mapping is not implemented yet.
- Host-based routing is not implemented yet.
- Weighted upstreams are not implemented yet.
- Service discovery is not implemented yet.
- OpenTelemetry tracing is not implemented yet.
- Loki centralized logging is not implemented yet.
- k6 load testing is not implemented yet.
- Kafka and RabbitMQ are not implemented yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Architecture Step

Sprint 37 recommended direction:

- Rollup Scheduler Command Dry-Run Invocation Contract Design or Analytics Retention Execution Design Review

Rationale:

- Sprint 36 kept scheduler execution DB-free and non-destructive while making command dry-run design requirements visible.
- Future rollup scheduler work should decide whether command-triggered dry-run may invoke the backfill service under explicit guardrails.
- Command dry-run invocation must define service dry-run semantics, source separation, event limit guardrails, operator output, and Docker/PostgreSQL validation before wiring.
- Execute mode should not be wired before command dry-run has a safe design and runtime validation plan.
- Process-local or external scheduler execution should remain blocked until background execution semantics and runtime validation are designed.
- Delete execution should remain unavailable until command/API semantics, runtime validation, rollback expectations, and operator controls are explicitly designed.