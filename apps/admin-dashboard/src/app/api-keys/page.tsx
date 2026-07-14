import type { Metadata } from "next";

import {
  ApiKeyListPanel,
} from "../../components/api-key-list-panel";
import {
  RegistryWorkspace,
  type RegistryWorkspaceCapability,
  type RegistryWorkspaceStep,
} from "../../components/registry-workspace";

export const metadata: Metadata = {
  title: "API Keys",
};

const steps: readonly RegistryWorkspaceStep[] = [
  {
    label: "Scope",
    title: "Select a validated consumer",
    detail: "The read path begins at ownership instead of exposing a global key registry.",
  },
  {
    label: "Redact",
    title: "Return safe key metadata",
    detail: "Only name, prefix, state, plan, expiry, use, and audit context are rendered.",
  },
  {
    label: "Evaluate",
    title: "Connect lifecycle and quota",
    detail: "Review assignment, expiration, last use, and revocation without revealing key material.",
  },
];

const capabilities: readonly RegistryWorkspaceCapability[] = [
  {
    icon: "key",
    eyebrow: "Consumer scope",
    title: "Owned credentials",
    description:
      "Every public key read starts from a selected consumer, preserving the credential ownership boundary.",
  },
  {
    icon: "redact",
    eyebrow: "Secret safety",
    title: "Prefixes, never raw keys",
    description:
      "The Dashboard renders a safe key prefix and lifecycle metadata while raw values and hashes remain unavailable.",
  },
  {
    icon: "quota",
    eyebrow: "Plan context",
    title: "Usage-plan assignment",
    description:
      "Inspect the quota plan associated with each key before moving into the dedicated usage and quota views.",
  },
  {
    icon: "audit",
    eyebrow: "Lifecycle evidence",
    title: "Use and revocation history",
    description:
      "Created, last-used, expiration, and revocation timestamps provide operational context without mutation controls.",
  },
];

export default function ApiKeysPage() {
  return (
    <RegistryWorkspace
      tone="keys"
      eyebrow="Credential security plane"
      title="Review credential posture without exposing secrets."
      description="Inspect consumer-scoped API key metadata, lifecycle state, quota assignment, and audit history through a server-only boundary designed to keep raw credentials out of the browser."
      badges={[
        "Consumer scoped",
        "Secret redaction",
        "Lifecycle evidence",
      ]}
      previewLabel="Credential read path"
      previewTitle="partner-mobile / mobile-prod"
      steps={steps}
      capabilities={capabilities}
      boundaryTitle="Metadata visibility with secret material withheld"
      boundaryItems={[
        "No raw API key or key hash is rendered",
        "No create, rotate, revoke, or reveal action",
        "No global key-listing endpoint",
      ]}
    >
      <ApiKeyListPanel />
    </RegistryWorkspace>
  );
}
