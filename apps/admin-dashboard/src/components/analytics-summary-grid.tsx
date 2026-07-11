import type { ReactNode } from "react";

export type AnalyticsSummaryItem = {
  key: string;
  label: string;
  value: ReactNode;
  description?: string;
  tone?: "default" | "warning" | "danger";
};

export function AnalyticsSummaryGrid({
  label,
  items,
}: {
  label: string;
  items: readonly AnalyticsSummaryItem[];
}) {
  return (
    <section
      className="analytics-summary-grid"
      aria-label={label}
    >
      {items.map((item) => (
        <article
          className="analytics-summary-item"
          data-tone={item.tone ?? "default"}
          key={item.key}
        >
          <strong>{item.value}</strong>
          <span>{item.label}</span>
          {item.description ? (
            <small>{item.description}</small>
          ) : null}
        </article>
      ))}
    </section>
  );
}
