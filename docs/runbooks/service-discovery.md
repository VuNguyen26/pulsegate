# Service Discovery Runbook

## Scope

This runbook covers Sprint 69 bounded configured service discovery.

It covers:

- service identity and instance contracts
- direct discovery target resolution
- weighted discovery interaction
- persistence and Admin semantics
- runtime reload
- Dashboard read-only metadata
- deterministic and bounded runtime validation

It does not cover:

- active or passive health checks
- automatic failover
- retry-to-another-instance behavior
- circuit breaking or outlier ejection
- registry polling, registration, deregistration, TTL, or heartbeat
- DNS SRV, Consul, Eureka, Kubernetes API, or cloud discovery
- client-selected instances
- sticky routing

## Configuration contract

Example direct discovery metadata:

```json
{
  "serviceName": "product-service",
  "downstreamUrl": "http://product-a:3001/products?version=1",
  "serviceInstances": [
    {
      "baseUrl": "http://product-a:3001"
    },
    {
      "baseUrl": "http://product-b:3001"
    }
  ]
}
```

Rules:

- Service names are lowercase kebab-case and at most 64 characters.
- A configured service has 1-8 instances.
- A snapshot has at most 64 services.
- Each `baseUrl` is a unique canonical HTTP or HTTPS origin.
- Credentials, path, query, fragment, trailing slash, invalid URL, and values above 2048 characters are rejected.
- The primary downstream origin is included.
- Routes sharing a service name use equal instance sets.

## Direct discovery behavior

For a route without `weightedUpstreams`:

1. Route identity resolves by method, pathname, and direct normalized Host.
2. Existing auth, quota, rate-limit, and cache policies run.
3. On cache miss, the runtime registry selects one configured instance.
4. The selected origin replaces the primary downstream origin.
5. The primary path and query are preserved.
6. The shared transform, timeout, retry, proxy, analytics, metrics, and access-log pipeline continues.

Missing registry state or a missing service produces no target and fails closed.

Retries reuse the resolved target; they do not select another instance.

## Weighted discovery behavior

Example:

```json
{
  "serviceName": "product-service",
  "downstreamUrl": "http://product-a:3001/products",
  "serviceInstances": [
    {
      "baseUrl": "http://product-a:3001"
    },
    {
      "baseUrl": "http://product-b:3001"
    }
  ],
  "weightedUpstreams": [
    {
      "downstreamUrl": "http://product-a:3001/products",
      "weight": 25
    },
    {
      "downstreamUrl": "http://product-b:3001/products",
      "weight": 75
    }
  ]
}
```

Weighted discovery rules:

- Weighted origins exactly match service instances.
- Weighted targets preserve the primary path and query.
- The weighted selector chooses the target.
- The direct discovery random source is not called.
- Retries reuse the selected weighted target.
- Weights are not health scores and do not provide failover.

## Persistence

Database column:

```text
gateway.gateway_routes.service_instances JSONB NULL
```

Semantics:

- SQL `NULL`: discovery disabled.
- Create omission or JSON null: SQL `NULL`.
- Update omission: preserve.
- Update JSON null: clear using `Prisma.DbNull`.
- Update array: replace.
- Soft delete removes the route from the active snapshot.

## Runtime reload

Reload validates the complete active route set and service snapshot before replacement.

Conflicting instance sets for one service name fail closed. Invalid reload does not partially replace the current registry.

## Dashboard

The `/routes` page displays:

- routing mode
- discovery mode
- instance count
- each canonical instance origin

The Dashboard is read-only and has no health, failover, registration, reload, or mutation controls.

## Validation commands

```powershell
npm.cmd --workspace api-gateway run test -- `
  src/config/service-discovery.test.ts `
  src/proxy/downstream-target-resolver.test.ts `
  src/routes/service-discovery-routing.route.test.ts `
  src/runtime/route-runtime-registry-service-discovery.test.ts `
  src/route-management/service-discovery-route-persistence.test.ts `
  src/routes/admin-route-service-discovery-validation.test.ts

npm.cmd --workspace admin-dashboard run test -- `
  src/lib/routes.test.ts `
  src/components/route-registry-panel.test.tsx `
  src/server/admin-routes.test.ts
```

Full validation:

```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
docker compose config --quiet
git diff --check
```

Expected Sprint 69 baselines:

- API Gateway: 153 test files / 1110 tests.
- Admin Dashboard: 53 test files / 244 tests.
- Developer Portal: 2 test files / 7 tests.

## Runtime evidence

Completed before documentation finalization:

- migration deployed and schema current
- nullable JSONB column verified
- Admin create/read/database roundtrip passed
- runtime reload passed
- direct discovery proxy returned HTTP 200
- route soft-delete and registry cleanup passed
- Dashboard BFF list/detail preserved discovery metadata
- Dashboard `/routes` returned HTTP 200
- read-only GET/POST authorization boundary passed
- credential non-disclosure check passed

This evidence does not prove health checks or failover; those remain Sprint 70 scope.
