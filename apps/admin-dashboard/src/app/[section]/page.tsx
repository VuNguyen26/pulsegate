import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  dashboardNavigation,
  findNavigationItem,
} from "@/lib/navigation";

type PlannedSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export function generateStaticParams() {
  return dashboardNavigation
    .filter(
      (item) =>
        item.href !== "/" &&
        item.href !== "/consumers" &&
        item.href !== "/api-keys" &&
        item.href !== "/usage-plans" &&
        item.href !== "/routes" &&
        item.href !== "/usage-analytics",
    )
    .map((item) => ({
      section: item.href.slice(1),
    }));
}

export async function generateMetadata({
  params,
}: PlannedSectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const item = findNavigationItem(`/${section}`);

  return {
    title: item?.label ?? "Not found",
  };
}

export default async function PlannedSectionPage({
  params,
}: PlannedSectionPageProps) {
  const { section } = await params;
  const item = findNavigationItem(`/${section}`);

  if (!item || item.href === "/") {
    notFound();
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Planned for Sprint {item.plannedSprint}
        </p>
        <h1>{item.label}</h1>
        <p>{item.description}</p>
      </header>

      <article className="content-card">
        <h2>Foundation placeholder</h2>
        <p>
          This section intentionally contains no fake data or mutation
          controls. Its implementation remains assigned to the stated
          roadmap sprint.
        </p>
      </article>
    </section>
  );
}