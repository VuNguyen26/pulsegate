"use client";

import { useEffect, useState } from "react";

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
  formatDashboardConsumerTimestamp,
  loadDashboardConsumers,
  summarizeDashboardConsumers,
  type DashboardConsumer,
} from "../lib/consumers";

type ConsumerPanelState =
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardConsumer[]
    >;

const consumerColumns:
  readonly AdminResourceColumn<DashboardConsumer>[] = [
    {
      key: "consumer",
      header: "Consumer",
      render: (consumer) => (
        <div className="consumer-name-cell">
          <strong>{consumer.name}</strong>
          <span>
            {consumer.description ??
              "No description provided."}
          </span>
        </div>
      ),
    },
    {
      key: "id",
      header: "Consumer ID",
      render: (consumer) => (
        <code>{consumer.id}</code>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (consumer) => (
        <span
          className="consumer-status-pill"
          data-status={consumer.status.toLowerCase()}
        >
          {consumer.status}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (consumer) => (
        <div className="consumer-audit-cell">
          <time dateTime={consumer.createdAt}>
            {formatDashboardConsumerTimestamp(
              consumer.createdAt,
            )}
          </time>
          <small>
            by {consumer.createdBy ?? "unknown actor"}
          </small>
        </div>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (consumer) => (
        <div className="consumer-audit-cell">
          <time dateTime={consumer.updatedAt}>
            {formatDashboardConsumerTimestamp(
              consumer.updatedAt,
            )}
          </time>
          <small>
            by {consumer.updatedBy ?? "unknown actor"}
          </small>
        </div>
      ),
    },
  ];

export function ConsumerRegistryContent({
  consumers,
}: {
  consumers: readonly DashboardConsumer[];
}) {
  if (consumers.length === 0) {
    return (
      <AdminResourceEmpty
        title="No consumers configured"
        description="PulseGate did not return any API consumers."
      />
    );
  }

  const summary =
    summarizeDashboardConsumers(consumers);

  return (
    <>
      <section
        className="consumer-registry-summary"
        aria-label="Consumer registry summary"
      >
        <article className="consumer-summary-item">
          <strong>{summary.total}</strong>
          <span>Total consumers</span>
        </article>
        <article className="consumer-summary-item">
          <strong>{summary.active}</strong>
          <span>Active</span>
        </article>
        <article className="consumer-summary-item">
          <strong>{summary.disabled}</strong>
          <span>Disabled</span>
        </article>
      </section>

      <AdminResourceTable
        caption="Configured API consumers"
        columns={consumerColumns}
        rows={consumers}
        getRowKey={(consumer) => consumer.id}
      />
    </>
  );
}

export function ConsumerListPanel() {
  const [refreshToken, setRefreshToken] =
    useState(0);
  const [state, setState] =
    useState<ConsumerPanelState>({
      status: "loading",
    });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void loadDashboardConsumers(
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
    setState({
      status: "loading",
    });
    setRefreshToken((current) => current + 1);
  }

  if (state.status === "loading") {
    return (
      <AdminResourceLoading
        title="Consumer registry"
        description="Loading API consumers through the read-only Dashboard BFF."
      />
    );
  }

  if (state.status === "error") {
    return (
      <AdminResourceError
        title="Consumer registry unavailable"
        error={state.error}
        onRetry={retry}
      />
    );
  }

  return (
    <ConsumerRegistryContent
      consumers={state.data}
    />
  );
}
