# Current Progress

## Canonical state after Sprint 70

- Product/documentation version: `v1.10.0`.
- Private npm workspace versions: `0.1.0`.
- Latest completed sprint: **Sprint 70 - Service discovery health/failover hardening**.
- Latest implementation commit before documentation finalization: `fdf38fadee069cbcf96c8e501b21306cfb73cb2f`.
- Protected annotated tag `v1.0.0` remains unchanged at `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 70 creates no Git tag.
- Next sprint: **Sprint 71 - Kubernetes foundation**.

## Sprint 70 implementation commits

- `8b2acec1e42242893d638145437581e34ddece89` - `feat(gateway): add service instance health contract`
- `42faa85e322b4dcb3af632cb649101aa924f5420` - `feat(gateway): add health-aware target selection`
- `fdf38fadee069cbcf96c8e501b21306cfb73cb2f` - `feat(gateway): fail over unhealthy service instances`

## Delivered behavior

- Bounded process-local service-instance health registry.
- Maximum 512 health entries.
- Healthy, cooldown, and computed probe behavior.
- Two-failure threshold and 30-second cooldown.
- Network, timeout, and downstream 5xx failure classification.
- HTTP responses below 500 reset health.
- Health-aware direct and weighted discovery selection.
- Per-request exclusion of qualifying failed instances.
- GET-only failover through the existing retry budget.
- Seven retry attempts and eight total executions maximum.
- Fail-closed behavior when no eligible target remains.
- Legacy direct and weighted compatibility.
- Reload preservation, initialization, pruning, and invalid-reload safety.
- No raw instance URL in client errors or metric labels.

## Validation baseline

- API Gateway: 155 test files / 1140 tests.
- Targeted failover coverage: 41 tests.
- API Gateway typecheck and build passed.
- Docker Compose configuration passed.
- Eleven Gateway migrations with none pending.
- Active persisted routes with `retry_attempts > 7`: 0.
- Gateway and Product Service images rebuilt.
- Discovery metadata JSONB roundtrip passed.
- Two qualifying failures produced client HTTP 200 through failover.
- Cooldown exclusion prevented more requests to the failed instance.
- No eligible target returned HTTP 503 without a downstream call.
- Raw instance URL disclosure check passed.
- Soft deletion, runtime removal, and database retention passed.
- Working tree remained clean and HEAD matched `origin/main`.

## Preserved boundaries

- No active background polling.
- No heartbeat, lease, registration, deregistration, or TTL.
- No distributed or persisted health state.
- No external registry, Consul, Eureka, DNS SRV, Kubernetes API, or cloud discovery.
- No general circuit breaker, service mesh, or outlier-ejection platform.
- No non-GET replay.
- No client-selected target, sticky routing, or arbitrary reverse proxy.
- No unbounded per-instance metrics.
- No Dashboard health controls.
- No Developer Portal route management.
- No migration, dependency, environment variable, permanent service, or permanent port.
- No Kubernetes, OpenTelemetry, Loki, billing, marketplace, or enterprise IAM work.
- No npm package version bump.
- No Sprint 70 Git tag.

## Fixed roadmap

- Sprint 61 - Admin Dashboard foundation - complete.
- Sprint 62 - Dashboard consumers/API keys/usage plans - complete.
- Sprint 63 - Dashboard quota/usage/rejected events - complete.
- Sprint 64 - Dashboard rollup/retention/scheduler panels - complete.
- Sprint 65 - Developer Portal foundation - complete.
- Sprint 66 - Developer Portal API docs and API-key self-service foundation - complete.
- Sprint 67 - Host-based routing foundation - complete.
- Sprint 68 - Weighted routing foundation - complete.
- Sprint 69 - Service discovery foundation - complete.
- Sprint 70 - Service discovery health/failover hardening - complete.
- Sprint 71 - Kubernetes foundation - next.
- Sprint 72 - Kubernetes runtime validation and deployment docs.
- Sprint 73 - OpenTelemetry tracing foundation.
- Sprint 74 - Loki logging foundation.
- Sprint 75 - Grafana observability integration.
- Sprint 76 - Platform RBAC/security hardening.
- Sprint 77 - UI state and responsive polish.
- Sprint 78 - E2E demo and bounded k6 validation.
- Sprint 79 - v2 docs, runbooks, and architecture cleanup.
- Sprint 80 - v2.0.0 release; no new feature scope.
