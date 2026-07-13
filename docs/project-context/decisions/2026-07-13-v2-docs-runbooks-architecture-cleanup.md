# Sprint 79 v2 Documentation, Runbook, and Architecture Cleanup

- Date: 2026-07-13
- Status: Accepted
- Sprint: 79
- Product/documentation version during implementation checkpoints: `v1.18.0`

## Context

PulseGate completed Sprint 78 with a bounded end-to-end demonstration and lightweight k6 validation. The repository then contained extensive append-only sprint documentation, overlapping current-state summaries, PowerShell examples that were not consistently Windows-safe, several exact encoding defects, and incomplete filename coverage in the decision index.

The cleanup had to improve documentation reliability without changing application behavior, dependencies, package-lock state, database state, runtime services, Compose topology, Kubernetes resources, private workspace versions, or protected release tags.

## Decision

- `README.md` remains the repository entry point and navigation surface.
- `docs/project-context/CURRENT_PROGRESS.md` owns the canonical current version, sprint, Git baseline, validation baseline, and immediate delivery boundary.
- `docs/project-context/AI_HANDOFF.md` remains the concise next-chat handoff.
- `docs/architecture/overview.md` owns the current architecture snapshot while preserving later sprint-specific sections as historical records.
- `docs/sdlc/requirements.md` owns the current normative boundary and fixed Sprint 45-80 roadmap while preserving historical acceptance sections.
- `docs/runbooks/local-validation.md` remains the canonical local validation entry point.
- `docs/project-context/DECISION_LOG.md` remains the decision summary and navigation index.
- Historical sprint and decision records are preserved by default.
- PowerShell-oriented runbooks use `npm.cmd`.
- Actionable `docker compose down -v` guidance is prohibited because named volumes and preserved evidence must not be deleted accidentally.
- Confirmed mojibake and duplicate H2 ambiguity are corrected exactly, without broad historical rewrites.
- Existing UTF-8 BOM state is preserved; no global BOM normalization is performed.
- Product/documentation version remains `v1.18.0` during implementation checkpoints.
- `v1.19.0` may be introduced only during successful Sprint 79 finalization.
- `v2.0.0` remains reserved for Sprint 80.
- Sprint 79 creates no Git tag.

## Audited implementation boundaries retained

- 29 protected Gateway Admin routes.
- 18 read routes and 11 mutation routes in the Admin authorization matrix.
- 18 fixed GET-only Admin Dashboard BFF route files and no generic Admin proxy.
- Server-only `ADMIN_READ_ONLY_API_KEY`.
- No full-access `ADMIN_API_KEY` in Dashboard runtime or browser surfaces.
- Public, static-first, unprivileged Developer Portal.
- Existing host routing, weighted routing, service discovery, health-aware failover, retry, quota, analytics, scheduler, retention, tracing, structured logging, metrics, Grafana, Loki, Alloy, Compose, Kubernetes, and database source-of-truth boundaries.
- Validated Compose model of 10 services.
- Kubernetes deployment tree of 12 YAML files.

## Checkpoint evidence

- `4b8ffa6cbda75e6a895d98ca75de54f711754613` — clarified canonical current state.
- `b9ded3afd7096b59146f415c6c3c147147b0d2a0` — hardened PowerShell runbook command guidance.
- `026b388247df16f011c34f3995c1dda1d3a18e4d` — aligned architecture and requirements.
- `bc6bb43b73e51e34ef3c24a167b336c477405043` — corrected encoding and heading ambiguity.

## Consequences

- Operators receive PowerShell-safe commands and non-destructive cleanup guidance.
- Current state is separated from historical sprint snapshots.
- The fixed roadmap and historical evidence remain intact.
- Documentation finalization can advance to `v1.19.0` only after final validation.
- Sprint 80 remains responsible for the Product/Platform v2 release and any `v2.0.0` tag.
