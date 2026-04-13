# Phase 4 Testing Guide

> Step-by-step guide to verify everything Phase 4 built works correctly.

---

## What Phase 4 Delivers

1. Reaction engine -- 15 types x 8 events = 120 reaction pools with type-flavored personality
2. Dynamic instructions -- context-aware system prompt with active Pokemon, evolution proximity, pending encounters
3. Personality system -- Claude naturally references the Pokemon using type-appropriate reactions
4. `<!-- buddy: -->` comment format -- invisible status line reactions embedded in Claude's responses

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

## Test 1: Reaction Engine

Verify reactions exist for all 15 types, placeholder substitution works, and cooldown enforcement is correct.

```bash
bun -e '
import { getReaction, shouldReact, getTypePersonality } from "./src/engine/reactions.ts";

// All 15 Pokemon types
const types = [
  "Normal","Fire","Water","Electric","Grass","Ice","Fighting",
  "Poison","Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon"
];

// All 8 reaction events
const events = [
  "error","test_fail","test_pass","commit",
  "level_up","encounter","pet","idle"
];

// Test reactions for all 15 types x 8 events
let total = 0;
let pass = 0;
for (const type of types) {
  for (const event of events) {
    total++;
    try {
      const reaction = getReaction("TestMon", type, event);
      if (reaction && reaction.length > 0) {
        pass++;
      } else {
        console.log(`FAIL: ${type}/${event} returned empty`);
      }
    } catch (e) {
      console.log(`FAIL: ${type}/${event} threw error:`, e.message);
    }
  }
}
console.log(`Reaction coverage: ${pass}/${total}`, pass === total ? "PASS" : "FAIL");

// Test {name} placeholder substitution
const reaction = getReaction("Sparky", "Electric", "test_pass");
console.log("\nSample reaction:", reaction);
console.log("Name substituted:", !reaction.includes("{name}") ? "PASS" : "FAIL");
console.log("Contains Sparky:", reaction.includes("Sparky") ? "PASS" : "FAIL");

// Test with different names
const ghostReact = getReaction("Gengar", "Ghost", "error");
console.log("Ghost reaction:", ghostReact);
console.log("Ghost name sub:", ghostReact.includes("Gengar") ? "PASS" : "FAIL");

// Test cooldown enforcement
const now = Date.now();
console.log("\nCooldown tests:");
console.log("0ms ago (within cooldown):", shouldReact(now), shouldReact(now) === false ? "PASS" : "FAIL");
console.log("29s ago (within cooldown):", shouldReact(now - 29000), shouldReact(now - 29000) === false ? "PASS" : "FAIL");
console.log("30s ago (at cooldown):", shouldReact(now - 30000), shouldReact(now - 30000) === true ? "PASS" : "FAIL");
console.log("60s ago (past cooldown):", shouldReact(now - 60000), shouldReact(now - 60000) === true ? "PASS" : "FAIL");

// Test custom cooldown
console.log("5s custom, 4s ago:", shouldReact(now - 4000, 5000), shouldReact(now - 4000, 5000) === false ? "PASS" : "FAIL");
console.log("5s custom, 6s ago:", shouldReact(now - 6000, 5000), shouldReact(now - 6000, 5000) === true ? "PASS" : "FAIL");

// Test type personalities
console.log("\nType personalities:");
for (const type of types) {
  const personality = getTypePersonality(type);
  console.log(`  ${type}: ${personality.slice(0, 50)}...`, personality.length > 0 ? "OK" : "FAIL");
}
'
```

**Expected:** All 120 type/event combinations return non-empty strings. `{name}` placeholders are replaced with the actual Pokemon name. Cooldown blocks reactions within 30 seconds (default), allows them after. All 15 types have personality descriptions.

---

## Test 2: Dynamic Instructions

Verify instruction building for first-run, active Pokemon, evolution proximity, and pending encounters.

