"use client";

import { useEffect, useState } from "react";

import {
  loadDashboardRuntimeStatus,
  type DashboardRuntimeStatusState,
} from "../lib/runtime-status";

type RuntimePanelState =
  | {
      status: "loading";
    }
  | DashboardRuntimeStatusState;

export function RuntimeStatusPanel() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] =
    useState<RuntimePanelState>({
      status: "loading",
    });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void loadDashboardRuntimeStatus(
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
      <section
        className="runtime-panel content-card"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="runtime-panel-heading">
          <div>
            <p className="eyebrow">Server-only boundary</p>
            <h2>Gateway connectivity</h2>
          </div>

          <span
            className="status-badge"
            data-status="loading"
          >
            Checking
          </span>
        </div>

        <p>
          Reading safe runtime metadata through the Dashboard
          BFF.
        </p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section
        className="runtime-panel content-card"
        aria-live="polite"
      >
        <div className="runtime-panel-heading">
          <div>
            <p className="eyebrow">Server-only boundary</p>
            <h2>Gateway connectivity</h2>
          </div>

          <span
            className="status-badge"
            data-status="error"
          >
            Unavailable
          </span>
        </div>

        <p>{state.error.message}</p>

        <dl className="runtime-facts">
          <div>
            <dt>Error code</dt>
            <dd>
              <code>{state.error.code}</code>
            </dd>
          </div>

          {state.error.requestId ? (
            <div>
              <dt>Request ID</dt>
              <dd>
                <code>{state.error.requestId}</code>
              </dd>
            </div>
          ) : null}
        </dl>

        <button
          className="secondary-button"
          type="button"
          onClick={retry}
        >
          Retry connection
        </button>
      </section>
    );
  }

  const { accessMode, runtime } = state.data;
  const runtimeAvailable = runtime.available;

  return (
    <section
      className="runtime-panel content-card"
      aria-live="polite"
    >
      <div className="runtime-panel-heading">
        <div>
          <p className="eyebrow">Server-only boundary</p>
          <h2>Gateway connectivity</h2>
        </div>

        <span
          className="status-badge"
          data-status={
            runtimeAvailable
              ? "connected"
              : "unavailable"
          }
        >
          {runtimeAvailable
            ? "Connected"
            : "Registry unavailable"}
        </span>
      </div>

      <p>
        The browser receives runtime metadata only. The Admin
        API credential remains inside the Dashboard server
        runtime.
      </p>

      <dl className="runtime-facts">
        <div>
          <dt>Access mode</dt>
          <dd>{accessMode}</dd>
        </div>

        <div>
          <dt>Runtime mode</dt>
          <dd>{runtime.mode}</dd>
        </div>

        <div>
          <dt>Loaded version</dt>
          <dd>{runtime.version ?? "Not loaded"}</dd>
        </div>

        <div>
          <dt>Registered routes</dt>
          <dd>{runtime.routeCount}</dd>
        </div>

        <div>
          <dt>Loaded at</dt>
          <dd>
            {runtime.loadedAt ? (
              <time dateTime={runtime.loadedAt}>
                {runtime.loadedAt}
              </time>
            ) : (
              "Not reported"
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
