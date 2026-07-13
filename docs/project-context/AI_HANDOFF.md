# AI Handoff

PulseGate Product/Platform v2 is complete through Sprint 80.

## Canonical state

- Product/documentation version: `v2.0.0`.
- Latest completed sprint: Sprint 80 - Product/Platform v2 Release.
- Current sprint: none.
- Next sprint: none.
- No sprint is defined beyond the fixed Sprint 45-80 roadmap.
- Release preparation commit: `6c995204fc301c1a6a43ebc47a969c499e1aa3a4`.
- Final Sprint 80 documentation commit: `docs: finalize sprint 80 documentation`.
- Annotated tag `v2.0.0`: pending post-commit release validation.
- Private first-party npm workspace versions remain `0.1.0`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Package-lock SHA-256 remains `0DC54D8748B45FDCC50DC8B5729D13838301F702AB1EB6F6C09814B3E07EEC41`.

## Final evidence

- 230 test files / 1474 tests passed.
- Workspace typecheck and production builds passed.
- Release-readiness and documentation checks passed.
- Docker Compose configuration passed with 10 services.
- All existing Kubernetes Kustomize targets rendered successfully.
- The bounded end-to-end demo and bounded k6 smoke passed.
- Runtime cleanup left zero Compose containers and preserved named volumes.

## Non-negotiable boundaries

- Do not invent Sprint 81.
- Do not move, delete, recreate, or force-update protected tag `v1.0.0`.
- Do not create or push `v2.0.0` until post-commit release validation passes.
- Keep all private first-party npm workspace versions at `0.1.0`.
- Keep `package-lock.json` unchanged.
- Keep `ADMIN_READ_ONLY_API_KEY` server-only.
- Keep full-access `ADMIN_API_KEY` out of Dashboard runtime and browser surfaces.
- Preserve the 29 protected Admin routes, 18-read/11-mutation authorization matrix, and 18 fixed GET-only Dashboard BFF resources.
- Preserve routing, discovery, failover, retry, analytics, scheduler, retention, tracing, logging, metrics, Compose, Kubernetes, and database source-of-truth boundaries.
- Keep generated evidence outside the repository under `E:\pulsegate-artifacts`.
- Use PowerShell 5.1-safe commands and `npm.cmd`.

## Start here

- [Current canonical state](CURRENT_PROGRESS.md)
- [Architecture overview](../architecture/overview.md)
- [Final requirements](../sdlc/requirements.md)
- [Sprint 80 history](../sdlc/sprint-history/sprint-80.md)
- [v2.0.0 release notes](../releases/v2.0.0.md)
- [v2 release decision](decisions/2026-07-13-v2-release-readiness.md)
- [Canonical local validation runbook](../runbooks/local-validation.md)
