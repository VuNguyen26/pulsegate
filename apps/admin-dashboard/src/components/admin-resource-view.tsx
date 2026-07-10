"use client";

import type { ReactNode } from "react";

import type {
  DashboardAdminResourceError,
} from "@/lib/admin-resource-contract";

export function AdminResourceLoading({
  title,
  description = "Loading the latest read-only resource data.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <section
      className="content-card"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="eyebrow">Loading</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export function AdminResourceEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="content-card" aria-live="polite">
      <p className="eyebrow">Empty</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export function AdminResourceError({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: DashboardAdminResourceError;
  onRetry: () => void;
}) {
  return (
    <section className="content-card" aria-live="polite">
      <p className="eyebrow">Unavailable</p>
      <h2>{title}</h2>
      <p>{error.message}</p>

      <dl className="runtime-facts">
        <div>
          <dt>Error code</dt>
          <dd>
            <code>{error.code}</code>
          </dd>
        </div>

        {error.requestId ? (
          <div>
            <dt>Request ID</dt>
            <dd>
              <code>{error.requestId}</code>
            </dd>
          </div>
        ) : null}
      </dl>

      <button
        className="secondary-button"
        type="button"
        onClick={onRetry}
      >
        Retry
      </button>
    </section>
  );
}

export type AdminResourceColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

export function AdminResourceTable<T>({
  caption,
  columns,
  rows,
  getRowKey,
}: {
  caption: string;
  columns: readonly AdminResourceColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
}) {
  return (
    <div className="content-card admin-resource-table-wrap">
      <table className="admin-resource-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
