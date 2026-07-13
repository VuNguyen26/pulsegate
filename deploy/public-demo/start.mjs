import {
  spawn,
} from "node:child_process";

const requiredEnvironmentVariables = [
  "PRODUCT_DATABASE_URL",
  "GATEWAY_DATABASE_URL",
  "REDIS_URL",
  "API_KEYS",
  "ADMIN_API_KEY",
  "ADMIN_READ_ONLY_API_KEY",
  "JWT_SECRET",
];

for (const name of requiredEnvironmentVariables) {
  if (!process.env[name]?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const publicPort = process.env.PORT?.trim() || "10000";
const productPort = "3001";
const productBaseUrl = `http://127.0.0.1:${productPort}`;

const commonEnvironment = {
  ...process.env,
  NODE_ENV: "production",
};

const productEnvironment = {
  ...commonEnvironment,
  HOST: "127.0.0.1",
  PORT: productPort,
  DATABASE_URL: process.env.PRODUCT_DATABASE_URL,
};

const gatewayEnvironment = {
  ...commonEnvironment,
  HOST: "0.0.0.0",
  PORT: publicPort,
  DATABASE_URL: process.env.GATEWAY_DATABASE_URL,
  PRODUCT_SERVICE_URL: productBaseUrl,
};

function runCommand(
  command,
  args,
  environment,
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: environment,
      stdio: "inherit",
    });

    child.once("error", reject);

    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed with code ${String(
            code,
          )} and signal ${String(signal)}`,
        ),
      );
    });
  });
}

async function waitForHealth(
  url,
  timeoutMs,
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // The local service is still starting.
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function stopChild(
  child,
  signal,
) {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill(signal);
  }
}

async function main() {
  console.log(
    JSON.stringify({
      event: "public_demo_bootstrap_started",
    }),
  );

  await runCommand(
    "npm",
    [
      "run",
      "db:migrate:deploy",
      "-w",
      "apps/product-service",
    ],
    productEnvironment,
  );

  await runCommand(
    "npm",
    [
      "run",
      "db:seed",
      "-w",
      "apps/product-service",
    ],
    productEnvironment,
  );

  await runCommand(
    "npm",
    [
      "run",
      "db:migrate:deploy",
      "-w",
      "apps/api-gateway",
    ],
    gatewayEnvironment,
  );

  await runCommand(
    "npm",
    [
      "run",
      "db:seed",
      "-w",
      "apps/api-gateway",
    ],
    gatewayEnvironment,
  );

  let productProcess;
  let gatewayProcess;
  let stopping = false;

  const shutdown = (signal) => {
    if (stopping) {
      return;
    }

    stopping = true;
    stopChild(gatewayProcess, signal);
    stopChild(productProcess, signal);
  };

  process.once("SIGINT", () => {
    shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    shutdown("SIGTERM");
  });

  productProcess = spawn(
    process.execPath,
    ["apps/product-service/dist/server.js"],
    {
      env: productEnvironment,
      stdio: "inherit",
    },
  );

  productProcess.once("error", (error) => {
    console.error(error);
    shutdown("SIGTERM");
    process.exitCode = 1;
  });

  await waitForHealth(`${productBaseUrl}/health`, 30000);

  gatewayProcess = spawn(
    process.execPath,
    ["apps/api-gateway/dist/server.js"],
    {
      env: gatewayEnvironment,
      stdio: "inherit",
    },
  );

  gatewayProcess.once("error", (error) => {
    console.error(error);
    shutdown("SIGTERM");
    process.exitCode = 1;
  });

  gatewayProcess.once("exit", (code, signal) => {
    if (!stopping) {
      console.error(
        JSON.stringify({
          event: "public_demo_gateway_exited",
          code,
          signal,
        }),
      );

      process.exitCode = code ?? 1;
      shutdown("SIGTERM");
    }
  });

  productProcess.once("exit", (code, signal) => {
    if (!stopping) {
      console.error(
        JSON.stringify({
          event: "public_demo_product_exited",
          code,
          signal,
        }),
      );

      process.exitCode = code ?? 1;
      shutdown("SIGTERM");
    }
  });

  console.log(
    JSON.stringify({
      event: "public_demo_runtime_started",
      publicPort,
      productPort,
    }),
  );
}

void main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "public_demo_bootstrap_failed",
      errorCode: "PUBLIC_DEMO_BOOTSTRAP_FAILED",
    }),
  );

  console.error(error);
  process.exitCode = 1;
});
