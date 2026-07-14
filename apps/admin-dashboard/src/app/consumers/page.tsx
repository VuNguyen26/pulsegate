import type { Metadata } from "next";

import {
  ConsumerListPanel,
} from "../../components/consumer-list-panel";
import {
  RegistryWorkspace,
  type RegistryWorkspaceCapability,
  type RegistryWorkspaceStep,
} from "../../components/registry-workspace";

export const metadata: Metadata = {
  title: "Consumers",
};

const steps: readonly RegistryWorkspaceStep[] = [
  {
    label: "Identify",
    title: "Consumer registry record",
    detail: "Start with a bounded identity, lifecycle status, and audit metadata.",
  },
  {
    label: "Associate",
    title: "Consumer-scoped API keys",
    detail: "Key metadata is reached through an explicit consumer ownership boundary.",
  },
  {
    label: "Measure",
    title: "Plan and usage context",
    detail: "Quota and analytics views preserve the same consumer identity.",
  },
];

const capabilities: readonly RegistryWorkspaceCapability[] = [
  {
    icon: "identity",
    eyebrow: "Registry identity",
    title: "Named consumers",
    description:
      "Review the product-facing identity that groups credentials, quota context, and usage evidence.",
  },
  {
    icon: "ownership",
    eyebrow: "Credential ownership",
    title: "Scoped relationships",
    description:
      "API key metadata is never loaded globally; it is read through a selected and validated consumer.",
  },
  {
    icon: "status",
    eyebrow: "Lifecycle state",
    title: "Active or disabled",
    description:
      "Consumer status remains prominent so operational reviews can distinguish configured identity from usable identity.",
  },
  {
    icon: "audit",
    eyebrow: "Change evidence",
    title: "Created and updated by",
    description:
      "Actor and timestamp fields keep each registry record explainable without enabling edits in the public surface.",
  },
];

export default function ConsumersPage() {
  return (
    <RegistryWorkspace
      tone="consumers"
      eyebrow="Identity control plane"
      title="Understand who is allowed to consume APIs."
      description="Review consumer identity, lifecycle status, credential ownership, and audit evidence as one bounded registry instead of a flat administrative table."
      badges={[
        "Bounded identities",
        "Credential ownership",
        "Read-only registry",
      ]}
      previewLabel="Identity relationship"
      previewTitle="Consumer / partner-mobile"
      steps={steps}
      capabilities={capabilities}
      boundaryTitle="Identity inspection without account administration"
      boundaryItems={[
        "No consumer create, update, or disable action",
        "No browser-visible administrative credential",
        "No public developer-account mapping",
      ]}
    >
      <ConsumerListPanel />
    </RegistryWorkspace>
  );
}
