import type { Metadata } from "next";

import {
  RegistryWorkspace,
  type RegistryWorkspaceCapability,
  type RegistryWorkspaceStep,
} from "../../components/registry-workspace";
import {
  UsagePlanListPanel,
} from "../../components/usage-plan-list-panel";

export const metadata: Metadata = {
  title: "Usage Plans",
};

const steps: readonly RegistryWorkspaceStep[] = [
  {
    label: "Select",
    title: "Persisted usage plan",
    detail: "Choose a validated plan and load its fixed read-only detail endpoint.",
  },
  {
    label: "Evaluate",
    title: "Limit and quota window",
    detail: "Read the request allowance together with the daily or monthly enforcement window.",
  },
  {
    label: "Explain",
    title: "Status and audit context",
    detail: "Connect enabled state, description, timestamps, and responsible actors.",
  },
];

const capabilities: readonly RegistryWorkspaceCapability[] = [
  {
    icon: "quota",
    eyebrow: "Allowance",
    title: "Explicit request limits",
    description:
      "Quota values are presented as operator-readable policy rather than as disconnected numeric fields.",
  },
  {
    icon: "window",
    eyebrow: "Enforcement period",
    title: "Daily and monthly windows",
    description:
      "The configured quota window remains visible beside the limit so the policy can be interpreted correctly.",
  },
  {
    icon: "status",
    eyebrow: "Runtime intent",
    title: "Enabled-state clarity",
    description:
      "Active and disabled plans are separated visually without implying that the public Dashboard can change them.",
  },
  {
    icon: "audit",
    eyebrow: "Configuration history",
    title: "Persisted audit trail",
    description:
      "Created and updated metadata keeps plan configuration reviewable across product and operations conversations.",
  },
];

export default function UsagePlansPage() {
  return (
    <RegistryWorkspace
      tone="plans"
      eyebrow="Quota policy plane"
      title="Read quota policy as an enforceable product contract."
      description="Connect each plan's request allowance, enforcement window, lifecycle state, and audit history in one operator workspace built for review rather than mutation."
      badges={[
        "Persisted policy",
        "Quota windows",
        "Read-only detail",
      ]}
      previewLabel="Quota evaluation"
      previewTitle="standard-monthly"
      steps={steps}
      capabilities={capabilities}
      boundaryTitle="Policy review without enforcement mutation"
      boundaryItems={[
        "No plan create, update, enable, or disable action",
        "No quota reset or counter mutation",
        "No change to Gateway enforcement behavior",
      ]}
    >
      <UsagePlanListPanel />
    </RegistryWorkspace>
  );
}
