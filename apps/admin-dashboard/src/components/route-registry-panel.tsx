"use client";

import {
  buildRouteRowKey,
  formatRouteRequestHost,
} from "../lib/route-host";
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
  countEnabledRoutePolicies,
  formatDashboardRouteTimestamp,
  loadDashboardRoute,
  loadDashboardRouteRuntime,
  loadDashboardRoutes,
  summarizeDashboardRoutes,
  type DashboardPersistedRoute,
  type DashboardRouteRuntimeSnapshot,
  type DashboardRuntimeRoute,
} from "../lib/routes";

type RouteListState =
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardPersistedRoute[]
    >;

type RouteDetailState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardPersistedRoute
    >;

type RuntimeState =
  | {
      status: "loading";
    }
  | DashboardAdminResourceLoadResult<
      DashboardRouteRuntimeSnapshot
    >;

function formatBoolean(value: boolean): string {
  return value ? "Enabled" : "Disabled";
}

function formatRouteUpstreamMode(
  route: DashboardPersistedRoute,
): string {
  const targetCount =
    route.weightedUpstreams?.length ?? 0;

  return targetCount > 0
    ? `Weighted routing (${targetCount} targets)`
    : "Single upstream";
}

const persistedColumns:
  readonly AdminResourceColumn<DashboardPersistedRoute>[] = [
    {
      key: "route",
      header: "Persisted route",
      render: (route) => (
        <div className="route-name-cell">
          <strong>
            {route.method} {route.gatewayPath}{" Â· "}{formatRouteRequestHost(route.requestHost)}
          </strong>
          <code>{route.id}</code>
          <small>{route.serviceName}</small>
        </div>
      ),
    },
    {
      key: "downstream",
      header: "Downstream",
      render: (route) => (
        <div className="route-downstream-cell">
          <code>{route.downstreamUrl}</code>
          <small>{formatRouteUpstreamMode(route)}</small>
          <small>Priority {route.priority}</small>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (route) => (
        <span
          className="route-status-pill"
          data-status={
            route.enabled
              ? "enabled"
              : "disabled"
          }
        >
          {route.enabled ? "ENABLED" : "DISABLED"}
        </span>
      ),
    },
    {
      key: "policies",
      header: "Policies",
      render: (route) => (
        <div className="route-policy-count">
          <strong>
            {countEnabledRoutePolicies(route)}
          </strong>
          <span>enabled groups</span>
        </div>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (route) => (
        <div className="route-audit-cell">
          <time dateTime={route.updatedAt}>
            {formatDashboardRouteTimestamp(
              route.updatedAt,
            )}
          </time>
          <small>
            by {route.updatedBy ?? "unknown actor"}
          </small>
        </div>
      ),
    },
  ];

const runtimeColumns:
  readonly AdminResourceColumn<DashboardRuntimeRoute>[] = [
    {
      key: "route",
      header: "Loaded route",
      render: (route) => (
        <strong>
          {route.method} {route.gatewayPath}{" Â· "}{formatRouteRequestHost(route.requestHost)}
        </strong>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (route) => route.serviceName,
    },
  ];

export function RouteRegistrySummary({
  routes,
}: {
  routes: readonly DashboardPersistedRoute[];
}) {
  const summary = summarizeDashboardRoutes(routes);

  return (
    <section
      className="route-registry-summary"
      aria-label="Persisted route registry summary"
    >
      <article className="route-summary-item">
        <strong>{summary.total}</strong>
        <span>Persisted routes</span>
      </article>
      <article className="route-summary-item">
        <strong>{summary.enabled}</strong>
        <span>Enabled</span>
      </article>
      <article className="route-summary-item">
        <strong>{summary.disabled}</strong>
        <span>Disabled</span>
      </article>
      <article className="route-summary-item">
        <strong>{summary.apiKeyProtected}</strong>
        <span>API key protected</span>
      </article>
      <article className="route-summary-item">
        <strong>{summary.jwtProtected}</strong>
        <span>JWT protected</span>
      </article>
    </section>
  );
}

function PolicyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function PersistedRouteDetail({
  route,
}: {
  route: DashboardPersistedRoute;
}) {
  const requestHeaderAdds = Object.keys(
    route.policies.requestTransform.addHeaders ?? {},
  ).length;
  const requestHeaderRemovals =
    route.policies.requestTransform.removeHeaders
      ?.length ?? 0;
  const responseHeaderAdds = Object.keys(
    route.policies.responseTransform.addHeaders ?? {},
  ).length;
  const responseHeaderRemovals =
    route.policies.responseTransform.removeHeaders
      ?.length ?? 0;

  return (
    <section
      className="content-card route-detail"
      aria-labelledby="route-detail-title"
    >
      <div>
        <p className="eyebrow">
          Persisted configuration
        </p>
        <h2 id="route-detail-title">
          {route.method} {route.gatewayPath}{" Â· "}{formatRouteRequestHost(route.requestHost)}
        </h2>
        <p>
          Database-backed route configuration. This is
          distinct from the currently loaded runtime snapshot.
        </p>
      </div>

      <dl className="route-detail-grid">
        <PolicyValue label="Route ID" value={route.id} />
        <PolicyValue
          label="Service"
          value={route.serviceName}
        />
        <PolicyValue
          label="Downstream URL"
          value={route.downstreamUrl}
        />
        <PolicyValue
          label="Routing mode"
          value={formatRouteUpstreamMode(route)}
        />
        {route.weightedUpstreams?.map(
          (upstream, index) => (
            <PolicyValue
              key={upstream.downstreamUrl}
              label={`Weighted target ${index + 1}`}
              value={`${upstream.downstreamUrl} - weight ${upstream.weight}`}
            />
          ),
        )}
        <PolicyValue
          label="Priority"
          value={String(route.priority)}
        />
        <PolicyValue
          label="Status"
          value={formatBoolean(route.enabled)}
        />
        <PolicyValue
          label="API key auth"
          value={formatBoolean(
            route.policies.auth.requireApiKey,
          )}
        />
        <PolicyValue
          label="JWT auth"
          value={formatBoolean(
            route.policies.auth.requireJwt,
          )}
        />
        <PolicyValue
          label="Timeout"
          value={
            route.policies.timeout.enabled
              ? `${route.policies.timeout.timeoutMs} ms`
              : "Disabled"
          }
        />
        <PolicyValue
          label="Cache"
          value={
            route.policies.cache.enabled
              ? `${route.policies.cache.ttlSeconds} seconds`
              : "Disabled"
          }
        />
        <PolicyValue
          label="Rate limit"
          value={
            route.policies.rateLimit.enabled
              ? `${route.policies.rateLimit.limit} per ${route.policies.rateLimit.windowMs} ms`
              : "Disabled"
          }
        />
        <PolicyValue
          label="Request transform"
          value={
            route.policies.requestTransform.enabled
              ? `${requestHeaderAdds} add / ${requestHeaderRemovals} remove`
              : "Disabled"
          }
        />
        <PolicyValue
          label="Response transform"
          value={
            route.policies.responseTransform.enabled
              ? `${responseHeaderAdds} add / ${responseHeaderRemovals} remove`
              : "Disabled"
          }
        />
        <PolicyValue
          label="Retry"
          value={
            route.policies.retry.enabled
              ? `${route.policies.retry.attempts} attempts on ${route.policies.retry.retryOnStatuses.join(", ")}`
              : "Disabled"
          }
        />
        <PolicyValue
          label="Created"
          value={formatDashboardRouteTimestamp(
            route.createdAt,
          )}
        />
        <PolicyValue
          label="Created by"
          value={route.createdBy ?? "unknown actor"}
        />
        <PolicyValue
          label="Updated"
          value={formatDashboardRouteTimestamp(
            route.updatedAt,
          )}
        />
        <PolicyValue
          label="Updated by"
          value={route.updatedBy ?? "unknown actor"}
        />
      </dl>

      <p className="route-read-only-note">
        This checkpoint cannot create, update, delete, or
        reload routes.
      </p>
    </section>
  );
}

export function RouteRuntimeSnapshotView({
  snapshot,
}: {
  snapshot: DashboardRouteRuntimeSnapshot;
}) {
  if (!snapshot.available) {
    return (
      <AdminResourceEmpty
        title="Runtime registry unavailable"
        description="The Gateway did not expose a loaded runtime route snapshot."
      />
    );
  }

  return (
    <section
      className="page-stack"
      aria-labelledby="runtime-route-title"
    >
      <div className="content-card route-runtime-header">
        <div>
          <p className="eyebrow">
            Runtime registry
          </p>
          <h2 id="runtime-route-title">
            Currently loaded routes
          </h2>
          <p>
            This snapshot is operational runtime state, not
            the persisted route configuration list.
          </p>
        </div>

        <dl className="route-runtime-facts">
          <div>
            <dt>Version</dt>
            <dd>{snapshot.version}</dd>
          </div>
          <div>
            <dt>Route count</dt>
            <dd>{snapshot.routeCount}</dd>
          </div>
          <div>
            <dt>Loaded at</dt>
            <dd>
              {snapshot.loadedAt
                ? formatDashboardRouteTimestamp(
                    snapshot.loadedAt,
                  )
                : "Unavailable"}
            </dd>
          </div>
        </dl>
      </div>

      {snapshot.routes.length === 0 ? (
        <AdminResourceEmpty
          title="No runtime routes loaded"
          description="The runtime registry is available but currently contains no routes."
        />
      ) : (
        <AdminResourceTable
          caption="Runtime route registry snapshot"
          columns={runtimeColumns}
          rows={snapshot.routes}
          getRowKey={(route) =>
            buildRouteRowKey(route)
          }
        />
      )}
    </section>
  );
}

export function RouteRegistryPanel() {
  const [listRefreshToken, setListRefreshToken] =
    useState(0);
  const [detailRefreshToken, setDetailRefreshToken] =
    useState(0);
  const [runtimeRefreshToken, setRuntimeRefreshToken] =
    useState(0);
  const [listState, setListState] =
    useState<RouteListState>({
      status: "loading",
    });
  const [detailState, setDetailState] =
    useState<RouteDetailState>({
      status: "idle",
    });
  const [runtimeState, setRuntimeState] =
    useState<RuntimeState>({
      status: "loading",
    });
  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void loadDashboardRoutes(
      fetch,
      controller.signal,
    ).then((result) => {
      if (!active) {
        return;
      }

      setListState(result);

      if (result.status === "success") {
        setSelectedRouteId((current) => {
          if (
            current &&
            result.data.some(
              (route) => route.id === current,
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

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void loadDashboardRouteRuntime(
      fetch,
      controller.signal,
    ).then((result) => {
      if (active) {
        setRuntimeState(result);
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [runtimeRefreshToken]);

  const selectedRoute = useMemo(() => {
    if (
      listState.status !== "success" ||
      !selectedRouteId
    ) {
      return null;
    }

    return (
      listState.data.find(
        (route) => route.id === selectedRouteId,
      ) ?? null
    );
  }, [listState, selectedRouteId]);

  useEffect(() => {
    if (!selectedRoute) {
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

    void loadDashboardRoute(
      selectedRoute.id,
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
  }, [selectedRoute, detailRefreshToken]);

  function retryList() {
    setListState({
      status: "loading",
    });
    setDetailState({
      status: "idle",
    });
    setSelectedRouteId(null);
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

  function retryRuntime() {
    setRuntimeState({
      status: "loading",
    });
    setRuntimeRefreshToken(
      (current) => current + 1,
    );
  }

  return (
    <div className="page-stack">
      <section
        className="page-stack"
        aria-labelledby="persisted-route-title"
      >
        <div className="content-card route-section-header">
          <p className="eyebrow">
            Persisted configuration
          </p>
          <h2 id="persisted-route-title">
            Route registry
          </h2>
          <p>
            Read database-backed route records and policy
            configuration through a bounded GET-only BFF.
          </p>
        </div>

        {listState.status === "loading" ? (
          <AdminResourceLoading
            title="Persisted route registry"
            description="Loading bounded route configuration through the read-only Dashboard BFF."
          />
        ) : null}

        {listState.status === "error" ? (
          <AdminResourceError
            title="Persisted route registry unavailable"
            error={listState.error}
            onRetry={retryList}
          />
        ) : null}

        {listState.status === "success" &&
        listState.data.length === 0 ? (
          <AdminResourceEmpty
            title="No persisted routes configured"
            description="PulseGate did not return any persisted route configuration."
          />
        ) : null}

        {listState.status === "success" &&
        listState.data.length > 0 ? (
          <>
            <RouteRegistrySummary
              routes={listState.data}
            />

            <section className="content-card route-picker">
              <label htmlFor="route-select">
                Persisted route detail
              </label>
              <select
                id="route-select"
                value={selectedRouteId ?? ""}
                onChange={(event) =>
                  setSelectedRouteId(
                    event.currentTarget.value,
                  )
                }
              >
                {listState.data.map((route) => (
                  <option
                    key={route.id}
                    value={route.id}
                  >
                    {route.method} {route.gatewayPath}{" Â· "}{formatRouteRequestHost(route.requestHost)}
                  </option>
                ))}
              </select>
              <p>
                Select one validated route ID to load its
                fixed persisted detail endpoint.
              </p>
            </section>

            <AdminResourceTable
              caption="Persisted route configuration"
              columns={persistedColumns}
              rows={listState.data}
              getRowKey={(route) => route.id}
            />

            {detailState.status === "loading" ? (
              <AdminResourceLoading
                title="Persisted route detail"
                description="Loading the selected route and its policy configuration."
              />
            ) : null}

            {detailState.status === "error" ? (
              <AdminResourceError
                title="Persisted route detail unavailable"
                error={detailState.error}
                onRetry={retryDetail}
              />
            ) : null}

            {detailState.status === "success" ? (
              <PersistedRouteDetail
                route={detailState.data}
              />
            ) : null}
          </>
        ) : null}
      </section>

      <section
        className="page-stack route-runtime-section"
        aria-label="Runtime route registry section"
      >
        {runtimeState.status === "loading" ? (
          <AdminResourceLoading
            title="Runtime route registry"
            description="Loading the separate Gateway runtime snapshot."
          />
        ) : null}

        {runtimeState.status === "error" ? (
          <AdminResourceError
            title="Runtime route registry unavailable"
            error={runtimeState.error}
            onRetry={retryRuntime}
          />
        ) : null}

        {runtimeState.status === "success" ? (
          <RouteRuntimeSnapshotView
            snapshot={runtimeState.data}
          />
        ) : null}
      </section>
    </div>
  );
}
