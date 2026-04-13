# Claudemon — Development Tasks

> Single source of truth for all development work.
> Mark tasks `[x]` when complete. Follow RULES.md strictly.

---

## Phase 1: Foundation (MVP)

> **Goal:** Install → pick starter → earn XP → level up → see stats

### 1.1 Project Setup
- [x] Initialize `package.json` with name `claudemon`, bun scripts
- [x] Configure `tsconfig.json` (strict mode, ES2022 target, path aliases)
- [x] Create `bunfig.toml`
- [x] Create `.gitignore` (node_modules, .tmp, raw sprites, dist)
- [x] Initialize git repo with initial commit
- [x] Install dependencies: `@modelcontextprotocol/sdk`, `zod`

### 1.2 Core Types & Interfaces
- [x] `src/engine/types.ts` — all shared types and interfaces:
  - `Pokemon`, `PokemonType`, `BaseStats`, `ExpGroup`
  - `OwnedPokemon`, `CodingStats`, `CodingStat`
  - `EvolutionChain`, `EvolutionMethod`, `EvolutionTrigger`
  - `PlayerState`, `PartySlot`, `PokedexEntry`
  - `CatchCondition`, `Achievement`, `StreakData`
  - `BuddyConfig`, `EventCounters`
- [x] `src/engine/constants.ts` — shared constants:
  - Max party size (6), max level (100), starter level (5)
  - XP source values (commit=15, test=12, etc.)
  - Game Boy grayscale palette (4 colors)
  - Stat names mapping

### 1.3 Pokemon Data
- [x] `src/engine/pokemon-data.ts` — static readonly data for all 151 Pokemon:
  - ID, name, types, base stats (HP/Atk/Def/Spd/Spc), exp group
  - Evolution chain ID, rarity tier
- [x] `src/engine/evolution-data.ts` — all evolution chains:
  - Level-based triggers with exact Gen 1 levels
  - Badge-based triggers (stone evolution replacements)
  - Collaboration-based triggers (trade evolution replacements)
  - Eevee branching rules (dominant stat)
- [x] `src/engine/starter-pool.ts` — the ~33 common base-stage Pokemon for starter selection

### 1.4 XP & Leveling Engine
- [x] `src/engine/xp.ts` — XP calculation:
  - Gen 1 growth rate formulas (fast, medium_fast, medium_slow, slow)
  - `xpForLevel(level, rate)` — cumulative XP needed
  - `xpToNextLevel(currentLevel, rate)` — XP delta for next level
  - `addXp(pokemon, amount)` — apply XP, return level-up info
- [x] Tests: verify XP formulas match Gen 1 data at known checkpoints (L10, L16, L36, L50, L100)

### 1.5 Stat System
- [x] `src/engine/stats.ts` — coding stat calculations:
  - `calculateDisplayStat(baseStat, level, activityBonus)` — effective stat value
  - `applyStatBoost(pokemon, stat, amount)` — increment from coding activity
  - Stat bar renderer (Unicode block characters, 10-char wide)
- [ ] Tests: verify stat growth at various levels

### 1.6 State Management
- [x] `src/state/io.ts` — atomic file I/O helpers:
  - `atomicWrite(path, data)` — temp + rename pattern
  - `safeRead<T>(path, schema)` — read + validate with zod
  - `ensureDir(path)` — create dir if missing
- [x] `src/state/state-manager.ts` — singleton state manager:
  - Load/save `PlayerState` from `~/.claudemon/state.json`
  - Profile initialization (first-run detection)
  - Event counter increment methods
  - Streak tracking (daily active check)
- [x] `src/state/schemas.ts` — zod schemas for all state files (validation on load)
- [ ] Tests: atomic write safety, schema validation, first-run detection

### 1.7 MCP Server (Basic Tools)
- [x] `src/server/index.ts` — server entry point:
  - McpServer instantiation with stdio transport
  - Dynamic instructions builder (active Pokemon context)
  - Tool registration
- [x] `src/server/tools/starter.ts` — `buddy_starter` tool:
  - Generate 3 random commons from starter pool (hash of date seed)
  - Display names + types + stats for selection
  - Initialize profile with chosen Pokemon at level 5
