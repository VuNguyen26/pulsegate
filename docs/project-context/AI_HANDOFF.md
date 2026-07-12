# AI Handoff

## Current canonical state

PulseGate is complete through **Sprint 69 - Service discovery foundation**.

- Product/documentation version: `v1.9.0`.
- Private npm workspace versions: `0.1.0`.
- Protected annotated tag `v1.0.0` remains at `407d03678674219e7228b15f0cd7a23074493f31`.
- Latest implementation HEAD before documentation finalization: `b5aefe9f3bcb4aa44b4be2d65a2f127007525141`.
- Next sprint: **Sprint 70 - Service discovery health/failover hardening**.
- Do not create, move, delete, or recreate a Git tag without explicit approval.
- `v2.0.0` remains reserved for Sprint 80.

## Sprint 69 route contract

```ts
type ServiceInstance = {
  baseUrl: string;
};

type WeightedUpstream = {
  downstreamUrl: string;
  weight: number;
};

type DownstreamRouteConfig = {
  requestHost?: string;
  serviceName: string;
  gatewayPath: string;
  downstreamUrl: string;
  weightedUpstreams?: readonly WeightedUpstream[];
  serviceInstances?: readonly ServiceInstance[];
  method: HttpMethod;
  policies: RoutePolicies;
};
```

Service discovery rules:

- `serviceName` uses canonical lowercase kebab-case and is at most 64 characters.
- Omitted discovery metadata means legacy direct or weighted behavior.
- Present `serviceInstances` contains 1-8 entries.
- Each `baseUrl` is one unique canonical HTTP or HTTPS origin.
- Credentials, paths, queries, fragments, trailing-slash non-canonical spelling, and values longer than 2048 characters fail closed.
- The primary downstream origin must exist in the instance set.
- A runtime snapshot contains at most 64 services.
- Active routes sharing one service name must expose equal instance sets.
- Snapshot instances and services are sorted and immutable.

## Runtime invariants

- Resolve route identity first: exact host, then path-only fallback.
- Missing or malformed direct Host input still fails closed.
- Forwarded host headers do not participate.
- Cache lookup happens before downstream target resolution.
- A cache hit performs no target selection and no downstream fetch.
- Legacy direct routes use `downstreamUrl`.
- Legacy weighted routes use the existing weighted selector.
- Direct discovery routes select one instance from the runtime service snapshot.
- Direct discovery preserves the primary path and query while replacing only the origin.
- Missing registry state or a missing service returns no target and fails closed.
- Weighted discovery continues to use `weightedUpstreams`; the service-discovery random source is not called.
- Weighted origins exactly match the configured instance set and share the primary path/query.
- One target is used for the proxy execution.
- Retries reuse the selected target and do not fail over.
- Client headers, query parameters, request IDs, API keys, consumers, and Host input cannot choose an instance.
- Shared auth, quota, rate-limit, cache, transforms, timeout, retry, analytics, metrics, and access-log behavior remains intact.

## Persistence and Admin semantics

- Prisma field: `serviceInstances Json? @map("service_instances")`.
- PostgreSQL column: nullable `gateway.gateway_routes.service_instances JSONB`.
- Existing SQL `NULL` rows preserve legacy behavior.
- Create omission or `null`: discovery disabled.
- Update omission: preserve current value.
- Update `null`: clear using `Prisma.DbNull`.
- Update array: replace the full instance set.
- Admin write validation builds the candidate active route set and rejects conflicting service definitions before persistence.
- Runtime loader validates the active route and discovery snapshot before atomic replacement.
- Soft-deleted routes do not participate in the active snapshot.

## Dashboard boundary

- The Dashboard remains read-only.
- It validates service-name format, 1-8 cardinality, canonical origins, uniqueness, primary-origin inclusion, and weighted-origin equality.
- It displays `Static upstream` or `Service discovery (N instances)`.
- It lists each configured service instance.
- It does not add create, update, delete, reload, health, failover, or traffic-control controls.
- Full-access Admin credentials remain absent.
- The read-only credential remains server-side and is not exposed in HTML or BFF responses.

