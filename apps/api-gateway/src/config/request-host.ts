import { isIP } from "node:net";

const MAX_HOST_LENGTH = 253;
const MAX_DNS_LABEL_LENGTH = 63;
const PORT_PATTERN = /^[0-9]{1,5}$/;
const DNS_LABEL_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const SPACE_OR_CONTROL_PATTERN = /[\u0000-\u0020\u007f]/;

export type RequestHostParseResult =
  | {
      ok: true;
      requestHost: string;
    }
  | {
      ok: false;
      reason: string;
    };

function invalidRequestHost(reason: string): RequestHostParseResult {
  return {
    ok: false,
    reason,
  };
}

function validatePort(port: string): string | null {
  if (!PORT_PATTERN.test(port)) {
    return "port must contain only decimal digits";
  }

  const parsedPort = Number(port);

  if (parsedPort < 1 || parsedPort > 65_535) {
    return "port must be between 1 and 65535";
  }

  return null;
}

function normalizeDnsOrIpv4Host(
  rawHostname: string,
): RequestHostParseResult {
  let hostname = rawHostname;

  if (hostname.endsWith(".")) {
    hostname = hostname.slice(0, -1);
  }

  if (!hostname || hostname.endsWith(".")) {
    return invalidRequestHost(
      "hostname must contain at most one trailing dot",
    );
  }

  const normalizedHostname = hostname.toLowerCase();

  if (isIP(normalizedHostname) === 4) {
    return {
      ok: true,
      requestHost: normalizedHostname,
    };
  }

  if (isIP(normalizedHostname) !== 0) {
    return invalidRequestHost(
      "IPv6 hosts must use bracket notation",
    );
  }

  if (normalizedHostname.length > MAX_HOST_LENGTH) {
    return invalidRequestHost(
      `hostname must not exceed ${MAX_HOST_LENGTH} characters`,
    );
  }

  const labels = normalizedHostname.split(".");

  if (
    labels.some(
      (label) =>
        !label ||
        label.length > MAX_DNS_LABEL_LENGTH ||
        !DNS_LABEL_PATTERN.test(label),
    )
  ) {
    return invalidRequestHost(
      "hostname contains an invalid DNS label",
    );
  }

  return {
    ok: true,
    requestHost: normalizedHostname,
  };
}

function normalizeRequestHostAuthority(
  value: string,
  allowPort: boolean,
): RequestHostParseResult {
  if (!value) {
    return invalidRequestHost("host is required");
  }

  if (
    value !== value.trim() ||
    SPACE_OR_CONTROL_PATTERN.test(value)
  ) {
    return invalidRequestHost(
      "host must not contain whitespace or control characters",
    );
  }

  if (value.includes(",")) {
    return invalidRequestHost(
      "host must contain exactly one authority value",
    );
  }

  if (
    value.includes("@") ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#")
  ) {
    return invalidRequestHost(
      "host must not contain user-info, path, query, or fragment data",
    );
  }

  if (value.includes("*")) {
    return invalidRequestHost(
      "wildcard host conditions are not supported",
    );
  }

  if (value.startsWith("[")) {
    const closingBracketIndex = value.indexOf("]");

    if (closingBracketIndex < 0) {
      return invalidRequestHost(
        "bracketed IPv6 host is missing a closing bracket",
      );
    }

    const bracketedHost = value.slice(
      0,
      closingBracketIndex + 1,
    );
    const ipv6Address = value.slice(1, closingBracketIndex);
    const remainder = value.slice(closingBracketIndex + 1);

    if (isIP(ipv6Address) !== 6) {
      return invalidRequestHost(
        "bracketed host must contain a valid IPv6 address",
      );
    }

    if (remainder) {
      if (!allowPort || !remainder.startsWith(":")) {
        return invalidRequestHost(
          "configured requestHost must not include a port",
        );
      }

      const portError = validatePort(remainder.slice(1));

      if (portError) {
        return invalidRequestHost(portError);
      }
    }

    try {
      const parsedUrl = new URL(
        `http://${bracketedHost}${remainder}`,
      );

      return {
        ok: true,
        requestHost: parsedUrl.hostname.toLowerCase(),
      };
    } catch {
      return invalidRequestHost(
        "host must contain a valid IPv6 authority",
      );
    }
  }

  if (value.includes("[") || value.includes("]")) {
    return invalidRequestHost(
      "IPv6 brackets must surround the complete address",
    );
  }

  const colonMatches = value.match(/:/g) ?? [];
  let hostname = value;

  if (colonMatches.length > 0) {
    if (!allowPort || colonMatches.length !== 1) {
      return invalidRequestHost(
        allowPort
          ? "IPv6 hosts must use bracket notation"
          : "configured requestHost must not include a port",
      );
    }

    const separatorIndex = value.lastIndexOf(":");
    hostname = value.slice(0, separatorIndex);

    const portError = validatePort(
      value.slice(separatorIndex + 1),
    );

    if (portError) {
      return invalidRequestHost(portError);
    }
  }

  return normalizeDnsOrIpv4Host(hostname);
}

export function parseRequestHostHeader(
  value: unknown,
): RequestHostParseResult {
  if (typeof value !== "string") {
    return invalidRequestHost(
      "Host header must be present as a single string",
    );
  }

  return normalizeRequestHostAuthority(value, true);
}

export function normalizeConfiguredRequestHost(
  value: string,
): string {
  const result = normalizeRequestHostAuthority(value, false);

  if (!result.ok) {
    throw new Error(`requestHost ${result.reason}`);
  }

  return result.requestHost;
}