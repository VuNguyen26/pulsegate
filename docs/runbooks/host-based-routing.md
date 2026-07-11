# Host-Based Routing Runbook

## Scope

This runbook covers Sprint 67 exact host-based routing. It excludes weighted routing, service discovery, failover, wildcard hosts, TLS, and DNS.

## Route identity

- `requestHost: null` or omitted means path-only.
- A canonical host means an exact host-specific route.
- Identity is `requestHost | null + method + gatewayPath`.

The database permits path-only and multiple exact-host routes to coexist on the same method/path. Admin conflict checks reserve identity for active and disabled non-deleted records. Soft deletion releases identity.

## Admin workflow

1. Create or update a route through the Admin Routes API.
2. Supply a host value accepted by the host normalizer.
3. Use explicit `null` to clear a host condition during PATCH.
4. Reload the runtime registry.
5. Confirm runtime output includes canonical `requestHost`.
6. Confirm the Dashboard displays the host or `Path-only`.

## Matching behavior

1. Parse only the direct Host header.
2. Normalize case, valid port, and one trailing dot.
3. Reject malformed, wildcard, suffix, regex, unsafe, or oversized values.
4. Match exact host + method + path.
5. Otherwise use path-only method/path fallback for a valid host.
6. Do not use fallback for missing or malformed host input.

## Policy isolation

Cache and route-level rate-limit state include configured host identity. Incoming raw host values are not used as upstream destinations, metrics labels, or unbounded policy keys.

Quota remains consumer/API-key based. Analytics remains method/path based in Sprint 67.

## Persistence migrations

- `20260711213000_add_gateway_route_request_host`
- `20260711223000_allow_host_route_identity`

The first migration adds nullable `request_host`. The second removes legacy method/path uniqueness. Existing seeded records remain path-only.

## Verification

Run:

```powershell
npm.cmd run validate:release
```

For database validation, deploy migrations to bounded PostgreSQL, seed path-only routes, create two exact-host routes sharing method/path, reload the registry, and verify exact selection plus valid unknown-host fallback.
