# PulseGate AI Handoff

## Purpose

This file gives enough context to continue PulseGate work in a new AI chat.

It should stay compact.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

Repository:

- https://github.com/VuNguyen26/pulsegate.git

Local path:

- E:\pulsegate

Current version:

- v0.39.0

Latest completed sprint:

- Sprint 38 - Rollup Scheduler Command Dry-Run Invocation Design Review

Recommended next technical sprint:

- Sprint 39 - Rollup Scheduler Command Dry-Run Service Invocation Contract Review or Analytics Retention Execution Design Review

---

## Long-Term Goal

PulseGate is not just a portfolio backend project.

The long-term target is to build it toward a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

Long-term product direction:

- Admin Dashboard
- Developer Portal
- API key request flow
- Dynamic route configuration
- Runtime route registry
- Catch-all dynamic router
- Route management APIs
- Service registry foundation
- API consumer management
- API key lifecycle management
- API key usage tracking
- Consumer analytics
- Usage plans and quotas
- Quota observability
- Rejected request tracking and drilldown
- Successful usage analytics and event investigation
- Analytics retention and rollups
- Observability stack
- CI/CD
- Kubernetes/cloud deployment later
- Event streaming later
- Background jobs later

---

## Tech Stack

Current stack:

- Node.js
- TypeScript
- Fastify
- npm workspaces
- Vitest
- Docker Compose
- PostgreSQL
- Prisma
- Redis
- Prometheus
- Grafana
- GitHub Actions CI/CD

Current ports:

- API Gateway -> 3000
- Product Service -> 3001
- Grafana -> 3002
- PostgreSQL -> 5432
- Redis -> 6379
- Prometheus -> 9090

---

## Current Validation Status

Latest stable validation from Sprint 38:

- npm run test -> passed.
- npm run typecheck -> passed.
- npm run build -> passed.

Latest automated test result:

- 103 test files passed.
- 716 tests passed.

Manual command validation:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway was validated for command dry-run invocation design review and process-local dry-run blocked boundary cases.
- Command dry-run validation passed with blockedReason=backfill-service-invocation-not-wired.
- Command dry-run validation exposed dryRunDesignReview.status=design-required.
- Command dry-run validation exposed dryRunInvocationReadiness with plannedBackfillRequestCount=2, plannedSources=["usage","rejected"], allPlannedRequestsDryRunOnly=true, canInvokeBackfillService=false, canReadEvents=false, and canPersistRollups=false.
- Command dry-run validation exposed dryRunInvocationDesignReview with proposedInvocationBoundary=command-to-backfill-service-dry-run, commandTriggerRequired=true, automaticTriggerAllowed=false, dryRunMayReadEvents=false, dryRunMayPersistRollups=false, dryRunMayAffectQuotaCounting=false, and dryRunMayDeleteRawEvents=false.
- Command dry-run validation exposed dryRunInvocationContract with currentInvocationState=not-wired, triggerBoundary=command-only, requiredBackfillMode=dry-run, serviceInvocationCurrentlyAllowed=false, eventReadCurrentlyAllowed=false, rollupPersistenceCurrentlyAllowed=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Process-local dry-run validation passed with blockedReason=automatic-trigger-not-wired and dryRunDesignReview=null.
- Runtime output preserved previewOnly=true, createsScheduledJob=false, invokesBackfillService=false, executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- No Docker/PostgreSQL validation was required because Sprint 38 stayed DB-free and non-destructive.

Sprint 38 commits:

- 2a203f5 feat(gateway): add rollup scheduler dry-run invocation design review
- 33b8b6d test(gateway): document rollup scheduler dry-run invocation design review

Sprint 38 preserved:

- gateway.api_usage_events as the source of truth for successful usage and quota counting.
- gateway.api_rejected_events as the separate source of truth for rejected/security traffic.
- No quota checker changes.
- No usage recorder changes.
- No rejected event recorder changes.
- No scheduled/background rollup job.
- No backfill service invocation from scheduler preview.
- No rollup summary API switch.
- No retention execute command.
- No operator-facing raw event deletion.

