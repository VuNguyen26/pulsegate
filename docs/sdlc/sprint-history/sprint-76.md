# Sprint 76 - Admin RBAC/Platform Security Hardening

Status: Complete

Product/documentation version: `v1.16.0`

Private npm workspace versions: `0.1.0`

## Goal

Harden the existing Admin API-key and Dashboard credential boundaries by deriving trusted actor attribution from verified authentication context, locking exact authorization matrices, and proving fail-closed runtime behavior without introducing enterprise IAM or changing platform behavior.

## Implementation commits

- `fce89f224e81335ae78024a22be89cf784c9b6cb` - `fix(security): trust authenticated admin actor context`
- `d82af694b0642de6a2efd5771bf2dc21f1df5c9e` - `test(security): lock admin authorization matrix`
- `9cd147d0565be99ddfc1c20b815f9fb230b8f67f` - `test(dashboard): lock admin credential boundary`

## Delivered

- Replaced caller-controlled actor attribution with trusted request-local context.
- Full-access actor is `admin-api-key`.
- Read-only actor is `admin-read-only-api-key`.
- Preserved timing-safe verification and full/read-only key separation.
- Locked 29 Gateway Admin routes: 18 read and 11 mutation routes.
- Locked read-only access to read methods only.
- Locked 18 fixed GET-only Dashboard BFF resources.
- Preserved server-only read-only credential handling and absence of the full-access key from Dashboard runtime.
- Added browser/server production credential boundary regression coverage.

## Runtime proof

- Missing Admin key returned `401 ADMIN_API_KEY_MISSING`.
- Invalid Admin key returned `403 ADMIN_API_KEY_INVALID`.
- Read-only GET returned HTTP 200.
- Read-only mutation returned `403 ADMIN_API_KEY_READ_ONLY` even with a forged actor header.
- Full-access GET returned HTTP 200.
- Dashboard BFF and page returned HTTP 200.
- Tested HTTP bodies and Gateway logs contained no Admin credential values.
- Source mutation count remained zero.
- Database mutation count remained zero.

## Validation

- Admin Dashboard: 54 test files / 248 tests.
- API Gateway: 163 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 test files / 36 tests.
- Workspace typecheck passed.
- Workspace production builds passed.
- Diff validation passed.
- Working tree was clean before release validation.
- HEAD and `origin/main` were synchronized.
- Release-readiness automated checks passed.

## Observability preservation

- API Gateway, Product Service, Prometheus, and Grafana returned HTTP 200.
- Prometheus and Loki datasources remained available.
- Metrics and logs dashboards remained provisioned.
- Loki and Alloy remained running.
- Loki retained no public host port.
- Application/Alloy-configured labels remained `service`, `level`, and `event`.
- Loki label discovery additionally reported managed `service_name`; Sprint 76 added no configured label.

## Preserved boundaries

- No database migration or schema change.
- No dependency or npm workspace version change.
- No new environment variable, Compose service, public port, or Kubernetes RBAC resource.
- No enterprise SSO, SAML, OIDC, database-backed administrator model, organization redesign, or multi-tenant billing.
- No routing, quota, analytics, tracing, logging, metrics, scheduler, retention, or raw-event behavior change.
- No Git tag.

## Next sprint

Sprint 77 - UI Loading/Empty/Error/Responsive Polish.

Sprint 77 must preserve the trusted Admin context, 29-route Gateway matrix, 18 fixed GET-only Dashboard resources, server-only read-only credential, and all existing application contracts.