- [x] `src/server/tools/show.ts` — `buddy_show` tool:
  - Display Pokemon with stats, level, XP bar
  - Compact and full detail modes
- [x] `src/server/tools/stats.ts` — `buddy_stats` tool:
  - Detailed stat breakdown with base + bonus values
  - XP progress to next level
- [x] `src/server/tools/pet.ts` — `buddy_pet` tool:
  - Happiness +5, small XP award, species-appropriate reaction (all 15 types)
- [ ] Tests: tool output format, starter generation determinism

### 1.8 Basic Sprites (Monochrome)
- [x] `src/sprites/mono-renderer.ts` — Unicode block art renderer:
  - Convert grayscale pixel data to ░▒▓█ characters
  - ANSI half-block renderer with Game Boy palette
  - Scale-down function for mini sprites
  - Render in markdown code fence (for MCP output)
- [x] `scripts/generate-sprites.ts` — build script:
  - Download Gen 1 R/B sprites from PokeAPI (56x56 grayscale PNGs)
  - Convert to mono Unicode art + ANSI art + mini ANSI art
  - Output as JSON files per Pokemon
  - Incremental mode (skip existing, --force to regenerate)
  - Barrel file generation (`src/sprites/index.ts`)
- [ ] Generate sprites for starter pool Pokemon first (~33 sprites)

### 1.9 Hooks (XP Pipeline)
- [x] `hooks/post-tool-use.sh` — PostToolUse hook:
  - Read tool_name and tool_response from stdin JSON
  - Pattern match: git commit, test pass/fail, build, error, edit, search
  - Call `bun run src/hooks/award-xp.ts` with event type and XP amount
  - Backgrounds bun calls for < 200ms hook latency
- [x] `src/hooks/award-xp.ts` — lightweight bun script:
  - Load state, apply XP to active Pokemon
  - Check level-up, update state + streak in single save
  - Terminal bell on level-up
- [x] `src/hooks/increment-counter.ts` — counter-only script for non-XP events
- [ ] `hooks/hooks.json` — hook registration config

### 1.10 Skill File
- [x] `skills/buddy/SKILL.md` — `/buddy` slash command:
  - Route subcommands to MCP tools
  - Support: show, stats, pet, starter, help
  - Display tool output exactly as returned

### 1.11 CLI Installer
- [x] `cli/install.ts` — one-command setup:
  - Check prerequisites (bun, claude code)
  - Create `~/.claudemon/` directory
  - Register MCP server in `~/.claude.json`
  - Install hooks in `~/.claude/settings.json`
  - Copy skill to `~/.claude/skills/buddy/`
  - Idempotent (safe to run twice)
- [x] `cli/uninstall.ts` — clean removal (revert all config changes, preserve Pokemon data)
- [x] `cli/doctor.ts` — 8-point diagnostic checker

### 1.12 Phase 1 Integration Test
- [x] TESTING-PHASE1.md — manual testing guide with 8 test scenarios
- [ ] End-to-end: install → pick starter → simulate coding events → verify XP gain → verify level-up
- [ ] Verify MCP server starts and responds to tool calls
- [ ] Verify hook detects a git commit and awards XP

### 1.13 Phase 1 Bug Fixes (Post-Testing)
- [x] **BUG: STATE_DIR evaluated at import time** — `STATE_DIR`, `STATE_FILE`, `STATUS_FILE` were static constants in `constants.ts`, evaluated once at module load. Tests that override `process.env.HOME` had no effect. **Fix:** Converted to functions `getStateDir()`, `getStateFile()`, `getStatusFile()` so they resolve at call time. Updated `state-manager.ts` to use the functions.
- [x] **BUG: Test 3 polluted real state** — TESTING-PHASE1.md Test 3 wrote to `~/.claudemon/state.json` instead of a temp dir, creating a fake Charmander profile that made `/buddy` skip starter selection. **Fix:** Cleared stale state, documented that tests must use temp dirs.
- [x] **BUG: `/buddy` with no Pokemon didn't trigger starter** — SKILL.md routed `/buddy` (no args) directly to `buddy_show` which returned an error but didn't auto-fallback to `buddy_starter`. **Fix:** Updated SKILL.md with explicit first-run behavior: if `buddy_show` fails (no Pokemon), immediately call `buddy_starter`.
- [x] **Prettier added** — Installed `prettier@3.8.2`, created `.prettierrc` (2-space, double quotes, 100 chars), added `format` and `format:check` scripts, formatted all files. Updated RULES.md with formatting rules.

