/**
 * esbuild bundler for Claudemon.
 * Produces four ESM bundles in dist/:
 *   - server.mjs   — MCP server entry point
 *   - award-xp.mjs — PostToolUse hook (XP pipeline)
 *   - increment-counter.mjs — Counter-only hook
 *   - cli.mjs      — CLI entry point
 *
 * Usage: bun run scripts/build.ts
 */

import * as esbuild from "esbuild";
import { rm, mkdir } from "node:fs/promises";

const DIST = "dist";

// Clean previous build
await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

const shared: Partial<esbuild.BuildOptions> = {
  bundle: true,
  format: "esm" as const,
  platform: "node" as const,
  target: "node18",
  minify: false, // Keep readable for debugging
  sourcemap: true,
};

// Bundle 1: MCP Server
await esbuild.build({
  ...shared,
  entryPoints: ["src/server/index.ts"],
  outfile: `${DIST}/server.mjs`,
  external: ["@modelcontextprotocol/sdk"], // Keep MCP SDK external (peer dep)
});

// Bundle 2: Hook XP script
await esbuild.build({
  ...shared,
  entryPoints: ["src/hooks/award-xp.ts"],
  outfile: `${DIST}/award-xp.mjs`,
  external: [], // Bundle everything -- hooks need to be fast
});

// Bundle 3: Hook counter script
await esbuild.build({
  ...shared,
  entryPoints: ["src/hooks/increment-counter.ts"],
  outfile: `${DIST}/increment-counter.mjs`,
  external: [], // Bundle everything -- hooks need to be fast
});

// Bundle 4: CLI
await esbuild.build({
  ...shared,
  entryPoints: ["cli/index.ts"],
  outfile: `${DIST}/cli.mjs`,
  external: ["@modelcontextprotocol/sdk"],
});

console.log(
  "Build complete: dist/server.mjs, dist/award-xp.mjs, dist/increment-counter.mjs, dist/cli.mjs",
);
