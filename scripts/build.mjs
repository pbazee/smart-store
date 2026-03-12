import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    SKIP_LIVE_DATA_DURING_BUILD: "true",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error("Failed to start Next.js build:", error);
  process.exit(1);
});