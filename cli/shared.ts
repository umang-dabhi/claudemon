/**
 * Shared types and utilities for Claudemon CLI commands.
 * Centralizes Claude Code config interfaces and common helpers.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, constants as fsConstants } from "node:fs";
import { readFile, writeFile, access as fsAccess } from "node:fs/promises";

// ── Config shape interfaces ──────────────────────────────────

export interface McpServerEntry {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface ClaudeConfig {
  mcpServers?: Record<string, McpServerEntry>;
  [key: string]: unknown;
}

export interface HookCommand {
  type: "command";
  command: string;
  timeout: number;
}

export interface HookMatcher {
  matcher?: string;
  hooks: HookCommand[];
}

export interface StatusLineConfig {
  type: "command";
  command: string;
  refreshInterval: number;
}

export interface ClaudeSettings {
  hooks?: Record<string, HookMatcher[]>;
  statusLine?: StatusLineConfig;
  [key: string]: unknown;
}

// ── Constants ────────────────────────────────────────────────

const HOME = process.env["HOME"];
if (!HOME) {
  console.error("Error: HOME environment variable is not set.");
  process.exit(1);
}

export const CLI_HOME = HOME;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve project root — works from both src (cli/) and compiled (dist/cli/)
let projectDir = resolve(dirname(__dirname));
if (projectDir.endsWith("/dist") || projectDir.endsWith("\\dist")) {
  projectDir = resolve(projectDir, "..");
}
export const PROJECT_DIR = projectDir;
export const CLAUDE_DIR = `${HOME}/.claude`;
export const CLAUDE_CONFIG = `${HOME}/.claude.json`;
export const CLAUDE_SETTINGS = `${CLAUDE_DIR}/settings.json`;
export const STATE_DIR = `${HOME}/.claudemon`;
export const SKILL_SRC = `${PROJECT_DIR}/skills/buddy/SKILL.md`;
export const SKILL_DEST_DIR = `${CLAUDE_DIR}/skills/buddy`;
export const SKILL_DEST = `${SKILL_DEST_DIR}/SKILL.md`;
export const HOOK_SCRIPT = `${PROJECT_DIR}/hooks/post-tool-use.sh`;
export const STOP_HOOK_SCRIPT = `${PROJECT_DIR}/hooks/stop.sh`;
export const USER_PROMPT_HOOK_SCRIPT = `${PROJECT_DIR}/hooks/user-prompt-submit.sh`;
export const STATUSLINE_SCRIPT = `${PROJECT_DIR}/statusline/buddy-status.sh`;
export const SERVER_ENTRY_TS = `${PROJECT_DIR}/src/server/index.ts`;
export const SERVER_ENTRY_JS = `${PROJECT_DIR}/dist/server.mjs`;
/** Legacy tsc output path — kept for backward compatibility */
export const SERVER_ENTRY_JS_LEGACY = `${PROJECT_DIR}/dist/src/server/index.js`;

/** Find the best runtime — Bun (fastest) > bundled node > legacy node */
export function getRuntime(): { command: string; serverEntry: string } {
  // Prefer bun (fastest — native TS, ~120ms startup)
  const bunCandidates = [`${HOME}/.bun/bin/bun`, "/usr/local/bin/bun", "/usr/bin/bun"];
  for (const p of bunCandidates) {
    if (existsSync(p)) {
      return { command: p, serverEntry: SERVER_ENTRY_TS };
    }
  }

  // No bun — use bundled ESM with node (~600ms but works everywhere)
  if (existsSync(SERVER_ENTRY_JS)) {
    return { command: "node", serverEntry: SERVER_ENTRY_JS };
  }

  // Fall back to legacy tsc output
  if (existsSync(SERVER_ENTRY_JS_LEGACY)) {
    return { command: "node", serverEntry: SERVER_ENTRY_JS_LEGACY };
  }

  // Last resort: assume bun in PATH
  return { command: "bun", serverEntry: SERVER_ENTRY_TS };
}

// ── Helpers ──────────────────────────────────────────────────

export function ok(msg: string): void {
  console.log(`  \u2713 ${msg}`);
}

export function fail(msg: string): void {
  console.error(`  \u2717 ${msg}`);
}

export function info(msg: string): void {
  console.log(`  - ${msg}`);
}

export async function readJson<T>(path: string): Promise<T | null> {
  try {
    await fsAccess(path, fsConstants.F_OK);
    const text = await readFile(path, "utf-8");
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
