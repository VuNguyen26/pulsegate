import type { Metadata } from "next";

import {
  ApiKeyListPanel,
} from "@/components/api-key-list-panel";

export const metadata: Metadata = {
  title: "API Keys",
};

export default function ApiKeysPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Sprint 62 - Consumer-scoped read view
        </p>
        <h1>API keys</h1>
        <p>
          Review safe API key metadata for one validated
          consumer at a time. Raw keys and key hashes are
          never exposed by this read-only Dashboard view.
        </p>
      </header>

      <ApiKeyListPanel />
    </section>
  );
}
