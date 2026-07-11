"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AdminResourceError,
  AdminResourceLoading,
} from "./admin-resource-view";
import {
  AnalyticsSummaryGrid,
} from "./analytics-summary-grid";
import type {
  DashboardAdminResourceLoadResult,
} from "../lib/admin-resource-contract";
import {
  loadDashboardSchedulerPreview,
} from "../lib/admin-scheduler-preview-client";
import type {
  DashboardSchedulerPreview,
  DashboardSchedulerSafety,
} from "../lib/admin-scheduler-preview";

type SchedulerPreviewPanelState =
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardSchedulerPreview
    >;

const safetyRows: readonly {
  key: keyof DashboardSchedulerSafety;
  label: string;
}[] = [
  {
    key: "createsScheduledJob",
    label: "Create scheduled job",
  },
  {
    key: "invokesBackfillService",
    label: "Invoke backfill service",
  },
  {
    key: "executesBackfill",
    label: "Execute backfill",
  },
  {
    key: "readsEvents",
    label: "Read raw events",
  },
  {
    key: "persistsRollups",
    label: "Persist rollups",
  },
  {
    key: "affectsQuotaCounting",
    label: "Affect quota counting",
  },
  {
    key: "deletesRawEvents",
    label: "Delete raw events",
  },
  {
    key: "runsRetentionExecution",
    label: "Run retention execution",
  },
];

function formatTimestamp(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle: "medium",
      timeStyle: "medium",
    },
  ).format(new Date(value));
}

function yesNo(
  value: boolean,
): string {
  return value ? "Yes" : "No";
}

export function SchedulerPreviewContent({
  preview,
}: {
  preview: DashboardSchedulerPreview;
}) {
  const plan = preview.output.previewPlan;
  const runtime =
    preview.output.runtimeGate.summary;

  return (
    <div className="analytics-results-stack">
      <AnalyticsSummaryGrid
        label="Scheduler preview summary"
        items={[
          {
            key: "plan-ready",
            label: "Preview plan ready",
            value: yesNo(
              preview.output.summary.ready,
            ),
          },
          {
            key: "runtime-open",
            label: "Runtime invocation open",
            value: yesNo(
              runtime.runtimeInvocationAllowed,
            ),
          },
          {
            key: "job-started",
            label: "Scheduled job started",
            value: yesNo(
              preview.startsScheduledJob,
            ),
          },
          {
            key: "adapter-invoked",
            label: "Runtime adapter invoked",
            value: yesNo(
              preview.invokesRuntimeAdapter,
            ),
          },
        ]}
      />

      <section
        className="analytics-lookup-card"
        aria-labelledby="scheduler-plan-title"
      >
        <header>
          <p className="eyebrow">
            Pure contract output
          </p>

          <h3 id="scheduler-plan-title">
            Preview plan
          </h3>
        </header>

        {plan ? (
          <dl>
            <div>
              <dt>Generated at</dt>
              <dd>
                {formatTimestamp(
                  preview.generatedAt,
                )}
              </dd>
            </div>

            <div>
              <dt>Trigger</dt>
              <dd>{plan.trigger}</dd>
            </div>

            <div>
              <dt>Mode</dt>
              <dd>
                {plan.requestedMode}
              </dd>
            </div>

            <div>
              <dt>Source</dt>
              <dd>{plan.source}</dd>
            </div>

            <div>
              <dt>Granularity</dt>
              <dd>
                {plan.granularity}
              </dd>
            </div>

            <div>
              <dt>Lookback buckets</dt>
              <dd>
                {plan.lookbackBuckets}
              </dd>
            </div>

            <div>
              <dt>Maximum buckets</dt>
              <dd>{plan.maxBuckets}</dd>
            </div>

            <div>
              <dt>Safety delay</dt>
              <dd>
                {plan.safetyDelayMs} ms
              </dd>
            </div>
          </dl>
        ) : (
          <p>
            The background runner contract
            did not produce a preview plan.
          </p>
        )}
      </section>

      <section
        className="analytics-lookup-card"
        aria-labelledby="scheduler-runtime-title"
      >
        <header>
          <p className="eyebrow">
            Runtime gate
          </p>

          <h3 id="scheduler-runtime-title">
            Closed execution boundary
          </h3>
        </header>

        <dl>
          <div>
            <dt>Status</dt>
            <dd>{runtime.status}</dd>
          </div>

          <div>
            <dt>Blocked reason</dt>
            <dd>
              {runtime.blockedReason ??
                "None"}
            </dd>
          </div>

          <div>
            <dt>
              Runtime factory resolution
            </dt>
            <dd>
              {yesNo(
                runtime.runtimeFactoryResolutionAllowed,
              )}
            </dd>
          </div>

          <div>
            <dt>
              Backfill service invocation
            </dt>
            <dd>
              {yesNo(
                runtime.backfillServiceInvocationAllowed,
              )}
            </dd>
          </div>

          <div>
            <dt>Execute backfill</dt>
            <dd>
              {yesNo(
                runtime.executeBackfillAllowed,
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="analytics-lookup-card"
        aria-labelledby="scheduler-safety-title"
      >
        <header>
          <p className="eyebrow">
            Non-destructive guarantees
          </p>

          <h3 id="scheduler-safety-title">
            Safety evidence
          </h3>
        </header>

        <ul>
          {safetyRows.map((row) => (
            <li key={row.key}>
              <strong>{row.label}:</strong>{" "}
              {yesNo(
                preview.output.safety[
                  row.key
                ],
              )}
            </li>
          ))}
        </ul>
      </section>

      <section
        className="analytics-lookup-card"
        aria-labelledby="scheduler-notes-title"
      >
        <header>
          <h3 id="scheduler-notes-title">
            Operator notes
          </h3>
        </header>

        <ul>
          {preview.output.operatorNotes.map(
            (note) => (
              <li key={note}>{note}</li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
}

export function SchedulerPreviewPanel() {
  const [refreshToken, setRefreshToken] =
    useState(0);

  const [state, setState] =
    useState<SchedulerPreviewPanelState>({
      status: "loading",
    });

  useEffect(() => {
    const controller =
      new AbortController();

    let active = true;

    setState({
      status: "loading",
    });

    void loadDashboardSchedulerPreview(
      fetch,
      controller.signal,
    ).then((result) => {
      if (active) {
        setState(result);
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [refreshToken]);

  function retry() {
    setRefreshToken(
      (current) => current + 1,
    );
  }

  return (
    <section
      className="analytics-panel-stack"
      aria-label="Analytics scheduler preview"
    >
      <div>
        <button
          type="button"
          disabled={
            state.status === "loading"
          }
          onClick={retry}
        >
          Refresh preview
        </button>
      </div>

      <p>
        This view evaluates a fixed,
        observational scheduler contract.
        It cannot start a job, resolve a
        runtime factory, invoke backfill or
        execute persistence.
      </p>

      {state.status === "loading" ? (
        <AdminResourceLoading
          title="Analytics scheduler preview"
          description="Evaluating the pure scheduler contract through the read-only Dashboard BFF."
        />
      ) : null}

      {state.status === "error" ? (
        <AdminResourceError
          title="Scheduler preview unavailable"
          error={state.error}
          onRetry={retry}
        />
      ) : null}

      {state.status === "success" ? (
        <SchedulerPreviewContent
          preview={state.data}
        />
      ) : null}
    </section>
  );
}