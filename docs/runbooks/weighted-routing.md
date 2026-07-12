# Weighted Routing Runbook

## Scope

This runbook covers Sprint 68 bounded route-level weighted upstream routing.

It does not implement or validate:

- service discovery
- upstream health checks
- automatic failover
- sticky sessions
- client-selected targets
- Kubernetes traffic splitting
- distributed coordination
- per-upstream high-cardinality metrics

## Contract

A legacy route uses one primary downstream:

```json
{
  "downstreamUrl": "http://product-service:3001/products",
  "weightedUpstreams": null
}
```

A weighted route keeps the same primary downstream and adds a bounded list:

```json
{
  "downstreamUrl": "http://product-service:3001/products",
  "weightedUpstreams": [
    {
      "downstreamUrl": "http://product-service:3001/products",
      "weight": 1
    },
    {
      "downstreamUrl": "http://product-service-canary:3001/products",
      "weight": 3
    }
  ]
}
```

Rules:

- 2-8 entries.
- Unique HTTP or HTTPS URLs.
- Integer weight 1-1000.
- Relative weights; no required sum.
- Primary `downstreamUrl` appears exactly once.
- Invalid configuration fails closed.

## Selection behavior

- Route identity is resolved first.
- Cache is checked before target selection.
- Selection occurs only on a cache miss.
- The cumulative relative-weight selector chooses only configured targets.
- Tests inject a deterministic random source.
- Production uses an internal random source.
- Retries reuse one selected target.
- No target health or failover behavior exists.

## Admin persistence semantics

Create:

- omitted or null weighted metadata means single-upstream mode
- a valid array stores weighted mode

Update:

- omitted weighted metadata preserves the existing value
- null clears weighted mode
- an array replaces the full set

Persistence:

- column: `gateway.gateway_routes.weighted_upstreams`
- type: nullable JSONB
- SQL `NULL`: legacy single-upstream mode
- explicit clear: `Prisma.DbNull`

Runtime reload validates the complete active route snapshot before replacement.

## Dashboard

The Dashboard is observational only:

- shows single or weighted mode
- shows target count
- shows target URLs and relative weights
- performs bounded fail-closed validation
- exposes no mutation, reload, health, or failover control

## Security checklist

- No client header or query parameter selects a target.
- No request ID, API key, or consumer ID controls selection.
- No Host value becomes a downstream URL.
- No arbitrary target is accepted outside validated persisted configuration.
- Existing auth, quota, rate limit, cache, transform, timeout, retry, analytics, and metrics pipeline remains active.
- Raw upstream URLs are not Prometheus labels.

## Verification

Run the full automated validation:

```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
docker compose config --quiet
```

Run Prisma validation and the bounded PostgreSQL/Admin/runtime lifecycle described in `docs/runbooks/local-validation.md`.

Expected Sprint 68 baselines:

- API Gateway: 147 test files / 1059 tests.
- Admin Dashboard: 53 test files / 243 tests.
- Developer Portal: 2 test files / 7 tests.

<!-- SPRINT-69-WEIGHTED-DISCOVERY-START -->
## Sprint 69 interaction with service discovery

Weighted routing remains the target selector when both `weightedUpstreams` and `serviceInstances` are configured.

Required relationship:

- `serviceInstances` contains canonical origins only.
- Weighted target origins exactly match the configured service instance set.
- Every weighted target preserves the primary downstream path and query.
- The existing weighted random source selects the target.
- The direct service-discovery random source is not invoked.
- Retries reuse the selected weighted target.
- This relationship validates service membership but does not add health checks or failover.

A direct discovery route without `weightedUpstreams` selects one configured instance from the runtime service snapshot and composes the selected origin with the primary downstream path and query.

See `docs/runbooks/service-discovery.md`.
<!-- SPRINT-69-WEIGHTED-DISCOVERY-END -->
