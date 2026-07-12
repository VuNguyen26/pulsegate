# Decision: Bounded configured service discovery foundation

Date: 2026-07-12

Status: accepted

Sprint:

Sprint 69 - Service discovery foundation

## Context

Sprint 68 added bounded route-level weighted routing but intentionally deferred service discovery and health-based failover.

Sprint 69 needed a service discovery foundation that:

- preserves exact host/path route identity
- preserves legacy direct and weighted routes
- allows one logical service to expose a bounded trusted instance set
- stays inside the existing route registry and shared proxy pipeline
- fails closed on invalid or conflicting service definitions
- remains reviewable through existing Admin and Dashboard read boundaries
- does not begin Sprint 70 health/failover work
- does not add an external service registry or background control plane

## Decision

Use optional route-owned `serviceInstances` metadata.

Service identity:

- `serviceName` is canonical lowercase kebab-case.
- Maximum length is 64 characters.

Instance contract:

- A configured service has 1-8 instances.
- Each instance contains one unique canonical HTTP or HTTPS origin.
- Base URLs contain no credentials, path, query, fragment, or non-canonical trailing slash.
- Maximum base URL length is 2048.
- The primary downstream origin is included.

Snapshot contract:

- The runtime snapshot contains at most 64 services.
- Routes sharing one service name expose equal sorted instance sets.
- Snapshot objects are immutable.
- Invalid, duplicate, empty, oversized, conflicting, unsafe, or non-canonical data fails closed.

Direct discovery:

- The runtime registry selects one trusted configured instance.
- Selection uses an internal injectable random source.
- Only the origin changes; the primary downstream path and query are preserved.
- Missing registry or service state returns no target.
- Retries reuse the resolved target.

Weighted discovery:

- The existing weighted selector remains authoritative.
- Weighted origins exactly match the configured instance set.
- Weighted targets preserve the primary path and query.
- The direct discovery random source is not used.
- Weighted routing remains relative traffic selection, not failover.

Persistence:

- Store route discovery metadata in nullable JSONB.
- SQL `NULL` preserves legacy behavior.
- Update omission preserves, null clears, and an array replaces.
- Candidate active-route validation occurs before Admin writes.
- Runtime reload validates the complete route and service snapshot before atomic replacement.

Dashboard:

- Validate the bounded service discovery contract again at the Dashboard boundary.
- Display discovery mode and canonical instances.
- Keep all route controls read-only.

## Rationale

A configured route-owned instance set is the smallest bounded discovery foundation compatible with the existing architecture.

Canonical origins:

- prevent paths, credentials, fragments, and alternate spellings from becoming service identities
- make equality and conflict checks deterministic
- prevent arbitrary target expansion

Consistent instance sets:

- give one service name one stable runtime meaning
- avoid route-dependent discovery state
- allow one immutable service snapshot

Separate direct and weighted resolution:

- preserves Sprint 68 weighted semantics
- avoids double-random selection
- keeps future health/failover work explicit
- avoids silently converting retries into failover

Nullable JSONB:

- preserves existing rows
- keeps bounded route-owned metadata together
- supports explicit clear and full replacement
- avoids premature registry tables or background synchronization

## Consequences

Positive:

- Legacy direct and weighted routes remain compatible.
- Discovery selection stays inside the shared proxy pipeline.
- Admin persistence and reload are bounded and fail closed.
- Dashboard operators can inspect the configured instance set.
- The contract is deterministic and testable.
- Future health/failover work has an explicit configured-instance foundation.

Tradeoffs:

- Instance configuration is duplicated on routes sharing a service name and must be equal.
- Discovery changes require Admin persistence and runtime reload.
- There is no dynamic registration or background refresh.
- Random direct discovery is not health aware.
- No instance state is shared across processes beyond configured metadata.
- No availability guarantee is implied.

## Rejected alternatives

### External registry integration

Rejected for Sprint 69 because Consul, Eureka, Kubernetes, DNS SRV, or cloud discovery would add network dependencies, background refresh, failure semantics, and operational scope beyond the bounded foundation.

### Dedicated service and instance database tables

Rejected for Sprint 69 because they would introduce lifecycle, ownership, mutation, and migration complexity before the route-owned contract is proven.

### Reuse weighted targets as the only discovery model

Rejected because direct discovery needs an equal-instance service identity without requiring artificial weights, while weighted discovery must retain explicit traffic weighting.

### Select another instance on retry

Rejected because that would silently introduce failover semantics assigned to Sprint 70.

### Client-provided service or instance selection

Rejected because it would weaken trusted configuration boundaries and risk an arbitrary reverse proxy.

## Safety boundaries

- No active health checks.
- No passive health scoring.
- No automatic failover.
- No retry-to-another-instance.
- No circuit breaker or outlier ejection.
- No registry polling or background refresh.
- No registration, deregistration, lease, heartbeat, or TTL.
- No DNS SRV, Consul, Eureka, Kubernetes API, or cloud discovery.
- No client-selected target.
- No sticky routing.
- No arbitrary reverse proxy.
- No unbounded per-instance metrics.
- No Dashboard mutation.
- No Developer Portal route management.
- No new dependency, environment variable, service, or port.
- No Kubernetes, OpenTelemetry, Loki, billing, marketplace, or enterprise IAM.
- No npm package version bump.
- No Sprint 69 Git tag.

## Validation evidence

- API Gateway: 153 test files / 1110 tests.
- Admin Dashboard: 53 test files / 244 tests.
- Developer Portal: 2 test files / 7 tests.
- Prisma schema validation passed.
- Root tests, typecheck, build, Compose config, and diff checks passed.
- PostgreSQL migration deployed and JSONB column verified.
- Admin create/read/database/reload/proxy/soft-delete roundtrip passed.
- Dashboard read-only authorization and BFF/runtime metadata validation passed.
- Probe cleanup passed.

## Follow-up

Sprint 70 may add bounded service health and failover hardening.

Sprint 70 must explicitly define:

- health signal source
- eligibility transitions
- failure and recovery thresholds
- failover timing
- retry interaction
- bounded metric labels
- process-local versus shared state
- runtime validation

Sprint 70 must not silently introduce Kubernetes or a general external registry.
