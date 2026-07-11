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
import type {
  DashboardRetentionCandidatePreview,
  DashboardRetentionPreview,
} from "../lib/admin-retention-preview";
import {
  loadDashboardRetentionPreview,
} from "../lib/admin-retention-preview-client";

type RetentionPreviewPanelState =
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardRetentionPreview
    >;

function formatInteger(
  value: number,
): string {
  return new Intl.NumberFormat("en").format(
    value,
  );
}

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

function CandidateSection({
  candidate,
  title,
}: {
  candidate:
    DashboardRetentionCandidatePreview;
  title: string;
}) {
  return (
    <section
      className="analytics-lookup-card"
      aria-labelledby={`retention-${candidate.source}-title`}
    >
      <header>
        <p className="eyebrow">
          {candidate.source} events
        </p>

        <h3
          id={`retention-${candidate.source}-title`}
        >
          {title}
        </h3>
      </header>

      <dl>
        <div>
          <dt>Candidate count</dt>
          <dd>
            {formatInteger(
              candidate.candidateCount,
            )}
          </dd>
        </div>

        <div>
          <dt>Retention period</dt>
          <dd>
            {candidate.retentionDays} days
          </dd>
        </div>

        <div>
          <dt>Cutoff exclusive</dt>
          <dd>
            {formatTimestamp(
              candidate.cutoffExclusive,
            )}
          </dd>
        </div>

        <div>
          <dt>Dry-run only</dt>
          <dd>
            {yesNo(
              candidate.dryRunOnly,
            )}
          </dd>
        </div>

        <div>
          <dt>Delete allowed</dt>
          <dd>
            {yesNo(
              candidate.deleteAllowed,
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function RetentionPreviewContent({
  preview,
}: {
  preview: DashboardRetentionPreview;
}) {
  const totalCandidates =
    preview.candidates.usage
      .candidateCount +
    preview.candidates.rejected
      .candidateCount;

  return (
    <div className="analytics-results-stack">
      <AnalyticsSummaryGrid
        label="Retention preview summary"
        items={[
          {
            key: "usage-candidates",
            label: "Usage candidates",
            value: formatInteger(
              preview.candidates.usage
                .candidateCount,
            ),
          },
          {
            key: "rejected-candidates",
            label: "Rejected candidates",
            value: formatInteger(
              preview.candidates.rejected
                .candidateCount,
            ),
          },
          {
            key: "total-candidates",
            label: "Total candidates",
            value: formatInteger(
              totalCandidates,
            ),
          },
          {
            key: "delete-allowed",
            label: "Delete allowed",
            value: yesNo(
              preview.deleteAllowed,
            ),
          },
        ]}
      />

      <section
        className="analytics-lookup-card"
        aria-labelledby="retention-policy-title"
      >
        <header>
          <p className="eyebrow">
            Fixed server-owned policy
          </p>

          <h3 id="retention-policy-title">
            Dry-run policy
          </h3>
        </header>

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
            <dt>Mode</dt>
            <dd>
              {preview.policy.mode}
            </dd>
          </div>

          <div>
            <dt>Source</dt>
            <dd>
              {preview.policy.source}
            </dd>
          </div>

          <div>
            <dt>Policy enabled</dt>
            <dd>
              {yesNo(
                preview.policy.enabled,
              )}
            </dd>
          </div>

          <div>
            <dt>Configuration source</dt>
            <dd>
              {
                preview.configurationSource
              }
            </dd>
          </div>
        </dl>
      </section>

      <CandidateSection
        candidate={
          preview.candidates.usage
        }
        title="Usage deletion candidates"
      />

      <CandidateSection
        candidate={
          preview.candidates.rejected
        }
        title="Rejected-event deletion candidates"
      />

      <section
        className="analytics-lookup-card"
        aria-labelledby="retention-safety-title"
      >
        <header>
          <p className="eyebrow">
            Non-destructive guarantees
          </p>

          <h3 id="retention-safety-title">
            Safety evidence
          </h3>
        </header>

        <ul>
          <li>
            <strong>
              Candidate counts read:
            </strong>{" "}
            {yesNo(
              preview.readsCandidateCounts,
            )}
          </li>

          <li>
            <strong>Dry-run only:</strong>{" "}
            {yesNo(
              preview.dryRunOnly,
            )}
          </li>

          <li>
            <strong>
              Delete repository imported:
            </strong>{" "}
            {yesNo(
              preview.importsDeleteRepository,
            )}
          </li>

          <li>
            <strong>
              Retention executed:
            </strong>{" "}
            {yesNo(
              preview.executesRetention,
            )}
          </li>

          <li>
            <strong>
              Delete allowed:
            </strong>{" "}
            {yesNo(
              preview.deleteAllowed,
            )}
          </li>
        </ul>
      </section>
    </div>
  );
}

export function RetentionPreviewPanel() {
  const [refreshToken, setRefreshToken] =
    useState(0);

  const [state, setState] =
    useState<RetentionPreviewPanelState>({
      status: "loading",
    });

  useEffect(() => {
    const controller =
      new AbortController();

    let active = true;

    setState({
      status: "loading",
    });

    void loadDashboardRetentionPreview(
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
      aria-label="Analytics retention preview"
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
        This view counts raw-event
        candidates under a fixed 90-day
        dry-run policy. It cannot execute
        retention, import the delete
        repository or delete raw events.
      </p>

      {state.status === "loading" ? (
        <AdminResourceLoading
          title="Analytics retention preview"
          description="Reading bounded candidate counts through the read-only Dashboard BFF."
        />
      ) : null}

      {state.status === "error" ? (
        <AdminResourceError
          title="Retention preview unavailable"
          error={state.error}
          onRetry={retry}
        />
      ) : null}

      {state.status === "success" ? (
        <RetentionPreviewContent
          preview={state.data}
        />
      ) : null}
    </section>
  );
}