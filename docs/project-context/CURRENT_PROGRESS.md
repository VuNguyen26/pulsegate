# Current Progress

## Canonical state after Sprint 76

- Product/documentation version: `v1.16.0`.
- Private npm workspace versions: `0.1.0`.
- Latest completed sprint: Sprint 76 - Admin RBAC/Platform Security Hardening.
- Latest implementation commit before documentation finalization: `9cd147d0565be99ddfc1c20b815f9fb230b8f67f`.
- Sprint 75 documentation baseline commit: `e62ce96b4502ee5b71aa88185de906e0d2ed5b11`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Tag object: `726feb46e62a3224f7e27d55ae4f9e74dd6b1123`.
- Tag target: `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 76 creates no Git tag.
- Current sprint: Sprint 77 - UI Loading/Empty/Error/Responsive Polish.
- Next sprint: Sprint 78 - End-to-End Demo and Lightweight k6 Validation.

## Sprint 76 implementation commits

- `fce89f224e81335ae78024a22be89cf784c9b6cb` - `fix(security): trust authenticated admin actor context`
- `d82af694b0642de6a2efd5771bf2dc21f1df5c9e` - `test(security): lock admin authorization matrix`
- `9cd147d0565be99ddfc1c20b815f9fb230b8f67f` - `test(dashboard): lock admin credential boundary`

## Delivered behavior

- Admin actor attribution now derives from request-local trusted authentication context rather than `x-admin-actor`.
- Full-access requests use actor `admin-api-key`.
- Read-only requests use actor `admin-read-only-api-key`.
- The exact Admin authorization matrix is locked at 29 routes: 18 read and 11 mutation routes.
- Read-only credentials remain limited to `GET`, `HEAD`, and `OPTIONS`.
- Dashboard production behavior is locked to 18 fixed GET-only BFF resources.
- No catch-all Admin proxy exists.
- Dashboard uses only the server-side read-only credential.
- Full-access Admin credential remains absent from Dashboard production runtime and browser surfaces.

## Runtime and validation evidence

- Missing Admin key: `401 ADMIN_API_KEY_MISSING`.
- Invalid Admin key: `403 ADMIN_API_KEY_INVALID`.
- Read-only Admin GET: HTTP 200.
- Read-only Admin mutation: `403 ADMIN_API_KEY_READ_ONLY`.
- Full-access Admin GET: HTTP 200.
- Dashboard BFF and page: HTTP 200.
- Admin credential values were absent from tested HTTP responses and Gateway logs.
- Source mutation count: zero.
- Database mutation count: zero.
- Admin Dashboard: 54 test files / 248 tests.
- API Gateway: 163 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 test files / 36 tests.
- Root release validation, typecheck, production builds, diff checks, clean-tree verification, and origin synchronization passed.

## Observability preservation

- API Gateway, Product Service, Prometheus, and Grafana returned HTTP 200 during validation.
- Grafana retained Prometheus and Loki datasources and both PulseGate dashboards.
- Loki and Alloy remained running.
- Loki retained no public host port.
- Application/Alloy-configured labels remain `service`, `level`, and `event`.
- Loki label discovery may additionally report managed `service_name`; Sprint 76 added no configured label.

## Preserved boundaries

- No database migration or schema change.
- No dependency or npm workspace version change.
- No new environment variable, service, public port, or Kubernetes RBAC resource.
- No enterprise SSO, SAML, OIDC, database-backed Admin identity, organization redesign, or multi-tenant billing.
- No routing, quota, analytics, tracing, logging, metrics, scheduler, retention, or raw-event behavior change.
- No Git tag.

## Sprint 77 boundary

Sprint 77 owns UI Loading/Empty/Error/Responsive Polish. It must preserve all Sprint 76 security boundaries, fixed GET-only Dashboard resources, server-only read-only credential use, and existing application behavior. It must not introduce Admin mutations, generic proxies, new identity systems, or Sprint 78 demo/load scope early.

## Fixed roadmap

### Backend Portfolio v1

- Sprints 45-60 complete.
- Sprint 60 released protected annotated tag `v1.0.0`.

### Product/Platform Expansion v2

- Sprint 61 - Admin Dashboard Foundation - complete.
- Sprint 62 - Dashboard Consumers/API Keys/Usage Plans/Routes - complete.
- Sprint 63 - Dashboard Quota/Usage/Rejected Events - complete.
- Sprint 64 - Dashboard Rollup/Retention/Scheduler Panels - complete.
- Sprint 65 - Developer Portal Foundation - complete.
- Sprint 66 - Portal API Docs and API-Key Self-Service Foundation - complete.
- Sprint 67 - Host-Based Routing Foundation - complete.
- Sprint 68 - Weighted Routing Foundation - complete.
- Sprint 69 - Service Discovery Foundation - complete.
- Sprint 70 - Service Discovery Health/Failover Hardening - complete.
- Sprint 71 - Kubernetes Manifests/Deployment Foundation - complete.
- Sprint 72 - Kubernetes Runtime Validation and Deployment Docs - complete.
- Sprint 73 - OpenTelemetry Tracing Foundation - complete.
- Sprint 74 - Loki Logging Foundation - complete.
- Sprint 75 - Grafana Observability Integration - complete.
- Sprint 76 - Admin RBAC/Platform Security Hardening - complete.
- Sprint 77 - UI Loading/Empty/Error/Responsive Polish - current.
- Sprint 78 - End-to-End Demo and Lightweight k6 Validation - next.
- Sprint 79 - v2 Docs, Runbooks and Architecture Cleanup - planned.
- Sprint 80 - Product/Platform v2 Release - planned; `v2.0.0` tag.
