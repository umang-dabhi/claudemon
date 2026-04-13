# Phase 1 Testing Guide

> Step-by-step guide to verify everything Phase 1 built works correctly.

---

## What Phase 1 Delivers

Phase 1 is the **foundation MVP**. After completing it, you can:

1. Install Claudemon with one command
2. Pick a starter Pokemon from 3 random commons
3. See your Pokemon with stats, level, XP bar
4. Pet your Pokemon (happiness + XP)
5. Earn XP from coding activities (commits, tests, edits, etc.)
6. Level up your Pokemon as you code
7. Use `/buddy` slash command in Claude Code

**What Phase 1 does NOT include yet:** Evolution, sprites (pixel art), wild encounters, catching, achievements, Pokedex, status line animation, legendary quests.

---

## Pre-Requisites

```bash
# Verify bun is installed
bun --version
# Expected: 1.x.x

# Verify project compiles
bun run typecheck
# Expected: no errors

# Verify formatting
bun run format:check
# Expected: all files pass (ignore "tests/**/*.ts" warning)
```

---

## Test 1: XP Formula Verification

Verify Gen 1 XP formulas are mathematically correct.

```bash
bun -e '
import { cumulativeXpForLevel } from "./src/engine/xp.ts";

const checks = [
  { group: "medium_fast", level: 5,   expected: 125 },
  { group: "medium_fast", level: 10,  expected: 1000 },
  { group: "medium_fast", level: 16,  expected: 4096 },
  { group: "medium_fast", level: 36,  expected: 46656 },
  { group: "medium_fast", level: 100, expected: 1000000 },
  { group: "slow",        level: 100, expected: 1250000 },
  { group: "fast",        level: 100, expected: 800000 },
];

let pass = 0;
for (const c of checks) {
  const actual = cumulativeXpForLevel(c.level, c.group);
  const ok = actual === c.expected;
  console.log(ok ? "PASS" : "FAIL", `${c.group} L${c.level}: ${actual} (expected ${c.expected})`);
  if (ok) pass++;
}
console.log(`\n${pass}/${checks.length} passed`);
'
```

**Expected:** All 7 checks pass.

---

## Test 2: Pokemon Data Integrity

Verify all 151 Pokemon are loaded with correct data.

```bash
bun -e '
import { POKEDEX, POKEMON_BY_ID } from "./src/engine/pokemon-data.ts";
import { EVOLUTION_CHAINS } from "./src/engine/evolution-data.ts";
import { STARTER_POOL } from "./src/engine/starter-pool.ts";

console.log("Pokemon count:", POKEDEX.length, POKEDEX.length === 151 ? "PASS" : "FAIL");
console.log("Evolution chains:", EVOLUTION_CHAINS.length);
console.log("Starter pool:", STARTER_POOL.length, STARTER_POOL.length >= 30 ? "PASS" : "FAIL");

// Spot checks
const bulba = POKEMON_BY_ID.get(1);
console.log("\nBulbasaur HP:", bulba?.baseStats.hp, bulba?.baseStats.hp === 45 ? "PASS" : "FAIL");
const mewtwo = POKEMON_BY_ID.get(150);
console.log("Mewtwo Special:", mewtwo?.baseStats.special, mewtwo?.baseStats.special === 154 ? "PASS" : "FAIL");
const mew = POKEMON_BY_ID.get(151);
console.log("Mew rarity:", mew?.rarity, mew?.rarity === "mythical" ? "PASS" : "FAIL");

// Verify all starters exist in Pokedex
const invalidStarters = STARTER_POOL.filter(id => !POKEMON_BY_ID.has(id));
console.log("Invalid starters:", invalidStarters.length, invalidStarters.length === 0 ? "PASS" : "FAIL");
'
```

**Expected:** All checks pass. 151 Pokemon, 30+ starters, correct base stats.

---

## Test 3: State Manager

Verify state persistence works (creates/loads/saves).

> **WARNING:** This test uses a temp dir via `process.env.HOME` override. The state path
> functions (`getStateDir()` etc.) resolve at call time, so this works correctly.
> If you see Charmander in `/buddy show` after running this test, the state leaked —
> run `rm ~/.claudemon/state.json` to fix.

```bash
# Clean any existing test state
rm -rf ~/.claudemon-test/

bun -e '
import { StateManager } from "./src/state/state-manager.ts";
import { initCodingStats } from "./src/engine/stats.ts";
import { POKEMON_BY_ID } from "./src/engine/pokemon-data.ts";

// Override state dir for testing
process.env.HOME = "/tmp/claudemon-test-" + Date.now();
const { mkdirSync } = await import("node:fs");
mkdirSync(process.env.HOME, { recursive: true });

const sm = StateManager.getInstance();

// Test 1: First run detection
const isFirst = await sm.isFirstRun();
console.log("First run:", isFirst, isFirst ? "PASS" : "FAIL");

// Test 2: Initialize player
const pokemon = POKEMON_BY_ID.get(4)!; // Charmander
const starter = {
  id: "test-uuid",
  pokemonId: 4,
  nickname: null,
  level: 5,
  currentXp: 0,
  totalXp: 0,
  codingStats: initCodingStats(pokemon.baseStats),
  happiness: 70,
  caughtAt: new Date().toISOString(),
  evolvedAt: null,
  isActive: true,
  personality: null,
  shiny: false,
  isStarter: true,
};
await sm.initializePlayer("trainer-123", "Umang", starter);
console.log("Player initialized: PASS");

// Test 3: Load back
StateManager.resetInstance();
const sm2 = StateManager.getInstance();
const state = await sm2.load();
console.log("State loaded:", state !== null ? "PASS" : "FAIL");
console.log("Active Pokemon:", sm2.getActivePokemon()?.pokemonId === 4 ? "PASS" : "FAIL");

// Cleanup
const { rmSync } = await import("node:fs");
rmSync(process.env.HOME, { recursive: true });
'
```

