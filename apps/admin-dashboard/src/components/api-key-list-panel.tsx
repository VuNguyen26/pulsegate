"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AdminResourceEmpty,
  AdminResourceError,
  AdminResourceLoading,
  AdminResourceTable,
  type AdminResourceColumn,
} from "./admin-resource-view";
import {
  formatDashboardApiKeyTimestamp,
  loadDashboardConsumerApiKeys,
  summarizeDashboardApiKeys,
  type DashboardApiKey,
} from "../lib/api-keys";
import type {
  DashboardAdminResourceLoadResult,
} from "../lib/admin-resource-contract";
import {
  loadDashboardConsumers,
  type DashboardConsumer,
} from "../lib/consumers";

type ConsumerState =
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardConsumer[]
    >;

type ApiKeyState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardApiKey[]
    >;

function displayTimestamp(
  value: string | null,
  emptyLabel: string,
) {
  return value
    ? formatDashboardApiKeyTimestamp(value)
    : emptyLabel;
}

const apiKeyColumns:
  readonly AdminResourceColumn<DashboardApiKey>[] = [
    {
      key: "key",
      header: "API key",
      render: (apiKey) => (
        <div className="api-key-name-cell">
          <strong>{apiKey.name}</strong>
          <code>{apiKey.keyPrefix}</code>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (apiKey) => (
        <span
          className="api-key-status-pill"
          data-status={apiKey.status.toLowerCase()}
        >
          {apiKey.status}
        </span>
      ),
    },
    {
      key: "usage-plan",
      header: "Usage plan",
      render: (apiKey) => (
        <code>
          {apiKey.usagePlanId ?? "Unassigned"}
        </code>
      ),
    },
    {
      key: "expires",
      header: "Expires",
      render: (apiKey) => (
        <time dateTime={apiKey.expiresAt ?? undefined}>
          {displayTimestamp(
            apiKey.expiresAt,
            "No expiration",
          )}
        </time>
      ),
    },
    {
      key: "last-used",
      header: "Last used",
      render: (apiKey) => (
        <time dateTime={apiKey.lastUsedAt ?? undefined}>
          {displayTimestamp(
            apiKey.lastUsedAt,
            "Never",
          )}
        </time>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (apiKey) => (
        <div className="api-key-audit-cell">
          <time dateTime={apiKey.createdAt}>
            {formatDashboardApiKeyTimestamp(
              apiKey.createdAt,
            )}
          </time>
          <small>
            by {apiKey.createdBy ?? "unknown actor"}
          </small>
        </div>
      ),
    },
    {
      key: "revoked",
      header: "Revoked",
      render: (apiKey) => (
        <div className="api-key-audit-cell">
          <time dateTime={apiKey.revokedAt ?? undefined}>
            {displayTimestamp(
              apiKey.revokedAt,
              "Not revoked",
            )}
          </time>
          {apiKey.revokedAt ? (
            <small>
              by {apiKey.revokedBy ?? "unknown actor"}
            </small>
          ) : null}
        </div>
      ),
    },
  ];

export function ApiKeyRegistryContent({
  consumer,
  apiKeys,
}: {
  consumer: DashboardConsumer;
  apiKeys: readonly DashboardApiKey[];
}) {
  if (apiKeys.length === 0) {
    return (
      <AdminResourceEmpty
        title="No API keys configured"
        description={`PulseGate did not return API keys for ${consumer.name}.`}
      />
    );
  }

  const summary =
    summarizeDashboardApiKeys(apiKeys);

  return (
    <>
      <section
        className="api-key-registry-summary"
        aria-label="API key registry summary"
      >
        <article className="api-key-summary-item">
          <strong>{summary.total}</strong>
          <span>Total keys</span>
        </article>
        <article className="api-key-summary-item">
          <strong>{summary.active}</strong>
          <span>Active</span>
        </article>
        <article className="api-key-summary-item">
          <strong>{summary.revoked}</strong>
          <span>Revoked</span>
        </article>
        <article className="api-key-summary-item">
          <strong>{summary.assigned}</strong>
          <span>Usage plan assigned</span>
        </article>
      </section>

      <AdminResourceTable
        caption={`API key metadata for ${consumer.name}`}
        columns={apiKeyColumns}
        rows={apiKeys}
        getRowKey={(apiKey) => apiKey.id}
      />
    </>
  );
}

export function ApiKeyListPanel() {
  const [consumerRefreshToken, setConsumerRefreshToken] =
    useState(0);
  const [apiKeyRefreshToken, setApiKeyRefreshToken] =
    useState(0);
  const [consumerState, setConsumerState] =
    useState<ConsumerState>({
      status: "loading",
    });
  const [selectedConsumerId, setSelectedConsumerId] =
    useState<string | null>(null);
  const [apiKeyState, setApiKeyState] =
    useState<ApiKeyState>({
      status: "idle",
    });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void loadDashboardConsumers(
      fetch,
      controller.signal,
    ).then((result) => {
      if (!active) {
        return;
      }

      setConsumerState(result);

      if (result.status === "success") {
        setSelectedConsumerId((current) => {
          if (
            current &&
            result.data.some(
              (consumer) => consumer.id === current,
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
  }, [consumerRefreshToken]);

  const selectedConsumer = useMemo(() => {
    if (
      consumerState.status !== "success" ||
      !selectedConsumerId
    ) {
      return null;
    }

    return (
      consumerState.data.find(
        (consumer) =>
          consumer.id === selectedConsumerId,
      ) ?? null
    );
  }, [consumerState, selectedConsumerId]);

  useEffect(() => {
    if (!selectedConsumer) {
      setApiKeyState({
        status: "idle",
      });
      return;
    }

    const controller = new AbortController();
    let active = true;

    setApiKeyState({
      status: "loading",
    });

    void loadDashboardConsumerApiKeys(
      selectedConsumer.id,
      fetch,
      controller.signal,
    ).then((result) => {
      if (active) {
        setApiKeyState(result);
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedConsumer, apiKeyRefreshToken]);

  function retryConsumers() {
    setConsumerState({
      status: "loading",
    });
    setSelectedConsumerId(null);
    setApiKeyState({
      status: "idle",
    });
    setConsumerRefreshToken(
      (current) => current + 1,
    );
  }

  function retryApiKeys() {
    setApiKeyState({
      status: "loading",
    });
    setApiKeyRefreshToken(
      (current) => current + 1,
    );
  }

  if (consumerState.status === "loading") {
    return (
      <AdminResourceLoading
        title="API key registry"
        description="Loading the bounded consumer registry before reading API key metadata."
      />
    );
  }

  if (consumerState.status === "error") {
    return (
      <AdminResourceError
        title="Consumer registry unavailable"
        error={consumerState.error}
        onRetry={retryConsumers}
      />
    );
  }

  if (consumerState.data.length === 0) {
    return (
      <AdminResourceEmpty
        title="No consumers configured"
        description="Create an API consumer before API key metadata can be viewed."
      />
    );
  }

  return (
    <div className="page-stack">
      <section className="content-card api-key-consumer-picker">
        <label htmlFor="api-key-consumer">
          API consumer
        </label>
        <select
          id="api-key-consumer"
          value={selectedConsumerId ?? ""}
          onChange={(event) =>
            setSelectedConsumerId(
              event.currentTarget.value,
            )
          }
        >
          {consumerState.data.map((consumer) => (
            <option
              key={consumer.id}
              value={consumer.id}
            >
              {consumer.name} ({consumer.status})
            </option>
          ))}
        </select>
        <p>
          API keys are read only for the selected consumer.
          There is no global API-key listing endpoint.
        </p>
      </section>

      {apiKeyState.status === "idle" ? (
        <AdminResourceEmpty
          title="Select an API consumer"
          description="Choose a validated consumer to read API key metadata."
        />
      ) : null}

      {apiKeyState.status === "loading" ? (
        <AdminResourceLoading
          title="API key metadata"
          description="Loading safe API key metadata through the read-only Dashboard BFF."
        />
      ) : null}

      {apiKeyState.status === "error" ? (
        <AdminResourceError
          title="API key registry unavailable"
          error={apiKeyState.error}
          onRetry={retryApiKeys}
        />
      ) : null}

      {apiKeyState.status === "success" &&
      selectedConsumer ? (
        <ApiKeyRegistryContent
          consumer={selectedConsumer}
          apiKeys={apiKeyState.data}
        />
      ) : null}
    </div>
  );
}
