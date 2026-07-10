# AI Handoff

## Current Version

- v0.59.0

## Latest Completed Sprint

- Sprint 58 - Minimal Admin/RBAC hardening

## Latest Commit on origin/main

- `c7087cc feat(gateway): use timing-safe admin key verification`

## Sprint 58 Summary

Sprint 58 hardened the internal administration boundary without introducing a full admin identity or enterprise RBAC platform.

Completed:

- Added fail-fast protected-route registration enforcement for `/internal/admin` and descendants.
- Added marked middleware detection so future admin routes cannot silently omit authentication.
- Centralized actor attribution across admin mutation routes.
- Sanitized `x-admin-actor` with bounded length and an audit-safe character set.
- Added optional read-only admin access.
- Limited read-only access to `GET`, `HEAD`, and `OPTIONS`.
- Added explicit `403 ADMIN_API_KEY_READ_ONLY` behavior.
- Preserved the existing full-access admin key contract.
- Added configuration validation preventing identical full-access/read-only credentials.
- Replaced raw admin key equality checks with the existing timing-safe hash verifier.
- Added Docker Compose and `.env.example` support.

Important interpretation:

- `x-admin-actor` is attribution metadata only.
- It must not be described as a verified administrator identity.
- `ADMIN_READ_ONLY_API_KEY` is a minimal two-level authorization boundary, not a general role system.
- Absence of `ADMIN_READ_ONLY_API_KEY` preserves prior full-access-only behavior.

Sprint 58 commits:

- `fef7202 feat(gateway): enforce admin route auth boundary`
- `bf428c3 feat(gateway): normalize admin actor attribution`
- `16941ca feat(gateway): add read-only admin access`
- `c7087cc feat(gateway): use timing-safe admin key verification`

Validation before docs finalization:

- Full tests passed: 136 test files / 987 tests.
- Typecheck passed.
- Build passed.
- `git diff --check` passed.
- Docker/PostgreSQL runtime validation passed.
- Read-only reads were allowed.
- Read-only writes were blocked.
- Full-access writes passed authentication.
- Invalid credentials remained blocked.

## Safety Boundaries

Do not open these without explicit approval:

- Retention execute command.
- Retention delete API.
- Scheduled retention delete job.
- Operator-facing `deleteCandidates`.
- Prisma retention delete repository wired into command/API/job execution.
- Quota mutation.
- Raw event deletion.
- Admin Dashboard UI before Sprint 61.
- Developer Portal UI before Sprint 65.
- Database-backed enterprise IAM, billing, marketplace, Kafka, Kubernetes, or multi-tenant organization expansion before roadmap.

## Next Recommended Sprint

Sprint 59 - Observability + Grafana/k6 lightweight validation.

Recommended scope:

- Validate existing Prometheus metrics and labels.
- Add or refine a small practical Grafana dashboard using existing signals.
- Add bounded k6 smoke/load checks.
- Document reproducible local observability validation.
- Avoid a broad monitoring-platform rewrite.
- Preserve quota, usage/rejection event separation, retention safety, and scheduler boundaries.

## Sprint 56 Summary

Sprint 56 added review-only retention execute contract output.

Key outcomes:

- `executeContractReview` exists as a retention execute contract model.
- Execution preview includes `executeContractReview`.
- Retention execution service preview includes `executeContractReview`.
- Operator preview includes `executeContractReview`.
- Command usage/output tests document review-only behavior.
- Destructive retention execution remains blocked.

Validation:

- 133 test files / 956 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime validation was not required because no new DB runtime path, migration, destructive delete execution, quota path, scheduled job, or raw event deletion path was added.

## Safety Boundaries

Do not open these without explicit approval:

- Retention execute command.
- Retention delete API.
- Scheduled retention delete job.
- Operator-facing `deleteCandidates`.
- Prisma retention delete repository wired into command/API/job execution.
- Quota mutation.
- Raw event deletion.
- Admin Dashboard UI before Sprint 61.
- Developer Portal UI before Sprint 65.
- Billing/marketplace/Kafka/K8s/multitenant org expansion before roadmap.

## Next Recommended Sprint

Sprint 58 - Minimal Admin/RBAC hardening.

Recommended scope:

- Harden rollback expectation output.
- Harden audit output expectation.
- Harden candidate recheck expectation.
- Keep execute review-only unless explicitly approved.
- Keep all destructive retention execution blocked.

## Required Docs Checklist at Sprint Finalization

Always audit/update:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- relevant runbooks
- docs/sdlc/sprint-history/sprint-N.md
- docs/project-context/decisions/YYYY-MM-DD-*.md
