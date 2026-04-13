# Claudemon — Testing Guide

> Single testing document covering all phases. Automated tests + manual Claude Code tests.

---

## Quick Start

```bash
# Run ALL automated tests (255 tests, ~60ms)
bun test

# Run only the E2E suite (84 tests covering all phases)
bun test tests/e2e/full-suite.test.ts

# Run specific unit test suites
bun test tests/engine/xp.test.ts           # XP formulas
bun test tests/engine/evolution.test.ts     # Evolution engine
bun test tests/engine/encounters.test.ts    # Encounter system
bun test tests/engine/stats.test.ts         # Stat system
bun test tests/gamification/achievements.test.ts  # Achievements

# Typecheck
bun run typecheck

# Format check
bun run format:check
```

---

## Automated Test Suites

### Test Suite Overview

| Suite | File | Tests | Covers |
|-------|------|-------|--------|
| XP Engine | `tests/engine/xp.test.ts` | 23 | Gen 1 XP formulas, leveling, multi level-up |
| Evolution | `tests/engine/evolution.test.ts` | 27 | Chains, eligibility, Eevee branching, badges |
| Encounters | `tests/engine/encounters.test.ts` | 20 | Trigger, pools, catch conditions |
| Stats | `tests/engine/stats.test.ts` | 28 | Stat init, display, bars, titles |
| Achievements | `tests/gamification/achievements.test.ts` | 26 | Conditions, new detection, integrity |
| **E2E Suite** | `tests/e2e/full-suite.test.ts` | **84** | **All phases end-to-end** |
| **Total** | | **255** | |

### E2E Suite Breakdown

The E2E suite (`tests/e2e/full-suite.test.ts`) covers every phase in one run:

**Phase 1 — Foundation (30 tests)**
- Pokemon data integrity (151 Pokemon, IDs, base stats, rarity)
- XP formulas match Gen 1 at known checkpoints
- Level-up, multi level-up, max level cap
- Stat system (init, scaling, boost, bars, titles)
- Constants validation (limits, awards, badges, titles)

**Phase 2 — Evolution & Sprites (19 tests)**
- Evolution chains (Charmander, Eevee, single-stage)
- Evolution eligibility (level threshold, badge, collaboration)
- Dominant stat for Eevee branching (including tie detection)
- Apply evolution (pokemonId change, evolvedAt timestamp)
- Badge earning and filtering
- Colorscript sprites (all 151 load, ANSI content, caching, invalid IDs)

**Phase 3 — Gamification (27 tests)**
- Encounter trigger threshold (500 XP)
- Encounter type mapping (all 13 event types)
- Encounter pool integrity (15 types, no legendaries, base-stage only)
- Achievement conditions (counter, level, streak, party_size)
- Achievement detection and deduplication
- Milestones (Pidgey at 1 commit, Abra at 50, exclusion of caught)
- Legendary quests (5 quests, 4 steps each, progress tracking)

**Phase 4 — Reactions & Personality (8 tests)**
- Reactions for all 15 types
- `{name}` placeholder substitution
- Cooldown enforcement
- Dynamic instructions (null state, active Pokemon, encounter notes)

**Cross-Phase Integration (5 tests)**
- Starter pool Pokemon all have sprites
- Evolution targets exist in Pokedex
- Milestone Pokemon exist in Pokedex
- XP → level-up → evolution pipeline
- Badge earning → evolution unlock pipeline

---

## Manual Claude Code Tests

These tests require an active Claude Code session with Claudemon installed.

### Setup

```bash
# Install (or update) Claudemon
bun run cli/install.ts

# Verify installation
bun run cli/doctor.ts

# Clear state for fresh testing (optional)
rm ~/.claudemon/state.json
```

### Test M1: Starter Selection

1. Start a new Claude Code session
2. Type `/buddy` — should detect no Pokemon → show 3 random starters with sprites
3. Type `/buddy starter` — should show the 3 options with names, types, stats
4. Type `/buddy starter 1` (or 2 or 3) — should create Pokemon at Level 5
5. Verify: colored sprite displayed, stats shown, congratulations message

**Expected:** Pokemon created with sprite, stats, and personality message.

### Test M2: Show & Stats

1. `/buddy show` — full display: colorscript sprite + stats card + XP bar + trainer info
2. `/buddy compact` — one-line: name + level + XP bar
3. `/buddy stats` — detailed stat breakdown with base vs bonus

