import { env } from "./config/env.js";
import { buildApiGatewayApp } from "./app.js";

const start = async () => {
  const app = await buildApiGatewayApp();

  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`API Gateway is running on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();