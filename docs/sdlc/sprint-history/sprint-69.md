# Sprint 69 - Service discovery foundation

Status: complete

Version:

`v1.9.0`

Private npm workspace versions remain `0.1.0`.

No Sprint 69 Git tag is created. Protected annotated tag `v1.0.0` remains unchanged at `407d03678674219e7228b15f0cd7a23074493f31`.

## Goal

Add a bounded configured service discovery foundation to the existing host/path route registry and shared proxy pipeline without introducing health checks, automatic failover, an external registry, Kubernetes integration, or client-controlled target selection.

## Implementation

### Contract

Commit:

- `5575cae feat(gateway): add service discovery contract`

Delivered:

- Canonical lowercase kebab-case service names.
- Service-name maximum length 64.
- 1-8 unique canonical HTTP or HTTPS instance origins.
- Base URL maximum length 2048.
- Primary downstream origin membership.
- Maximum 64 services per snapshot.
- Equal instance sets across routes sharing a service name.
- Immutable sorted service snapshots.
- Weighted-origin and path/query relationship validation.
- Fail-closed invalid, empty, duplicate, unsafe, conflicting, or oversized configuration.

### Runtime resolution

Commit:

- `7c4f706 feat(gateway): resolve configured service instances`

Delivered:

- Runtime registry service discovery snapshot.
- Direct discovery random instance resolution.
- Path/query preservation when composing a selected instance origin.
- Missing registry or missing service fail-closed target resolution.
- Legacy direct routing compatibility.
- Legacy weighted routing compatibility.
- Weighted discovery remains on the existing weighted selector.
- Injectable random sources for deterministic tests.
- Shared proxy policy pipeline preservation.

### Persistence and Admin route management

Commit:

- `ab5a2b7 feat(gateway): persist service discovery routes`

Delivered:

- Prisma `serviceInstances Json? @map("service_instances")`.
- Migration `20260712114500_add_gateway_route_service_instances`.
- Nullable PostgreSQL JSONB persistence.
- Database and Admin DTO mapping.
- Create/read/update/clear/reload behavior.
- `Prisma.DbNull` clearing.
- Candidate active-route validation before writes.
- Conflict rejection for unequal instance sets under one service name.
- Soft-delete compatibility.

### Dashboard

Commit:

- `b5aefe9 feat(dashboard): show service discovery metadata`

Delivered:

- Strict read-only discovery DTO validation.
- Canonical-origin and bounded-cardinality checks.
- Primary-origin and weighted-origin relationship checks.
- Static versus discovery mode display.
- Service instance count and detail rendering.
- Existing fixed GET-only BFF boundary.
- No mutation controls.

## Validation

Automated:

- API Gateway: 153 test files / 1110 tests.
- Admin Dashboard: 53 test files / 244 tests.
- Developer Portal: 2 test files / 7 tests.
- Targeted service discovery contract, runtime, persistence, Admin, and Dashboard tests passed.
- Root tests passed.
- Root typecheck passed.
- Root production build passed.
- Prisma schema validation passed.
- Docker Compose configuration passed.
- Working and staged diff checks passed.

Database/runtime:

- Eleven Gateway migrations were recognized.
- Migration `20260712114500_add_gateway_route_service_instances` deployed.
- Schema reported up to date.
- `gateway.gateway_routes.service_instances` verified as nullable JSONB.
- Admin route list contract included service instances.
- Direct discovery route create returned HTTP 201.
- Admin detail returned HTTP 200.
- Database JSONB roundtrip passed.
- Runtime reload returned HTTP 200.
- Dynamic proxy through the discovery route returned HTTP 200.
- Probe route soft-delete and reload cleanup passed.
- Removed route returned HTTP 404.
- Dashboard and Gateway images were force-recreated and verified.
- Read-only Gateway GET returned HTTP 200.
- Read-only Gateway POST returned HTTP 403.
- Dashboard BFF list and detail returned HTTP 200 and preserved `serviceInstances`.
- Dashboard `/routes` returned HTTP 200.
- Dashboard HTML did not expose the read-only credential.
- Probe cleanup left no active route in the BFF list.

## Preserved boundaries

- No health checks.
- No automatic failover.
- No retry-to-another-instance behavior.
- No circuit breaking or outlier ejection.
- No external registry or background discovery refresh.
- No registration, deregistration, TTL, heartbeat, DNS SRV, Consul, Eureka, Kubernetes API, or cloud discovery.
- No client-selected instance.
- No arbitrary reverse proxy.
- No sticky routing.
- No per-instance unbounded Prometheus labels.
- No Dashboard mutation.
- No Developer Portal route management.
- No new dependency, environment variable, service, or port.
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
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/admin-route-management.md`
- `docs/runbooks/local-validation.md`
- `docs/runbooks/runtime-reload.md`
- `docs/runbooks/weighted-routing.md`
- `docs/runbooks/service-discovery.md`
- `docs/sdlc/sprint-history/sprint-69.md`
- `docs/project-context/decisions/2026-07-12-service-discovery-foundation.md`

## Next sprint

Sprint 70 - Service discovery health/failover hardening.

Sprint 70 must define bounded health and failover semantics explicitly and must not silently introduce Kubernetes or an external registry.