---

## Phase 2: Evolution & Sprites

> **Goal:** Pokemon evolve → retro Game Boy sprites render → status line animated

### 2.1 Evolution Engine
- [x] `src/engine/evolution.ts` — evolution logic:
  - `findEvolutionChain`, `getEvolutionLinks`, `checkEvolution`, `isMethodSatisfied`
  - `applyEvolution` — transform species, recalculate stats (preserves activity bonuses)
  - `getDominantStat` — Eevee branching (returns null on tie)
  - `isBadgeEarned`, `getNewlyEarnedBadges` — badge earning checks
  - Level-based, badge-based, collaboration-based, stat-based (Eevee) methods
  - Precomputed O(1) lookup index for evolution chains
- [x] Evolution cancellation — confirm flag required, preview shown first (like pressing B)

### 2.2 Sprite Generation Pipeline
- [x] All 151 Gen 1 R/B sprites generated via `bun run generate-sprites`
  - Downloaded from PokeAPI, cached in `sprites/raw/`
  - Full-size ANSI (56x28), mini ANSI (12x6), mono Unicode art
  - Game Boy 4-color grayscale palette
  - 151 JSON files in `sprites/full/`
- [x] `src/sprites/index.ts` — auto-generated barrel with lazy loading
  - `SPRITE_INDEX` map (151 entries), `loadSprite(id)`, `loadAllSprites()`
  - Caches in memory after first load
- [x] `src/sprites/mono-renderer.ts` — renders both mono and ANSI formats (built in Phase 1)

### 2.3 Evolution MCP Tools + Show Integration
- [x] `src/server/tools/evolve.ts` — `buddy_evolve` tool:
  - Preview card with stat comparison (new vs old)
  - Confirm/cancel flow
  - Badge auto-earning before evolution check
  - Mono sprite display on evolution success
  - Terminal bell on evolution
- [x] `buddy_show` updated — loads mono sprite via `loadSprite()`, displays in full mode
- [x] `award-xp.ts` updated — checks for new badges + evolution after XP award
- [x] `state-manager.ts` — `writeStatus()` now includes `evolutionReady` flag
- [x] `index.ts` — `buddy_evolve` registered
- [x] SKILL.md — evolve/evolve confirm commands added

### 2.4 Status Line
- [x] `statusline/buddy-status.sh` — text-based display:
  - Reads `~/.claudemon/status.json`
  - Name + Lv + XP bar (12-char Unicode blocks) + percentage
  - Evolution indicator when `evolutionReady` is true
  - Game Boy palette ANSI colors
  - Time-based animation frame (reserved for Phase 5 mini sprites)
  - Silent failure on missing deps/state
- [x] `cli/install.ts` updated — registers status line in `~/.claude/settings.json`
- [x] `chmod +x` on both shell scripts

### 2.5 Level-Up & Evolution Animations
- [x] Level-up: terminal bell via `\x07`
- [x] Evolution available: terminal bell + `evolutionReady` flag in status.json
- [ ] Evolution: sprite transition animation (old → glow → new) — deferred to Phase 5
- [ ] Reaction bubbles in status line — deferred to Phase 5

