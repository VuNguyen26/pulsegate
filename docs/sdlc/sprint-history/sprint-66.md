# Sprint 66 - Developer Portal API docs and API-key self-service foundation

Status: complete

Version: v1.6.0

## Goal

Replace the Sprint 65 Developer Portal placeholders with bounded, truthful developer-facing foundations without adding public authentication, real API-key lifecycle, privileged Admin integration, billing, marketplace, or Sprint 67 routing work.

## Implementation

### API documentation foundation

Commit:

- `4e00f79 feat(portal): add api documentation foundation`

Delivered:

- Static curated API reference.
- Verified `GET /health`.
- Verified `GET /api/product-service/health`.
- Verified protected `GET /api/products`.
- API-key and bearer-token guidance.
- Request ID, cache, rate-limit, quota, and downstream error guidance.
- Responsive endpoint cards, table of contents, examples, headers, and error table.
- Navigation status changed from planned to available.

Preserved boundaries:

- No OpenAPI or Swagger asset.
- No new dependency.
- No invented downstream success schema.
- No dynamic route-registry publication.
- No internal or Admin route publication.
- No backend or environment change.

### API-key self-service foundation

Commit:

- `64e1123 feat(portal): add api key self-service foundation`

Delivered:

- Static non-operational foundation.
- Current-capability and contract-gap sections.
- Future identity, ownership, issuance, storage, and lifecycle stages.
- Security guidance.
- No-connected-account state.
- Explicit `Not connected` and `No key will be created` labels.
- Navigation status changed from planned to available.

Preserved boundaries:

- No form, button, input, client mutation, or fetch call.
- No developer identity or session.
- No consumer ownership mapping.
- No issue, list, revoke, or rotate operation.
- No fake secret, fake account, or fake successful issuance.
- No browser persistence.
- No Admin credential or privileged Admin API.
- No backend, database, migration, dependency, or environment change.

## Validation

- Admin Dashboard: 52 test files / 237 tests.
- API Gateway: 140 test files / 1000 tests.
- Developer Portal: 2 test files / 7 tests.
- Root release-readiness validation passed.
- Root typecheck and build passed.
- Docker Compose configuration passed.
- Developer Portal image build passed.
- Developer Portal container became healthy.
- `/`, `/getting-started`, `/api-docs`, and `/api-keys` returned HTTP 200.
- A Next.js static JavaScript asset returned HTTP 200.
- Rendered API docs and API-key content checks passed.
- Privileged Admin and secret-surface audits passed.
- Working and staged diff checks passed.

## Version and release boundary

- Product/documentation version: `v1.6.0`.
- Private npm workspace versions: `0.1.0`.
- No Sprint 66 Git tag.
- Protected annotated tag `v1.0.0` remains unchanged.
- `v2.0.0` remains reserved for Sprint 80.

## Next sprint

Sprint 67 - Host-based routing foundation.

Sprint 67 must not start weighted routing, service discovery, Kubernetes, OpenTelemetry, Loki, billing, marketplace, or enterprise IAM early.
