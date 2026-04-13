/**
 * Claudemon CLI Installer.
 * Registers MCP server, hooks, and skill into Claude Code.
 *
 * Usage: bun run cli/install.ts
 */

import { mkdir, copyFile, chmod, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

import type { ClaudeConfig, ClaudeSettings, HookCommand, HookMatcher } from "./shared.js";
import {
  ok,
  fail,
  readJson,
  writeJson,
  CLAUDE_DIR,
  CLAUDE_CONFIG,
  CLAUDE_SETTINGS,
  STATE_DIR,
  SKILL_SRC,
  SKILL_DEST_DIR,
  SKILL_DEST,
  HOOK_SCRIPT,
  STOP_HOOK_SCRIPT,
  USER_PROMPT_HOOK_SCRIPT,
  STATUSLINE_SCRIPT,
  SERVER_ENTRY,
  getBunPath,
} from "./shared.js";

// ── Step 1: Check Prerequisites ──────────────────────────────

async function checkPrerequisites(): Promise<boolean> {
  let allGood = true;

  // Check bun (sanity)
  try {
    const proc = Bun.spawn(["bun", "--version"], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    ok(`Bun runtime: v${output.trim()}`);
  } catch {
    fail("Bun runtime not found. Install from https://bun.sh");
    allGood = false;
  }

  // Check Claude Code directory
  try {
    await access(CLAUDE_DIR, fsConstants.F_OK);
    ok("Claude Code directory: ~/.claude/");
  } catch {
    fail("Claude Code not found. Install Claude Code first: https://claude.ai/download");
    console.error("    Expected directory: ~/.claude/");
    allGood = false;
  }

  return allGood;
}

// ── Step 2: Create State Directory ───────────────────────────

async function createStateDirectory(): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  ok(`State directory: ${STATE_DIR}/`);
}

// ── Step 3: Register MCP Server ──────────────────────────────

async function registerMcpServer(): Promise<void> {
  const existing = await readJson<ClaudeConfig>(CLAUDE_CONFIG);
  const config: ClaudeConfig = existing ?? {};

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  config.mcpServers["claudemon"] = {
    command: getBunPath(),
    args: ["run", SERVER_ENTRY],
    env: {},
  };

  await writeJson(CLAUDE_CONFIG, config);
  ok("MCP server: registered in ~/.claude.json");
}

// ── Step 4: Install Hooks ────────────────────────────────────

async function installHooks(): Promise<void> {
  const existing = await readJson<ClaudeSettings>(CLAUDE_SETTINGS);
  const settings: ClaudeSettings = existing ?? {};

  if (!settings.hooks) {
    settings.hooks = {};
  }

  const ourHook: HookCommand = {
    type: "command",
    command: HOOK_SCRIPT,
    timeout: 5000,
  };

  const ourMatcher: HookMatcher = {
    matcher: "Bash|Write|Edit|Read|Grep|Glob",
    hooks: [ourHook],
  };

  // Check if PostToolUse already has our matcher
  const postToolUse = settings.hooks["PostToolUse"];
  if (postToolUse) {
    // Remove any existing claudemon matcher (idempotent reinstall)
    const filtered = postToolUse.filter(
      (m) => !m.hooks.some((h) => h.command.includes("post-tool-use.sh")),
    );
    filtered.push(ourMatcher);
    settings.hooks["PostToolUse"] = filtered;
  } else {
    settings.hooks["PostToolUse"] = [ourMatcher];
  }

  // ── Stop hook (extracts buddy comments from responses) ────
  const stopHook: HookCommand = {
    type: "command",
    command: STOP_HOOK_SCRIPT,
    timeout: 3000,
  };

  const stopEntry: HookMatcher = {
    hooks: [stopHook],
  };

  const stopHooks = settings.hooks["Stop"];
  if (stopHooks) {
    const filtered = stopHooks.filter((m) => !m.hooks.some((h) => h.command.includes("stop.sh")));
    filtered.push(stopEntry);
    settings.hooks["Stop"] = filtered;
  } else {
    settings.hooks["Stop"] = [stopEntry];
  }

  // ── UserPromptSubmit hook (reacts to Pokemon name mentions) ─
  const userPromptHook: HookCommand = {
    type: "command",
    command: USER_PROMPT_HOOK_SCRIPT,
    timeout: 3000,
  };

  const userPromptEntry: HookMatcher = {
    hooks: [userPromptHook],
  };

  const userPromptHooks = settings.hooks["UserPromptSubmit"];
  if (userPromptHooks) {
    const filtered = userPromptHooks.filter(
      (m) => !m.hooks.some((h) => h.command.includes("user-prompt-submit.sh")),
    );
    filtered.push(userPromptEntry);
    settings.hooks["UserPromptSubmit"] = filtered;
  } else {
    settings.hooks["UserPromptSubmit"] = [userPromptEntry];
  }

  await writeJson(CLAUDE_SETTINGS, settings);
  ok("Hooks: PostToolUse, Stop, UserPromptSubmit configured in ~/.claude/settings.json");
}

// ── Step 5: Register Status Line ─────────────────────────────

async function registerStatusLine(): Promise<void> {
  const existing = await readJson<ClaudeSettings>(CLAUDE_SETTINGS);
  const settings: ClaudeSettings = existing ?? {};

  // Merge status line config without overwriting other settings
  settings.statusLine = {
    type: "command",
    command: STATUSLINE_SCRIPT,
    refreshInterval: 1,
  };

  await writeJson(CLAUDE_SETTINGS, settings);
  ok("Status line: registered in ~/.claude/settings.json");
}

// ── Step 6: Install Skill ─────────────────────────────────────

async function installSkill(): Promise<void> {
  await mkdir(SKILL_DEST_DIR, { recursive: true });
  await copyFile(SKILL_SRC, SKILL_DEST);
  ok("Skill: /buddy command installed to ~/.claude/skills/buddy/");
}

// ── Step 7: Set Script Permissions ───────────────────────────

async function setScriptPermissions(): Promise<void> {
  await chmod(HOOK_SCRIPT, 0o755);
  ok("Hook script: post-tool-use.sh set executable");
  await chmod(STOP_HOOK_SCRIPT, 0o755);
  ok("Hook script: stop.sh set executable");
  await chmod(USER_PROMPT_HOOK_SCRIPT, 0o755);
  ok("Hook script: user-prompt-submit.sh set executable");
  await chmod(STATUSLINE_SCRIPT, 0o755);
  ok("Status line script: set executable");
}

// ── Main ─────────────────────────────────────────────────────

export async function install(): Promise<void> {
  console.log("");
  console.log("Claudemon Installer");
  console.log("===================");
  console.log("");
  console.log("Checking prerequisites...");

  const prereqOk = await checkPrerequisites();
  if (!prereqOk) {
    console.log("");
    fail("Prerequisites not met. Fix the issues above and try again.");
    process.exit(1);
  }

  console.log("");
  console.log("Installing...");

  await createStateDirectory();
  await registerMcpServer();
  await installHooks();
  await registerStatusLine();
  await installSkill();
  await setScriptPermissions();

  console.log("");
  console.log("\u2713 Claudemon installed successfully!");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Start a new Claude Code session");
  console.log("  2. Type /buddy starter to pick your first Pokemon!");
  console.log("");
  console.log("Run 'bun run cli/doctor.ts' to verify installation.");
  console.log("");
}

// Run if executed directly
install().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nInstallation failed: ${message}`);
  process.exit(1);
});
