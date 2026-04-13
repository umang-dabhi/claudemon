# Phase 3 Testing Guide

> Step-by-step guide to verify everything Phase 3 built works correctly.

---

## What Phase 3 Delivers

1. Wild encounter system -- activity-type to Pokemon-type mapping, trigger threshold, weighted rarity
2. Encounter pools -- pre-built per-type pools of base-stage Pokemon (no legendaries/mythicals)
3. Catching mechanics -- level gate, stat gate, catch-rate roll
4. Party management -- list, switch active, deposit to PC, withdraw from PC (max 6)
5. Pokedex -- 151-entry grid with caught/seen/unknown symbols, filters, per-Pokemon detail view
6. Achievement system -- 18 achievements across trainer/coding/pokemon categories
7. Milestone discoveries -- specific Pokemon appear at coding counter thresholds
8. Legendary quest chains -- 5 multi-step quests for Articuno, Zapdos, Moltres, Mewtwo, Mew
9. Stop hook -- extracts `<!-- buddy: -->` comments from Claude's responses, writes reaction to status.json
10. Name reaction hook -- detects active Pokemon's name in user prompts, writes reaction to status.json

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
# Expected: all files pass
```

---

## Test 1: Encounter Engine

Verify activity-type mapping, trigger threshold, and catch conditions.

```bash
bun -e '
import { getEncounterTypes, shouldTriggerEncounter, getCatchCondition } from "./src/engine/encounters.ts";

// Test encounter types for different activities
const commitTypes = getEncounterTypes("commit");
console.log("commit types:", commitTypes, commitTypes.includes("Normal") ? "PASS" : "FAIL");

const testTypes = getEncounterTypes("test_pass");
console.log("test_pass types:", testTypes, testTypes.includes("Fighting") ? "PASS" : "FAIL");

const bugTypes = getEncounterTypes("bug_fix");
console.log("bug_fix types:", bugTypes, bugTypes.includes("Bug") ? "PASS" : "FAIL");

const refactorTypes = getEncounterTypes("large_refactor");
console.log("large_refactor types:", refactorTypes, refactorTypes.includes("Psychic") ? "PASS" : "FAIL");

// Test trigger threshold (500 XP)
console.log("499 XP triggers:", shouldTriggerEncounter(499), shouldTriggerEncounter(499) === false ? "PASS" : "FAIL");
console.log("500 XP triggers:", shouldTriggerEncounter(500), shouldTriggerEncounter(500) === true ? "PASS" : "FAIL");
console.log("501 XP triggers:", shouldTriggerEncounter(501), shouldTriggerEncounter(501) === true ? "PASS" : "FAIL");

// Test catch conditions for different rarities
const commonCatch = getCatchCondition(16); // Pidgey (common)
console.log("Pidgey (common) - no stat req:", commonCatch.requiredStat === null ? "PASS" : "FAIL");
console.log("Pidgey - level req:", commonCatch.requiredLevel, commonCatch.requiredLevel === 1 ? "PASS" : "FAIL");

const uncommonCatch = getCatchCondition(63); // Abra (uncommon)
console.log("Abra (uncommon) - has stat req:", uncommonCatch.requiredStat !== null ? "PASS" : "FAIL");
console.log("Abra - level req:", uncommonCatch.requiredLevel, uncommonCatch.requiredLevel === 10 ? "PASS" : "FAIL");

const rareCatch = getCatchCondition(147); // Dratini (rare)
console.log("Dratini (rare) - level req:", rareCatch.requiredLevel, rareCatch.requiredLevel === 25 ? "PASS" : "FAIL");
'
```

**Expected:** All checks pass. Commit encounters map to Normal/Flying, test encounters to Fighting/Normal, etc. Trigger fires at 500 XP. Commons have no stat requirement, uncommons need level 10, rares need level 25.

---

## Test 2: Encounter Pool

Verify pools exist for all 15 types, exclude legendaries/mythicals, and contain only base-stage Pokemon.

```bash
bun -e '
import { TYPE_POOLS } from "./src/engine/encounter-pool.ts";
import { POKEMON_BY_ID } from "./src/engine/pokemon-data.ts";

