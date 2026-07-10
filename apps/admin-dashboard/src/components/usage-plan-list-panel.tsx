"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AdminResourceEmpty,
  AdminResourceError,
  AdminResourceLoading,
  AdminResourceTable,
  type AdminResourceColumn,
} from "./admin-resource-view";
import type {
  DashboardAdminResourceLoadResult,
} from "../lib/admin-resource-contract";
import {
  formatDashboardQuotaLimit,
  formatDashboardUsagePlanTimestamp,
  loadDashboardUsagePlan,
  loadDashboardUsagePlans,
  summarizeDashboardUsagePlans,
  type DashboardUsagePlan,
} from "../lib/usage-plans";

type UsagePlanListState =
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardUsagePlan[]
    >;

type UsagePlanDetailState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardUsagePlan
    >;

const usagePlanColumns:
  readonly AdminResourceColumn<DashboardUsagePlan>[] = [
    {
      key: "plan",
      header: "Usage plan",
      render: (usagePlan) => (
        <div className="usage-plan-name-cell">
          <strong>{usagePlan.name}</strong>
          <code>{usagePlan.id}</code>
          <small>
            {usagePlan.description ?? "No description"}
          </small>
        </div>
      ),
    },
    {
      key: "quota",
      header: "Quota",
      render: (usagePlan) => (
        <div className="usage-plan-quota-cell">
          <strong>
            {formatDashboardQuotaLimit(
              usagePlan.quotaLimit,
            )}
          </strong>
          <span>
            requests per{" "}
            {usagePlan.quotaWindow.toLowerCase()} window
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (usagePlan) => (
        <span
          className="usage-plan-status-pill"
          data-status={
            usagePlan.enabled
              ? "enabled"
              : "disabled"
          }
        >
          {usagePlan.enabled ? "ENABLED" : "DISABLED"}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (usagePlan) => (
        <div className="usage-plan-audit-cell">
          <time dateTime={usagePlan.updatedAt}>
            {formatDashboardUsagePlanTimestamp(
              usagePlan.updatedAt,
            )}
          </time>
          <small>
            by {usagePlan.updatedBy ?? "unknown actor"}
          </small>
        </div>
      ),
    },
  ];

export function UsagePlanSummary({
  usagePlans,
}: {
  usagePlans: readonly DashboardUsagePlan[];
}) {
  const summary =
    summarizeDashboardUsagePlans(usagePlans);

  return (
    <section
      className="usage-plan-summary"
      aria-label="Usage plan registry summary"
    >
      <article className="usage-plan-summary-item">
        <strong>{summary.total}</strong>
        <span>Total plans</span>
      </article>
      <article className="usage-plan-summary-item">
        <strong>{summary.enabled}</strong>
        <span>Enabled</span>
      </article>
      <article className="usage-plan-summary-item">
        <strong>{summary.disabled}</strong>
        <span>Disabled</span>
      </article>
      <article className="usage-plan-summary-item">
        <strong>{summary.daily}</strong>
        <span>Daily windows</span>
      </article>
      <article className="usage-plan-summary-item">
        <strong>{summary.monthly}</strong>
        <span>Monthly windows</span>
      </article>
    </section>
  );
}

export function UsagePlanDetail({
  usagePlan,
}: {
  usagePlan: DashboardUsagePlan;
}) {
  return (
    <section
      className="content-card usage-plan-detail"
      aria-labelledby="usage-plan-detail-title"
    >
      <div>
        <p className="eyebrow">Selected plan</p>
        <h2 id="usage-plan-detail-title">
          {usagePlan.name}
        </h2>
        <p>
          {usagePlan.description ?? "No description"}
        </p>
      </div>

      <dl className="usage-plan-detail-grid">
        <div>
          <dt>Plan ID</dt>
          <dd>
            <code>{usagePlan.id}</code>
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            {usagePlan.enabled
              ? "Enabled"
              : "Disabled"}
          </dd>
        </div>
        <div>
          <dt>Quota limit</dt>
          <dd>
            {formatDashboardQuotaLimit(
              usagePlan.quotaLimit,
            )}
          </dd>
        </div>
        <div>
          <dt>Quota window</dt>
          <dd>{usagePlan.quotaWindow}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>
            <time dateTime={usagePlan.createdAt}>
              {formatDashboardUsagePlanTimestamp(
                usagePlan.createdAt,
              )}
            </time>
          </dd>
        </div>
        <div>
          <dt>Created by</dt>
          <dd>{usagePlan.createdBy ?? "unknown actor"}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>
            <time dateTime={usagePlan.updatedAt}>
              {formatDashboardUsagePlanTimestamp(
                usagePlan.updatedAt,
              )}
            </time>
          </dd>
        </div>
        <div>
          <dt>Updated by</dt>
          <dd>{usagePlan.updatedBy ?? "unknown actor"}</dd>
        </div>
      </dl>

      <p className="usage-plan-read-only-note">
        This checkpoint is read only. It does not create,
        update, enable, disable, or change quota behavior.
      </p>
    </section>
  );
}

export function UsagePlanListPanel() {
  const [listRefreshToken, setListRefreshToken] =
    useState(0);
  const [detailRefreshToken, setDetailRefreshToken] =
    useState(0);
  const [listState, setListState] =
    useState<UsagePlanListState>({
      status: "loading",
    });
  const [selectedUsagePlanId, setSelectedUsagePlanId] =
    useState<string | null>(null);
  const [detailState, setDetailState] =
    useState<UsagePlanDetailState>({
      status: "idle",
    });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void loadDashboardUsagePlans(
      fetch,
      controller.signal,
    ).then((result) => {
      if (!active) {
        return;
      }

      setListState(result);

      if (result.status === "success") {
        setSelectedUsagePlanId((current) => {
          if (
            current &&
            result.data.some(
              (usagePlan) =>
                usagePlan.id === current,
            )
          ) {
            return current;
          }

          return result.data[0]?.id ?? null;
        });
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [listRefreshToken]);

  const selectedUsagePlan = useMemo(() => {
    if (
      listState.status !== "success" ||
      !selectedUsagePlanId
    ) {
      return null;
    }

    return (
      listState.data.find(
        (usagePlan) =>
          usagePlan.id === selectedUsagePlanId,
      ) ?? null
    );
  }, [listState, selectedUsagePlanId]);

  useEffect(() => {
    if (!selectedUsagePlan) {
      setDetailState({
        status: "idle",
      });
      return;
    }

    const controller = new AbortController();
    let active = true;

    setDetailState({
      status: "loading",
    });

    void loadDashboardUsagePlan(
      selectedUsagePlan.id,
      fetch,
      controller.signal,
    ).then((result) => {
      if (active) {
        setDetailState(result);
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedUsagePlan, detailRefreshToken]);

  function retryList() {
    setListState({
      status: "loading",
    });
    setSelectedUsagePlanId(null);
    setDetailState({
      status: "idle",
    });
    setListRefreshToken(
      (current) => current + 1,
    );
  }

  function retryDetail() {
    setDetailState({
      status: "loading",
    });
    setDetailRefreshToken(
      (current) => current + 1,
    );
  }

  if (listState.status === "loading") {
    return (
      <AdminResourceLoading
        title="Usage plan registry"
        description="Loading bounded usage plan configuration through the read-only Dashboard BFF."
      />
    );
  }

  if (listState.status === "error") {
    return (
      <AdminResourceError
        title="Usage plan registry unavailable"
        error={listState.error}
        onRetry={retryList}
      />
    );
  }

  if (listState.data.length === 0) {
    return (
      <AdminResourceEmpty
        title="No usage plans configured"
        description="PulseGate did not return any usage plan configuration."
      />
    );
  }

  return (
    <div className="page-stack">
      <UsagePlanSummary
        usagePlans={listState.data}
      />

      <section className="content-card usage-plan-picker">
        <label htmlFor="usage-plan-select">
          Usage plan detail
        </label>
        <select
          id="usage-plan-select"
          value={selectedUsagePlanId ?? ""}
          onChange={(event) =>
            setSelectedUsagePlanId(
              event.currentTarget.value,
            )
          }
        >
          {listState.data.map((usagePlan) => (
            <option
              key={usagePlan.id}
              value={usagePlan.id}
            >
              {usagePlan.name} (
              {usagePlan.enabled
                ? "ENABLED"
                : "DISABLED"}
              )
            </option>
          ))}
        </select>
        <p>
          Select a validated plan to load its fixed
          read-only detail endpoint.
        </p>
      </section>

      <AdminResourceTable
        caption="Persisted usage plan configuration"
        columns={usagePlanColumns}
        rows={listState.data}
        getRowKey={(usagePlan) => usagePlan.id}
      />

      {detailState.status === "idle" ? (
        <AdminResourceEmpty
          title="Select a usage plan"
          description="Choose a validated usage plan to read its detail."
        />
      ) : null}

      {detailState.status === "loading" ? (
        <AdminResourceLoading
          title="Usage plan detail"
          description="Loading the selected persisted usage plan."
        />
      ) : null}

      {detailState.status === "error" ? (
        <AdminResourceError
          title="Usage plan detail unavailable"
          error={detailState.error}
          onRetry={retryDetail}
        />
      ) : null}

      {detailState.status === "success" ? (
        <UsagePlanDetail
          usagePlan={detailState.data}
        />
      ) : null}
    </div>
  );
}
