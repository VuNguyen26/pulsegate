# Analytics Retention Dry-Run Runbook

## Purpose

This runbook documents the dry-run-only analytics retention command added in Sprint 26.

The command previews candidate raw analytics events that would be affected by a future retention policy.

It does not delete data.

---

## Safety Guarantees

Current behavior:

- Dry-run only.
- No raw event deletion.
- No execute mode.
- No scheduled retention job.
- No quota counting changes.
- No usage recorder changes.
- No rejected event recorder changes.
- No summary API switch is controlled by retention dry-run. Selected summary runtime-read switching is controlled separately by ollupSummaryRuntimeRead=true and raw-summary fallback.

Output includes:

- dryRunOnly=true
- deleteAllowed=false

---

## Command

Base command:

    npm run analytics:retention:dry-run --workspace api-gateway -- [options]

Options:

- --enabled <true|false>
- --source <usage|rejected|both>
- --mode <dry-run>
- --usage-retention-days <n>
- --rejected-retention-days <n>

Examples:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled false

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source rejected --rejected-retention-days 90

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90

---

## Local Validation With Docker PostgreSQL

Start PostgreSQL:

    docker compose up -d postgres

Set local PowerShell DATABASE_URL:

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

Deploy migrations:

    npm run db:migrate:deploy --workspace api-gateway

Run disabled preview:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled false

Run usage-only preview:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90

Run rejected-only preview:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source rejected --rejected-retention-days 90

Run both-source preview:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90

Validate execute mode is rejected:

    npm run analytics:retention:dry-run --workspace api-gateway -- --mode execute

Expected execute-mode result:

- Command fails.
- Usage text is printed.
- No data is deleted.

---

## Expected JSON Shape

Successful dry-run output includes:

    {
      "policy": {},
      "plan": {},
      "candidates": {},
      "dryRunOnly": true,
      "deleteAllowed": false
    }

Usage-only candidate output includes usage and rejected=null.

Rejected-only candidate output includes rejected and usage=null.

Both-source candidate output includes both usage and rejected.

---

## Troubleshooting

If DATABASE_URL is missing:

    Environment variable not found: DATABASE_URL

Fix:

- Start PostgreSQL.
- Set DATABASE_URL in the current shell.
- Re-run migration deploy.
- Re-run the dry-run command.

If execute mode is passed:

    mode currently only supports dry-run

This is expected in Sprint 26.

---

## Current Limitations

- Candidate previews count rows older than the computed cutoff.
- No delete command exists yet.
- No retention schedule exists yet.
- No retention metrics or dashboard panels exist yet.
- No summary APIs use retention or rollup reads yet.

## Sprint 54 Scheduler Boundary Note

Sprint 54 does not change retention dry-run or retention execution behavior.

Background scheduler contract/output must not run retention execution and must not delete raw events.

## Sprint 55 Scheduler Runtime Boundary Note

Sprint 55 does not change this feature path.

The sprint only opens a guarded direct CLI `process-local` + `dry-run` scheduler runtime path for analytics rollup service invocation. It does not add scheduled/background jobs, external scheduler execution, execute mode expansion, quota mutation, raw event deletion, or retention execution.