### 2.6 Sprite Rework: Generated → Hand-Crafted Colorscripts
- [x] **Iteration 1:** Grayscale GB → full color `front_default` PNG → still blurry in terminal
- [x] **Iteration 2:** Tried MCP ImageContent (base64) → Claude Code doesn't render images inline
- [x] **Iteration 3:** Tried markdown image `![name](url)` → renders as text link, not image
- [x] **Final decision:** Switch to **pokemon-colorscripts** — hand-crafted ANSI terminal art
- [x] **Why:** Artist-drawn for terminals, pixel-perfect, 1,329 sprites (all gens), no image processing
- [x] Downloaded all 151 Gen 1 colorscripts (small + large) to `sprites/colorscripts/` — 0 failures
- [x] Deleted old `sprites/full/`, `sprites/raw/`, `sprites/mini/` directories
- [x] Updated `.gitignore` — removed old sprite entries
- [x] Updated `src/server/tools/show.ts` — loads small colorscript, prepends to stats card
- [x] Updated `src/server/tools/evolve.ts` — shows large colorscript on evolution celebration
- [x] Updated `src/server/tools/starter.ts` — shows small sprites for each starter option
- [x] Rewrote `src/sprites/index.ts` — simple `loadSmallSprite()`/`loadLargeSprite()` from .txt files
- [x] Created `scripts/download-colorscripts.ts` — replaces generate-sprites.ts
- [x] Deleted `src/sprites/mono-renderer.ts` — no longer needed
- [x] Deleted `scripts/generate-sprites.ts` — replaced by download script
- [x] Removed `SpriteData`/`SpriteFormat` from types.ts, `ALPHA_THRESHOLD` from constants.ts
- [x] Removed `sharp` from devDependencies
- [x] Updated PLAN.md — section 10 rewritten for colorscripts
- [x] Verified: typecheck clean, all files formatted

---

## Phase 3: Gamification & Journey

> **Goal:** Wild encounters → catch Pokemon → achievements → Pokedex → streaks

### 3.1 Wild Encounter System
- [x] `src/engine/encounters.ts` — encounter engine:
  - Activity-type → Pokemon-type mapping (13 event types × 15 Pokemon types)
  - `shouldTriggerEncounter()` — threshold check (~1 per 500 XP)
  - `generateEncounter()` — weighted rarity selection, base-stage only, starter exclusion
  - `canCatch()` — 3-gate evaluation: level, stat, catch rate roll
  - `getCatchCondition()` — rarity-based requirements
  - Deterministic PRNG (mulberry32) seeded by timestamp
- [x] `src/engine/encounter-pool.ts` — pre-built pools:
  - TYPE_POOLS map built at module load from POKEDEX
  - Base-stage filtering via EVOLVED_IDS set
  - Legendary/mythical excluded from wild encounters

### 3.2 Milestone Discoveries
- [x] `src/gamification/milestones.ts` — 8 milestone definitions:
  - 1 commit → Pidgey, 10 tests → Machop, 50 commits → Abra, etc.
  - `checkNewMilestones()` — checks counters against thresholds

### 3.3 Catch & Party MCP Tools
- [x] `src/server/tools/catch.ts` — `buddy_catch` tool:
  - Preview shows encounter + requirements, confirm rolls catch
  - Creates OwnedPokemon, adds to party/box, updates pokedex
  - Achievement check, terminal bell on catch
- [x] `src/server/tools/party.ts` — `buddy_party` tool:
  - list/switch/deposit/withdraw actions
  - Shows sprites, marks active with ★
- [x] `src/server/tools/pokedex.ts` — `buddy_pokedex` tool:
  - 151-entry grid (●/◐/○), filters, specific Pokemon lookup with sprite + evolution chain
- [x] `src/server/tools/achievements.ts` — `buddy_achievements` tool:
  - Grouped by category, progress tracking
- [x] `src/server/tools/legendary.ts` — `buddy_legendary` tool:
  - 5 quest chains with step-by-step progress
- [x] Added `pendingEncounter` + `xpSinceLastEncounter` to PlayerState
- [x] Updated schemas.ts, state-manager.ts with encounter methods
- [x] Updated award-xp.ts — triggers encounters after XP threshold
- [x] Updated index.ts — registered all 5 new tools
- [x] Updated SKILL.md — catch, party, pokedex, achievements, legendary routing

### 3.4 Achievement System
- [x] `src/gamification/achievements.ts` — 18 achievements across 3 categories
  - `isConditionMet()` — exhaustive condition checker
  - `checkNewAchievements()` — filters unlocked vs locked
  - Integrated into catch tool + award-xp flow

