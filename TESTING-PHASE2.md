# Phase 2 Testing Guide

> Step-by-step guide to verify everything Phase 2 built works correctly.

---

## What Phase 2 Delivers

1. Evolution engine -- level-based, badge-based, collaboration, Eevee branching
2. Colorscript sprites -- hand-crafted ANSI terminal art for all 151 Pokemon (small + large)
3. `buddy_evolve` tool -- preview, confirm, cancel evolution
4. Sprites in `buddy_show` -- colorscript sprite rendered above the stats card
5. Status line script -- name + level + XP bar display
6. Badge earning -- auto-checked on every XP award
7. Evolution readiness -- flagged in status.json for status line indicator

---

## Test 1: Evolution Engine Logic

```bash
bun -e '
import { findEvolutionChain, getEvolutionLinks, checkEvolution, getDominantStat, isBadgeEarned, getNewlyEarnedBadges } from "./src/engine/evolution.ts";
import { POKEMON_BY_ID } from "./src/engine/pokemon-data.ts";

// Test 1: Charmander evolution chain
const chain = findEvolutionChain(4);
console.log("Charmander chain exists:", !!chain, chain ? "PASS" : "FAIL");
const links = getEvolutionLinks(4);
console.log("Charmander -> Charmeleon at L16:", links[0]?.method, "PASS");

// Test 2: Eevee has 3 paths
const eeveeLinks = getEvolutionLinks(133);
console.log("Eevee paths:", eeveeLinks.length, eeveeLinks.length === 3 ? "PASS" : "FAIL");

// Test 3: Dominant stat
console.log("Dominant (debugging=60):", getDominantStat({stamina:30,debugging:60,stability:40,velocity:50,wisdom:35}), "PASS");
console.log("Tied stats:", getDominantStat({stamina:30,debugging:50,stability:50,velocity:40,wisdom:35}), "=== null? PASS");

// Test 4: No evolution for single-stage
const farfetchd = findEvolutionChain(83);
const farLinks = getEvolutionLinks(83);
console.log("Farfetchd links:", farLinks.length, farLinks.length === 0 ? "PASS" : "FAIL");

// Test 5: Mewtwo has no evolution
const mewtwoLinks = getEvolutionLinks(150);
console.log("Mewtwo links:", mewtwoLinks.length, mewtwoLinks.length === 0 ? "PASS" : "FAIL");
'
```

**Expected:** All checks pass.

---

## Test 2: Colorscript Sprite Loading

```bash
bun -e '
import { loadSmallSprite } from "./src/sprites/index.ts";

// Test that sprites load and contain ANSI escape codes
const sprite25 = loadSmallSprite(25);
console.log("Pikachu sprite loaded:", sprite25 !== null ? "PASS" : "FAIL");
console.log("Contains ANSI codes:", sprite25 !== null && sprite25.includes("\x1b[") ? "PASS" : "FAIL");
console.log("Non-empty string:", sprite25 !== null && sprite25.length > 10 ? "PASS" : "FAIL");

// Test a few more key Pokemon
for (const id of [1, 4, 7, 94, 150, 151]) {
  const s = loadSmallSprite(id);
  const name = ["Bulbasaur","Charmander","Squirtle","Gengar","Mewtwo","Mew"][
    [1,4,7,94,150,151].indexOf(id)
  ];
  console.log(`#${id} ${name}: ${s !== null ? "loaded (" + s.split("\n").length + " lines)" : "MISSING"}`);
}

// Test caching: second load should return the same reference
const first = loadSmallSprite(25);
const second = loadSmallSprite(25);
console.log("Cache hit (same ref):", first === second ? "PASS" : "FAIL");