// Verify pools exist for all 15 types
const allTypes = [
  "Normal","Fire","Water","Electric","Grass","Ice","Fighting",
  "Poison","Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon"
];
let typePass = 0;
for (const t of allTypes) {
  const pool = TYPE_POOLS.get(t);
  if (pool) {
    const total = pool.common.length + pool.uncommon.length + pool.rare.length;
    console.log(`${t}: ${total} Pokemon (${pool.common.length}C/${pool.uncommon.length}U/${pool.rare.length}R)`);
    typePass++;
  } else {
    console.log(`${t}: MISSING POOL — FAIL`);
  }
}
console.log(`\nPools present: ${typePass}/15`, typePass === 15 ? "PASS" : "FAIL");

// Verify legendary/mythical excluded
const legendaryIds = [144, 145, 146, 150, 151]; // Articuno, Zapdos, Moltres, Mewtwo, Mew
let legendaryFound = false;
for (const [_type, pool] of TYPE_POOLS) {
  for (const id of [...pool.common, ...pool.uncommon, ...pool.rare]) {
    if (legendaryIds.includes(id)) {
      console.log("FAIL: legendary/mythical found in pool:", id);
      legendaryFound = true;
    }
  }
}
console.log("No legendaries in pools:", !legendaryFound ? "PASS" : "FAIL");

// Verify only base-stage Pokemon included (spot-check evolved forms)
const evolvedIds = [5, 6, 9, 26, 65, 68]; // Charmeleon, Charizard, Blastoise, Raichu, Alakazam, Machamp
let evolvedFound = false;
for (const [_type, pool] of TYPE_POOLS) {
  for (const id of [...pool.common, ...pool.uncommon, ...pool.rare]) {
    if (evolvedIds.includes(id)) {
      console.log("FAIL: evolved Pokemon found in pool:", id, POKEMON_BY_ID.get(id)?.name);
      evolvedFound = true;
    }
  }
}
console.log("No evolved Pokemon in pools:", !evolvedFound ? "PASS" : "FAIL");
'
```

**Expected:** All 15 type pools present. No legendary/mythical IDs (144-146, 150, 151) in any pool. No evolved-form IDs (like Charmeleon, Charizard) in any pool.

---

## Test 3: Achievements

Verify all 18 achievements exist and condition evaluation works.

```bash
bun -e '
import { ACHIEVEMENTS, isConditionMet, checkNewAchievements } from "./src/gamification/achievements.ts";

// Test achievement count
console.log("Achievement count:", ACHIEVEMENTS.length, ACHIEVEMENTS.length === 18 ? "PASS" : "FAIL");

