# AI Handoff

## Current Version

- Product/documentation version: `v1.1.0`
- Private npm workspace versions: `0.1.0`
- Existing annotated release tag: `v1.0.0`
- Tag `v1.0.0` remains unchanged at commit:
  - `407d03678674219e7228b15f0cd7a23074493f31`

## Latest Completed Sprint

- Sprint 61 - Admin Dashboard foundation

## Latest Implementation Commit Before Docs Finalization

- `12d1148 feat(dashboard): add production runtime wiring`

Sprint 61 implementation commits:

- `82926c6 feat(dashboard): add admin dashboard foundation`
- `9e35b5b feat(dashboard): add secure admin api boundary`
- `0475e51 feat(dashboard): show gateway runtime status`
- `12d1148 feat(dashboard): add production runtime wiring`

## Sprint 61 Summary

Sprint 61 establishes the first PulseGate Admin Dashboard foundation.

Delivered:

- Added `apps/admin-dashboard`.
- Uses Next.js App Router, React, TypeScript, and plain CSS.
- Added responsive application shell, top bar, sidebar, Overview page, loading, error, and not-found boundaries.
- Added placeholders for Dashboard functionality assigned to Sprints 62-64.
- Added root command:
  - `npm run dev:dashboard`
- Dashboard local and Docker port:
  - `3003`
- Added a server-only Admin API boundary.
- Added strict environment validation.
- Added a fixed read-only Gateway client.
- Added a fixed browser-facing BFF endpoint.
- Added Overview runtime connectivity states.
- Added a production multi-stage Docker image.
- Added Docker Compose runtime wiring and health checking.
- Added Dashboard runbook and Sprint 61 records.

## Dashboard Security Architecture

The browser must not call protected Gateway Admin APIs directly.

Browser request:

```txt
GET /api/admin/runtime-status
```

Dashboard server request:

```txt
GET /internal/admin/routes/runtime
```

The Dashboard server reads:

```txt
PULSEGATE_GATEWAY_BASE_URL
ADMIN_READ_ONLY_API_KEY
ADMIN_API_KEY_HEADER
ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS
```

Required values:

```txt
PULSEGATE_GATEWAY_BASE_URL
ADMIN_READ_ONLY_API_KEY
```

Defaults:

```txt
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS=3000
```

The Dashboard must not receive or expose:

```txt
ADMIN_API_KEY
NEXT_PUBLIC_ADMIN_API_KEY
NEXT_PUBLIC_ADMIN_READ_ONLY_API_KEY
```

The Admin credential must not appear in:

- browser requests to the Gateway
- HTML
- client bundles
- browser local storage
- browser session storage
- query strings
- BFF responses
- Dashboard logs
- Docker image configuration

Sprint 61 adds no generic Admin API proxy.

## Runtime Status Contract

The Dashboard Overview may display only safe runtime metadata:

- access mode
- runtime registry mode
- registry availability
- loaded version
- loaded timestamp
- registered route count
- registered route metadata already exposed by the bounded Gateway endpoint

Expected connected response:

```txt
data.accessMode = read-only
data.runtime.mode = runtime-registry
data.runtime.available = true
```

Normalized Dashboard errors include:

```txt
ADMIN_DASHBOARD_CONFIG_MISSING
ADMIN_DASHBOARD_CONFIG_INVALID
ADMIN_DASHBOARD_UNAUTHORIZED
ADMIN_DASHBOARD_FORBIDDEN
ADMIN_DASHBOARD_TIMEOUT
ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE
ADMIN_DASHBOARD_UPSTREAM_ERROR
ADMIN_DASHBOARD_INVALID_RESPONSE
ADMIN_DASHBOARD_UNAVAILABLE
```

Safe Gateway `requestId` attribution may be preserved.

Raw exception details and credentials must not be returned.

## Production Runtime

Docker Compose service:

```txt
admin-dashboard
```

Container:

```txt
pulsegate-admin-dashboard
```

Published port:

```txt
3003
```

Docker-internal Gateway origin:

```txt
http://api-gateway:3000
```

Runtime requirements:

- Node.js 20
- production Next.js build
- non-root `node` user
- runtime-only read-only credential injection
- health check against the Dashboard root page
- no Admin credential baked into the image

## Sprint 61 Validation

Automated validation passed:

- Admin Dashboard:
  - 5 test files
  - 22 tests
- API Gateway:
  - 136 test files
  - 988 tests
- Root typecheck passed.
- Root production build passed.
- `docker compose config --quiet` passed.
- `git diff --check` passed.
- Browser-facing production source secret audit passed.
- Dashboard Docker image secret inspection passed.

Runtime validation passed:

- PostgreSQL healthy.
- Redis healthy.
- Product Service healthy.
- API Gateway running on port `3000`.
- Admin Dashboard healthy on port `3003`.
- Direct read-only Gateway runtime request returned `HTTP 200`.
- Dashboard Overview returned `HTTP 200`.
- Dashboard BFF returned `HTTP 200`.
- Runtime registry returned `available=true`.
- Runtime registry returned two loaded routes.
- Dashboard access mode returned `read-only`.
- Invalid Dashboard credential returned `HTTP 403`.
- Invalid credential errors normalized to:
  - `ADMIN_DASHBOARD_FORBIDDEN`
