# Current Progress

## Current Version

v0.59.0

## Latest Completed Sprint

Sprint 58 - Minimal Admin/RBAC hardening

## Sprint 58 Completion Summary

Sprint 58 completed bounded Admin/RBAC hardening for internal administration APIs.

Delivered:

- Fail-fast registration enforcement for the exact `/internal/admin` route and all descendants.
- Shared marked admin API key authentication middleware detection.
- Centralized and sanitized `x-admin-actor` attribution.
- Optional read-only admin API key support.
- Read-only access limited to `GET`, `HEAD`, and `OPTIONS`.
- Explicit `ADMIN_API_KEY_READ_ONLY` mutation rejection.
- Startup rejection for identical full-access and read-only credentials.
- Timing-safe verification through the existing API key hashing helper.
- Docker Compose and `.env.example` configuration support.
- Unit, integration, regression, and Docker runtime validation.

Preserved boundaries:

- `x-admin-actor` remains audit attribution rather than authenticated identity.
- No Admin Dashboard UI.
- No database-backed administrator or role model.
- No database migration.
- No quota behavior changes.
- No analytics rollup scheduler changes.
- No retention execution.
- No raw event deletion.

Sprint 58 commits:

- `fef7202 feat(gateway): enforce admin route auth boundary`
- `bf428c3 feat(gateway): normalize admin actor attribution`
- `16941ca feat(gateway): add read-only admin access`
- `c7087cc feat(gateway): use timing-safe admin key verification`

Validation before docs finalization:

- `npm run test`: 136 test files / 987 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Docker/PostgreSQL runtime validation passed.
- Health and read-only admin reads returned `200`.
- Read-only mutation returned `403 ADMIN_API_KEY_READ_ONLY`.
- Full-access mutation passed auth and reached payload validation.
- Invalid admin credentials remained rejected.

## Next Sprint

Sprint 59 - Observability + Grafana/k6 lightweight validation.

Sprint 59 should remain a lightweight portfolio validation sprint focused on existing observability signals, practical Grafana panels, and bounded k6 checks. It should not expand into a new monitoring platform, alter quota correctness, open retention execution, add raw event deletion, or introduce broad product/UI scope.

## Sprint 56 Completion Summary

Sprint 56 added a review-only analytics retention execute contract boundary.

Implemented:

- `executeContractReview` contract model.
- DB-free execution-preview output exposure.
- Operator-preview output exposure.
- Command usage/output documentation.
- Service-preview contract propagation.
- Tests for contract model, execution preview, service preview, operator preview, and command output.

Safety preserved:

- No retention execute command.
- No retention delete API.
- No scheduled retention delete job.
- No operator-facing `deleteCandidates` call.
- No Prisma retention delete repository wiring into command/API/job execution.
- No quota mutation.
- No raw event deletion.
- No rollup summary behavior change.

Final Sprint 56 validation:

- 133 test files / 956 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime validation was not required because Sprint 56 added contract/model/output/usage/test changes only and no new DB runtime or destructive delete path.

## Latest Commits

- `d635573 feat(gateway): propagate retention execute review through service preview`
- `dd501a2 test(gateway): document retention execute review command output`
- `ec842ea feat(gateway): expose retention execute review in operator preview`
- `026b744 feat(gateway): expose retention execute contract review preview`
- `380e17e feat(gateway): add retention execute contract review`

## Next Recommended Sprint

Sprint 57 - Retention Execute Preview Hardening/rollback expectation.

Sprint 57 should remain non-destructive unless explicitly approved. It should harden rollback/audit/candidate-recheck expectation output and keep `deleteCandidates`, Prisma delete execution, raw event deletion, quota mutation, and scheduled delete jobs blocked.

## Fixed Roadmap

Sprint 45-60 = Backend Portfolio v1.

- 45 Fail-Closed Error Model
- 46 Command Dry-Run Service Invocation Wiring Contract
- 47 Command Dry-Run Runtime Service Invocation
- 48 Dry-Run Runtime Output Hardening
- 49 Command Execute Contract Review
- 50 Command Execute Wiring Preview blocked-by-default
- 51 Command Execute Runtime Wiring with strict guardrails
- 52 Rollup Summary API Switch Preview
- 53 Switch selected summary reads to rollup read model with fallback
- 54 Background Scheduler Contract/Runner
- 55 Background Scheduler Runtime Wiring with guardrails
- 56 Retention Execute Contract Review
- 57 Retention Execute Preview Hardening/rollback expectation
- 58 Minimal Admin/RBAC hardening
- 59 Observability + Grafana/k6 lightweight validation
- 60 Final polish, docs, demo script, architecture cleanup, release v1.0.0

Sprint 61-80 = Product/Platform Expansion v2.
