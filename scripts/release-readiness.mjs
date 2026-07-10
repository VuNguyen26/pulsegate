import { spawnSync } from "node:child_process";

const allowDirty = process.argv.includes("--allow-dirty");

function section(title) {
  console.log(`\n${"=".repeat(72)}\n${title}\n${"=".repeat(72)}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    shell: options.shell ?? false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stdout = result.stdout?.trim();
    const stderr = result.stderr?.trim();

    if (stdout) {
      console.error(stdout);
    }

    if (stderr) {
      console.error(stderr);
    }

    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status}`,
    );
  }

  return options.capture ? result.stdout.trim() : "";
}

function runNpm(args) {
  const npmCliPath = process.env.npm_execpath;

  if (npmCliPath) {
    return run(process.execPath, [npmCliPath, ...args]);
  }

  return run("npm", args, {
    shell: process.platform === "win32",
  });
}

section("Git preflight");

const branch = run("git", ["branch", "--show-current"], {
  capture: true,
});

if (branch !== "main") {
  throw new Error(
    `Release validation must run on main, received: ${branch}`,
  );
}

const initialStatus = run(
  "git",
  ["status", "--porcelain=v1"],
  { capture: true },
);

if (initialStatus && !allowDirty) {
  console.error(initialStatus);

  throw new Error(
    "Working tree is not clean. Use --allow-dirty only while validating this script before commit.",
  );
}

if (initialStatus) {
  console.log(
    "Development mode: dirty working tree is allowed, but release readiness will not be asserted.",
  );
} else {
  console.log("Working tree is clean.");
}

section("Automated validation");

runNpm(["run", "test"]);
runNpm(["run", "typecheck"]);
runNpm(["run", "build"]);

section("Diff validation");

run("git", ["diff", "--check"]);
run("git", ["diff", "--cached", "--check"]);

section("Final repository verification");

const finalStatus = run(
  "git",
  ["status", "--porcelain=v1"],
  { capture: true },
);

if (finalStatus !== initialStatus) {
  console.error("Initial status:");
  console.error(initialStatus || "(clean)");
  console.error("Final status:");
  console.error(finalStatus || "(clean)");

  throw new Error(
    "Validation commands changed the repository state.",
  );
}

const head = run(
  "git",
  ["rev-parse", "HEAD"],
  { capture: true },
);

const originMain = run(
  "git",
  ["rev-parse", "--verify", "origin/main"],
  { capture: true },
);

if (head !== originMain) {
  throw new Error(
    "HEAD and origin/main are not synchronized.",
  );
}

section("Summary");

console.log(
  "Tests, typecheck, build, and diff checks passed.",
);
console.log(
  "HEAD and origin/main are synchronized.",
);

if (initialStatus) {
  console.log(
    "Release readiness was not asserted because the working tree is dirty.",
  );
} else {
  console.log(
    "Release-readiness automated checks passed on a clean working tree.",
  );
}
