# Dashboard Resource Read Views

Date: 2026-07-10

Sprint: Sprint 62 - Dashboard consumers/API keys/usage plans

## Context

Sprint 61 established a product-facing Admin Dashboard with a server-only read-only credential boundary and one fixed runtime-status resource.

Sprint 62 needed to expose consumers, API keys, usage plans, and route information without turning the Dashboard into an arbitrary Admin API proxy or opening mutation behavior.

## Decision

Use explicit fixed read-only resource boundaries.

Dashboard pages:

```txt
/consumers
/api-keys
/usage-plans
/routes
```

Dashboard BFF resources:

```txt
GET /api/admin/consumers
GET /api/admin/consumers/:consumerId
GET /api/admin/consumers/:consumerId/api-keys
GET /api/admin/usage-plans
GET /api/admin/usage-plans/:usagePlanId
GET /api/admin/routes
GET /api/admin/routes/:routeId
GET /api/admin/routes/runtime
```

The Dashboard server maps each BFF resource to one fixed Gateway Admin GET endpoint. It uses only `ADMIN_READ_ONLY_API_KEY`, applies no-store behavior, validates bounded DTOs, and returns normalized safe errors.

## Resource Decisions

### Consumers

Provide list/detail inspection only. Do not add create, update, deactivate, or delete controls.

### API keys

Require consumer scoping and expose metadata only. Do not return raw issued key material. Do not add issue, revoke, or usage-plan assignment controls.

### Usage plans

Provide list/detail inspection only. Do not add create/update controls and do not change quota enforcement.

### Routes

Keep persisted configuration and runtime registry state as separate resources. Do not add route create/update/delete/reload controls. Do not treat downstream URLs as arbitrary proxy targets.

## Security Decisions

- Keep Admin credentials server-only.
- Keep full-access `ADMIN_API_KEY` out of the Dashboard.
- Reject arbitrary browser-selected paths, methods, hosts, headers, and targets.
- Keep BFF resources GET-only.
- Keep raw key material out of HTML, responses, browser storage, logs, and bundles.
- Preserve Gateway read-only mutation rejection.

## Versioning Decision

- Product/documentation version becomes `v1.2.0`.
- Private npm workspace versions remain `0.1.0`.
- Existing annotated Git tag `v1.0.0` remains unchanged.
- No Sprint 62 tag is created automatically.
- `v2.0.0` remains reserved for Sprint 80.

## Consequences

Benefits:

- Operators can inspect core API management resources from one product-facing surface.
- The browser cannot widen access beyond the fixed BFF contracts.
- API key and route data have explicit exposure boundaries.
- The shared resource foundation can be reused in Sprint 63.

Trade-offs:

- Operators cannot mutate these resources from the Dashboard.
- API key listing requires selecting a consumer.
- Persisted and runtime route views require separate requests and presentation.
- New resource types require new explicit BFF routes rather than generic forwarding.

## Preserved Behavior

This decision does not change:

- consumer, API key, usage-plan, or route persistence
- Gateway Admin API contracts
- quota counting
- successful usage recording
- rejected/security event recording
- rollup persistence or summary switching
- scheduler execution
- retention execution
- raw-event deletion
- database schema
- administrator identity or enterprise IAM

## Validation

- Admin Dashboard: 21 test files / 110 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Typecheck, build, Compose config, and diff checks passed.
- Runtime BFF/direct Gateway parity passed.
- Missing-resource mappings passed.
- Unsupported mutation methods were rejected.
- Read-only Gateway mutation was rejected.
- Credential leakage checks passed.
- Successful runtime mutation count was zero.
