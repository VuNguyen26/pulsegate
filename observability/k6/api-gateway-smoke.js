import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.BASE_URL || "http://api-gateway:3000").replace(
  /\/+$/,
  "",
);

const gatewayHealthUrl = `${baseUrl}/health`;
const proxiedProductHealthUrl =
  `${baseUrl}/api/product-service/health`;

const requestParams = {
  timeout: "2s",
};

export const options = {
  setupTimeout: "30s",
  scenarios: {
    smoke: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 10,
      maxDuration: "30s",
      gracefulStop: "5s",
    },
  },
  thresholds: {
    "http_req_failed{phase:smoke}": ["rate==0"],
    "http_req_duration{phase:smoke}": ["p(95)<1000"],
    checks: ["rate==1"],
  },
};

export function setup() {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const response = http.get(gatewayHealthUrl, {
      ...requestParams,
      tags: {
        phase: "readiness",
      },
    });

    if (response.status === 200) {
      return;
    }

    sleep(1);
  }

  throw new Error(
    `API Gateway did not become ready: ${gatewayHealthUrl}`,
  );
}

export default function () {
  const response = http.get(proxiedProductHealthUrl, {
    ...requestParams,
    tags: {
      phase: "smoke",
    },
  });

  let reportsProductService = false;
  let reportsHealthyStatus = false;

  try {
    reportsProductService =
      response.json("service") === "product-service";

    reportsHealthyStatus =
      response.json("status") === "ok";
  } catch {
    reportsProductService = false;
    reportsHealthyStatus = false;
  }

  check(response, {
    "proxied health returns HTTP 200":
      (result) => result.status === 200,

    "proxied health reports product service":
      () => reportsProductService,

    "proxied health reports ok":
      () => reportsHealthyStatus,
  });
}
