# PulseGate v2 Release Readiness

Date: 2026-07-13

Sprint: Sprint 80 - Product/Platform v2 Release

Status: Accepted. Final release validation complete; annotated tag pending post-commit validation.

## Context

Product/Platform v2 implementation is complete through Sprint 79, with Sprint 80 reserved as a release-only milestone. Sprint 80 validated, documented, and prepared the existing platform for the final Product/Platform v2 Git and product-documentation release without adding product scope.

## Decision

### Release version

- Use `v2.0.0` as the Git and product/documentation release version.
- Keep private first-party npm workspace versions at `0.1.0`.
- Keep `package-lock.json` unchanged.
- Do not publish npm packages, container images, or a cloud deployment as part of this release.

### Release validation

- Require all workspace tests, typecheck, and production builds to pass.
- Require `npm.cmd run validate:release` to pass.
- Require documentation integrity checks to pass.
- Require Docker Compose configuration to pass with 10 services.
- Require all existing Kubernetes Kustomize targets to render without apply.
- Require the bounded end-to-end demo and bounded k6 smoke to pass.
- Require non-destructive cleanup with zero remaining Compose containers.
- Require a clean repository, synchronized refs, unchanged package-lock, unchanged private workspace versions, and unchanged protected tag `v1.0.0`.

### Final evidence

- 230 test files / 1474 tests passed.
- Static validation report SHA-256: `B16E4AFA923D1757F1F1E5321CF9073EBD0091D625E77822400865F232A1D322`.
- Release-readiness log SHA-256: `E9A285A9D9F4B5673B554EC37C528941204600F64A609AA85911AF4F4C8214D5`.
- Runtime report SHA-256: `5C5362FC8A47B29F5FD6AA4E06B5B94D3C4BD4003ADA305B4668850CE4E86F5D`.
- Demo log SHA-256: `81E9D486EA2A2E349DA030BC0564D7146B301137065E7E3B5F0FDAAEA9C4A19B`.
- k6 log SHA-256: `3BA22FC9363A4BF5F706393FD51E2D0EA0D3811019759B526E28C0ED97DE3BE7`.

### Tag contract

- Create annotated tag `v2.0.0`.
- Use annotation `PulseGate v2.0.0 - Product/Platform v2`.
- Target the pushed final Sprint 80 documentation commit.
- Create the tag only after post-commit release validation, clean-tree verification, ref synchronization, package-lock verification, workspace-version verification, and protected-tag verification.
- Push only `refs/tags/v2.0.0`.
- Never force-update, move, delete, or recreate a conflicting remote tag.

## Consequences

Benefits:

- The fixed Sprint 45-80 roadmap ends with an evidence-backed release.
- Product and private package version semantics remain explicit.
- Existing architecture, security, database, routing, observability, and deployment boundaries remain unchanged.
- No Sprint 81 is invented.

Trade-offs:

- Runtime validation remains local and PowerShell-first.
- The release is a repository and product-documentation milestone, not a production deployment or capacity certification.
