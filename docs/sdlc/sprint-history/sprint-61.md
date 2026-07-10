# Sprint 61 - Admin Dashboard foundation

Version: v1.1.0

Date: 2026-07-10

Status: Complete

## Objective

Establish the first PulseGate Admin Dashboard foundation against the existing protected Admin APIs without expanding administration mutations, persistence semantics, analytics behavior, scheduler execution, retention execution, or raw-event deletion.

## Delivered

### Dashboard application foundation

- Added `apps/admin-dashboard` using Next.js App Router, React, TypeScript, and plain CSS.
- Added a responsive application shell with top bar, sidebar navigation, and Overview page.
- Added loading, error, and not-found boundaries.
- Added roadmap placeholders for:
  - Consumers
  - API Keys
  - Usage Plans
  - Routes
  - Usage Analytics
  - Rejected Events
  - Rollups
  - Scheduler
  - Retention
- Added root `npm run dev:dashboard`.
- Reserved local Dashboard port `3003`.

### Secure server-only Admin API boundary

- Added strict server-side Dashboard configuration parsing.
- Added the required environment variables:
  - `PULSEGATE_GATEWAY_BASE_URL`
  - `ADMIN_READ_ONLY_API_KEY`
- Added optional configuration:
  - `ADMIN_API_KEY_HEADER`
  - `ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS`
- Restricted the Dashboard Gateway client to the fixed read-only endpoint:
  - `GET /internal/admin/routes/runtime`
- Added a fixed Dashboard BFF endpoint:
  - `GET /api/admin/runtime-status`
- Added no generic Admin API proxy.
- Added bounded request timeout handling.
- Added normalized unauthorized, forbidden, timeout, unavailable, upstream, and invalid-response errors.
- Preserved only safe request attribution through `requestId`.
- Added `server-only` import guards around environment and Gateway access modules.

### Overview runtime status

- Added an Overview connectivity panel.
- Added loading, connected, unavailable, and retry states.
- Displays only safe runtime registry metadata:
  - access mode
  - runtime mode
  - loaded version
  - registered route count
  - loaded timestamp
- Added client-side response validation for BFF responses.
- Rejected inconsistent runtime metadata.
- Kept Admin credentials out of browser requests, browser storage, HTML, bundles, responses, and logs.

### Production runtime wiring

- Added a multi-stage production Dockerfile.
- Runs the Dashboard container as the non-root `node` user.
- Added the `admin-dashboard` Docker Compose service.
- Published port `3003`.
- Added Dashboard health checking.
- Uses the Docker-internal Gateway origin:
  - `http://api-gateway:3000`
- Injects only the read-only Admin credential at runtime.
- Does not inject the full-access `ADMIN_API_KEY`.
- Added Dashboard environment documentation to `.env.example`.
- Excluded `.next` build output from Docker build context.

## Implementation Commits

- `82926c6 feat(dashboard): add admin dashboard foundation`
- `9e35b5b feat(dashboard): add secure admin api boundary`
- `0475e51 feat(dashboard): show gateway runtime status`
- `12d1148 feat(dashboard): add production runtime wiring`

## Automated Validation

Final pre-documentation validation passed:

- Admin Dashboard: 5 test files / 22 tests.
- API Gateway: 136 test files / 988 tests.
- Root typecheck passed.
- Root production build passed.
- `git diff --check` passed.
- `docker compose config --quiet` passed.
- Dashboard Docker image secret inspection passed.
- Browser-facing production source secret audit passed.

## Runtime Validation

Docker runtime validation passed:

- PostgreSQL healthy.
- Redis healthy.
- Product Service healthy.
- API Gateway running on port `3000`.
- Admin Dashboard healthy on port `3003`.
- Direct read-only Gateway runtime status returned `HTTP 200`.
- Dashboard Overview returned `HTTP 200`.
- Dashboard BFF returned `HTTP 200`.
- Runtime registry returned `available=true`.
- Runtime registry returned two loaded routes.
- Dashboard access mode returned `read-only`.
- Invalid Dashboard credential returned `HTTP 403`.
- Invalid credential errors were normalized to `ADMIN_DASHBOARD_FORBIDDEN`.
- The Dashboard container had `ADMIN_READ_ONLY_API_KEY`.
- The Dashboard container did not have `ADMIN_API_KEY`.
- Admin credentials were absent from HTML, BFF responses, client bundles, image configuration, and Dashboard logs.

## Security and Safety Boundaries

Sprint 61 preserves these boundaries:

- No Dashboard mutation controls.
- No generic Admin API proxy.
- No full-access Admin credential in the Dashboard runtime.
- No Admin credential in `NEXT_PUBLIC_*` variables.
- No Admin credential in browser storage.
- No consumer, API key, usage-plan, or route persistence behavior changes.
- No quota behavior changes.
- No successful-usage or rejected-event recorder changes.
- No scheduler execute expansion.
- No retention execution.
- No raw-event deletion.
- No database migration.
- No database-backed administrator, organization, tenant, or enterprise IAM model.
- No Developer Portal.
- No OpenTelemetry, Loki, or Kubernetes scope.

## Known Dependency Note

Next.js `16.2.10` currently resolves a transitive PostCSS version reported by npm audit with moderate findings.

Sprint 61 does not apply a forced dependency downgrade, canary upgrade, or `npm audit fix --force`.

The Dashboard does not accept or process untrusted CSS input.

## Documentation

Sprint 61 documentation set:

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

## Next Sprint

Sprint 62 - Dashboard consumers/API keys/usage plans.

Sprint 62 may add bounded administration views and controls for consumers, API keys, usage plans, and routes while preserving authorization, audit attribution, persistence, quota, scheduler, retention, and raw-event safety boundaries.
