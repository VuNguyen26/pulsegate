import { buildApiGatewayApp } from "./app.js";
import { env } from "./config/env.js";
import { connectRedis } from "./redis/redis-client.js";

const start = async () => {
  const app = await buildApiGatewayApp();

  try {
    await connectRedis();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`API Gateway is running on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    await app.close();
    process.exit(1);
  }
};

start();