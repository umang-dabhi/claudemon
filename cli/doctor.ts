/**
 * Claudemon Doctor — diagnostic tool.
 * Checks the health of the Claudemon installation.
 *
 * Usage: bun run cli/doctor.ts
 */

import { access, stat, unlink, readdir, readFile } from "node:fs/promises";
import { constants as fsConstants, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { StateManager } from "../src/state/state-manager.js";
import { PlayerStateSchema } from "../src/state/schemas.js";
import { checkForUpdate, getCurrentVersion } from "../src/engine/version-check.js";

import type { ClaudeConfig, ClaudeSettings } from "./shared.js";
import {
  readJson,
  info,
  CLAUDE_CONFIG,
  CLAUDE_SETTINGS,
  STATE_DIR,
  SKILL_DEST,
  HOOK_SCRIPT,
} from "./shared.js";

// ── Local Constants ─────────────────────────────────────────

const STATE_FILE = `${STATE_DIR}/state.json`;
const LOCK_FILE = `${STATE_DIR}/state.lock`;
const LOCK_MAX_AGE_MS = 5000;
const EXPECTED_SPRITE_COUNT = 151;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Sprite dir: check multiple candidate paths (works from source, dist, and npm global)
function findColorscriptDir(): string | null {
  const candidates = [
    resolve(dirname(__dirname), "sprites", "colorscripts", "small"),
    resolve(dirname(__dirname), "..", "sprites", "colorscripts", "small"),
    resolve(__dirname, "..", "sprites", "colorscripts", "small"),
    resolve(__dirname, "..", "..", "sprites", "colorscripts", "small"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}
const COLORSCRIPT_DIR = findColorscriptDir();

// ── Helpers ──────────────────────────────────────────────────

interface CheckResult {
  label: string;
  passed: boolean;
  detail: string;
}

function formatCheck(result: CheckResult): string {
  const icon = result.passed ? "\u2713" : "\u2717";
  return `[${icon}] ${result.label}: ${result.detail}`;
}

// ── Check 1: Bun Version ─────────────────────────────────────

async function checkBun(): Promise<CheckResult> {
  try {
    const result = spawnSync("bun", ["--version"], { stdio: "pipe" });
    if (result.error) throw result.error;
    const output = result.stdout?.toString().trim();
    return { label: "Bun runtime", passed: true, detail: `v${output}` };
  } catch {
    return { label: "Bun runtime", passed: false, detail: "not found" };
  }
}

// ── Check 2: State Directory ─────────────────────────────────

async function checkStateDir(): Promise<CheckResult> {
  try {
    await access(STATE_DIR, fsConstants.F_OK);
    return { label: "State directory", passed: true, detail: "~/.claudemon/" };
  } catch {
    return {
      label: "State directory",
      passed: false,
      detail: "~/.claudemon/ not found (run installer)",
    };
  }
}

// ── Check 3: State File ──────────────────────────────────────

async function checkStateFile(): Promise<CheckResult> {
  try {
    await access(STATE_FILE, fsConstants.F_OK);
  } catch {
    return { label: "State file", passed: false, detail: "not found (run /buddy starter first)" };
  }

  try {
    const text = await readFile(STATE_FILE, "utf-8");
    const data = JSON.parse(text) as Record<string, unknown>;

    // Check for active pokemon
    const party = data["party"];
    if (Array.isArray(party) && party.length > 0) {
      const active = party.find(
        (p: unknown) =>
          typeof p === "object" &&
          p !== null &&
          "isActive" in p &&
          (p as Record<string, unknown>)["isActive"] === true,
      );
      if (active && typeof active === "object" && "pokemonId" in active) {
        return {
          label: "State file",
          passed: true,
          detail: `valid, active Pokemon #${(active as Record<string, unknown>)["pokemonId"]}`,
        };
      }
      return { label: "State file", passed: true, detail: "valid, but no active Pokemon set" };
    }

    return { label: "State file", passed: true, detail: "valid JSON, no party members yet" };
  } catch {
    return { label: "State file", passed: false, detail: "exists but invalid JSON" };
  }
}

// ── Check 4: MCP Server Registration ─────────────────────────

async function checkMcpServer(): Promise<CheckResult> {
  const config = await readJson<ClaudeConfig>(CLAUDE_CONFIG);
  if (!config) {
    return { label: "MCP server", passed: false, detail: "~/.claude.json not found" };
  }

  if (config.mcpServers && config.mcpServers["claudemon"]) {
    return { label: "MCP server", passed: true, detail: "registered in ~/.claude.json" };
  }

  return { label: "MCP server", passed: false, detail: "not registered in ~/.claude.json" };
}

// ── Check 5: Hooks ───────────────────────────────────────────

async function checkHooks(): Promise<CheckResult> {
  const settings = await readJson<ClaudeSettings>(CLAUDE_SETTINGS);
  if (!settings) {
    return { label: "Hooks", passed: false, detail: "~/.claude/settings.json not found" };
  }

  if (!settings.hooks || !settings.hooks["PostToolUse"]) {
    return { label: "Hooks", passed: false, detail: "no PostToolUse hooks configured" };
  }

  const hasOurHook = settings.hooks["PostToolUse"].some((m) =>
    m.hooks.some((h) => h.command.includes("post-tool-use.sh")),
  );

  if (hasOurHook) {
    return { label: "Hooks", passed: true, detail: "PostToolUse configured" };
  }

  return { label: "Hooks", passed: false, detail: "PostToolUse exists but missing Claudemon hook" };
}

// ── Check 6: Skill ───────────────────────────────────────────

async function checkSkill(): Promise<CheckResult> {
  try {
    await access(SKILL_DEST, fsConstants.F_OK);
    return { label: "Skill", passed: true, detail: "/buddy command installed" };
  } catch {
    return { label: "Skill", passed: false, detail: "~/.claude/skills/buddy/SKILL.md not found" };
  }
}

// ── Check 7: Hook Script Executable ──────────────────────────

async function checkHookScript(): Promise<CheckResult> {
  // Windows doesn't use Unix file permissions
  if (process.platform === "win32") {
    try {
      await access(HOOK_SCRIPT, fsConstants.F_OK);
      return { label: "Hook script", passed: true, detail: "found (Windows — no chmod needed)" };
    } catch {
      return { label: "Hook script", passed: false, detail: "not found" };
    }
  }

  try {
    await access(HOOK_SCRIPT, fsConstants.X_OK);
    return { label: "Hook script", passed: true, detail: "executable" };
  } catch {
    try {
      await access(HOOK_SCRIPT, fsConstants.F_OK);
      return {
        label: "Hook script",
        passed: false,
        detail: "exists but not executable (run chmod +x)",
      };
    } catch {
      return { label: "Hook script", passed: false, detail: "not found" };
    }
  }
}

// ── Check 7b: jq Installed ──────────────────────────────────

async function checkJq(): Promise<CheckResult> {
  try {
    const result = spawnSync("jq", ["--version"], { stdio: "pipe" });
    if (result.error) throw result.error;
    const output = result.stdout?.toString().trim();
    return { label: "jq", passed: true, detail: output || "installed" };
  } catch {
    const installHint =
      process.platform === "darwin"
        ? "brew install jq"
        : process.platform === "win32"
          ? "winget install jqlang.jq"
          : "sudo apt install jq";
    return {
      label: "jq",
      passed: false,
      detail: `not found — required for status line. Install: ${installHint}`,
    };
  }
}

// ── Check 8: State Manager Load ──────────────────────────────

async function checkStateManager(): Promise<CheckResult> {
  try {
    StateManager.resetInstance();
    const manager = StateManager.getInstance();
    const state = await manager.load();
    StateManager.resetInstance();

    if (state) {
      return { label: "State manager", passed: true, detail: "loaded successfully" };
    }
    return { label: "State manager", passed: true, detail: "no state file yet (first run)" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    StateManager.resetInstance();
    return { label: "State manager", passed: false, detail: `load failed: ${message}` };
  }
}

// ── Check 9: Stale Lock File ────────────────────────────────

async function checkStaleLock(): Promise<CheckResult> {
  try {
    const lockStat = await stat(LOCK_FILE);
    const lockAge = Date.now() - lockStat.mtimeMs;

    if (lockAge > LOCK_MAX_AGE_MS) {
      // Offer cleanup
      info(`Stale lock file found (${Math.round(lockAge / 1000)}s old). Cleaning up...`);
      try {
        await unlink(LOCK_FILE);
        return { label: "Lock file", passed: true, detail: "stale lock cleaned up" };
      } catch {
        return { label: "Lock file", passed: false, detail: "stale lock found, cleanup failed" };
      }
    }

    return {
      label: "Lock file",
      passed: true,
      detail: `active (${Math.round(lockAge / 1000)}s old)`,
    };
  } catch {
    // No lock file — this is the normal case
    return { label: "Lock file", passed: true, detail: "no lock (clean)" };
  }
}

// ── Check 10: Sprite Count ──────────────────────────────────

async function checkSpriteCount(): Promise<CheckResult> {
  try {
    if (!COLORSCRIPT_DIR) {
      return { label: "Sprites", passed: false, detail: "colorscripts directory not found" };
    }
    await access(COLORSCRIPT_DIR, fsConstants.F_OK);
    const entries = await readdir(COLORSCRIPT_DIR);
    const spriteFiles = entries.filter((f) => f.endsWith(".txt"));
    const count = spriteFiles.length;

    if (count >= EXPECTED_SPRITE_COUNT) {
      return {
        label: "Sprites",
        passed: true,
        detail: `${count}/${EXPECTED_SPRITE_COUNT} sprite files`,
      };
    }

    return {
      label: "Sprites",
      passed: false,
      detail: `only ${count}/${EXPECTED_SPRITE_COUNT} sprite files (some sprites missing)`,
    };
  } catch {
    return { label: "Sprites", passed: false, detail: "colorscripts directory not found" };
  }
}

// ── Check 11: State File Validity (Zod) ─────────────────────

async function checkStateValidity(): Promise<CheckResult> {
  try {
    await access(STATE_FILE, fsConstants.F_OK);
  } catch {
    return { label: "State validity", passed: true, detail: "no state file yet" };
  }

  try {
    const text = await readFile(STATE_FILE, "utf-8");
    if (!text.trim()) {
      return { label: "State validity", passed: false, detail: "state file is empty" };
    }

    const data = JSON.parse(text) as unknown;
    const result = PlayerStateSchema.safeParse(data);

    if (result.success) {
      return { label: "State validity", passed: true, detail: "schema valid" };
    }

    // Report first few issues
    const issues = result.error.issues.slice(0, 3);
    const details = issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return {
      label: "State validity",
      passed: false,
      detail: `schema errors: ${details}`,
    };
  } catch {
    return { label: "State validity", passed: false, detail: "invalid JSON" };
  }
}

// ── Check 12: Version ──────────────────────────────────────────

async function checkVersion(): Promise<CheckResult> {
  const current = getCurrentVersion();
  if (current === "unknown") {
    return { label: "Version", passed: false, detail: "could not determine current version" };
  }

  try {
    const result = await checkForUpdate();
    if (!result) {
      return {
        label: "Version",
        passed: true,
        detail: `v${current} (could not reach npm registry)`,
      };
    }

    if (result.hasUpdate) {
      return {
        label: "Version",
        passed: false,
        detail: `v${current} (v${result.latest} available — run: npm install -g @umang-boss/claudemon)`,
      };
    }

    return { label: "Version", passed: true, detail: `v${current} (latest)` };
  } catch {
    return { label: "Version", passed: true, detail: `v${current} (check skipped)` };
  }
}

// ── Main ─────────────────────────────────────────────────────

export async function doctor(): Promise<void> {
  console.log("");
  console.log("Claudemon Doctor");
  console.log("================");
  console.log("");

  const checks: CheckResult[] = [
    await checkVersion(),
    await checkBun(),
    await checkJq(),
    await checkStateDir(),
    await checkStateFile(),
    await checkMcpServer(),
    await checkHooks(),
    await checkSkill(),
    await checkHookScript(),
    await checkStateManager(),
    await checkStaleLock(),
    await checkSpriteCount(),
    await checkStateValidity(),
  ];

  for (const check of checks) {
    console.log(formatCheck(check));
  }

  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;

  console.log("");
  console.log(`Result: ${passed}/${total} checks passed`);

  if (passed < total) {
    console.log("");
    console.log("Run 'bun run cli/install.ts' to fix missing components.");
  }

  console.log("");
}

// Run if executed directly
doctor().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nDoctor failed: ${message}`);
  process.exit(1);
});
