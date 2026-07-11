export type DashboardRetentionCandidatePreview = {
  source: "usage" | "rejected";
  cutoffExclusive: string;
  retentionDays: 90;
  candidateCount: number;
  dryRunOnly: true;
  deleteAllowed: false;
};

export type DashboardRetentionPreview = {
  kind:
    "analytics-retention-admin-preview";
  generatedAt: string;
  configurationSource:
    "dashboard-observational-defaults";
  policy: {
    enabled: true;
    mode: "dry-run";
    source: "both";
    usageRetentionDays: 90;
    rejectedRetentionDays: 90;
  };
  candidates: {
    enabled: true;
    generatedAt: string;
    usage:
      DashboardRetentionCandidatePreview & {
        source: "usage";
      };
    rejected:
      DashboardRetentionCandidatePreview & {
        source: "rejected";
      };
  };
  readsCandidateCounts: true;
  dryRunOnly: true;
  deleteAllowed: false;
  importsDeleteRepository: false;
  executesRetention: false;
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value);

  return (
    actual.length === keys.length &&
    keys.every((key) =>
      Object.prototype.hasOwnProperty.call(
        value,
        key,
      ),
    )
  );
}

function isIsoTimestamp(
  value: unknown,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parsed = new Date(value);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString() === value
  );
}

function isCandidate(
  value: unknown,
  source: "usage" | "rejected",
  generatedAt: string,
): value is DashboardRetentionCandidatePreview {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "source",
      "cutoffExclusive",
      "retentionDays",
      "candidateCount",
      "dryRunOnly",
      "deleteAllowed",
    ]) ||
    value.source !== source ||
    !isIsoTimestamp(value.cutoffExclusive) ||
    value.retentionDays !== 90 ||
    typeof value.candidateCount !== "number" ||
    !Number.isSafeInteger(
      value.candidateCount,
    ) ||
    value.candidateCount < 0 ||
    value.dryRunOnly !== true ||
    value.deleteAllowed !== false
  ) {
    return false;
  }

  return (
    new Date(
      value.cutoffExclusive,
    ).getTime() <
    new Date(generatedAt).getTime()
  );
}

function isPolicy(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "enabled",
      "mode",
      "source",
      "usageRetentionDays",
      "rejectedRetentionDays",
    ]) &&
    value.enabled === true &&
    value.mode === "dry-run" &&
    value.source === "both" &&
    value.usageRetentionDays === 90 &&
    value.rejectedRetentionDays === 90
  );
}

function isCandidates(
  value: unknown,
  generatedAt: string,
): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "enabled",
      "generatedAt",
      "usage",
      "rejected",
    ]) &&
    value.enabled === true &&
    value.generatedAt === generatedAt &&
    isCandidate(
      value.usage,
      "usage",
      generatedAt,
    ) &&
    isCandidate(
      value.rejected,
      "rejected",
      generatedAt,
    )
  );
}

export function isDashboardRetentionPreview(
  value: unknown,
): value is DashboardRetentionPreview {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "kind",
      "generatedAt",
      "configurationSource",
      "policy",
      "candidates",
      "readsCandidateCounts",
      "dryRunOnly",
      "deleteAllowed",
      "importsDeleteRepository",
      "executesRetention",
    ]) ||
    value.kind !==
      "analytics-retention-admin-preview" ||
    !isIsoTimestamp(value.generatedAt) ||
    value.configurationSource !==
      "dashboard-observational-defaults" ||
    value.readsCandidateCounts !== true ||
    value.dryRunOnly !== true ||
    value.deleteAllowed !== false ||
    value.importsDeleteRepository !==
      false ||
    value.executesRetention !== false
  ) {
    return false;
  }

  return (
    isPolicy(value.policy) &&
    isCandidates(
      value.candidates,
      value.generatedAt,
    )
  );
}