## Sprint 69 implementation commits

- `5575cae641462dd9646fa2c2fb22689dcdf5787f` - service discovery contract.
- `7c4f70655e7c2f6d9b50a26d81cfe00a06f1fc46` - runtime configured-instance resolution.
- `ab5a2b72d9b0fe4d592636305d5fb3fbea43725e` - persistence and Admin route integration.
- `b5aefe9f3bcb4aa44b4be2d65a2f127007525141` - Dashboard discovery metadata.

## Validation baseline

- API Gateway: 153 test files / 1110 tests.
- Admin Dashboard: 53 test files / 244 tests.
- Developer Portal: 2 test files / 7 tests.
- Prisma validation passed.
- Root tests, typecheck, build, Compose config, and diff checks passed.
- PostgreSQL migration and JSONB schema validation passed.
- Admin/runtime direct discovery roundtrip passed.
- Dashboard BFF/runtime discovery metadata validation passed.
- Working tree and Git refs were clean and synchronized before docs finalization.

## Non-negotiable boundaries for Sprint 70

Sprint 70 is **service discovery health/failover hardening**, not Kubernetes or an external service-registry platform.

Audit the exact Sprint 69 runtime before changing it.

Potential Sprint 70 scope must remain bounded and explicit:

- define active/passive health semantics before implementation
- define failure thresholds, recovery behavior, and selection eligibility
- keep health state bounded and non-client-controlled
- preserve exact host/path route identity
- preserve legacy direct and weighted compatibility
- preserve cache, quota, rate-limit, transforms, timeout, retry, analytics, metrics, and access-log boundaries
- define whether failover occurs before request, after connection failure, or across retries
- avoid silently changing retry semantics
- avoid unbounded per-instance metrics labels
- require deterministic tests and bounded Docker runtime validation

Sprint 70 must not silently add:

- Kubernetes API discovery
- Consul, Eureka, DNS SRV, cloud registry, or general plugin registry
- registration or deregistration APIs
- heartbeat or lease protocols
- distributed consensus
- client-selected instances
- arbitrary reverse proxy targets
- sticky sessions
- billing, marketplace, or enterprise IAM
- raw-event deletion or quota source-of-truth changes

## Required workflow

- Audit exact repository state, tests, migrations, scripts, and PowerShell behavior first.
- Make small checkpointed changes.
- Run targeted tests after each checkpoint.
- Validate database/runtime behavior before documentation finalization.
- Keep finalization limited to docs, clean validation, commit, push, and report.
- Save handoff artifacts outside the repository under `E:\pulsegate-artifacts`.
- Do not reset successful work automatically after a failure.
- Preserve private npm workspace versions at `0.1.0`.
- Do not create a Sprint 70 tag.
- Keep protected tag `v1.0.0` unchanged.
- Keep `v2.0.0` reserved for Sprint 80.

## Fixed roadmap

- 61 Admin Dashboard foundation - complete.
- 62 Dashboard consumers/API keys/usage plans - complete.
- 63 Dashboard quota/usage/rejected events - complete.
- 64 Dashboard rollup/retention/scheduler panels - complete.
- 65 Developer Portal foundation - complete.
- 66 Developer Portal API docs/key self-service foundation - complete.
- 67 Host-based routing foundation - complete.
- 68 Weighted routing foundation - complete.
- 69 Service discovery foundation - complete.
- 70 Service discovery health/failover hardening - next.
- 71 Kubernetes foundation.
- 72 Kubernetes runtime validation/docs.
- 73 OpenTelemetry foundation.
- 74 Loki foundation.
- 75 Grafana observability integration.
- 76 Platform RBAC/security hardening.
- 77 UI state/responsive polish.
- 78 E2E demo and bounded k6 validation.
- 79 v2 docs/runbooks/architecture cleanup.
- 80 v2.0.0 release.
