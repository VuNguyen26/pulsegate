# Decision Log

## Purpose

This file is now a compact decision index.

Detailed decision records live in:

- docs/project-context/decisions/

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Older full decision history remains available in Git history before Checkpoint 14.0.

---

## Current Project Direction

PulseGate is being built toward a product-like API Gateway and API Management Platform.

It should not be treated as a small portfolio backend only.

Long-term inspiration:

- Kong
- Apache APISIX
- Tyk
- Apigee
- AWS API Gateway

Current product direction:

- API Gateway
- API Management
- Dynamic route configuration
- Runtime route reload
- API consumer management
- API key lifecycle management
- API usage tracking
- Consumer analytics
- Usage plans and quotas
- Admin Dashboard later
- Developer Portal later
- Observability
- CI/CD
- Kubernetes/cloud deployment later

Status:

Accepted.

---

# Current Major Decisions

## Keep Main Documentation Compact

Decision:

Keep main documentation files compact and role-based.

Main files:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md

Archive folders:

- docs/sdlc/sprint-history/
- docs/project-context/decisions/
- docs/runbooks/

Detailed decision record:

- docs/project-context/decisions/2026-07-03-documentation-compaction.md

Status:

Accepted.

---

## Use Node.js, TypeScript, and Fastify

Decision:

Use Node.js, TypeScript, and Fastify for API Gateway and services.

Status:

Accepted.

---

## Use npm Workspaces

Decision:

Use npm workspaces for the monorepo.

Current structure:

- apps/api-gateway
- apps/product-service
- packages/shared

Status:

Accepted.

---

## Build in Small Stable Checkpoints

Decision:

Implement one small stable checkpoint at a time.

Status:

Accepted.

---

## Keep Project Local-First and Cost-Safe

Decision:

Run locally first through Docker Compose before cloud deployment.

Status:

Accepted.

---

## Use PostgreSQL and Prisma

Decision:

Use PostgreSQL and Prisma for persistent data.

Current ownership:

- Product Service owns public schema.
- API Gateway owns gateway schema.

Status:

Accepted.

---

## Use Redis for Rate Limiting and Response Cache

Decision:

Use Redis for API Gateway traffic protection and caching.

Status:

Accepted.

---

## Use Prometheus and Grafana for Observability

Decision:

Use Prometheus and Grafana for local observability.

Status:

Accepted.

---

## Use GitHub Actions for CI

Decision:

Use GitHub Actions to validate repository health.

Status:

Accepted.

---

# Gateway Architecture Decisions

## Use Policy-Driven Route Behavior

Decision:

Gateway route behavior should be controlled by route policies.

Current policy model:

- auth
- timeout
- cache
- rateLimit
- requestTransform
- responseTransform
- retry

Status:

Accepted.

---

## Store Gateway Route Config in PostgreSQL

Decision:

Store Gateway route config in gateway.gateway_routes.

Status:

Accepted.

---

## Keep Static Route Config Fallback

Decision:

Keep static downstream route config as startup fallback.

Status:

Accepted.

---

## Use Soft Delete for Route Config

Decision:

Use soft delete for Gateway route config records.

Status:

Accepted.

---

## Use Active-Route Partial Unique Index

Decision:

Enforce route uniqueness only for active non-deleted route identities.

Rule:

- method + gateway_path must be unique where deleted_at IS NULL.

Status:

Accepted.

---

## Use Runtime Route Registry

Decision:

Use a runtime route registry snapshot for active route configs.

Status:

Accepted.

---

## Use Catch-All Dynamic Router

Decision:

