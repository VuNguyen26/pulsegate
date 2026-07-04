# PulseGate

High-Traffic API Gateway & Observability Platform.

PulseGate is being built toward a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

Current version:

- v0.17.0

Latest completed sprint:

- Sprint 16 - Quota Observability and Usage Management Hardening

---

## Current Status

PulseGate currently includes:

- Fastify API Gateway
- Product Service
- Docker Compose runtime
- PostgreSQL with Prisma
- Redis
- Prometheus
- Grafana
- GitHub Actions CI/CD
- Dynamic route config
- Runtime route registry
- Catch-all dynamic router
- API consumer management
- DB-backed issued API keys
- API usage tracking
- Usage plans and quotas
- Runtime quota enforcement
- Quota observability endpoints

Latest validation:

- 46 test files passed
- 329 tests passed
- npm run typecheck passed
- npm run build passed
- Docker runtime quota observability validation passed

---

## Tech Stack

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
- GitHub Actions

---

## Local Ports

- API Gateway: 3000
- Product Service: 3001
- Grafana: 3002
- PostgreSQL: 5432
- Redis: 6379
- Prometheus: 9090

---

## Main Runtime Features

Current gateway capabilities:

- GET /health
- GET /metrics
- GET /api/product-service/health
- GET /api/products
- Dynamic /api/* catch-all dispatcher
- Runtime route registry
- Runtime route reload
- Shared downstream proxy pipeline
- DB-backed API key authentication
- Env API key fallback
- JWT authentication
- Redis-backed rate limiting
- Redis response caching
- API usage recording
- Usage plan quota enforcement
- Quota observability
- Structured access logs
- Prometheus metrics

Current internal/admin capabilities:

- Route config management
- Runtime route registry inspection
- Runtime route reload
- API consumer management
- API key issue/list/revoke
- API key usage plan assignment
- Usage plan create/list/detail/update
- Consumer usage summary
- API key usage summary
- API key quota state
- Usage plan usage summary

---

## Current Quota Behavior

Usage plans support:

- DAILY quota window
- MONTHLY quota window
- Enabled/disabled plans
- Optional assignment to API keys

Quota enforcement applies when:

- The route requires API key auth.
- The request uses a DB-backed API key.
- The API key has usagePlanId.
- The assigned usage plan is enabled.

Over-quota behavior:

- Request is rejected before cache/proxy execution.
- Gateway returns 429 QUOTA_EXCEEDED.
- Response includes quota metadata:
  - quotaLimit
  - quotaWindow
  - usedRequests
  - remainingRequests
  - windowStartedAt
  - windowEndsAt
  - resetAt

Current limitation:

- Quota-denied requests are not recorded into gateway.api_usage_events yet.
- Failed auth and rate-limited requests are not tracked yet.
- Usage data is event-based only.
- No aggregate rollup table yet.

---

## Useful Commands

Install dependencies:

    npm ci

Run automated validation:

    npm run test
    npm run typecheck
    npm run build
    git status

Start Docker stack:

    docker compose up --build -d
    docker compose ps

Check API Gateway health:

    Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10

Stop Docker stack:

    docker compose down

---

## Important Docs

Compact project docs:

- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md

Detailed sprint history:

- docs/sdlc/sprint-history/

Runbooks:

- docs/runbooks/

Decision records:

- docs/project-context/decisions/

Latest sprint history:

- docs/sdlc/sprint-history/sprint-16.md

Latest quota runbook:

- docs/runbooks/usage-plans-and-quotas.md

Latest decision record:

- docs/project-context/decisions/2026-07-04-quota-denied-usage-event-tracking.md

---

## Recommended Next Sprint

Sprint 17 recommended direction:

- API Usage Rejection Tracking Design, or
- Advanced Usage Analytics Hardening

Recommended focus:

- Decide how to track failed auth, rate-limited, and quota-denied requests.
- Keep successful/proxied usage and rejected/security events clearly separated or clearly typed.
- Avoid corrupting event-based quota counts.
