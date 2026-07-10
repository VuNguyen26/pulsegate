# Minimal Admin/RBAC Hardening

Date: 2026-07-10

Sprint: Sprint 58 - Minimal Admin/RBAC hardening

## Status

Accepted.

## Context

PulseGate internal administration routes already required a shared API key, but protection depended on every route author remembering to attach the middleware.

The administration credential also provided only one access level, mutation actor attribution was duplicated across route modules, and raw configured secrets were compared directly.

Sprint 58 needs to improve these boundaries without introducing an Admin UI, database-backed identity model, organization model, multi-tenancy, or enterprise IAM platform.

## Decision

PulseGate will use a bounded administration authorization model.

### Protected route registration

The exact `/internal/admin` path and every descendant under `/internal/admin/` must include marked admin API key authentication middleware.

The application registers an `onRoute` boundary that rejects protected routes missing the marked middleware.

Unrelated similar paths such as `/internal/administrator` are not automatically classified as protected administration routes.

### Full-access and read-only credentials

`ADMIN_API_KEY` remains the full-access administration credential.

`ADMIN_READ_ONLY_API_KEY` is optional.

When configured, the read-only credential may call:

- `GET`
- `HEAD`
- `OPTIONS`

It may not call mutation methods.

Mutation attempts return:

```txt
403 ADMIN_API_KEY_READ_ONLY
```

An absent or blank read-only configuration preserves previous full-access-only behavior.

Full-access and read-only credentials must be different.

### Timing-safe verification

Configured credentials are hashed when admin middleware is created.

Incoming credentials are verified through the existing `verifyApiKeyHash` helper.

That helper uses SHA-256 and Node.js `timingSafeEqual`.

Direct request-secret equality checks are not used.

### Actor attribution

Admin mutation routes share one `getAdminActor` helper.

The helper trims `x-admin-actor`, limits it to 64 characters, allows an audit-safe character set, and falls back to `admin-api-key` for missing or invalid values.

Actor attribution is metadata for audit fields. It is not a verified administrator identity.

## Consequences

Benefits:

- Future protected admin routes fail closed when authentication middleware is forgotten.
- Operators may distribute a read-only credential without granting mutation access.
- Existing full-access integrations remain compatible.
- Invalid prefix-like and different-length credentials remain rejected.
- Audit attribution is consistent across mutation routes.
- Docker Compose can validate the authorization boundary locally.

Trade-offs:

- This remains a shared-secret model.
- There is no individual administrator identity.
- There are only two effective access levels.
- Credential rotation and distribution remain operational responsibilities.
- A future database-backed identity/RBAC model requires a separate explicit design.

## Explicit Non-Goals

Sprint 58 does not add:

- Admin Dashboard UI
- database-backed administrator accounts
- arbitrary roles or permissions
- organization or tenant authorization
- SSO or OAuth administration login
- database migrations
- quota behavior changes
- retention execution
- analytics rollup scheduler changes
- raw event deletion

## Validation

Before docs finalization:

- `npm run test` passed: 136 test files / 987 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.

Docker/PostgreSQL runtime validation passed:

- API Gateway health returned `200`.
- Read-only admin `GET` returned `200`.
- Read-only admin mutation returned `403 ADMIN_API_KEY_READ_ONLY`.
- Full-access mutation passed authentication and reached request validation with `400 API_CONSUMER_INVALID`.
- Invalid credentials returned `403 ADMIN_API_KEY_INVALID`.

No test administration record was created because the full-access mutation used an intentionally invalid empty payload.
