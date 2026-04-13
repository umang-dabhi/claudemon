/**
 * Shared types and utilities for Claudemon CLI commands.
 * Centralizes Claude Code config interfaces and common helpers.
 */

import { resolve, dirname } from "node:path";

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
export const PROJECT_DIR = resolve(dirname(import.meta.dir));
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
export const SERVER_ENTRY = `${PROJECT_DIR}/src/server/index.ts`;

/** Resolve full path to bun binary (Claude Code may not have bun in PATH) */
export function getBunPath(): string {
  const { existsSync } = require("node:fs") as { existsSync: (p: string) => boolean };
  const candidates = [`${HOME}/.bun/bin/bun`, "/usr/local/bin/bun", "/usr/bin/bun"];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return "bun";
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
  const file = Bun.file(path);
  if (!(await file.exists())) {
    return null;
  }
  const text = await file.text();
  return JSON.parse(text) as T;
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await Bun.write(path, JSON.stringify(data, null, 2) + "\n");
}