- Dashboard container contained:
  - `ADMIN_READ_ONLY_API_KEY`
- Dashboard container did not contain:
  - `ADMIN_API_KEY`
- Credential leak checks passed for HTML, responses, bundles, logs, and image configuration.

## Known Dependency Note

Next.js `16.2.10` currently resolves a transitive PostCSS version reported by npm audit with moderate findings.

Do not automatically:

- run `npm audit fix --force`
- downgrade Next.js
- switch to a canary release
- add unsupported package overrides

Sprint 61 does not accept or process untrusted CSS input.

Treat this as a documented upstream moderate dependency finding unless an approved stable remediation becomes available.

## Safety Boundaries

Do not open these boundaries without explicit roadmap scope and approval:

- generic Admin API proxy
- browser-stored Admin credentials
- full-access Admin credential in the Dashboard
- Dashboard mutation controls outside the assigned sprint
- destructive retention execution
- retention delete API
- scheduled retention delete job
- operator-facing `deleteCandidates`
- raw event deletion
- quota source-of-truth changes
- successful/rejected event source merging
- unguarded background execute
- external scheduler execution
- database-backed administrator or organization expansion
- Developer Portal before Sprint 65
- Kubernetes before Sprint 71
- OpenTelemetry before Sprint 73
- Loki before Sprint 74
- billing, marketplace, enterprise SSO/SAML, or unrelated platform scope

Current sources of truth remain:

```txt
gateway.api_usage_events
```

for successful usage and quota counting, and:

```txt
gateway.api_rejected_events
```

for rejected/security traffic.

Prometheus, Grafana, and rollup tables remain operational or analytical projections, not quota sources of truth.

## Next Recommended Sprint

Sprint 62 - Dashboard consumers/API keys/usage plans.

Recommended bounded scope:

- add Dashboard views for API consumers
- add Dashboard views for API keys
- add Dashboard views for usage plans
- add Dashboard views for route configuration
- add only explicitly approved controls
- preserve full-access/read-only Admin authorization
- preserve sanitized `x-admin-actor` attribution for mutations
- preserve current persistence semantics
- preserve quota source-of-truth behavior
- preserve successful/rejected event separation
- preserve scheduler, retention, and raw-event safety boundaries

Sprint 62 must not add:

- generic Admin API proxy
- browser-stored credentials
- enterprise IAM
- unrelated analytics panels
- scheduler execution expansion
- retention execution
- raw-event deletion

## Fixed Roadmap

### Backend Portfolio v1

Sprint 45-60 is complete.

- 45 Fail-Closed Error Model
- 46 Command Dry-Run Service Invocation Wiring Contract
- 47 Command Dry-Run Runtime Service Invocation
- 48 Dry-Run Runtime Output Hardening
- 49 Command Execute Contract Review
- 50 Command Execute Wiring Preview blocked-by-default
- 51 Command Execute Runtime Wiring with strict guardrails
- 52 Rollup Summary API Switch Preview
- 53 Switch selected summary reads to rollup read model with fallback
- 54 Background Scheduler Contract/Runner
- 55 Background Scheduler Runtime Wiring with guardrails
- 56 Retention Execute Contract Review
- 57 Retention Execute Preview Hardening/rollback expectation
- 58 Minimal Admin/RBAC hardening
- 59 Observability + Grafana/k6 lightweight validation
- 60 Final polish, docs, demo script, architecture cleanup, release v1.0.0

### Product/Platform Expansion v2

- 61 Admin Dashboard foundation - complete
- 62 Dashboard consumers/API keys/usage plans
- 63 Dashboard quota/usage/rejected events
- 64 Dashboard rollup/retention/scheduler panels
- 65 Developer Portal foundation
- 66 Developer Portal API docs/key self-service foundation
- 67 Host-based routing
- 68 Weighted upstream routing
- 69 Service discovery foundation
- 70 Service discovery health/failover
- 71 Kubernetes foundation
- 72 Kubernetes runtime validation/docs
- 73 OpenTelemetry foundation
- 74 Loki foundation
- 75 Grafana observability integration
- 76 Platform RBAC/security hardening
- 77 UI state/responsive polish
- 78 E2E demo and bounded k6 validation
- 79 v2 docs/runbooks/architecture cleanup
- 80 v2.0.0 release

## Sprint 61 Documentation Checklist

Required Sprint 61 documents:

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/project-context/decisions/2026-07-10-admin-dashboard-foundation.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/local-validation.md`
- `docs/sdlc/sprint-history/sprint-61.md`

## Required Docs Checklist at Future Sprint Finalization

Always audit and update:

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- relevant runbooks
- `docs/sdlc/sprint-history/sprint-N.md`
- `docs/project-context/decisions/YYYY-MM-DD-*.md`

Do not finalize a sprint after updating only a subset of this recurring documentation set.
