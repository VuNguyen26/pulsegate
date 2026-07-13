# Decision: Derive Admin identity from trusted authentication context

Date: 2026-07-13

Status: Accepted

## Context

PulseGate already had a bounded full-access/read-only Admin API-key model and a server-only read-only Dashboard BFF. However, mutation audit attribution still accepted the caller-controlled `x-admin-actor` header. A valid Admin credential holder could therefore choose the persisted actor text, which was bounded but not authenticated.

Sprint 76 also needed regression evidence that every current Admin route and Dashboard BFF resource remained within the intended authorization boundary.

## Decision

- Ignore `x-admin-actor` for authenticated identity.
- Create a request-local authentication context only after credential verification succeeds.
- Store context outside client-controlled request headers using a `WeakMap<FastifyRequest, AdminAuthContext>`.
- Derive `admin-api-key` for full-access requests.
- Derive `admin-read-only-api-key` for read-only requests.
- Keep read-only methods limited to `GET`, `HEAD`, and `OPTIONS`.
- Keep the global marked route-registration guard for every `/internal/admin` route.
- Lock the current 29-route matrix in one authorization test: 18 read and 11 mutation routes.
- Lock the Dashboard at 18 fixed GET-only BFF resources with no catch-all Admin proxy.
- Keep only the read-only Admin credential in the Dashboard server runtime.
- Keep full-access Admin credentials and all Admin credential values out of browser-facing production surfaces.

## Consequences

Admin audit attribution now reflects the verified credential class rather than caller text. Full-access mutations retain the stable actor `admin-api-key`. Read-only requests have a distinct stable actor but still cannot mutate.

The route and BFF matrix tests intentionally fail when a resource is added, removed, or changes method without an explicit security review and test update.

This remains a local API-key authorization model. It does not provide named human identity, enterprise SSO, SAML, OIDC, SCIM, database-backed administrators, organizations, tenants, or generalized policy evaluation.

## Validation

- Focused trusted-context tests passed.
- Exact Admin route authorization matrix tests passed.
- Dashboard credential boundary tests passed.
- Missing, invalid, read-only, and full-access runtime behavior passed.
- Dashboard BFF and page returned HTTP 200.
- Credential reflection and Gateway log exposure checks passed.
- Admin Dashboard: 54 test files / 248 tests.
- API Gateway: 163 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 test files / 36 tests.
- Typecheck, production builds, diff checks, clean-tree verification, and origin synchronization passed.

## Boundaries

- No database migration or schema change.
- No dependency, environment variable, service, public port, Kubernetes RBAC resource, or Git tag.
- No routing, quota, analytics, tracing, logging, metrics, scheduler, retention, or raw-event behavior change.
- Application/Alloy-configured Loki labels remain `service`, `level`, and `event`; Loki-managed `service_name` discovery is not a newly configured application label.