Use a stable /api/* catch-all dynamic router instead of unsafe Fastify unregister/register.

Status:

Accepted.

---

## Keep Dynamic Router Exact-Match Only for Now

Decision:

Dynamic router currently uses exact method + exact path matching.

Deferred:

- Path parameters
- Wildcard upstream mapping
- Host-based routing
- Header-based routing
- Weighted upstreams
- Service discovery

Status:

Accepted.

---

# API Management Decisions

## Store API Consumers in Gateway Schema

Decision:

Store API consumers in gateway.api_consumers.

Status:

Accepted.

---

## Store Issued API Keys in Gateway Schema

Decision:

Store issued API keys in gateway.api_keys.

Status:

Accepted.

---

## Never Persist Raw API Keys

Decision:

Never store raw issued API keys.

Stored:

- keyHash
- keyPrefix

Returned only once:

- rawKey

Status:

Accepted.

---

## Use Deterministic API Key Hashing

Decision:

Use deterministic hashing for API key lookup.

Current implementation:

- SHA-256 hex hash

Status:

Accepted.

---

## Use API Key Status for Revocation

Decision:

Use API key status instead of hard delete.

Current statuses:

- ACTIVE
- REVOKED

Status:

Accepted.

---

## Use API Consumer Status for Runtime Key Eligibility

Decision:

Consumer status affects whether keys are accepted.

Current statuses:

- ACTIVE
- DISABLED

Status:

Accepted.

---

## Do Not Fall Back When Known DB Key Is Invalid

Decision:

If a DB-backed key is found but revoked, expired, or belongs to a disabled consumer, reject it.

Status:

Accepted.

---

## Keep Env API_KEYS Fallback

Decision:

Keep env API_KEYS fallback after DB-backed API key auth.

Status:

Accepted.

---

## Keep lastUsedAt as Metadata Only

Decision:

Update lastUsedAt as best-effort metadata.

Status:

Accepted.

---

# API Usage Decisions

## Store API Usage Events in Gateway Schema

Decision:

Store API usage events in gateway.api_usage_events.

Reason:

- Usage tracking belongs to API Gateway/API Management.
- Product Service should not own usage analytics.
- Usage events are needed before usage plans, quotas, Admin Dashboard analytics, and Developer Portal usage views.

Status:

Accepted in Sprint 14.

---

## Record Usage After Successful Downstream Proxy Handling

Decision:

Record usage events after the request reaches downstream proxy handler and produces a successful proxy response path.

Current recorded cases:

- Cache HIT.
- Cache MISS.
- Cache BYPASS.
- DB-backed API key traffic.
- Env fallback API key traffic.
- Public proxy traffic with no API key.

Current not recorded:

- Missing API key.
- Invalid API key.
- Missing JWT.
- Invalid JWT.
- Rate-limited request.

Reason:

- Sprint 14 focuses on API Management usage attribution for proxied traffic.
- Failed auth and security events need separate design.

Status:

Accepted in Sprint 14.

---

## Usage Recorder Failure Must Not Fail Client Response

Decision:

If usage recording fails, PulseGate should log the error and still return the successful proxied response.

Reason:

- Usage tracking is operational metadata.
- A telemetry/analytics write failure should not break a valid downstream response.

Status:

Accepted in Sprint 14.

---

## Keep Usage Tracking Event-Based First

Decision:

Use event-based usage tracking first.

Reason:

- Simple and auditable foundation.
- Easier to validate.
- Can support later aggregate rollup tables.
- Can become source of truth for quotas and analytics.

Deferred:

- Rollup tables.
- Retention policy.
- Async event pipeline.

Status:

Accepted in Sprint 14.

---

## Add Admin Usage Summary APIs

Decision:

Expose admin summary APIs for consumer and API key usage.

Endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Reason:

- Admin users need usage visibility.
- Usage summaries prepare for Admin Dashboard and Developer Portal.
- Sprint 14 should prove the usage tracking data can be read back through APIs.

Status:

Accepted in Sprint 14.

---

# Sprint Direction Decisions

## Sprint 14 Completed Direction

Decision:

Sprint 14 focused on API Key Usage Tracking and Consumer Analytics Foundation.

Included:

- API usage event schema.
- API usage recorder.
- Runtime usage recording in downstream proxy.
- Consumer usage summary.
- API key usage summary.
- Admin usage summary APIs.
- Docker runtime validation.

Detailed archive:

- docs/sdlc/sprint-history/sprint-14.md

Runbook:

- docs/runbooks/api-usage-tracking.md

Status:

Done.

---

## Sprint 15 Recommended Direction

Decision:

Sprint 15 should focus on Usage Plans and Quota Foundation.

Reason:

- Sprint 13 introduced API consumers and issued API keys.
- Sprint 14 introduced usage tracking and usage summaries.
- The next API Management step is attaching usage limits to consumers or keys.

Recommended scope:

- Usage plan schema.
- Consumer or API key plan assignment.
- Quota window model.
- Simple quota counters.
- Basic quota enforcement.
- Keep usage events as source of truth.

Status:

Recommended next technical sprint.

---

# Deferred Decisions

These are intentionally deferred:

- Failed auth request tracking.
- Rate-limited request tracking.
- Usage aggregate rollup table.
- Usage retention policy.
- Admin Dashboard UI.
- Developer Portal UI.
- Billing.
- Paid plans.
- Multi-tenant organization model.
- Stronger admin users and RBAC.
- Route management audit log table.
- Advanced route matching.
- Service registry.
- OpenTelemetry tracing.
- Loki centralized logs.
- k6 load testing.
- Kafka.
- RabbitMQ.
- Docker image registry push.
- Kubernetes deployment.
- Production cloud deployment.
