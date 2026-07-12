# Sprint 70 - Service discovery health/failover hardening

## Status

Complete.

## Version

Product/documentation version: `v1.10.0`.

Private npm workspace versions remain `0.1.0`.

No Sprint 70 Git tag is created. Protected annotated tag `v1.0.0` remains unchanged at `407d03678674219e7228b15f0cd7a23074493f31`.

## Goal

Add bounded passive service-instance health and retry-budget failover without active polling, distributed state, an external registry, Kubernetes discovery, a service mesh, or a general circuit-breaker platform.

## Implementation commits

- `8b2acec1e42242893d638145437581e34ddece89` - `feat(gateway): add service instance health contract`
- `42faa85e322b4dcb3af632cb649101aa924f5420` - `feat(gateway): add health-aware target selection`
- `fdf38fadee069cbcf96c8e501b21306cfb73cb2f` - `feat(gateway): fail over unhealthy service instances`

## Delivered scope

- Process-local health identity based on service name and canonical base URL.
- Maximum 512 health entries.
- Healthy, cooldown, and computed probe behavior.
- Two-failure threshold and 30-second cooldown.
- Network, timeout, and downstream 5xx failure classification.
- HTTP responses below 500 reset health.
- Health-aware direct and weighted discovery.
- Per-request failed-target exclusion.
- GET-only retry-budget failover.
- Seven retries and eight total executions maximum.
- No-eligible-target fail-closed behavior.
- Legacy direct and weighted compatibility.
- Reload preservation and pruning.
- No raw instance URL in client errors or metric labels.

## Validation

- API Gateway: 155 test files / 1140 tests.
- Targeted failover suites: 41 tests.
- API Gateway typecheck and build passed.
- Eleven migrations with none pending.
- Active routes with retry attempts above 7: 0.
- Docker/PostgreSQL runtime validation proved failover, cooldown, fail-closed behavior, persistence roundtrip, reload, soft deletion, runtime removal, and cleanup.
- Repository remained clean and synchronized before docs finalization.

## Preserved boundaries

- No active polling or heartbeat.
- No distributed or persisted health state.
- No external registry or Kubernetes discovery.
- No general circuit breaker or service mesh.
- No non-GET replay.
- No client-selected targets.
- No Dashboard health controls.
- No Developer Portal route management.
- No migration, dependency, environment variable, permanent service, or permanent port.
- No npm version bump.
- No Sprint 70 tag.

## Next sprint

Sprint 71 - Kubernetes foundation.

Production Kubernetes runtime validation remains assigned to Sprint 72.
