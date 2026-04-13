/**
 * Claudemon CLI Uninstaller.
 * Cleanly removes MCP server, hooks, and skill from Claude Code.
 *
 * Usage: bun run cli/uninstall.ts
 */

import { rm } from "node:fs/promises";

import type { ClaudeConfig, ClaudeSettings } from "./shared.js";
import {
  ok,
  info,
  readJson,
  writeJson,
  CLAUDE_CONFIG,
  CLAUDE_SETTINGS,
  STATE_DIR,
  SKILL_DEST_DIR,
} from "./shared.js";

// ── Step 1: Remove MCP Server Registration ───────────────────

async function removeMcpServer(): Promise<void> {
  const config = await readJson<ClaudeConfig>(CLAUDE_CONFIG);
  if (!config) {
    info("MCP server: ~/.claude.json not found (nothing to remove)");
    return;
  }

  if (!config.mcpServers || !config.mcpServers["claudemon"]) {
    info("MCP server: not registered (nothing to remove)");
    return;
  }

  delete config.mcpServers["claudemon"];

  // Clean up empty mcpServers object
  if (Object.keys(config.mcpServers).length === 0) {
    delete config.mcpServers;
  }

  await writeJson(CLAUDE_CONFIG, config);
  ok("MCP server: removed from ~/.claude.json");
}

// ── Step 2: Remove Hooks ─────────────────────────────────────

async function removeHooks(): Promise<void> {
  const settings = await readJson<ClaudeSettings>(CLAUDE_SETTINGS);
  if (!settings) {
    info("Hooks: ~/.claude/settings.json not found (nothing to remove)");
    return;
  }

  if (!settings.hooks) {
    info("Hooks: no hooks found (nothing to remove)");
    return;
  }

  // Remove PostToolUse hook
  if (settings.hooks["PostToolUse"]) {
    const filtered = settings.hooks["PostToolUse"].filter(
      (m) => !m.hooks.some((h) => h.command.includes("post-tool-use.sh")),
    );
    if (filtered.length === 0) {
      delete settings.hooks["PostToolUse"];
    } else {
      settings.hooks["PostToolUse"] = filtered;
    }
  }

  // Remove Stop hook
  if (settings.hooks["Stop"]) {
    const filtered = settings.hooks["Stop"].filter(
      (m) => !m.hooks.some((h) => h.command.includes("stop.sh")),
    );
    if (filtered.length === 0) {
      delete settings.hooks["Stop"];
    } else {
      settings.hooks["Stop"] = filtered;
    }
  }

  // Remove UserPromptSubmit hook
  if (settings.hooks["UserPromptSubmit"]) {
    const filtered = settings.hooks["UserPromptSubmit"].filter(
      (m) => !m.hooks.some((h) => h.command.includes("user-prompt-submit.sh")),
    );
    if (filtered.length === 0) {
      delete settings.hooks["UserPromptSubmit"];
    } else {
      settings.hooks["UserPromptSubmit"] = filtered;
    }
  }

  // Clean up empty hooks object
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  await writeJson(CLAUDE_SETTINGS, settings);
  ok("Hooks: removed PostToolUse, Stop, UserPromptSubmit entries from ~/.claude/settings.json");
}

// ── Step 3: Remove Skill ─────────────────────────────────────

async function removeSkill(): Promise<void> {
  const file = Bun.file(`${SKILL_DEST_DIR}/SKILL.md`);
  if (!(await file.exists())) {
    info("Skill: ~/.claude/skills/buddy/ not found (nothing to remove)");
    return;
  }

  await rm(SKILL_DEST_DIR, { recursive: true, force: true });
  ok("Skill: removed ~/.claude/skills/buddy/");
}

// ── Step 4: Preserve State Data ──────────────────────────────

async function preserveStateData(): Promise<void> {
  const stateFile = Bun.file(`${STATE_DIR}/state.json`);
  if (await stateFile.exists()) {
    info(`Your Pokemon data is preserved at ${STATE_DIR}/. Delete manually to remove.`);
  } else {
    info(`State directory: ${STATE_DIR}/ (kept, no state file found)`);
  }
}

// ── Main ─────────────────────────────────────────────────────

export async function uninstall(): Promise<void> {
  console.log("");
  console.log("Claudemon Uninstaller");
  console.log("=====================");
  console.log("");
  console.log("Removing Claudemon from Claude Code...");
  console.log("");

  await removeMcpServer();
  await removeHooks();
  await removeSkill();
  await preserveStateData();

  console.log("");
  console.log("\u2713 Claudemon uninstalled successfully.");
  console.log("");
}

// Run if executed directly
uninstall().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nUninstall failed: ${message}`);
  process.exit(1);
});