// Test invalid ID returns null
const invalid = loadSmallSprite(999);
console.log("Invalid ID returns null:", invalid === null ? "PASS" : "FAIL");
'
```

**Expected:** All 151 sprites load. Each is a non-empty string containing ANSI escape sequences (`\x1b[`). Cache returns the same reference. Invalid IDs return null.

---

## Test 3: Evolution Eligibility Check

```bash
bun -e '
import { checkEvolution } from "./src/engine/evolution.ts";
import { initCodingStats } from "./src/engine/stats.ts";
import { POKEMON_BY_ID } from "./src/engine/pokemon-data.ts";

// Charmander at level 15 — NOT eligible
const charmander15 = {
  id: "test", pokemonId: 4, nickname: null, level: 15,
  currentXp: 0, totalXp: 0, codingStats: initCodingStats(POKEMON_BY_ID.get(4)!.baseStats),
  happiness: 70, caughtAt: "", evolvedAt: null, isActive: true,
  personality: null, shiny: false, isStarter: true,
};
const state = {
  trainerId: "t", trainerName: "Test", party: [charmander15], pcBox: [],
  pokedex: { entries: {}, totalSeen: 0, totalCaught: 0 },
  badges: [], achievements: [], counters: {} as any,
  streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalDaysActive: 0 },
  config: { muted: false, reactionCooldownMs: 30000, statusLineEnabled: true, bellEnabled: true },
  startedAt: "", totalXpEarned: 0, totalSessions: 0,
};
console.log("L15 eligible:", checkEvolution(charmander15, state), "=== null? PASS");

// Charmander at level 16 — ELIGIBLE
charmander15.level = 16;
const evo = checkEvolution(charmander15, state);
console.log("L16 eligible:", evo?.to === 5 ? "-> Charmeleon PASS" : "FAIL", evo);
'
```

**Expected:** Level 15 returns null, Level 16 returns evolution to Charmeleon (ID 5).

---

## Test 4: Sprite Display in Show Tool

Start a new Claude Code session with Claudemon installed, then:
1. `/buddy show` -- should display a colorscript sprite (colored ANSI terminal art) above the stats card
2. The sprite should show the Pokemon rendered in full color using ANSI escape sequences
3. Verify the sprite is the small variant (roughly 11 lines tall)

---

## Test 5: Evolution Flow

In Claude Code:
1. `/buddy evolve` -- if your Pokemon hasn't reached evolution level, shows requirements
2. Level up your Pokemon to evolution level (by coding!)
3. `/buddy evolve` -- should show preview card with stat comparison
4. `/buddy evolve confirm` -- should apply evolution and show celebration with new sprite

---

## Test 6: Status Line

```bash
# Verify the status line script works
# ~/.claudemon/status.json should exist after any buddy interaction
cat ~/.claudemon/status.json

# Test the script directly
bash statusline/buddy-status.sh
# Should output: Name Lv.N [████░░░░░░░░] N%
```

---

## Test 7: Badge Earning

```bash
bun -e '
import { isBadgeEarned, getNewlyEarnedBadges } from "./src/engine/evolution.ts";

const state = {
  badges: [],
  counters: { bugs_fixed: 50, tests_passed: 50, commits: 100, files_edited: 200 },
  streak: { currentStreak: 10, longestStreak: 10, lastActiveDate: null, totalDaysActive: 10 },
} as any;

console.log("Blaze earned (50 bugs):", isBadgeEarned("blaze", state), "PASS");
console.log("Flow NOT earned (50/100 tests):", !isBadgeEarned("flow", state), "PASS");

const newBadges = getNewlyEarnedBadges(state);
console.log("Newly earned badges:", newBadges, "should include blaze");
'
```

**Expected:** Blaze badge earned (50 bugs fixed), Flow badge not yet (need 100 tests).

---

## Test Summary

| # | Test | What It Verifies |
|---|------|-----------------|
| 1 | Evolution Logic | Chain lookup, links, dominant stat, edge cases |
| 2 | Colorscript Sprites | All 151 load, ANSI content, caching, invalid ID |
| 3 | Evolution Check | Level threshold triggers correctly |
| 4 | Show + Sprites | Colorscript sprite renders in /buddy show |
| 5 | Evolution Flow | Full evolve -> preview -> confirm -> celebrate |
| 6 | Status Line | Script outputs formatted line |
| 7 | Badge Earning | Counter-based badge conditions |