---
## Current Architecture Summary

API Gateway currently supports:

- Startup route config loading from PostgreSQL.
- Static route config fallback.
- Runtime route registry.
- Runtime registry status endpoint.
- Runtime registry reload endpoint.
- Catch-all dynamic router for /api/*.
- Shared downstream proxy pipeline.
- Route policy model.
- DB-backed issued API key authentication.
- Env API_KEYS fallback.
- JWT authentication.
- Redis-backed rate limiting.
- Redis response caching.
- Request transform foundation.
- Response transform foundation.
- Timeout policy.
- Retry policy foundation.
- Downstream error normalization.
- API usage event recording.
- API rejected event recording.
- Consumer usage summary with filters.
- API key usage summary with filters.
- Successful usage events listing with filters, safe offset pagination, and cursor pagination.
- Usage plan management.
- API key usage plan assignment.
- Event-based quota checker.
- Runtime quota enforcement.
- API key quota state endpoint.
- Usage plan usage summary endpoint.
- Rejected events summary endpoint.
- Filtered rejected events summary endpoint.
- Rejected events listing endpoint with filters, safe offset pagination, and cursor pagination.
- Analytics rollup calculation, persistence, manual backfill, read model, schedule plan, schedule preview, scheduler runner contract, scheduler execution decision boundary, scheduler execution blocked reason review, scheduler execution wiring review, scheduler command dry-run design review, scheduler command dry-run invocation contract review, scheduler command dry-run readiness review, scheduler command dry-run invocation design review, schedule preview command, scheduler preview args parser, and scheduler preview command foundations.
- Read-only analytics rollup endpoint.
- Analytics retention dry-run policy, candidate count, service, args parser, and command foundations.
- Analytics retention execution guard, execution args parser, execution preview command, delete batch plan model, repository safety contract, operation planner, Prisma delete repository foundation, execution service preview, summary model, candidate count loader, candidate-read preview composition, operator preview output, DB-backed operator preview command, and operator preview fail-fast CLI hardening.
- 429 QUOTA_EXCEEDED responses with quota metadata.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Internal/admin usage plan APIs.
- Internal/admin API usage analytics APIs.
- Structured access logs.
- Prometheus metrics.
- Grafana dashboard.

Product Service currently supports:

- GET /health
- GET /products
- PostgreSQL-backed product data through Prisma

---

## Current Data Ownership

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

## Current API Usage, Quota, Rejected Event, Rollup, and Retention Behavior

Usage event table:

- gateway.api_usage_events

Usage plan table:

- gateway.usage_plans

Rejected event table:

- gateway.api_rejected_events

Rollup tables:

- gateway.api_usage_rollups
- gateway.api_rejected_rollups

Admin usage analytics endpoints:

- GET /internal/admin/usage/events
- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Admin rejected analytics endpoints:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Admin rollup analytics endpoint:

- GET /internal/admin/analytics/rollups

Rollup commands:

- npm run analytics:rollup:backfill --workspace api-gateway -- --from 2026-07-05T00:00:00.000Z --to 2026-07-06T00:00:00.000Z --granularity hour
- npm run analytics:rollup:schedule-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1
- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1
- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source usage --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-mode execute
- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source usage --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-trigger process-local

Retention commands:

- npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90
- npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100
- npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120

Analytics rollup foundation:

- Rollup helpers live in apps/api-gateway/src/analytics.
- Helpers support UTC hourly/daily bucket calculation.
- Helpers support rebuild window planning and maxBuckets.
- Helpers aggregate raw successful usage events and raw rejected events.
- Dimension hash builder creates stable SHA-256 hashes from rollup dimensions.
- Usage and rejected rollup repositories upsert by dimensionHash.
- Persistence service aggregates raw-shaped events and delegates to repositories.
- Manual backfill command can plan or execute controlled rollup rebuilds.
- Schedule preview command can plan a future rollup window without creating scheduled jobs, reading events, or persisting rollups.
- Scheduler preview command can convert a schedule plan into dry-run backfill request contracts without creating scheduled jobs, invoking backfill service, reading events, or persisting rollups.
- Scheduler preview command exposes executionDecision.wiringReview with currentCapability=command-preview-only and recommended next steps for preview, dry-run, execute, and automatic trigger requests.
- Scheduler preview command exposes dryRunDesignReview for command:dry-run requests while keeping backfill service invocation unwired and non-destructive.
- Scheduler preview command exposes dryRunInvocationContract for command:dry-run requests while keeping service invocation, event reads, rollup persistence, quota changes, and raw event deletion disallowed.
- Scheduler preview command exposes dryRunInvocationReadiness for command:dry-run requests, including planned request count, planned sources, planned granularity, and dry-run-only verification.
- Scheduler preview command keeps process-local:dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- Read model can query usage or rejected rollup rows through an internal/admin endpoint.
- Rollups are not used by runtime summaries, scheduled background jobs, retention delete, execution preview, or quota counting yet.

Analytics retention foundation:

- Dry-run policy parser supports disabled/default dry-run planning.
- Candidate reader counts usage or rejected events older than computed cutoffs.
- Dry-run service orchestrates policy, plan, and candidate read.
- Dry-run command prints DB-backed candidate JSON preview.
- Execution guard models dry-run, execute, confirmation, hard delete limit, and blocked reasons.
- Execution preview command prints guard JSON preview without DB access.
- Prisma delete repository can count candidates and delete only bounded selected IDs after safety checks.
- Operator preview command reads candidate counts from PostgreSQL through the Prisma candidate read repository.
- Operator preview command validates execution args before DB-backed candidate reads.
- Operator preview output reports commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
- Service previews and operator previews do not call deleteCandidates.
- Execution preview command still reports deleteImplementationAvailable=false.
- No operator-facing raw event deletion exists.
- No retention execute command exists yet.

Current analytics limitations:

- Usage and rejected summary APIs are event-based at runtime.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- No retention delete job yet.
- Rollup schedule and scheduler preview commands exist, and scheduler preview exposes execution boundary decisions, but no scheduled/background rollup job yet.

---

## Current Main Endpoints

Public:

- GET /health
- GET /metrics
- GET /api/product-service/health

Protected:

- GET /api/products

Dynamic dispatcher:

- GET /api/*
- POST /api/*
- PUT /api/*
- PATCH /api/*
- DELETE /api/*

Internal/admin analytics:

- GET /internal/admin/usage/events
- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary
- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events
- GET /internal/admin/analytics/rollups

Internal/admin quota observability:

- GET /internal/admin/api-keys/:id/quota
- GET /internal/admin/usage-plans/:id/usage-summary

Internal/admin usage plans:

- GET /internal/admin/usage-plans
- POST /internal/admin/usage-plans
- GET /internal/admin/usage-plans/:id
- PATCH /internal/admin/usage-plans/:id

Internal/admin API key usage plan assignment:

- PATCH /internal/admin/api-keys/:id/usage-plan

Admin auth:

- Header: x-admin-api-key
- Local key: local-admin-key
- Optional actor header: x-admin-actor

---

## Important Files

Analytics foundation:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/analytics/
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts

API Gateway usage tracking and analytics:

- apps/api-gateway/src/api-usage/
- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

Rejected events:

- apps/api-gateway/src/api-rejections/
- apps/api-gateway/src/routes/admin-api-rejection.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

Usage plans, quota, and quota observability:

- apps/api-gateway/src/usage-plans/
- apps/api-gateway/src/routes/admin-usage-plan.route.ts
- apps/api-gateway/src/routes/admin-api-key.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

Docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/AI_HANDOFF.md
- docs/sdlc/sprint-history/sprint-38.md
- docs/runbooks/analytics-rollup-backfill.md
- docs/runbooks/analytics-rollup-schedule-preview.md
- docs/runbooks/analytics-rollup-scheduler-preview.md
- docs/runbooks/analytics-rollup-read.md
- docs/runbooks/analytics-retention-dry-run.md
- docs/runbooks/analytics-retention-execution-preview.md
- docs/runbooks/analytics-retention-delete-repository.md
- docs/runbooks/analytics-retention-execution-service-preview.md
- docs/runbooks/analytics-retention-operator-preview.md
- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-command-dry-run-invocation-design-review.md
- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-command-dry-run-invocation-contract-design.md
- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-command-dry-run-design-review.md
- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-execution-wiring-review.md
- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-execution-boundary-design.md
- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-runner-design.md
- docs/project-context/decisions/2026-07-06-analytics-rollup-scheduling-foundation.md
- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-hardening.md
- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-command.md
- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

## Current Documentation Strategy

From Checkpoint 14.0 onward:

- Keep README public-facing and compact.
- Keep overview focused on current architecture.
- Keep requirements focused on FR/NFR and future requirements.
- Keep CURRENT_PROGRESS focused on current state.
- Keep AI_HANDOFF compact enough for a new chat.
- Keep DECISION_LOG as an index/recent decisions file.
- Move sprint history to docs/sdlc/sprint-history/.
- Move long decisions to docs/project-context/decisions/.
- Move command-heavy validation steps to docs/runbooks/.

---

## User Working Preferences

Use Vietnamese when explaining.

Work style:

- Work like a careful senior backend reviewer.
- Explain the goal of the current checkpoint.
- Change a small number of files at a time.
- Provide copy-paste-ready PowerShell blocks.
- For docs replacement, provide one single copyable PowerShell block.
- Explain what changed and why.
- Ask user to run commands and paste terminal output.
- Review terminal output carefully before moving forward.
- Run focused tests when useful.
- Run npm run test.
- Run npm run typecheck.
- Run npm run build.
- Run Docker/runtime validation when runtime behavior changes.
- Commit only after stable validation.
- Push after each stable commit.
- Keep final docs compact.
- Do not overbuild.
- Do not silently skip tests.
- Do not claim production-ready when only foundation exists.

---

## Current Known Limitations

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any command, API, scheduled job, or quota path yet.
- No retention delete job yet.
- Rollup schedule and scheduler preview commands exist, and scheduler preview exposes execution boundary decisions plus wiring review output, but no scheduled/background rollup job yet.
- No per-consumer Grafana dashboard yet.
- No per-key Grafana dashboard yet.
- No quota usage dashboard yet.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
- No Admin Dashboard yet.
- No Developer Portal yet.
- No admin user/RBAC system yet.
- No route management audit log table yet.
- Dynamic router supports exact method + exact path matching only.
- No path params yet.
- No wildcard upstream path mapping yet.
- No host-based routing yet.
- No weighted upstreams yet.
- No service discovery yet.
- CI does not run full Docker Compose runtime stack yet.
- CI does not push Docker images to registry yet.
- CI does not deploy automatically yet.
- Kafka and RabbitMQ are not implemented yet.
- Kubernetes and cloud deployment are planned later.

---

## Recommended Next Step

Start Sprint 39 after confirming Sprint 38 docs are committed and pushed.

Recommended direction:

- Rollup Scheduler Command Dry-Run Service Invocation Contract Review or Analytics Retention Execution Design Review.

Before starting:

- Confirm git status is clean.
- Confirm latest docs commit is pushed.
- Keep implementation small and testable.
- Preserve quota correctness.
- Keep successful usage and rejected/security event storage separate.
- Keep scheduler preview separate from actual background execution.
- Keep command dry-run blocked until backfill service invocation semantics are explicitly designed and approved.
- If designing command dry-run service invocation, define service dry-run contract, source separation, event limit guardrails, max bucket guardrails, operator output, failure behavior, and Docker/PostgreSQL runtime validation before wiring.
- Keep execute mode blocked until command dry-run has a safe design and implementation boundary first.
- Keep process-local/external-scheduler execution blocked until explicitly designed.
- Keep retention execution explicit and guarded.
- Do not expose a destructive execute command until explicitly approved.