**Expected:** All three display modes render correctly.

### Test M3: Pet & XP

1. `/buddy pet` — happiness +5, small XP, type-appropriate reaction
2. `/buddy show` — verify XP increased
3. Pet multiple times — watch XP accumulate

**Expected:** Each pet awards XP and shows a reaction.

### Test M4: XP from Coding

1. Make a git commit in the terminal
2. `/buddy show` — verify XP increased from the commit (+15 XP)
3. Write a test file — verify XP increase
4. Run tests — verify XP increase on pass

**Expected:** PostToolUse hook detects events and awards XP automatically.

### Test M5: Level Up

1. Keep coding until your Pokemon levels up
2. A terminal bell should sound on level-up
3. `/buddy show` — verify new level displayed

**Expected:** Level increases, stats recalculate, bell sounds.

### Test M6: Evolution

1. Level your Pokemon to its evolution level (e.g., Pidgey at L18)
2. `/buddy evolve` — should show preview with stat comparison
3. `/buddy evolve confirm` — should apply evolution with new sprite
4. `/buddy show` — verify new species displayed

**Expected:** Evolution preview → confirm → celebration with sprite.

### Test M7: Wild Encounters

1. Code for a while (~500 XP worth of activity)
2. A wild Pokemon should appear (terminal bell)
3. `/buddy catch` — shows the encountered Pokemon with catch requirements
4. `/buddy catch confirm` — attempts to catch (may succeed or fail based on stats)
5. If caught: `/buddy party` to see it in your party
6. If fled: keep coding, it'll return

**Expected:** Encounters trigger periodically, catch based on stats/level.

### Test M8: Party Management

1. Catch at least 2 Pokemon
2. `/buddy party` — shows party with sprites and ★ for active
3. `/buddy switch 2` — switches active Pokemon
4. `/buddy show` — verify different Pokemon displayed
5. If party full (6): `/buddy deposit 3` — moves to PC box
6. `/buddy withdraw 1` — moves from PC box to party

**Expected:** Party operations work, active Pokemon switches.

### Test M9: Pokedex

1. `/buddy pokedex` — shows 151-entry grid (● caught, ◐ seen, ○ unknown)
2. `/buddy pokedex caught` — shows only caught Pokemon
3. `/buddy pokedex pikachu` — shows specific Pokemon detail

**Expected:** Grid renders, filters work, detail shows stats + evolution chain.

### Test M10: Achievements

1. `/buddy achievements` — shows all achievements with progress
2. Make your first commit → "First Steps" should unlock
3. `/buddy achievements` — verify it shows as unlocked with date

**Expected:** Achievements track and unlock correctly.

### Test M11: Legendary Quests

1. `/buddy legendary` — shows 5 quest chains with step progress
2. Progress on steps (e.g., 30-day streak for Articuno step 1)
3. `/buddy legendary` — verify step marked as complete

**Expected:** Quest progress tracks across sessions.

### Test M12: Status Line

1. Check Claude Code status line at the bottom
2. Should show: `Name Lv.N [████░░░░░░░░] N%`
3. When evolution is ready, should show `EVOLVING!` indicator
4. After a reaction, should briefly show the reaction text

**Expected:** Status line updates in real-time.

### Test M13: Hooks

1. Mention your Pokemon's name in a message → status line should show reaction
2. Make errors in code → Pokemon should react (visible in Claude's response as buddy comment)
3. Pass tests → Pokemon celebrates

**Expected:** All 3 hooks fire correctly.

---

## Manual Test Checklist

| # | Test | What to Verify |
|---|------|---------------|
| M1 | Starter Selection | 3 random starters, sprites, creation |
| M2 | Show & Stats | 3 display modes render |
| M3 | Pet & XP | Happiness, XP, reactions |
| M4 | XP from Coding | Hook detects commits/tests/builds |
| M5 | Level Up | Level increases, bell sounds |
| M6 | Evolution | Preview → confirm → new species |
| M7 | Wild Encounters | Appear, catch, flee/return |
| M8 | Party Management | List, switch, deposit, withdraw |
| M9 | Pokedex | Grid, filters, detail view |
| M10 | Achievements | Track, unlock, display |
| M11 | Legendary Quests | 5 quests, step progress |
| M12 | Status Line | Real-time updates |
| M13 | Hooks | All 3 hook types fire |
