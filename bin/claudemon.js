#!/usr/bin/env node
/**
 * Claudemon CLI — works with Node.js (no Bun required for users).
 * Routes to install/uninstall/update/doctor.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

// Try compiled JS first (dist/), then fall back to TS with bun
const distCli = resolve(__dirname, "..", "dist", "cli", "index.js");
const srcCli = resolve(__dirname, "..", "cli", "index.ts");

if (existsSync(distCli)) {
  // Run compiled JS with node
  const result = spawnSync("node", [distCli, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  process.exit(result.status ?? 1);
} else {
  // Fallback: try bun with source TS
  const home = process.env.HOME || "";
  const bunPaths = [`${home}/.bun/bin/bun`, "/usr/local/bin/bun", "/usr/bin/bun"];
  let bunPath = null;

  for (const p of bunPaths) {
    if (existsSync(p)) {
      bunPath = p;
      break;
    }
  }

  if (!bunPath) {
    const which = spawnSync("which", ["bun"], { stdio: "pipe" });
    if (which.status === 0) bunPath = "bun";
  }

  if (bunPath && existsSync(srcCli)) {
    const result = spawnSync(bunPath, ["run", srcCli, ...args], {
      stdio: "inherit",
      env: process.env,
    });
    process.exit(result.status ?? 1);
  }

  console.error(`
  Error: Could not find compiled files (dist/) or Bun runtime.

  If you installed via npm, try reinstalling:
    npm install -g @umang-boss/claudemon

  Or install Bun and run from source:
    curl -fsSL https://bun.sh/install | bash
  `);
  process.exit(1);
}