```bash
bun -e '
import { buildInstructions } from "./src/server/instructions.ts";
import { initCodingStats } from "./src/engine/stats.ts";
import { POKEMON_BY_ID } from "./src/engine/pokemon-data.ts";

// Test 1: First-run instructions (null state)
const firstRun = buildInstructions(null);
console.log("=== First Run ===");
console.log(firstRun);
console.log("Contains starter guidance:", firstRun.includes("starter") ? "PASS" : "FAIL");
console.log("");

// Test 2: First-run instructions (empty party)
const emptyParty = buildInstructions({
  party: [], pcBox: [], pokedex: { entries: {}, totalSeen: 0, totalCaught: 0 },
  badges: [], achievements: [], counters: {} as any,
  streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalDaysActive: 0 },
  config: { muted: false, reactionCooldownMs: 30000, statusLineEnabled: true, bellEnabled: true },
  startedAt: "", totalXpEarned: 0, totalSessions: 0, trainerId: "t", trainerName: "Test",
} as any);
console.log("=== Empty Party ===");
console.log(emptyParty);
console.log("Contains starter guidance:", emptyParty.includes("starter") ? "PASS" : "FAIL");
console.log("");

// Test 3: Active Pokemon instructions
const charmander = POKEMON_BY_ID.get(4)!;
const activeState = {
  party: [{
    id: "test", pokemonId: 4, nickname: null, level: 14,
    currentXp: 200, totalXp: 3000,
    codingStats: initCodingStats(charmander.baseStats),
    happiness: 100, caughtAt: "", evolvedAt: null,
    isActive: true, personality: null, shiny: false, isStarter: true,
  }],
  pcBox: [],
  pokedex: { entries: {}, totalSeen: 0, totalCaught: 0 },
  badges: [], achievements: [], counters: {} as any,
  streak: { currentStreak: 5, longestStreak: 5, lastActiveDate: null, totalDaysActive: 5 },
  config: { muted: false, reactionCooldownMs: 30000, statusLineEnabled: true, bellEnabled: true },
  startedAt: "", totalXpEarned: 3000, totalSessions: 10,
  trainerId: "t", trainerName: "Test",
  pendingEncounter: null,
  xpSinceLastEncounter: 0,
} as any;

const activeInstructions = buildInstructions(activeState);
console.log("=== Active Pokemon ===");
console.log(activeInstructions);
console.log("");
console.log("Contains Charmander:", activeInstructions.includes("Charmander") ? "PASS" : "FAIL");
console.log("Contains Fire type:", activeInstructions.includes("Fire") ? "PASS" : "FAIL");
console.log("Contains level:", activeInstructions.includes("Level 14") ? "PASS" : "FAIL");
console.log("Contains buddy comment format:", activeInstructions.includes("<!-- buddy:") ? "PASS" : "FAIL");
console.log("Contains personality:", activeInstructions.includes("Personality:") ? "PASS" : "FAIL");
console.log("");

// Test 4: Evolution proximity note (Charmander evolves at L16, within 200 XP)
// Charmander at L15 with small currentXp should be close to L16
const closeToEvolve = {
  ...activeState,
  party: [{
    ...activeState.party[0],
    level: 15,
    currentXp: 3500,
  }],
};
const evoInstructions = buildInstructions(closeToEvolve);
console.log("=== Evolution Proximity ===");
const hasEvoNote = evoInstructions.includes("evolv") || evoInstructions.includes("Charmeleon");
console.log("Contains evolution reference:", hasEvoNote ? "PASS" : "MAYBE (depends on XP distance)");
console.log("");

// Test 5: Encounter note
const encounterState = {
  ...activeState,
  pendingEncounter: { pokemonId: 16, level: 8, catchCondition: { requiredStat: null, minStatValue: 0, requiredLevel: 1 } },
};
const encInstructions = buildInstructions(encounterState);
console.log("=== Pending Encounter ===");
console.log("Contains Pidgey:", encInstructions.includes("Pidgey") ? "PASS" : "FAIL");
console.log("Contains catch:", encInstructions.includes("catch") ? "PASS" : "FAIL");
'
```

**Expected:**
- First-run (null or empty party): guides user to `/buddy starter`
- Active Pokemon: includes name, level, type, personality, `<!-- buddy: -->` comment format
- Evolution proximity: mentions evolving (if within 200 XP of the evolution level)
- Pending encounter: mentions the wild Pokemon name and suggests `/buddy catch`

---

## Test 3: Personality Integration (in Claude Code)

This tests the end-to-end personality system. Requires a running Claudemon instance.

### 3a: Session behavior

1. Start a new Claude Code session
2. Code for a while -- make commits, run tests, fix bugs
3. Observe that Claude occasionally references your Pokemon by name in its responses
4. References should match the Pokemon's type personality:
   - Fire types: intense, passionate language
   - Water types: calm, flowing metaphors
   - Electric types: energetic, zippy expressions
   - Bug types: ironic self-awareness about finding bugs
   - Ghost types: dark humor and spooky references
5. Frequency should be subtle -- roughly 1 in 3-4 messages, not every response

### 3b: Buddy comments in responses

1. After a few interactions, check that Claude includes invisible buddy comments:
   ```
   <!-- buddy: *Charmander wags its tail* -->
   ```
2. These should appear naturally within Claude's responses (not every message)
3. The stop hook (`hooks/stop.sh`) extracts these and writes them to `~/.claudemon/status.json`

### 3c: Status line reactions

1. After Claude sends a response with a buddy comment:
   ```bash
   cat ~/.claudemon/status.json | jq '.reaction'
   ```
2. Should show the extracted reaction text
3. Run the status line to see it displayed:
   ```bash
   bash statusline/buddy-status.sh
   ```

### 3d: Reaction triggers

Verify different events produce appropriate reactions:

| Action | Expected Behavior |
|--------|-------------------|
| Encounter an error | Claude may mention your Pokemon reacting to the bug |
| Pass a test | Claude may mention your Pokemon celebrating |
| Make a commit | Claude may acknowledge the commit through your Pokemon |
| Level up | Claude announces the level-up through your Pokemon |
| Type your Pokemon's name | Name-react hook fires, status line shows reaction |

---

## Test Summary Checklist

| # | Test | What It Verifies |
|---|------|-----------------|
| 1 | Reaction Engine | 120 reaction pools, name substitution, cooldown logic |
| 2 | Dynamic Instructions | First-run, active Pokemon, evolution note, encounter note |
| 3 | Personality (Claude Code) | Type-flavored reactions appear naturally in session |

Test 1-2 are automated (run in terminal). Test 3 requires manual interaction in Claude Code across multiple messages.
