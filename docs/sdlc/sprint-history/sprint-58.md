# Sprint 58 - Minimal Admin/RBAC hardening

Date: 2026-07-10

Version: v0.59.0

## Summary

Sprint 58 hardened PulseGate internal administration authentication and added a bounded full-access/read-only authorization model.

The sprint intentionally avoided Admin UI work, database-backed administrator identity, arbitrary role systems, migrations, quota changes, retention execution, scheduler expansion, and raw event deletion.

## Completed Work

### 58.1 - Enforce the protected admin route boundary

Added a marked admin authentication middleware contract and an application route-registration boundary.

The application now fails during startup when the exact `/internal/admin` route or any descendant is registered without marked admin authentication middleware.

Covered:

- exact protected path
- protected descendant paths
- valid marked middleware
- middleware arrays
- unrelated similar paths
- fail-fast registration behavior

Commit:

- `fef7202 feat(gateway): enforce admin route auth boundary`

### 58.2 - Normalize admin actor attribution

Added a shared `getAdminActor` helper and removed duplicated route-local actor parsing.

Applied to:

- API consumer mutations
- managed API key mutations
- route configuration mutations
- usage plan mutations

Actor attribution now:

- trims whitespace
- allows a maximum of 64 characters
- accepts a restricted audit-safe character set
- rejects ambiguous multi-value input
- falls back to `admin-api-key`

Commit:

- `bf428c3 feat(gateway): normalize admin actor attribution`

### 58.3 - Add read-only admin access

Added optional `ADMIN_READ_ONLY_API_KEY` configuration.

Authorization behavior:

- full-access key may read and mutate
- read-only key may call `GET`, `HEAD`, and `OPTIONS`
- read-only mutation returns `403 ADMIN_API_KEY_READ_ONLY`
- missing key returns `401 ADMIN_API_KEY_MISSING`
- invalid key returns `403 ADMIN_API_KEY_INVALID`
- identical full-access and read-only keys fail during middleware creation
- absent read-only configuration preserves previous behavior

Updated:

- environment configuration
- environment tests
- admin authentication middleware
- middleware integration tests
- Docker Compose
- `.env.example`

Commit:

- `16941ca feat(gateway): add read-only admin access`

### 58.4 - Use timing-safe admin key verification

Replaced direct request-secret equality checks with the existing API key hashing verifier.

Configured key hashes are prepared when middleware is created.

Incoming credentials are verified through SHA-256 and Node.js `timingSafeEqual`.

Added regression coverage for:

- shorter prefix-like keys
- longer suffix-extended keys
- different-length invalid full-access values
- different-length invalid read-only values

Commit:

- `c7087cc feat(gateway): use timing-safe admin key verification`

## Runtime Validation

Docker/PostgreSQL runtime validation passed.

Validated container configuration:

- `ADMIN_API_KEY_HEADER=x-admin-api-key`
- `ADMIN_API_KEY=local-admin-key`
- `ADMIN_READ_ONLY_API_KEY=runtime-read-only-key`

Validated behavior:

- API Gateway health: `200`
- read-only admin `GET`: `200`
- read-only admin `POST`: `403 ADMIN_API_KEY_READ_ONLY`
- full-access admin `POST` with invalid payload: `400 API_CONSUMER_INVALID`
- invalid-key admin `GET`: `403 ADMIN_API_KEY_INVALID`

The full-access mutation intentionally used an empty invalid payload, so authentication was proven without creating a database record.

## Safety Boundaries

Sprint 58 did not introduce:

- Admin Dashboard UI
- authenticated individual administrator identities
- database-backed administrator or role tables
- arbitrary permission assignment
- organization or tenant authorization
- database migration
- quota counting changes
- rollup scheduler behavior changes
- retention execution
- raw event deletion

`x-admin-actor` remains audit attribution metadata rather than authenticated identity.

## Validation

Before docs finalization:

- `npm run test` passed: 136 test files / 987 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Docker/PostgreSQL runtime validation passed.

## Documentation Updated

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/decisions/2026-07-10-minimal-admin-rbac-hardening.md
- docs/runbooks/admin-route-management.md

## Next Sprint

Sprint 59 - Observability + Grafana/k6 lightweight validation.
