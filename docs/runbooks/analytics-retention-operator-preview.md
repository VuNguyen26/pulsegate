# Analytics Retention Operator Preview Runbook

## Scope

This runbook documents the non-destructive analytics retention operator preview command added in Sprint 30.

The command reads candidate counts from PostgreSQL through the Prisma candidate read repository and prints a JSON preview.

It is not a delete command.

---

## Current Status

Implemented command:

    npm run analytics:retention:operator-preview --workspace api-gateway -- [options]

Still unavailable:

- No retention execute command.
- No retention delete API.
- No scheduled/background retention delete job.
- No production delete workflow.
- No operator-facing call to deleteCandidates.

---

## Required Environment

For local PowerShell validation against Docker PostgreSQL:

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

Start required services:

    docker compose up -d postgres redis

Deploy migrations:

    npm run db:migrate:deploy --workspace api-gateway

Expected migration state:

- 7 migrations found.
- No pending migrations.

---

## Command Options

Base command:

    npm run analytics:retention:operator-preview --workspace api-gateway -- [options]

Supported options:

- --enabled <true|false>
- --source <usage|rejected|both>
- --mode <dry-run|execute>
- --usage-retention-days <n>
- --rejected-retention-days <n>
- --confirm-execute <confirmation>
- --hard-delete-limit <n>

Execute confirmation value:

    I_UNDERSTAND_ANALYTICS_RETENTION_DELETE

---

## Examples

Disabled preview:

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled false

Usage-only preview:

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90

Rejected-only preview:

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source rejected --rejected-retention-days 90

Both-source dry-run preview:

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120

Both-source execute preview:

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100

---

## Expected Safety Output

The output should include:

    "kind": "analytics-retention-operator-preview"

Required safety fields:

    "candidateCountLoader": {
      "dryRunOnly": true,
      "deleteAllowed": false
    }

    "safety": {
      "commandDeletesEvents": false,
      "candidateReadOnly": true,
      "deleteRepositoryExecuted": false,
      "deleteAllowed": false,
      "destructiveExecutionPerformed": false
    }

Top-level safety fields:

    "deleteAllowed": false
    "destructiveExecutionPerformed": false

Execute-preview mode may show:

    "mode": "execute"
    "hardDeleteLimit": 100

But it must still keep:

    "deleteAllowed": false
    "destructiveExecutionPerformed": false

---

## Safety Model

The operator preview command is read-only.

Required safety conditions:

- It reads candidate counts only.
- It uses the Prisma candidate read repository, not the delete repository.
- It does not call deleteCandidates.
- It does not delete raw usage events.
- It does not delete raw rejected events.
- It keeps usage and rejected candidate counts separate.
- It does not affect quota counting.
- It does not affect usage recording.
- It does not affect rejected event recording.
- It does not switch summary APIs to rollup reads.

---

## Validation Commands

Run automated validation:

    npm run test
    npm run typecheck
    npm run build

Run targeted operator preview tests:

    npm run test --workspace api-gateway -- analytics-retention-operator-preview-output.test.ts
    npm run test --workspace api-gateway -- analytics-retention-operator-preview.command.test.ts

Run DB-backed runtime validation:

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

    docker compose up -d postgres redis

    npm run db:migrate:deploy --workspace api-gateway

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled false

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source rejected --rejected-retention-days 90

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120

    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100

Expected result:

- All commands complete successfully.
- Candidate counts are loaded from PostgreSQL for enabled selected sources.
- Safety fields remain non-destructive.
- No raw events are deleted.

---

## Troubleshooting

If DATABASE_URL is missing, Prisma may report:

    Environment variable not found: DATABASE_URL

Fix:

- Set DATABASE_URL in the current PowerShell session before running DB-backed commands.

If execute preview is missing confirmation or hard delete limit, the execution guard should block delete planning.

This is expected and safe.

---

## Related Runbooks

- docs/runbooks/analytics-retention-dry-run.md
- docs/runbooks/analytics-retention-execution-preview.md
- docs/runbooks/analytics-retention-delete-repository.md
- docs/runbooks/analytics-retention-execution-service-preview.md
