import type { FastifyPluginAsync } from "fastify";

import type { HttpMetrics } from "../observability/metrics.js";

export type MetricsRouteOptions = {
  metrics: HttpMetrics;
};

export const metricsRoute: FastifyPluginAsync<MetricsRouteOptions> = async (
  app,
  options,
) => {
  app.get("/metrics", async (_request, reply) => {
    const metricsText = await options.metrics.getMetricsText();

    reply
      .code(200)
      .type(options.metrics.contentType)
      .send(metricsText);
  });
};