// Count by category
const byCategory = ACHIEVEMENTS.reduce((acc, a) => {
  acc[a.category] = (acc[a.category] ?? 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log("By category:", byCategory);
console.log("Trainer:", byCategory.trainer, byCategory.trainer === 7 ? "PASS" : "FAIL");
console.log("Coding:", byCategory.coding, byCategory.coding === 7 ? "PASS" : "FAIL");
console.log("Pokemon:", byCategory.pokemon, byCategory.pokemon === 2 ? "PASS" : "FAIL");
// Remaining 2 in other categories

// Test condition evaluation with a mock state
const mockState = {
  party: [{ pokemonId: 4, level: 15, isActive: true, evolvedAt: null }],
  pcBox: [],
  pokedex: { entries: {}, totalSeen: 5, totalCaught: 3 },
  badges: [],
  achievements: [],
  counters: { bugs_fixed: 12, tests_passed: 50, commits: 30, builds_succeeded: 10 },
  streak: { currentStreak: 8, longestStreak: 8, lastActiveDate: null, totalDaysActive: 8 },
} as any;

// first_steps: party_size >= 1
console.log("first_steps met:", isConditionMet({ type: "party_size", minSize: 1 }, mockState) ? "PASS" : "FAIL");

// bug_catcher_10: bugs_fixed >= 10
console.log("bug_catcher met:", isConditionMet({ type: "counter", counter: "bugs_fixed", threshold: 10 }, mockState) ? "PASS" : "FAIL");

// iron_coder: streak >= 7
console.log("iron_coder met:", isConditionMet({ type: "streak", minDays: 7 }, mockState) ? "PASS" : "FAIL");

// getting_started: level >= 10 (party max is 15)
console.log("level 10 met:", isConditionMet({ type: "level", minLevel: 10 }, mockState) ? "PASS" : "FAIL");

// master: level >= 100 (not met)
console.log("level 100 not met:", !isConditionMet({ type: "level", minLevel: 100 }, mockState) ? "PASS" : "FAIL");

// Test new achievement detection
const newAchievements = checkNewAchievements(mockState);
console.log("New achievements found:", newAchievements.length);
console.log("Includes first_steps:", newAchievements.some(a => a.id === "first_steps") ? "PASS" : "FAIL");
console.log("Includes bug_catcher:", newAchievements.some(a => a.id === "bug_catcher_10") ? "PASS" : "FAIL");
console.log("Includes iron_coder:", newAchievements.some(a => a.id === "iron_coder") ? "PASS" : "FAIL");
console.log("Does NOT include master:", !newAchievements.some(a => a.id === "master") ? "PASS" : "FAIL");
'
```

**Expected:** 18 total achievements (7 trainer, 7 coding, 2 pokemon, plus any others). Conditions evaluate correctly against mock state. `checkNewAchievements` returns only achievements whose conditions are met and not already unlocked.

---

## Test 4: Milestones

Verify all 8 milestones exist and trigger at correct counter values.

```bash
bun -e '
import { MILESTONES, checkNewMilestones } from "./src/gamification/milestones.ts";

// Test milestone count
console.log("Milestone count:", MILESTONES.length, MILESTONES.length === 8 ? "PASS" : "FAIL");

// Print all milestones
for (const m of MILESTONES) {
  console.log(`  #${m.pokemonId} at ${m.counter} >= ${m.threshold}: "${m.message}"`);
}

// Test: 1 commit triggers Pidgey (#16)
const counters1 = { commits: 1 };
const caught1 = new Set<number>();
const new1 = checkNewMilestones(counters1, caught1);
console.log("\n1 commit -> Pidgey:", new1.some(m => m.pokemonId === 16) ? "PASS" : "FAIL");

// Test: 10 tests passed triggers Machop (#66)
const counters2 = { tests_passed: 10 };
const new2 = checkNewMilestones(counters2, new Set<number>());
console.log("10 tests -> Machop:", new2.some(m => m.pokemonId === 66) ? "PASS" : "FAIL");

// Test: 50 commits triggers Abra (#63) but NOT Magikarp (#129, needs 200)
const counters3 = { commits: 50 };
const new3 = checkNewMilestones(counters3, new Set<number>());
console.log("50 commits -> Abra:", new3.some(m => m.pokemonId === 63) ? "PASS" : "FAIL");
console.log("50 commits -> no Magikarp:", !new3.some(m => m.pokemonId === 129) ? "PASS" : "FAIL");

// Test: already caught Pokemon excluded
const counters4 = { commits: 1 };
const caught4 = new Set([16]); // Pidgey already caught
const new4 = checkNewMilestones(counters4, caught4);
console.log("Already caught excluded:", !new4.some(m => m.pokemonId === 16) ? "PASS" : "FAIL");
'
```

**Expected:** 8 milestones. Pidgey at 1 commit, Machop at 10 tests, Abra at 50 commits. Already-caught Pokemon are excluded from results.

---

## Test 5: Legendary Quests

Verify all 5 quest chains exist and progress tracking works.

```bash
bun -e '
import { LEGENDARY_QUESTS, getQuestProgress } from "./src/gamification/legendary-quests.ts";

// Test 5 quests exist
console.log("Quest count:", LEGENDARY_QUESTS.length, LEGENDARY_QUESTS.length === 5 ? "PASS" : "FAIL");

// Print quest names
for (const q of LEGENDARY_QUESTS) {
  console.log(`  #${q.pokemonId}: "${q.name}" (${q.steps.length} steps)`);
}

// Verify each quest has exactly 4 steps
const all4Steps = LEGENDARY_QUESTS.every(q => q.steps.length === 4);
console.log("All quests have 4 steps:", all4Steps ? "PASS" : "FAIL");

// Test progress tracking with empty state
const emptyState = {
  party: [{ pokemonId: 4, level: 5, isActive: true, evolvedAt: null }],
  pcBox: [],
  pokedex: { entries: {}, totalSeen: 0, totalCaught: 0 },
  badges: [], achievements: [],
  counters: { bugs_fixed: 0, tests_passed: 0, commits: 0, tests_written: 0 },
  streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalDaysActive: 0 },
} as any;

const progress = getQuestProgress(emptyState);
console.log("\nEmpty state progress:");
for (const p of progress) {
  console.log(`  ${p.quest.name}: ${p.stepsCompleted}/${p.totalSteps}`);
}
const allZero = progress.every(p => p.stepsCompleted === 0);
console.log("All at 0 progress:", allZero ? "PASS" : "FAIL");

// Test progress with partial completion (Zapdos: 100 tests passed = step 1 done)
const partialState = {
  ...emptyState,
  counters: { ...emptyState.counters, tests_passed: 100, tests_written: 50 },
};
const partial = getQuestProgress(partialState);
const zapdos = partial.find(p => p.quest.pokemonId === 145);
console.log("\nZapdos (100 tests, 50 written):", zapdos?.stepsCompleted, "/", zapdos?.totalSteps);
console.log("Zapdos step 1+2 done:", zapdos?.stepsCompleted === 2 ? "PASS" : "FAIL");
'
```

**Expected:** 5 quests (Articuno #144, Zapdos #145, Moltres #146, Mewtwo #150, Mew #151), each with 4 steps. Empty state yields 0 progress on all. Partial completion tracked sequentially.

---

## Test 6: Colorscript Sprites

Verify sprite loading for all 151, caching, and invalid ID handling.

```bash
bun -e '
import { loadSmallSprite } from "./src/sprites/index.ts";

// Test loading for all 151
let loaded = 0;
let failed = [];
for (let id = 1; id <= 151; id++) {
  const sprite = loadSmallSprite(id);
  if (sprite !== null && sprite.length > 0) {
    loaded++;
  } else {
    failed.push(id);
  }
}
console.log(`Sprites loaded: ${loaded}/151`, loaded === 151 ? "PASS" : "FAIL");
if (failed.length > 0) {
  console.log("Failed IDs:", failed);
}

// Test caching: load Pikachu twice, should be same reference
const a = loadSmallSprite(25);
const b = loadSmallSprite(25);
console.log("Cache works (same ref):", a === b ? "PASS" : "FAIL");

// Test invalid ID returns null
console.log("ID 0:", loadSmallSprite(0) === null ? "PASS" : "FAIL");
console.log("ID 999:", loadSmallSprite(999) === null ? "PASS" : "FAIL");
console.log("ID -1:", loadSmallSprite(-1) === null ? "PASS" : "FAIL");
'
```

**Expected:** All 151 sprites load successfully. Cache returns the same reference. Invalid IDs (0, 999, -1) return null.

---

## Test 7: MCP Tools (in Claude Code)

These tests require an installed Claudemon instance running inside Claude Code. Run each command and verify the output.

### 7a: Catch tool

1. **No pending encounter:**
   - `/buddy catch` -- should say "No wild Pokemon nearby! Keep coding and one will appear."

2. **With pending encounter** (code enough to accumulate 500+ XP, then a wild Pokemon appears):
   - `/buddy catch` -- shows encounter preview: sprite, name, type, level, catch requirements, rarity
   - `/buddy catch confirm` -- attempts the catch. On success: "Gotcha! {name} was caught!" with Pokedex count. On failure: "{name} broke free!"

### 7b: Party tool

1. `/buddy party` -- lists all party Pokemon with sprites, names, levels, types, active marker
2. `/buddy switch 2` -- switches active Pokemon to slot 2 (if you have more than 1)
3. `/buddy deposit 2` -- sends party slot 2 to PC Box
4. `/buddy withdraw 1` -- retrieves first Pokemon from PC Box back to party

### 7c: Pokedex tool

1. `/buddy pokedex` -- shows 151-entry grid using symbols (caught/seen/unknown)
2. `/buddy pokedex caught` -- lists only caught Pokemon with names, types, levels
3. `/buddy pokedex Pikachu` -- shows detailed view: sprite, stats, evolution chain, catch status

### 7d: Achievements tool

1. `/buddy achievements` -- shows all 18 achievements grouped by category (Trainer, Coding, Pokemon)
2. Unlocked achievements show a checkmark and unlock date
3. Locked achievements show progress (e.g., "50/100 tests" or "Lv.15/50")

### 7e: Legendary tool

1. `/buddy legendary` -- shows all 5 quest chains with sprites
2. Each quest shows its name, 4 steps with completion markers, and overall progress

---

## Test 8: Hooks

### 8a: Stop hook (buddy comment extraction)

The stop hook reads Claude's response and extracts `<!-- buddy: ... -->` comments.

```bash
# Simulate the stop hook with a mock response containing a buddy comment
echo '{"tool_response":"Some text <!-- buddy: *Charmander wags its tail* --> more text"}' | \
  bash hooks/stop.sh
echo "Exit code: $?"
# Expected: exit code 0 (always)

# If ~/.claudemon/status.json exists, check it was updated:
cat ~/.claudemon/status.json | jq '.reaction // "no reaction"'
```

**Expected:** Hook always exits 0. If status.json exists, the reaction field is updated with the extracted comment.

### 8b: User prompt submit hook (name mention detection)

The name-react hook detects when the user mentions their active Pokemon's name.

```bash
# Simulate mentioning the Pokemon's name in a prompt
# First check what your active Pokemon is named:
jq '.party[] | select(.isActive==true)' ~/.claudemon/state.json 2>/dev/null
jq '.name' ~/.claudemon/status.json 2>/dev/null

# Simulate a prompt containing the Pokemon's name (replace "Charmander" with your actual Pokemon):
echo '{"user_prompt":"Hey Charmander, how are you doing today?"}' | \
  bash hooks/user-prompt-submit.sh
echo "Exit code: $?"
# Expected: exit code 0 (always)

# Check status.json for the reaction
cat ~/.claudemon/status.json | jq '.reaction // "no reaction"'
# Expected: something like "*Charmander perks up!*" or "*Charmander wiggles happily!*"
```

**Expected:** Hook always exits 0. When the Pokemon's name appears in the user prompt (case-insensitive), a reaction is written to status.json. When the name is absent, no reaction is written.

---

## Test Summary Checklist

| # | Test | What It Verifies |
|---|------|-----------------|
| 1 | Encounter Engine | Activity-type mapping, 500 XP trigger, catch conditions by rarity |
| 2 | Encounter Pool | 15 type pools, no legendaries, base-stage only |
| 3 | Achievements | 18 definitions, condition evaluation, new achievement detection |
| 4 | Milestones | 8 definitions, counter threshold triggers, caught exclusion |
| 5 | Legendary Quests | 5 quest chains, 4 steps each, sequential progress tracking |
| 6 | Colorscript Sprites | All 151 load, caching works, invalid IDs return null |
| 7 | MCP Tools | catch, party, pokedex, achievements, legendary commands work in Claude Code |
| 8 | Hooks | stop.sh extracts buddy comments, user-prompt-submit.sh detects name mentions |

Tests 1-6 are automated (run in terminal). Tests 7-8 require manual interaction in Claude Code.