### 3.5 Streak & Titles
- [x] Streak logic built into `state-manager.ts` (`updateStreak()`)
- [x] Trainer titles built into `src/engine/stats.ts` (`getTrainerTitle()`)
- [x] Displayed in `buddy_show` and `buddy_stats`

### 3.6 Badge System
- [x] Badge definitions in `src/engine/constants.ts` (BADGES)
- [x] Badge earning in `src/engine/evolution.ts` (`isBadgeEarned()`, `getNewlyEarnedBadges()`)
- [x] Auto-checked in `award-xp.ts` on every XP award
- [x] Wired into evolution eligibility

### 3.7 Remaining Hooks
- [x] `hooks/stop.sh` — extracts `<!-- buddy: ... -->` comments, writes reaction to status.json
- [x] `hooks/user-prompt-submit.sh` — detects Pokemon name mention, writes reaction
- [x] Updated `cli/install.ts` — registers Stop + UserPromptSubmit hooks
- [x] Updated `cli/uninstall.ts` — removes all 3 hook types
- [x] `chmod +x` on all hook scripts

---

## Phase 4: Reactions & Personality

> **Goal:** Pokemon feel alive with type-appropriate reactions and personality

### 4.1 Reaction System
- [x] `src/engine/reactions.ts` — full reaction engine:
  - 15 types × 8 events = 120 reaction pools (3-5 reactions each)
  - `getReaction()` — picks random reaction, substitutes `{name}` placeholder
  - `shouldReact()` — cooldown enforcement
  - Distinct personality per type (Fire=intense, Ghost=spooky, Bug=ironic, etc.)

### 4.2 Dynamic Instructions
- [x] `src/server/instructions.ts` — personality injection:
  - `buildInstructions()` — builds full context for Claude's system prompt
  - Active Pokemon name, level, type, personality description
  - Evolution proximity note ("142 XP to level 16!")
  - Pending encounter note ("Wild Pidgey appeared!")
  - `<!-- buddy: -->` comment format instructions
  - First-run guide if no Pokemon yet

### 4.3 Legendary Quests
- [x] `src/gamification/legendary-quests.ts` — 5 quest chains:
  - Articuno (endurance), Zapdos (testing), Moltres (debugging)
  - Mewtwo (Pokedex completion), Mew (365-day streak)
  - 4 steps each with progressive difficulty
  - `getQuestProgress()` — sequential step checking

---

## Phase 5: Polish & Distribution

> **Goal:** Production-ready, one-command install, npm published

### 5.1 CLI Polish
- [x] `cli/doctor.ts` — 8-point diagnostics (built in Phase 1)
- [x] `cli/update.ts` — re-register MCP server, hooks, skill, status line without touching state
- [x] `cli/install.ts` — registers MCP, 3 hooks, skill, status line (updated in Phase 3)
- [x] `cli/uninstall.ts` — removes all registrations, preserves state
- [x] Extracted shared display helpers (`src/server/tools/display-helpers.ts`) — `formatTypes`, `pad`, `CODING_TO_BASE`

### 5.2 Testing
- [x] 171 tests across 5 test suites, 0 failures, 26ms runtime:
  - `tests/engine/xp.test.ts` — 23 tests (Gen 1 XP formulas, leveling, multi-level-up)
  - `tests/engine/evolution.test.ts` — 27 tests (chains, eligibility, Eevee branching, badges)
  - `tests/engine/encounters.test.ts` — 20 tests (trigger, pools, catch conditions)
  - `tests/engine/stats.test.ts` — 28 tests (stat init, display, bars, titles)
  - `tests/gamification/achievements.test.ts` — 26 tests (conditions, new detection, integrity)
- [x] TESTING-PHASE2.md — updated for colorscripts
- [x] TESTING-PHASE3.md — 8 test scenarios (encounters, achievements, milestones, quests, hooks)
- [x] TESTING-PHASE4.md — 3 test scenarios (reactions, instructions, personality)

