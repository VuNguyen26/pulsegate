import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ServiceDiscoverySnapshot,
} from "../config/service-discovery.js";
import {
  MAX_SERVICE_INSTANCE_HEALTH_ENTRY_COUNT,
  SERVICE_INSTANCE_COOLDOWN_MS,
  createServiceInstanceHealthRegistry,
} from "./service-instance-health-registry.js";

function createSnapshot(
  services: Array<{
    serviceName: string;
    baseUrls: string[];
  }> = [
    {
      serviceName: "product-service",
      baseUrls: [
        "http://product-a:3001",
        "http://product-b:3001",
      ],
    },
  ],
): ServiceDiscoverySnapshot {
  return {
    serviceCount: services.length,
    services: services.map(
      (service) => ({
        serviceName:
          service.serviceName,
        instances:
          service.baseUrls.map(
            (baseUrl) => ({
              baseUrl,
            }),
          ),
      }),
    ),
  };
}

describe(
  "service instance health registry",
  () => {
    it(
      "initializes configured instances as healthy and eligible",
      () => {
        const registry =
          createServiceInstanceHealthRegistry({
            initialSnapshot:
              createSnapshot(),
          });

        const snapshot =
          registry.getSnapshot();

        expect(snapshot.entryCount).toBe(2);
        expect(snapshot.entries).toEqual([
          {
            serviceName:
              "product-service",
            baseUrl:
              "http://product-a:3001",
            state: "healthy",
            eligible: true,
            consecutiveFailures: 0,
            cooldownUntil: null,
          },
          {
            serviceName:
              "product-service",
            baseUrl:
              "http://product-b:3001",
            state: "healthy",
            eligible: true,
            consecutiveFailures: 0,
            cooldownUntil: null,
          },
        ]);

        expect(
          Object.isFrozen(snapshot),
        ).toBe(true);

        expect(
          Object.isFrozen(
            snapshot.entries,
          ),
        ).toBe(true);
      },
    );

    it(
      "enters cooldown after two consecutive failures",
      () => {
        let nowMs = 1_000;

        const registry =
          createServiceInstanceHealthRegistry({
            initialSnapshot:
              createSnapshot(),
            now: () =>
              new Date(nowMs),
          });

        expect(
          registry.recordFailure(
            "product-service",
            "http://product-a:3001",
          ),
        ).toBe(true);

        expect(
          registry.getStatus(
            "product-service",
            "http://product-a:3001",
          ),
        ).toMatchObject({
          state: "healthy",
          eligible: true,
          consecutiveFailures: 1,
          cooldownUntil: null,
        });

        expect(
          registry.recordFailure(
            "product-service",
            "http://product-a:3001",
          ),
        ).toBe(true);

        expect(
          registry.getStatus(
            "product-service",
            "http://product-a:3001",
          ),
        ).toMatchObject({
          state: "cooldown",
          eligible: false,
          consecutiveFailures: 2,
          cooldownUntil:
            new Date(
              nowMs +
                SERVICE_INSTANCE_COOLDOWN_MS,
            ),
        });
      },
    );

    it(
      "exposes a probe after cooldown and immediately re-enters cooldown on failure",
      () => {
        let nowMs = 2_000;

        const registry =
          createServiceInstanceHealthRegistry({
            initialSnapshot:
              createSnapshot(),
            now: () =>
              new Date(nowMs),
          });

        registry.recordFailure(
          "product-service",
          "http://product-a:3001",
        );

        registry.recordFailure(
          "product-service",
          "http://product-a:3001",
        );

        nowMs +=
          SERVICE_INSTANCE_COOLDOWN_MS;

        expect(
          registry.getStatus(
            "product-service",
            "http://product-a:3001",
          ),
        ).toMatchObject({
          state: "probe",
          eligible: true,
        });

        registry.recordFailure(
          "product-service",
          "http://product-a:3001",
        );

        expect(
          registry.getStatus(
            "product-service",
            "http://product-a:3001",
          ),
        ).toMatchObject({
          state: "cooldown",
          eligible: false,
          consecutiveFailures: 2,
          cooldownUntil:
            new Date(
              nowMs +
                SERVICE_INSTANCE_COOLDOWN_MS,
            ),
        });
      },
    );

    it(
      "recovers an instance after a successful response",
      () => {
        const registry =
          createServiceInstanceHealthRegistry({
            initialSnapshot:
              createSnapshot(),
          });

        registry.recordFailure(
          "product-service",
          "http://product-a:3001",
        );

        registry.recordFailure(
          "product-service",
          "http://product-a:3001",
        );

        expect(
          registry.recordSuccess(
            "product-service",
            "http://product-a:3001",
          ),
        ).toBe(true);

        expect(
          registry.getStatus(
            "product-service",
            "http://product-a:3001",
          ),
        ).toMatchObject({
          state: "healthy",
          eligible: true,
          consecutiveFailures: 0,
          cooldownUntil: null,
        });
      },
    );

    it(
      "preserves retained state and prunes removed instances during reconciliation",
      () => {
        const registry =
          createServiceInstanceHealthRegistry({
            initialSnapshot:
              createSnapshot(),
          });

        registry.recordFailure(
          "product-service",
          "http://product-a:3001",
        );

        registry.reconcile(
          createSnapshot([
            {
              serviceName:
                "product-service",
              baseUrls: [
                "http://product-a:3001",
                "http://product-c:3001",
              ],
            },
          ]),
        );

        expect(
          registry.getStatus(
            "product-service",
            "http://product-a:3001",
          ),
        ).toMatchObject({
          consecutiveFailures: 1,
          state: "healthy",
        });

        expect(
          registry.getStatus(
            "product-service",
            "http://product-b:3001",
          ),
        ).toBeNull();

        expect(
          registry.getStatus(
            "product-service",
            "http://product-c:3001",
          ),
        ).toMatchObject({
          consecutiveFailures: 0,
          state: "healthy",
          eligible: true,
        });
      },
    );

    it(
      "keeps current state when reconciliation input is invalid",
      () => {
        const registry =
          createServiceInstanceHealthRegistry({
            initialSnapshot:
              createSnapshot(),
          });

        registry.recordFailure(
          "product-service",
          "http://product-a:3001",
        );

        const before =
          registry.getSnapshot();

        const invalidSnapshot: ServiceDiscoverySnapshot = {
          serviceCount: 1,
          services: [
            {
              serviceName:
                "product-service",
              instances: [
                {
                  baseUrl:
                    "http://product-a:3001",
                },
                {
                  baseUrl:
                    "http://product-a:3001",
                },
              ],
            },
          ],
        };

        expect(() =>
          registry.reconcile(
            invalidSnapshot,
          ),
        ).toThrow(
          /duplicate instance/,
        );

        expect(
          registry.getSnapshot(),
        ).toEqual(before);
      },
    );

    it(
      "ignores signals for instances outside the configured snapshot",
      () => {
        const registry =
          createServiceInstanceHealthRegistry({
            initialSnapshot:
              createSnapshot(),
          });

        expect(
          registry.recordFailure(
            "unknown-service",
            "http://unknown:3001",
          ),
        ).toBe(false);

        expect(
          registry.recordSuccess(
            "unknown-service",
            "http://unknown:3001",
          ),
        ).toBe(false);

        expect(
          registry.getSnapshot()
            .entryCount,
        ).toBe(2);
      },
    );

    it(
      "supports the bounded maximum of 512 configured instances",
      () => {
        expect(
          MAX_SERVICE_INSTANCE_HEALTH_ENTRY_COUNT,
        ).toBe(512);

        const services =
          Array.from(
            {
              length: 64,
            },
            (_, serviceIndex) => ({
              serviceName:
                `service-${serviceIndex}`,
              baseUrls:
                Array.from(
                  {
                    length: 8,
                  },
                  (_, instanceIndex) =>
                    `http://service-${serviceIndex}-${instanceIndex}:3001`,
                ),
            }),
          );

        const registry =
          createServiceInstanceHealthRegistry({
            initialSnapshot:
              createSnapshot(
                services,
              ),
          });

        expect(
          registry.getSnapshot()
            .entryCount,
        ).toBe(512);
      },
    );
  },
);
