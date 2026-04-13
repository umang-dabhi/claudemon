#!/usr/bin/env node
/**
 * Claudemon CLI wrapper — detects Bun and delegates to it.
 * Works with `npx claudemon` even on systems with only Node.js.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliEntry = resolve(__dirname, "..", "cli", "index.ts");
const args = process.argv.slice(2);

// Find bun binary
function findBun() {
  const home = process.env.HOME || "";
  const candidates = [
    `${home}/.bun/bin/bun`,
    "/usr/local/bin/bun",
    "/usr/bin/bun",
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  // Try PATH
  const result = spawnSync("which", ["bun"], { stdio: "pipe" });
  if (result.status === 0) return "bun";
  return null;
}

const bunPath = findBun();

if (bunPath) {
  const result = spawnSync(bunPath, ["run", cliEntry, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  process.exit(result.status ?? 1);
} else {
  console.error(`
  Claudemon requires Bun (https://bun.sh) to run.

  Install Bun:
    curl -fsSL https://bun.sh/install | bash

  Then run:
    npx claudemon install
  `);
  process.exit(1);
}