### 5.3 Code Cleanup
- [x] Removed dead code: mono-renderer.ts, generate-sprites.ts, SpriteData/SpriteFormat types, ALPHA_THRESHOLD
- [x] Removed unused sharp dependency
- [x] Extracted duplicated `formatTypes()`, `pad()`, `CODING_TO_BASE` to shared display-helpers.ts
- [x] Exported `getDominantStat` and added `isBadgeEarned` to evolution.ts (needed by tests)
- [x] Fixed starter.ts syntax error (`];` → `);`)
- [x] Fixed bunfig.toml (removed invalid `preload = []`)
- [x] Fixed achievement count in tests (17 not 18)

### 5.4 Documentation
- [x] `README.md` — features, quick start, architecture, XP table, evolution mechanics, requirements, disclaimer
- [x] Pokemon + pokemon-colorscripts disclaimer included

### 5.5 Edge Cases & Hardening
- [x] Multi-session safety — file lock (`state.lock`) with 5s stale detection in `withLock()`
- [x] State corruption recovery — backup corrupted file as `.corrupt.{timestamp}`, log to stderr, degrade to first-run
- [x] Graceful degradation if sprites missing — all tools handle `null` from `loadSmallSprite()`
- [x] Hook timeout handling — `timeout 3` on bun calls, `timeout 2` on jq calls
- [x] Narrow terminal width handling — status line: <20 cols = silent, <40 = minimal, >=40 = full
- [x] MCP server startup resilience — `safeRegister()` wraps each tool, state load failure doesn't crash
- [x] Fixed bun PATH issue — installer uses full `getBunPath()` (/home/user/.bun/bin/bun) instead of bare `bun`
- [x] Fixed sprite name normalization — handles ♀/♂, apostrophes, dots in Pokemon names
- [x] Doctor updated — 11 checks (added stale lock, sprite count, state validity)
- [x] 38 hardening tests in `tests/edge-cases/hardening.test.ts`
- [x] 84 E2E tests in `tests/e2e/full-suite.test.ts`
- [x] Unified `TESTING.md` — merged all 4 phase testing docs + manual Claude Code test checklist
- [x] **Total: 309 tests, 0 failures, 7 test files**

### 5.6 Post-Hardening Additions
- [x] Removed sprites from MCP tool output (ANSI doesn't render in MCP text)
- [x] Status line: two-column layout (left: model+context+speech, right: sprite+name)
- [x] Status line: model name + context % from Claude Code stdin JSON
- [x] Status line: buddy speech (8 idle messages, 30s rotation, zero API cost)
- [x] Status line: wild encounter alert (bright yellow, "Use /buddy catch!")
- [x] `buddy_rename` tool — nickname Pokemon (max 20 chars, priority over species name)
- [x] `buddy_hide` / `buddy_unhide` — toggle sprite visibility in status line
- [x] `statusLine.type: "command"` fix — Claude Code requires this field
- [x] `refreshInterval: 1` — matches reference repo for responsive updates
- [x] `padding` field added to StatusLineConfig interface
- [x] Speech text color improved (warm muted yellow, readable on dark backgrounds)

### Pre-Launch Checklist
- [x] Typecheck: clean
- [x] Tests: 309 pass, 0 fail
- [x] Format: clean
- [x] Doctor: 11/11 checks
- [x] Sprites: 151/151
- [x] MCP tools: 14 registered
- [x] Skill commands: 26 routed
- [x] Install/uninstall/update: working
- [x] Speech timer set to 30s (production)
- [ ] Initial git commit
- [ ] Push to GitHub

---

## Phase 6: Future (Backlog)

> Not in v1. Architecture supports adding these later.

- [ ] Shiny Pokemon variants (`shiny` flag ready on OwnedPokemon)
- [ ] XP sharing for inactive party Pokemon (hook point ready in XP flow)
- [ ] Full-color sprite mode toggle
- [ ] Cross-session memory
- [ ] Mood system
- [ ] Battle system (compare stats between users)
- [ ] Community Pokedex leaderboard
- [ ] Trade system (exchange Pokemon via shared keys)
- [ ] Light theme color support
- [ ] More interactions (feed, train, play)
