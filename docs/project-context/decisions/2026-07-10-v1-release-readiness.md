# PulseGate v1 Release Readiness

Date: 2026-07-10

Sprint: Sprint 60 - Final polish, docs, demo script, architecture cleanup, release v1.0.0

## Status

Accepted. Git tag pending final validation and explicit approval.

## Context

Backend Portfolio v1 is complete through Sprint 60.

The repository needed a repeatable release check, a bounded runtime demo, accurate scheduler documentation, and an explicit version convention before creating the first stable Git release.

## Decision

### Release version

- Use `v1.0.0` as the Git and product documentation release version.
- Keep private npm workspace versions at `0.1.0`.
- Do not publish npm packages as part of this release.

### Release validation

- Use `npm run validate:release` for tests, typecheck, build, Git diff checks, clean working-tree verification, and `origin/main` synchronization.
- Use `npm run demo:runtime` for bounded Docker runtime validation.
- Create the Git tag only after final documentation, automated validation, runtime validation, clean repository verification, and explicit approval.

### Runtime demo boundary

The demo validates:

- Gateway, Prometheus, and Grafana readiness.
- Bounded unmatched metric labels.
- Prometheus gateway target health.
- Grafana datasource and five-panel dashboard provisioning.
- Admin full-access, read-only, and invalid-key boundaries.
- Bounded k6 health smoke.

The demo does not run:

- Destructive retention execution.
- Raw event deletion.
- Autonomous scheduled or background execute.
- External scheduler runtime execution.

### Product boundary

Sprint 60 remains a release and polish sprint.

It does not add Admin Dashboard UI, Developer Portal, Kubernetes, OpenTelemetry, Loki, billing, marketplace, or unrelated platform scope.

## Consequences

Benefits:

- Release checks are reproducible.
- Runtime validation is bounded and portfolio-friendly.
- Product and package version semantics are explicit.
- Safety boundaries remain unchanged.

Trade-offs:

- The runtime demo is PowerShell-first.
- Full Docker Compose runtime validation remains local rather than part of CI.
- The release does not publish npm packages.

## Validation Baseline

- 136 test files passed.
- 988 tests passed.
- Typecheck and build passed.
- Prometheus, Grafana, admin auth, bounded metrics, and k6 runtime checks passed.
