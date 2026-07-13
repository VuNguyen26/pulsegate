import { describe, expect, it } from "vitest";

import {
  buildProductErrorLogPayload,
} from "./logging.js";

describe("bounded Product Service error logging", () => {
  it("uses only bounded operational fields", () => {
    const payload =
      buildProductErrorLogPayload("request-1");

    expect(payload).toEqual({
      event: "product_request_failed",
      requestId: "request-1",
      errorCode: "INTERNAL_SERVER_ERROR",
    });

    expect(JSON.stringify(payload)).not.toContain(
      "secret exception detail",
    );
  });
});