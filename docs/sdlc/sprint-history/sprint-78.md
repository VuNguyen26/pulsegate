# Sprint 78 - End-to-End Demo and Lightweight k6 Validation

Status: Complete

Product/documentation version: `v1.18.0`

Private npm workspace versions: `0.1.0`

## Goal

Prove one truthful existing product flow and one lightweight local k6 smoke without adding new functionality, widening credentials, changing runtime contracts, or making production-performance claims.

## Implementation commits

- `260293efacf063487999d2473d76cc2b03c0c0b9` - `feat(demo): add bounded end-to-end validation flow`
- `4cf3d2d60e5edc4a58449af7d64b3f8a14601f0a` - `test(k6): add bounded end-to-end validation`

## Delivered

- Bounded GET-only demo in `scripts/demo-runtime.ps1`.
- Developer Portal API-doc verification for `/api/product-service/health`.
- Direct Gateway and Product Service readiness validation.
- Admin Dashboard and Developer Portal availability validation.
- Proxied Product Service response validation.
- Sanitized external summary artifacts.
- Existing k6 smoke retargeted to the proxied Product Service health flow.
- One VU, ten shared iterations, and bounded thresholds.
- Deterministic checks for HTTP status, service identity, and healthy status.

## Runtime proof

Demo:

- Usage count for the selected route: `3 -> 4`.
- Usage-event delta: `1`.
- Rejected-event delta: `0`.
- All five HTTP checks returned 200.
- Proxied response reported `product-service` and `ok`.

k6:

- 10/10 iterations completed.
- 30/30 checks passed.
- Failed smoke request rate: `0%`.
- Smoke-phase p95: `34.19 ms`.
- Usage count for the selected route: `4 -> 14`.
- Usage-event delta: `10`.
- Rejected-event delta: `0`.
- No core service restart or recreation.
- Disposable k6 container removed.
- No production-capacity or production-SLO claim.

Cleanup:

- Six Sprint-started runtime containers were removed.
- Named volumes were preserved.
- Eleven bounded Sprint 78 usage events were retained as evidence.
- Database evidence was not destructively cleaned.

## Validation

- Admin Dashboard: 55 test files / 253 tests.
- API Gateway: 163 test files / 1177 tests.
- Developer Portal: 2 test files / 8 tests.
- Product Service: 10 test files / 36 tests.
- Root tests, typecheck, production builds, release readiness, Compose checks, diff checks, clean-tree verification, and origin synchronization passed.
- Release validation created zero additional usage and rejected events.
- Package-lock and protected-tag hashes remained unchanged.

## Artifacts

- `E:\pulsegate-artifacts\sprint-78-demo`
- `E:\pulsegate-artifacts\sprint-78-runtime-validation`
- `E:\pulsegate-artifacts\sprint-78-k6-validation`
- `E:\pulsegate-artifacts\sprint-78-release-readiness`
- `E:\pulsegate-artifacts\sprint-78-documentation`

## Preserved boundaries

- No new feature, endpoint, Admin mutation, migration, schema, seed, dependency, environment variable, service, public port, Kubernetes resource, npm workspace version, or Git tag.
- No API key, JWT, or Admin credential used by the selected flow.
- No destructive HTTP method.
- No broad load laboratory, stress, soak, scalability, production-capacity, or production-SLO claim.
- Protected annotated tag `v1.0.0` remained unchanged.

## Next sprint

Sprint 79 - v2 Docs, Runbooks and Architecture Cleanup.

Sprint 79 must audit and consolidate current documentation without changing implementation behavior or performing Sprint 80 release work early.
