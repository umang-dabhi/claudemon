/**
 * Claudemon CLI Updater.
 * Re-registers MCP server, hooks, skill, and status line without
 * touching the user's saved state/Pokemon data.
 *
 * Effectively: uninstall registrations + reinstall registrations.
 * State directory (~/.claudemon/) is preserved completely.
 *
 * Usage: bun run cli/update.ts
 */

import { mkdir, copyFile, chmod, access } from "node:fs/promises";
import { constants as fsConstants, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import type { ClaudeConfig, ClaudeSettings, HookCommand, HookMatcher } from "./shared.js";
import {
  ok,
  fail,
  info,
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
  PROJECT_DIR,
  getRuntime,
} from "./shared.js";

// ── Step 1: Check Prerequisites ──────────────────────────────

async function checkPrerequisites(): Promise<boolean> {
  let allGood = true;

  try {
    const bunResult = spawnSync("bun", ["--version"], { stdio: "pipe" });
    if (!bunResult.error) {
      ok(`Bun runtime: v${bunResult.stdout?.toString().trim()} (fast mode)`);
    } else {
      throw new Error("no bun");
    }
  } catch {
    const nodeResult = spawnSync("node", ["--version"], { stdio: "pipe" });
    if (!nodeResult.error) {
      ok(`Node.js runtime: ${nodeResult.stdout?.toString().trim()}`);
    } else {
      fail("No runtime found. Install Node.js 18+");
      allGood = false;
    }
  }

  try {
    await access(CLAUDE_DIR, fsConstants.F_OK);
    ok("Claude Code directory: ~/.claude/");
  } catch {
    fail("Claude Code not found at ~/.claude/");
    allGood = false;
  }

  return allGood;
}

// ── Step 2: Remove Old Registrations ─────────────────────────

async function removeOldMcpServer(): Promise<void> {
  const config = await readJson<ClaudeConfig>(CLAUDE_CONFIG);
  if (!config?.mcpServers?.["claudemon"]) {
    info("MCP server: not previously registered");
    return;
  }
  delete config.mcpServers["claudemon"];
  if (Object.keys(config.mcpServers).length === 0) {
    delete config.mcpServers;
  }
  await writeJson(CLAUDE_CONFIG, config);
  ok("MCP server: removed old registration");
}

async function removeOldHooks(): Promise<void> {
  const settings = await readJson<ClaudeSettings>(CLAUDE_SETTINGS);
  if (!settings?.hooks) {
    info("Hooks: none found");
    return;
  }

  const hookTypes = ["PostToolUse", "Stop", "UserPromptSubmit"] as const;
  const patterns = ["post-tool-use.sh", "stop.sh", "user-prompt-submit.sh"] as const;

  for (let i = 0; i < hookTypes.length; i++) {
    const hookType = hookTypes[i]!;
    const pattern = patterns[i]!;
    const entries = settings.hooks[hookType];
    if (entries) {
      const filtered = entries.filter((m) => !m.hooks.some((h) => h.command.includes(pattern)));
      if (filtered.length === 0) {
        delete settings.hooks[hookType];
      } else {
        settings.hooks[hookType] = filtered;
      }
    }
  }

  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  await writeJson(CLAUDE_SETTINGS, settings);
  ok("Hooks: removed old registrations");
}

// ── Step 3: Re-register Everything ───────────────────────────

async function registerMcpServer(): Promise<void> {
  const existing = await readJson<ClaudeConfig>(CLAUDE_CONFIG);
  const config: ClaudeConfig = existing ?? {};

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  config.mcpServers["claudemon"] = {
    command: getRuntime().command,
    args: [getRuntime().serverEntry],
    env: {},
  };

  await writeJson(CLAUDE_CONFIG, config);
  ok("MCP server: registered in ~/.claude.json");
}

async function installHooks(): Promise<void> {
  const existing = await readJson<ClaudeSettings>(CLAUDE_SETTINGS);
  const settings: ClaudeSettings = existing ?? {};

  if (!settings.hooks) {
    settings.hooks = {};
  }

  // PostToolUse hook
  const ourHook: HookCommand = {
    type: "command",
    command: HOOK_SCRIPT,
    timeout: 5000,
  };
  const ourMatcher: HookMatcher = {
    matcher: "Bash|Write|Edit|Read|Grep|Glob",
    hooks: [ourHook],
  };
  const postToolUse = settings.hooks["PostToolUse"];
  if (postToolUse) {
    const filtered = postToolUse.filter(
      (m) => !m.hooks.some((h) => h.command.includes("post-tool-use.sh")),
    );
    filtered.push(ourMatcher);
    settings.hooks["PostToolUse"] = filtered;
  } else {
    settings.hooks["PostToolUse"] = [ourMatcher];
  }

  // Stop hook
  const stopHook: HookCommand = { type: "command", command: STOP_HOOK_SCRIPT, timeout: 3000 };
  const stopEntry: HookMatcher = { hooks: [stopHook] };
  const stopHooks = settings.hooks["Stop"];
  if (stopHooks) {
    const filtered = stopHooks.filter((m) => !m.hooks.some((h) => h.command.includes("stop.sh")));
    filtered.push(stopEntry);
    settings.hooks["Stop"] = filtered;
  } else {
    settings.hooks["Stop"] = [stopEntry];
  }

  // UserPromptSubmit hook
  const userPromptHook: HookCommand = {
    type: "command",
    command: USER_PROMPT_HOOK_SCRIPT,
    timeout: 3000,
  };
  const userPromptEntry: HookMatcher = { hooks: [userPromptHook] };
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
  ok("Hooks: PostToolUse, Stop, UserPromptSubmit configured");
}

async function registerStatusLine(): Promise<void> {
  const existing = await readJson<ClaudeSettings>(CLAUDE_SETTINGS);
  const settings: ClaudeSettings = existing ?? {};

  settings.statusLine = {
    type: "command",
    command: STATUSLINE_SCRIPT,
    refreshInterval: 1,
  };

  await writeJson(CLAUDE_SETTINGS, settings);
  ok("Status line: registered");
}

async function installSkill(): Promise<void> {
  await mkdir(SKILL_DEST_DIR, { recursive: true });
  await copyFile(SKILL_SRC, SKILL_DEST);
  ok("Skill: /buddy command updated");
}

async function setScriptPermissions(): Promise<void> {
  await chmod(HOOK_SCRIPT, 0o755);
  await chmod(STOP_HOOK_SCRIPT, 0o755);
  await chmod(USER_PROMPT_HOOK_SCRIPT, 0o755);
  await chmod(STATUSLINE_SCRIPT, 0o755);
  ok("Scripts: set executable");
}

// ── Step 4: Check for Missing Colorscripts ───────────────────

async function checkColorscripts(): Promise<{ missing: number; total: number }> {
  const smallDir = join(PROJECT_DIR, "sprites", "colorscripts", "small");
  let missing = 0;
  const total = 151;

  for (let id = 1; id <= total; id++) {
    // We don't know the name mapping without importing the data module,
    // so check if any file starting with the ID exists
    const prefix = `${id}-`;
    const dirExists = existsSync(smallDir);
    if (!dirExists) {
      missing = total;
      break;
    }

    // Check for files matching the pattern
    const files = readdirSync(smallDir).filter((f) => f.startsWith(prefix) && f.endsWith(".txt"));
    if (files.length === 0) {
      missing++;
    }
  }

  return { missing, total };
}

// ── Step 5: State Preservation Check ─────────────────────────

async function checkStatePreserved(): Promise<void> {
  try {
    await access(`${STATE_DIR}/state.json`, fsConstants.F_OK);
    ok("State data: preserved (not modified)");
  } catch {
    info("State data: no save file found (run /buddy starter to begin)");
  }
}

// ── Main ─────────────────────────────────────────────────────

export async function update(): Promise<void> {
  console.log("");
  console.log("Claudemon Updater");
  console.log("=================");
  console.log("");
  console.log("Checking prerequisites...");

  const prereqOk = await checkPrerequisites();
  if (!prereqOk) {
    console.log("");
    fail("Prerequisites not met. Fix the issues above and try again.");
    process.exit(1);
  }

  console.log("");
  console.log("Removing old registrations...");
  await removeOldMcpServer();
  await removeOldHooks();

  console.log("");
  console.log("Re-registering...");
  await registerMcpServer();
  await installHooks();
  await registerStatusLine();
  await installSkill();
  await setScriptPermissions();

  console.log("");
  console.log("Checking sprites...");
  const { missing, total } = await checkColorscripts();
  if (missing === 0) {
    ok(`Colorscripts: all ${total} sprites present`);
  } else if (missing === total) {
    fail(`Colorscripts: sprite directory not found. Run: bun run download-sprites`);
  } else {
    info(`Colorscripts: ${missing}/${total} missing. Run: bun run download-sprites`);
  }

  console.log("");
  await checkStatePreserved();

  console.log("");
  console.log("\u2713 Claudemon updated successfully!");
  console.log("");
  console.log("Start a new Claude Code session to use the updated version.");
  console.log("");
}

// Run if executed directly
update().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nUpdate failed: ${message}`);
  process.exit(1);
});
