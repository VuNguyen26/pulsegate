# Sprint 68 - Weighted routing foundation

## Goal

Add bounded route-level weighted upstream selection while preserving host/path route identity, existing single-upstream behavior, the shared proxy/policy pipeline, and all current security and analytics boundaries.

## Product/documentation version

`v1.8.0`

Private npm workspace versions remain `0.1.0`.

No Sprint 68 Git tag is created. Protected annotated tag `v1.0.0` remains unchanged.

## Implementation commits

- `ee22b47721b3a962e0dced0ec1bf456b3bf715d6` - `feat(gateway): add weighted upstream contract`
- `7c706c42f0ee1bca60ac20c85b33b6a14cefc6dc` - `feat(gateway): route traffic across weighted upstreams`
- `278e00e4cad5fb9726895241e446238ffed16866` - `feat(gateway): persist weighted upstream routing`
- `528b9fbaf8b2429dab8b839824abfd8a99df924e` - `feat(dashboard): show weighted route metadata`

## Delivered scope

### Contract

- Added `WeightedUpstream`.
- Kept `downstreamUrl` as primary and legacy target.
- Added optional `weightedUpstreams`.
- Enforced 2-8 entries.
- Enforced unique HTTP or HTTPS URLs.
- Enforced relative integer weights from 1 through 1000.
- Required the primary URL exactly once.
- Rejected invalid configuration fail closed.

### Runtime

- Kept exact-host route matching before path-only fallback.
- Selected one configured target after a cache miss.
- Preserved single-upstream behavior.
- Preserved host-specific and path-only behavior.
- Reused one selected target across retries.
- Added deterministic selector and runtime integration tests.
- Added no failover or health behavior.

### Persistence and Admin

- Added nullable JSONB `weighted_upstreams`.
- Preserved SQL `NULL` legacy rows.
- Added Admin create/read/update/clear semantics.
- Used `Prisma.DbNull` for explicit clearing.
- Preserved runtime registry replacement validation.

### Dashboard

- Added bounded read-only weighted metadata validation.
- Added single versus weighted mode display.
- Added target and weight details.
- Added no mutation controls.

## Validation

Automated:

- API Gateway: 147 test files / 1059 tests.
- Admin Dashboard: 53 test files / 243 tests.
- Developer Portal: 2 test files / 7 tests.
- Targeted Gateway persistence and runtime tests passed.
- Targeted Dashboard contract/rendering tests passed.
- Root tests passed.
- Root typecheck passed.
- Root production build passed.
- Prisma schema validation passed.
- Docker Compose configuration passed.
- Working and staged diff checks passed.

Database/runtime:

- Ten Gateway migrations were recognized.
- Sprint 67 host migrations and Sprint 68 weighted migration deployed.
- `weighted_upstreams` was verified as nullable JSONB.
- Five existing routes remained SQL `NULL`.
- Admin create stored two weighted targets.
- Runtime reload applied the weighted route.
- Weighted proxy request returned HTTP 200.
- Admin read returned two targets.
- PATCH null cleared the column to SQL `NULL`.
- Single-upstream reload and proxy returned HTTP 200.
- Probe route soft-delete and final registry reload passed.
- Application containers were stopped after validation.

## Preserved boundaries

- No service discovery.
- No upstream health checks.
- No automatic failover.
- No sticky routing.
- No retry-to-another-target behavior.
- No client target override.
- No arbitrary reverse proxy.
- No new dependency, environment variable, service, or port.
- No per-upstream unbounded metric labels.
- No Dashboard mutation.
- No Developer Portal route management.
- No Kubernetes, OpenTelemetry, Loki, billing, marketplace, or enterprise IAM.
- No npm package version bump.
- No Git tag.

## Documentation

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/runbooks/host-based-routing.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/local-validation.md`
- `docs/runbooks/weighted-routing.md`
- `docs/sdlc/sprint-history/sprint-68.md`
- `docs/project-context/decisions/2026-07-12-weighted-routing-foundation.md`

## Next sprint

Sprint 69 - Service discovery foundation.

Sprint 69 must not silently include Sprint 70 health/failover hardening.