**Expected:** All 4 checks pass — first run detected, player initialized, state reloaded, active Pokemon found.

---

## Test 4: Stat Bar Rendering

Verify stat display looks correct.

```bash
bun -e '
import { renderStatBar, getTrainerTitle } from "./src/engine/stats.ts";

console.log("0%:  ", "[" + renderStatBar(0) + "]");
console.log("25%: ", "[" + renderStatBar(25) + "]");
console.log("50%: ", "[" + renderStatBar(50) + "]");
console.log("75%: ", "[" + renderStatBar(75) + "]");
console.log("100%:", "[" + renderStatBar(100) + "]");

console.log("\nTitles:");
console.log("L1:", getTrainerTitle(1));
console.log("L15:", getTrainerTitle(15));
console.log("L50:", getTrainerTitle(50));
console.log("L100:", getTrainerTitle(100));
'
```

**Expected:** Bars should show increasing fill (░ for empty, █ for filled). Titles should progress from "Bug Catcher" to "Professor".

---

## Test 5: Mono Sprite Renderer

Verify sprite rendering produces output.

```bash
bun -e '
import { pixelsToMono, pixelsToAnsi, wrapInCodeFence } from "./src/sprites/mono-renderer.ts";

// Simple 6x6 pixel art (a diamond shape)
const pixels = [
  [0, 0, 3, 3, 0, 0],
  [0, 3, 4, 4, 3, 0],
  [3, 4, 4, 4, 4, 3],
  [3, 4, 4, 4, 4, 3],
  [0, 3, 4, 4, 3, 0],
  [0, 0, 3, 3, 0, 0],
];

console.log("=== Mono Art ===");
console.log(pixelsToMono(pixels, 6, 6));

console.log("=== ANSI Art ===");
console.log(pixelsToAnsi(pixels, 6, 6));

console.log("=== Markdown Wrapped ===");
console.log(wrapInCodeFence(pixelsToMono(pixels, 6, 6), "DiamondMon"));
'
```

**Expected:** Three renderings of a diamond shape — Unicode blocks, colored ANSI (if terminal supports it), and markdown code fence.

---

## Test 6: MCP Server Starts

Verify the MCP server can start without errors.

```bash
# Server runs on stdio, so we just check it doesn't crash on startup
timeout 3 bun run src/server/index.ts 2>&1 || true
echo "Server started without crash: PASS"
```

**Expected:** No crash. It will hang waiting for stdin (that's normal — MCP servers are stdio-based). The timeout kills it after 3 seconds.

---

## Test 7: CLI Installer (Dry Run)

Verify the installer script runs.

```bash
bun run cli/install.ts 2>&1
```

**Expected:** Either installs successfully (registers MCP server, hooks, skill) or shows clear error messages if prerequisites are missing.

To verify installation:
```bash
bun run cli/doctor.ts
```

**Expected:** Shows checklist of what's installed with ✓ or ✗.

---

## Test 8: Full Integration (In Claude Code)

This tests the actual end-to-end experience. Do this AFTER running the installer.

1. **Start a new Claude Code session**
2. **Type `/buddy`** — should show help or prompt to pick a starter
3. **Type `/buddy starter`** — should show 3 random common Pokemon
4. **Type `/buddy starter 1`** (or 2 or 3) — should create your Pokemon
5. **Type `/buddy show`** — should display your Pokemon with stats and level
6. **Type `/buddy stats`** — should show detailed stat breakdown
7. **Type `/buddy pet`** — should show a reaction and give small XP
8. **Make a git commit** — PostToolUse hook should award XP in the background
9. **Type `/buddy show`** again — XP should have increased

---

## Test Summary Checklist

| # | Test | What It Verifies |
|---|------|-----------------|
| 1 | XP Formula | Gen 1 math is correct |
| 2 | Pokemon Data | All 151 loaded, stats accurate |
| 3 | State Manager | Persistence works (create/load/save) |
| 4 | Stat Bars | Visual rendering correct |
| 5 | Sprite Renderer | Mono + ANSI + markdown output |
| 6 | MCP Server | Starts without crash |
| 7 | CLI Installer | Registration works |
| 8 | Full Integration | End-to-end in Claude Code |

Tests 1-6 are automated (run in terminal). Test 7-8 require manual interaction.
