# AI Handoff

PulseGate is complete through Sprint 78 - End-to-End Demo and Lightweight k6 Validation.

## Canonical state

- Product/documentation version: `v1.18.0`.
- Private npm workspace versions: `0.1.0`.
- Latest implementation commit before docs: `4cf3d2d60e5edc4a58449af7d64b3f8a14601f0a`.
- Sprint 77 documentation baseline: `b0e854190837dfec81a284d5b4fea7d3f8237778`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Tag object: `726feb46e62a3224f7e27d55ae4f9e74dd6b1123`.
- Tag target: `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 78 creates no tag.
- Current sprint: Sprint 79 - v2 Docs, Runbooks and Architecture Cleanup.
- Next sprint: Sprint 80 - Product/Platform v2 Release.

## Sprint 78 implementation commits

- `260293efacf063487999d2473d76cc2b03c0c0b9` - bounded GET-only end-to-end demo.
- `4cf3d2d60e5edc4a58449af7d64b3f8a14601f0a` - bounded proxied Product Service k6 smoke.

## Sprint 78 runtime contract

- Demonstrated flow: Developer Portal `/api-docs` -> API Gateway `/api/product-service/health` -> Product Service `/health`.
- Method: GET only.
- Credentials: none.
- Demo persistence: one successful usage event, zero rejected events.
- k6: one VU, ten shared iterations, 30-second max duration, five-second graceful stop, two-second timeout.
- k6 checks: HTTP 200, `service=product-service`, `status=ok`.
- k6 thresholds: zero failed smoke requests, smoke p95 below 1000 ms, all checks pass.
- Observed smoke p95: 34.19 ms.
- k6 persistence: ten successful usage events, zero rejected events.
- Core containers were not restarted or recreated.
- Sprint-created containers were removed; named volumes and bounded database evidence were preserved.
- No production capacity or production SLO claim.

## Validation evidence

- Admin Dashboard: 55 test files / 253 tests.
- API Gateway: 163 test files / 1177 tests.
- Developer Portal: 2 test files / 8 tests.
- Product Service: 10 test files / 36 tests.
- Root tests, typecheck, production builds, release validation, Compose checks, diff checks, package-lock integrity, protected-tag integrity, clean-tree verification, and origin synchronization passed.
- Release validation added zero usage or rejected events.
- Sanitized evidence remains under `E:\pulsegate-artifacts\sprint-78-*`.

## Long-lived invariants

- Audit exact source before patching.
- Preserve the trusted Gateway Admin context and all 29 Admin route protections.
- Preserve the 18 fixed GET-only Dashboard BFF resources.
- Preserve the server-only `ADMIN_READ_ONLY_API_KEY`.
- Keep full-access `ADMIN_API_KEY` out of Dashboard runtime and browser surfaces.
- Keep the Portal public, static-first, unprivileged, and free of fake issued credentials.
- Preserve route identity, weighted routing, configured service discovery, bounded process-local failover, quota, usage, rejection, rollup, scheduler, retention, tracing, logging, metrics, Grafana, Loki, Alloy, Kubernetes, and database sources of truth.
- Preserve package-lock and private npm versions unless a later sprint explicitly approves change.
- Preserve protected tag `v1.0.0`.
- Keep artifacts outside the repository, preferably under `E:\pulsegate-artifacts`.
- Use PowerShell 5.1-safe commands, `npm.cmd`, small checkpoints, exact exit-code checks, clean Git state, and synchronized refs.

## Sprint 79 starting boundary

Sprint 79 is v2 Docs, Runbooks and Architecture Cleanup.

Audit before patching:

- Canonical top-level version, sprint, roadmap, test, commit, tag, and runtime markers.
- Duplicated historical sections and oversized append-only documentation.
- Stale future-tense statements for completed sprints.
- Runbook overlap, discoverability, command accuracy, and PowerShell 5.1 safety.
- Architecture statements that no longer match current implementation.
- UTF-8, mojibake, broken links, inconsistent headings, and generated artifact references.
- The exact files that can be consolidated without losing historical evidence.
- Sprint 80 release requirements, while keeping release execution and `v2.0.0` creation out of Sprint 79.

Sprint 79 may change documentation structure and wording only. Do not change application behavior, tests merely to satisfy docs, runtime configuration, database state, dependencies, package versions, services, ports, Kubernetes resources, protected tags, or Sprint 78 evidence. Do not perform Sprint 80 release work early.
