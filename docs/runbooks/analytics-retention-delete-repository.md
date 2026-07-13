# Analytics Retention Delete Repository Runbook

## Scope

This runbook documents the current backend-only retention delete repository safety foundation.

It is not an operator command runbook.

There is currently no retention execute command, API, scheduled job, or UI action that calls this repository.

---

## Current Status

Implemented foundations:

- Delete repository safety contract.
- Delete repository port and executor.
- Delete operation planner.
- Prisma delete repository implementation.
- Unit tests for safety and Prisma repository behavior.

Still unavailable:

- No operator-facing retention execute command.
- No retention delete API.
- No scheduled/background retention delete job.
- No production delete workflow.

---

## Safety Model

A repository delete operation must pass layered checks before Prisma delete is called.

Required safety conditions:

- Delete batch plan must be allowed.
- Source must be selected by the batch plan.
- Source must be usage or rejected.
- Cutoff must be valid.
- Requested limit must be a positive safe integer.
- Requested limit must not exceed hard delete limit.
- Requested limit must not exceed source max delete count.
- Candidate recheck must have completed.
- Rechecked candidate count must be positive.
- Requested limit must not exceed rechecked candidates.
- Repository input source, cutoff, and limit must match the prepared safety decision.

---

## Prisma Delete Behavior

The Prisma repository does not delete by an unbounded cutoff filter.

It uses this pattern:

1. Count candidates for a source.
2. Select bounded candidate IDs using occurredAt < cutoffExclusive and take=limit.
3. Delete only rows whose id is in the selected ID list.
4. Return deleted count.

Usage and rejected sources use separate Prisma models:

- usage -> prisma.apiUsageEvent
- rejected -> prisma.apiRejectedEvent

---

## Validation Commands

Run automated validation:

    npm.cmd run test
    npm.cmd run typecheck
    npm.cmd run build

Run targeted repository tests:

    npm.cmd run test --workspace api-gateway -- analytics-retention-delete.repository
    npm.cmd run test --workspace api-gateway -- analytics-retention-delete.repository.prisma
    npm.cmd run test --workspace api-gateway -- analytics-retention-delete-repository-safety
    npm.cmd run test --workspace api-gateway -- analytics-retention-delete-operation-plan

Run safe runtime validation without invoking repository delete:

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

    docker compose up -d postgres redis

    npm.cmd run db:migrate:deploy --workspace api-gateway

    npm.cmd run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90

    npm.cmd run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 10

Expected safe runtime result:

- Migration deploy has no pending migrations.
- Dry-run returns dryRunOnly=true and deleteAllowed=false.
- Execution preview returns deleteImplementationAvailable=false.
- No raw events are deleted.

---

## Current Guardrails

Do not wire this repository to an operator-facing command until a separate execution service design exists.

Do not use this repository for quota counting.

Do not use this repository from runtime summary APIs.

Do not use this repository from rollup backfill.

Do not merge usage and rejected event delete paths.

<!-- pulsegate:sprint-64-dashboard-visibility:start -->
## Sprint 64 Dashboard visibility

The Admin Dashboard now exposes read-only /rollups, /scheduler, and /retention operator views. These views do not open scheduler execution or retention deletion. Use docs/runbooks/admin-dashboard-analytics-operations.md for endpoint, safety, and troubleshooting guidance.
<!-- pulsegate:sprint-64-dashboard-visibility:end -->
