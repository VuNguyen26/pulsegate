# Current Progress

## Canonical state after Sprint 69

- Product/documentation version: `v1.9.0`.
- Private npm workspace versions: `0.1.0`.
- Latest completed sprint: **Sprint 69 - Service discovery foundation**.
- Latest implementation commit before documentation finalization: `b5aefe9f3bcb4aa44b4be2d65a2f127007525141`.
- Protected annotated tag `v1.0.0` remains unchanged at `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 69 creates no Git tag.
- Next sprint: **Sprint 70 - Service discovery health/failover hardening**.

## Sprint 69 implementation commits

- `5575cae641462dd9646fa2c2fb22689dcdf5787f` - `feat(gateway): add service discovery contract`
- `7c4f70655e7c2f6d9b50a26d81cfe00a06f1fc46` - `feat(gateway): resolve configured service instances`
- `ab5a2b72d9b0fe4d592636305d5fb3fbea43725e` - `feat(gateway): persist service discovery routes`
- `b5aefe9f3bcb4aa44b4be2d65a2f127007525141` - `feat(dashboard): show service discovery metadata`

## Delivered behavior

- Optional route-level `serviceInstances`.
- Canonical lowercase kebab-case service identity.
- 1-8 unique canonical HTTP or HTTPS instance origins.
- Maximum 64 services in one runtime discovery snapshot.
- Primary downstream origin required in the instance set.
- Equal instance sets required across active routes sharing a service name.
- Direct discovery selects one trusted configured instance and preserves path/query.
- Missing service/runtime state fails closed.
- Weighted discovery remains on the existing weighted selector.
- Weighted origins exactly match discovery instances.
- Legacy direct and weighted routes remain compatible.
- Nullable PostgreSQL JSONB persistence.
- Admin create/read/update/clear/reload/soft-delete support.
- Candidate-set validation before Admin writes.
- Read-only Dashboard discovery mode and instance display.

## Validation baseline

- API Gateway: 153 test files / 1110 tests.
- Admin Dashboard: 53 test files / 244 tests.
- Developer Portal: 2 test files / 7 tests.
- Prisma schema validation passed.
- Root tests, typecheck, and production build passed.
- Docker Compose configuration passed.
- Working and staged diff checks passed.
- Migration `20260712114500_add_gateway_route_service_instances` deployed.
- `service_instances` verified as nullable JSONB.
- Admin create/read/reload/database roundtrip/direct proxy/soft-delete/cleanup passed.
- Dashboard read-only GET/POST authorization boundary passed.
- Dashboard BFF list/detail preserved discovery metadata.
- Dashboard `/routes` returned HTTP 200 without credential disclosure.

## Preserved boundaries

- No health checks or automatic failover.
- No retry-to-another-instance behavior.
- No external registry, DNS discovery, Kubernetes discovery, or cloud control plane.
- No registration, deregistration, heartbeat, TTL, or background refresh.
- No circuit breaker, passive health scoring, or outlier ejection.
- No client-selected instance, arbitrary reverse proxy, or sticky routing.
- No per-instance unbounded Prometheus labels.
- No Dashboard mutation controls.
- No Developer Portal route management.
- No new dependency, environment variable, service, or port.
- No Kubernetes, OpenTelemetry, Loki, billing, marketplace, or enterprise IAM work.
- No npm package version bump.
- No Sprint 69 Git tag.

## Documentation updated

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/admin-route-management.md`
- `docs/runbooks/local-validation.md`
- `docs/runbooks/runtime-reload.md`
- `docs/runbooks/weighted-routing.md`
- `docs/runbooks/service-discovery.md`
- `docs/sdlc/sprint-history/sprint-69.md`
- `docs/project-context/decisions/2026-07-12-service-discovery-foundation.md`

## Fixed roadmap

### Backend Portfolio v1

- Sprints 45-60 complete.
- Sprint 60 released protected annotated tag `v1.0.0`.

### Product/Platform Expansion v2

- Sprint 61 - Admin Dashboard foundation - complete.
- Sprint 62 - Dashboard consumers/API keys/usage plans - complete.
- Sprint 63 - Dashboard quota/usage/rejected events - complete.
- Sprint 64 - Dashboard rollup/retention/scheduler panels - complete.
- Sprint 65 - Developer Portal foundation - complete.
- Sprint 66 - Developer Portal API docs and API-key self-service foundation - complete.
- Sprint 67 - Host-based routing foundation - complete.
- Sprint 68 - Weighted routing foundation - complete.
- Sprint 69 - Service discovery foundation - complete.
- Sprint 70 - Service discovery health/failover hardening - next.
- Sprint 71 - Kubernetes foundation.
- Sprint 72 - Kubernetes runtime validation and deployment docs.
- Sprint 73 - OpenTelemetry tracing foundation.
- Sprint 74 - Loki logging foundation.
- Sprint 75 - Grafana observability integration.
- Sprint 76 - Platform RBAC/security hardening.
- Sprint 77 - UI state and responsive polish.
- Sprint 78 - E2E demo and bounded k6 validation.
- Sprint 79 - v2 docs, runbooks, and architecture cleanup.
- Sprint 80 - v2.0.0 release; no new feature scope.
