# AI Handoff

PulseGate is complete through Sprint 78 - End-to-End Demo and Lightweight k6 Validation. Sprint 79 is documentation-only cleanup. Sprint 80 remains the Product/Platform v2 release sprint.

## Start here

- [Current canonical state](CURRENT_PROGRESS.md)
- [Architecture overview](../architecture/overview.md)
- [Requirements and fixed roadmap](../sdlc/requirements.md)
- [Canonical local validation runbook](../runbooks/local-validation.md)
- [Sprint 78 history](../sdlc/sprint-history/sprint-78.md)
- [Sprint 78 validation decision](decisions/2026-07-13-end-to-end-demo-lightweight-k6-validation.md)

## Canonical baseline

- Expected branch: `main`.
- Expected Sprint 78 baseline commit: `310806edfff40fe7e3a6dd24d1edc700e14a3143`.
- Product/documentation version: `v1.18.0`.
- Private first-party npm workspace versions: `0.1.0`.
- Latest completed sprint: Sprint 78.
- Current sprint: Sprint 79 - v2 Docs, Runbooks and Architecture Cleanup.
- Next sprint: Sprint 80 - Product/Platform v2 Release.
- Protected annotated tag: `v1.0.0`.
- Tag object: `726feb46e62a3224f7e27d55ae4f9e74dd6b1123`.
- Tag target: `407d03678674219e7228b15f0cd7a23074493f31`.
- Package-lock SHA-256: `0DC54D8748B45FDCC50DC8B5729D13838301F702AB1EB6F6C09814B3E07EEC41`.
- Sprint 79 creates no Git tag.
- `v2.0.0` remains reserved for Sprint 80.

## Sprint 78 evidence baseline

- Demonstrated flow: Developer Portal `/api-docs` -> API Gateway `/api/product-service/health` -> Product Service `/health`.
- Method: GET only.
- Credentials: none.
- Demo result: one successful usage event and zero rejected events.
- k6 result: one VU, ten iterations, 30/30 checks, and zero failed smoke requests.
- Observed smoke p95: `34.19 ms`.
- k6 persistence: ten successful usage events and zero rejected events.
- Named volumes and eleven bounded successful usage events were preserved.
- No production-capacity or production-SLO claim was made.

Final test baseline:

- Admin Dashboard: 55 files / 253 tests.
- API Gateway: 163 files / 1177 tests.
- Developer Portal: 2 files / 8 tests.
- Product Service: 10 discovered files / 36 tests.

## Non-negotiable invariants

- Audit exact source and documentation before patching.
- Preserve all 29 protected Admin routes.
- Preserve the 18-read/11-mutation Admin authorization matrix.
- Preserve the 18 fixed GET-only Dashboard BFF resources.
- Keep `ADMIN_READ_ONLY_API_KEY` server-only.
- Keep full-access `ADMIN_API_KEY` out of Dashboard runtime and browser surfaces.
- Keep the Developer Portal public, static-first, unprivileged, and non-operational for real key issuance.
- Preserve route identity, host routing, weighted routing, service discovery, health/failover, retry, quota, analytics, scheduler, retention, tracing, logging, metrics, Grafana, Loki, Alloy, Compose, Kubernetes, and database sources of truth.
- Preserve package-lock and private npm versions.
- Preserve protected tag `v1.0.0`.
- Keep artifacts outside the repository under `E:\pulsegate-artifacts`.
- Use PowerShell 5.1-safe commands and `npm.cmd`.
- Use small checkpoints, exact exit-code checks, clean Git state, and synchronized refs.
- Preserve historical sprint and decision records by default.

## Sprint 79 rules

Allowed:

- Documentation structure and wording changes.
- Canonical-state clarification.
- Runbook consolidation and command correction.
- Architecture and requirements correction based on audited source.
- Navigation, heading, link, and encoding cleanup.
- Sprint 80 release-readiness documentation.

Forbidden:

- Application or test-behavior changes.
- Database connection or data mutation merely for documentation cleanup.
- Migration, dependency, package-lock, environment, service, port, Compose, or Kubernetes changes.
- npm workspace version changes.
- Sprint 79 tag creation.
- Sprint 80 release execution.
- Creation of `v2.0.0`.

Keep product/documentation version `v1.18.0` until Sprint 79 finalization. Advance to `v1.19.0` only after all documentation checkpoints and final validation pass.

## Completed Sprint 79 audit

- Documentation files: 148.
- Historical documents: 115.
- Current or operational documents: 33.
- Runbooks: 26.
- Invalid UTF-8 files: zero.
- Empty documents: zero.
- Broken relative links confirmed: zero.
- Confirmed mojibake occurrences: eight.
- UTF-8 BOM files: 19; do not normalize historical records broadly.
- Package-script references checked: 49; unknown script references: zero.
- Missing repository path references: zero.
- Dashboard BFF resources: 18, all GET only.
- Dashboard pages: 11.
- Developer Portal pages: four.
- Compose services: ten.
- Kubernetes YAML files: 12.

## Remaining Sprint 79 checkpoints

- Consolidate and correct runbook commands and dangerous cleanup guidance.
- Align architecture and requirements with audited implementation.
- Correct confirmed mojibake and exact documentation defects.
- Add Sprint 79 history and decision records.
- Finalize product/documentation version `v1.19.0`.
- Run documentation, test, typecheck, build, release-readiness, Git, package-lock, and protected-tag validation.
- Commit and push documentation-only changes.
- Leave `v2.0.0` creation to Sprint 80.
