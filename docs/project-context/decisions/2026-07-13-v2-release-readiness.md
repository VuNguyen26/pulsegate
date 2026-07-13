# PulseGate v2 Release Readiness

Date: 2026-07-13

Sprint: Sprint 80 - Product/Platform v2 Release

Status: Accepted for release preparation; final evidence and annotated tag pending.

## Context

Product/Platform v2 implementation is complete through Sprint 79, with Sprint 80 reserved as a release-only milestone. The repository requires evidence-backed static validation, bounded runtime validation, accurate release documentation, and safe annotated-tag creation without adding product features or changing established architecture and security boundaries.

## Decision

### Release version

- Use `v2.0.0` as the Git and product-documentation release version only after successful Sprint 80 finalization.
- Keep private first-party npm workspace versions at `0.1.0`.
- Keep `package-lock.json` unchanged.
- Do not publish npm packages, container images, or a cloud deployment as part of this release.

### Release documentation

- Add `docs/releases/v2.0.0.md`.
- Add `docs/sdlc/sprint-history/sprint-80.md`.
- Preserve current canonical documents at `v1.19.0` until final validation succeeds.
- Finalize canonical current-state documents only after static and runtime evidence pass.

### Release validation

- Use `npm.cmd run validate:release` for repository release readiness.
- Use the existing bounded runtime demonstration and k6 smoke after their contracts are re-audited.
- Validate Docker Compose statically before runtime startup.
- Render existing Kubernetes targets without applying them.
- Record actual test counts, runtime evidence, database deltas, cleanup, and artifact hashes.
- Preserve all established Admin, Dashboard, Portal, routing, discovery, failover, retry, analytics, tracing, logging, metrics, Compose, Kubernetes, and database boundaries.

### Tag contract

- Create annotated tag `v2.0.0`.
- Use annotation `PulseGate v2.0.0 - Product/Platform v2`.
- Target the pushed final Sprint 80 documentation commit.
- Create the tag only after post-commit validation, clean-tree verification, ref synchronization, package-lock verification, workspace-version verification, and protected-tag verification.
- Push only `refs/tags/v2.0.0`.
- Never force-update, move, delete, or recreate a conflicting remote tag.

## Consequences

Benefits:

- Release claims remain bounded and evidence-backed.
- Product and private package version semantics remain explicit.
- The fixed Sprint 45-80 roadmap ends without inventing Sprint 81.
- Existing behavior and safety boundaries remain unchanged.

Trade-offs:

- Runtime validation remains local and PowerShell-first.
- The release is a repository/product-documentation milestone, not a production deployment or capacity certification.
- Final version and tag creation remain blocked until all release evidence passes.
