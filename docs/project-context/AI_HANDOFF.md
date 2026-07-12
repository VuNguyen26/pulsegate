# AI Handoff

PulseGate is complete through **Sprint 70 - Service discovery health/failover hardening**.

## Canonical state

- Product/documentation version: `v1.10.0`.
- Private npm workspace versions: `0.1.0`.
- Latest implementation commit before docs: `fdf38fadee069cbcf96c8e501b21306cfb73cb2f`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Sprint 70 creates no tag.
- Next sprint: **Sprint 71 - Kubernetes foundation**.

## Current service discovery contract

- `serviceName` is canonical lowercase kebab-case.
- `serviceInstances` contains 1-8 unique canonical HTTP or HTTPS origins.
- Runtime discovery is bounded to 64 services.
- The primary downstream origin must exist in the instance set.
- Active routes sharing a service name must expose the same instance set.
- Weighted origins must equal the configured service instance origins.
- Admin writes validate the complete candidate active route set.
- Runtime reload atomically validates and replaces the active snapshot.

## Sprint 70 health contract

- Health state is process-local.
- Identity is `serviceName + canonical baseUrl`.
- Maximum health entries: 512.
- Failure threshold: 2 consecutive qualifying failures.
- Cooldown: 30 seconds.
- States: healthy, cooldown, and computed probe.
- Network failures, timeouts, and downstream 5xx responses qualify.
- Any HTTP response below 500 resets health.
- Invalid JSON is not an instance failure.
- Valid reload preserves unchanged identities, initializes new identities, and prunes removed identities.
- Invalid reload preserves previous routing and health.
- Process restart resets health.

## Sprint 70 failover contract

- Health selection applies only to routes with `serviceInstances`.
- Direct discovery selects uniformly from eligible instances.
- Weighted discovery filters ineligible origins and preserves remaining relative weights.
- Failed targets are excluded from later attempts in the same request.
- Failover occurs only inside the retry budget.
- Only GET retries.
- Non-GET requests are never replayed.
- Retry attempts are capped at 7.
- Total downstream executions are capped at 8.
- Legacy direct and weighted behavior remains unchanged.
- No eligible target fails closed.
- Raw instance URLs are absent from client errors and Prometheus labels.

## Sprint 70 implementation commits

- `8b2acec1e42242893d638145437581e34ddece89` - health registry.
- `42faa85e322b4dcb3af632cb649101aa924f5420` - health-aware selection and retry bound.
- `fdf38fadee069cbcf96c8e501b21306cfb73cb2f` - proxy failover wiring.

## Validation baseline

- API Gateway: 155 test files / 1140 tests.
- Targeted failover suites: 41 tests.
- API Gateway typecheck and build passed.
- Active persisted routes with retry attempts above 7: 0.
- Eleven migrations with none pending.
- Runtime proved database roundtrip, two qualifying failures, client HTTP 200 failover, cooldown exclusion, no-eligible-target HTTP 503, no raw URL disclosure, soft deletion, and runtime removal.

## Sprint 71 boundaries

Sprint 71 is **Kubernetes foundation**, not a replacement routing or dynamic registry platform.

Sprint 71 must:

- audit current Docker, environment, port, health, startup, and migration boundaries
- preserve Docker Compose development
- preserve route identity and configured service discovery
- preserve process-local health ownership
- preserve GET-only retry and non-GET no-replay behavior
- preserve Admin, quota, analytics, cache, transform, timeout, metrics, and access-log boundaries
- leave production Kubernetes runtime validation to Sprint 72

Sprint 71 must not silently add:

- Kubernetes API service discovery
- service mesh
- distributed health state
- external secret-management platform
- cloud-vendor-specific deployment dependencies
- OpenTelemetry, Loki, billing, marketplace, or enterprise IAM
- npm package version changes
- a Git tag

Keep protected tag `v1.0.0` unchanged and keep `v2.0.0` reserved for Sprint 80.
