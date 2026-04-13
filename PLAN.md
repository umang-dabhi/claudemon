# Claudemon — Pokemon Gen 1 Coding Companion

> *"Gotta code 'em all!"*

## Vision

A gamified coding companion for Claude Code that uses Pokemon Gen 1 (151 Pokemon) as its theme. Your Pokemon levels up as you code, evolves at milestones, and reacts to your coding activity. Built as an MCP server so it survives every Claude Code update.

**Project name:** `claudemon`
**npm package:** `claudemon`
**Install:** `npx claudemon install`
**GitHub:** `umang-dabhi/claudemon`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Core Engine](#4-core-engine)
5. [Stat System](#5-stat-system)
6. [XP & Leveling](#6-xp--leveling)
7. [Evolution System](#7-evolution-system)
8. [MCP Server](#8-mcp-server)
9. [Hooks System](#9-hooks-system)
10. [Sprite System](#10-sprite-system)
11. [Status Line](#11-status-line)
12. [Skill / Slash Command](#12-skill--slash-command)
13. [State Management](#13-state-management)
14. [Gamification Layer](#14-gamification-layer)
15. [Installation Flow](#15-installation-flow)
16. [Phase Plan](#16-phase-plan)
17. [Key Architectural Decisions](#17-key-architectural-decisions)
18. [Open Questions](#18-open-questions)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Claude Code                        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ /buddy   │  │  Hooks   │  │   Status Line     │  │
│  │  Skill   │  │ (shell)  │  │   (shell script)  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
│       ▼              ▼                 ▼              │
│  ┌──────────────────────────────────────────────┐    │
│  │          MCP Server (stdio)                   │    │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐   │    │
│  │  │  Tools  │ │Resources │ │ Instructions │   │    │
│  │  └────┬────┘ └────┬─────┘ └──────┬───────┘   │    │
│  │       │           │              │            │    │
│  │       ▼           ▼              ▼            │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │           Core Engine                │     │    │
│  │  │  ┌────────┐ ┌─────┐ ┌───────────┐   │     │    │
│  │  │  │Pokemon │ │ XP  │ │ Evolution │   │     │    │
│  │  │  │  Data  │ │Level│ │  Engine   │   │     │    │
│  │  │  └────────┘ └─────┘ └───────────┘   │     │    │
│  │  │  ┌────────┐ ┌─────┐ ┌───────────┐   │     │    │
│  │  │  │Sprites │ │Stats│ │Reactions  │   │     │    │
│  │  │  └────────┘ └─────┘ └───────────┘   │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └──────────────────────────────────────────────┘    │
│                        │                             │
│                        ▼                             │
│               ~/.claudemon/                       │
│          (profile, pokedex, events)                  │
└─────────────────────────────────────────────────────┘
```

**Five integration points with Claude Code:**
1. **MCP Server** — Tools that Claude can call (show buddy, pet, stats, evolve)
2. **Skill** — `/buddy` slash command routing to MCP tools
3. **Hooks** — PostToolUse detects coding events → awards XP
4. **Status Line** — Animated Pokemon sprite in terminal
5. **Dynamic Instructions** — Injects buddy personality into Claude's system prompt

---

## 2. Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Language | **TypeScript** | Type-safe, native MCP SDK support, great for JSON schemas |
| Runtime | **Bun** | Fast startup (~50ms vs Node's ~150ms), native TS execution, built-in test runner |
| MCP SDK | `@modelcontextprotocol/sdk` + `zod` | Official SDK, schema validation |
| Sprite Source | pokemon-colorscripts (GitHub) | Hand-crafted ANSI art, 1,329 sprites, all gens |
| State Storage | JSON files in `~/.claudemon/` | Simple, atomic writes, no DB needed |
| Hooks | Shell scripts (bash) | Claude Code hook system uses shell |
| Package Manager | bun | Lockfile, workspace support |
| Distribution | npm package | `npx claudemon install` for setup |

---

## 3. Project Structure

```
claudemon/
├── package.json
├── tsconfig.json
├── bunfig.toml
├── .prettierrc
├── PLAN.md                          # This file
├── TASKS.md                         # Development task tracker
├── RULES.md                         # Development standards
│
├── src/
│   ├── server/                      # MCP Server
│   │   ├── index.ts                 # Server entry point, tool registration, stdio transport
│   │   ├── instructions.ts          # Dynamic instruction builder for Claude's prompt
│   │   └── tools/                   # MCP tool handlers (one per file)
│   │       ├── starter.ts           # buddy_starter — first-run Pokemon selection
│   │       ├── show.ts              # buddy_show — display Pokemon + colorscript sprite
│   │       ├── stats.ts             # buddy_stats — detailed stat breakdown
│   │       ├── pet.ts               # buddy_pet — pet Pokemon, +happiness, +XP
│   │       ├── evolve.ts            # buddy_evolve — evolution preview + confirm
│   │       ├── catch.ts             # buddy_catch — catch wild Pokemon
│   │       ├── party.ts             # buddy_party — list/switch/deposit/withdraw
│   │       ├── pokedex.ts           # buddy_pokedex — 151-entry grid + detail view
│   │       ├── achievements.ts      # buddy_achievements — achievement progress
│   │       └── legendary.ts         # buddy_legendary — quest chain progress
│   │
│   ├── engine/                      # Core Game Engine
│   │   ├── types.ts                 # All TypeScript interfaces & types
│   │   ├── constants.ts             # Shared constants (XP, limits, badges, palette)
│   │   ├── pokemon-data.ts          # All 151 Pokemon (stats, types, rarity, exp group)
│   │   ├── evolution-data.ts        # 79 evolution chains (level/badge/collab/stat)
│   │   ├── starter-pool.ts          # 39 common base-stage starters
│   │   ├── xp.ts                    # Gen 1 XP formulas, leveling, addXp
│   │   ├── stats.ts                 # Coding stat system, stat bars, trainer titles
│   │   ├── evolution.ts             # Evolution engine (check, apply, badges, Eevee)
│   │   ├── encounters.ts            # Wild encounter engine (trigger, generate, catch)
│   │   ├── encounter-pool.ts        # Pre-built type→Pokemon pools
│   │   └── reactions.ts             # 15 types × 8 events reaction templates
│   │
│   ├── sprites/                     # Sprite Loader
│   │   └── index.ts                 # loadSmallSprite() — reads colorscript .txt files
│   │
│   ├── state/                       # Persistence Layer
│   │   ├── io.ts                    # Atomic read/write helpers (temp+rename)
│   │   ├── schemas.ts               # Zod validation schemas for all state
│   │   └── state-manager.ts         # Singleton state manager
│   │
│   ├── hooks/                       # Hook scripts (TypeScript, called by shell hooks)
│   │   ├── award-xp.ts              # XP award + level-up + evolution + encounter check
│   │   └── increment-counter.ts     # Counter-only increment (no XP)
│   │
│   └── gamification/                # Gamification Layer
│       ├── achievements.ts          # 18 achievements, condition checker
│       ├── milestones.ts            # 8 milestone discoveries
│       └── legendary-quests.ts      # 5 legendary quest chains (4 steps each)
│
├── sprites/                         # Pre-rendered colored terminal art
│   └── colorscripts/
│       └── small/                   # 151 small ANSI colorscript files (~11 lines each)
│           ├── 1-bulbasaur.txt
│           ├── 2-ivysaur.txt
│           └── ...151 files
│
├── scripts/
│   └── download-colorscripts.ts     # Download colorscripts from GitHub repo
│
├── cli/                             # CLI tools
│   ├── install.ts                   # One-command installer (MCP + hooks + skill + status line)
│   ├── uninstall.ts                 # Clean removal
│   └── doctor.ts                    # 8-point diagnostics
│
├── hooks/                           # Claude Code hooks (shell scripts)
│   ├── post-tool-use.sh             # PostToolUse — detect events, award XP
│   ├── stop.sh                      # Stop — extract <!-- buddy: --> comments
│   └── user-prompt-submit.sh        # UserPromptSubmit — name mention reactions
│
├── skills/                          # Claude Code skills
│   └── buddy/
│       └── SKILL.md                 # /buddy slash command (15+ subcommands)
│
├── statusline/                      # Status line display
│   └── buddy-status.sh             # Text-based status (name + Lv + XP bar)
│
└── tests/                           # Test suite (Phase 5)
    └── (pending)
```

---

## 4. Core Engine

### 4.1 Pokemon Data Model

```typescript
interface Pokemon {
  id: number;                    // 1-151
  name: string;                  // "Bulbasaur"
  types: [PokemonType, PokemonType?]; // ["Grass", "Poison"]
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    special: number;             // Gen 1 single Special stat
  };
  expGroup: "fast" | "medium_fast" | "medium_slow" | "slow";
  evolutionChainId: number;      // Groups evolution families
  rarity: "common" | "uncommon" | "rare" | "legendary" | "mythical";
}

interface OwnedPokemon {
  pokemonId: number;             // Which species
  nickname: string | null;       // Custom name
  level: number;                 // 1-100
  currentXp: number;             // XP in current level
  totalXp: number;               // Lifetime XP earned
  codingStats: CodingStats;      // Our 5 coding stats
  happiness: number;             // 0-255 (affects reactions)
  caughtAt: string;              // ISO date
  evolvedAt: string | null;      // When last evolved
  isActive: boolean;             // Currently displayed
  personality: string | null;    // Custom personality blurb
  shiny: boolean;                // Future: rare cosmetic variant (always false in v1)
}
```

### 4.2 All 151 Pokemon

Stored as a static data file (`src/engine/pokemon.ts`). Key data per Pokemon:
- ID, name, type(s), base stats (HP/Atk/Def/Spd/Spc), experience group
- Evolution chain reference
- Rarity tier
- Short flavor text for reactions

The 15 Gen 1 types: Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon

### 4.3 Pokemon Types → Coding Personality

Each Pokemon type influences how the buddy reacts to coding events:

| Pokemon Type | Coding Personality | Reaction Style |
|-------------|-------------------|----------------|
| Fire | Aggressive debugger | "Burn that bug!" / intense about errors |
| Water | Calm, methodical | "Let's flow through this systematically" |
| Electric | Fast, energetic | "Zap! Quick fix incoming!" |
| Grass | Patient, nurturing | "Let it grow... the solution will come" |
| Psychic | Analytical | "I sense a pattern here..." |
| Fighting | Determined | "We won't back down from this bug!" |
| Ghost | Mysterious, dark humor | "This code is haunted..." |
| Dragon | Proud, powerful | "A worthy challenge for us" |
| Bug | Ironic self-awareness | "A Bug type finding bugs... how meta" |
| Normal | Friendly, supportive | "You've got this!" |
| Poison | Sarcastic edge | "That code is... toxic" |
| Rock | Steady, reliable | "Solid as a rock. Let's not break things." |
| Ice | Cool under pressure | "Stay frosty. We'll crack this." |
| Flying | Free-spirited | "Let's soar past this problem!" |
| Ground | Grounded, practical | "Back to basics. Check the fundamentals." |

---

## 5. Stat System

### 5.1 Mapping Pokemon Stats → Coding Stats

We remap the 5 Gen 1 stats to coding-relevant stats while keeping the Pokemon flavor:

| Pokemon Stat | Coding Stat | What It Represents | Grows From |
|-------------|-------------|-------------------|-----------|
| HP | **STAMINA** | Session endurance, resilience | Long coding sessions, streaks |
| Attack | **DEBUGGING** | Bug-finding power | Fixing errors, resolving lint issues |
| Defense | **STABILITY** | Code quality, test coverage | Writing tests, passing builds |
| Speed | **VELOCITY** | Coding speed, throughput | Commits, file edits, task completion |
| Special | **WISDOM** | Deep problem-solving | Complex refactors, large PRs, long sessions |

### 5.2 Stat Growth Formula

Each coding stat starts at the Pokemon's base stat value (scaled to our system) and grows based on relevant activity:

```
effective_stat = base_stat + (activity_bonus * level_multiplier)

where:
  base_stat = pokemon.baseStats[stat] (1-255 range from Gen 1 data)
  activity_bonus = accumulated points from relevant coding activities
  level_multiplier = 1 + (level / 100)
```

Stats are displayed on a 1-100 visual scale (normalized from internal values) with progress bars.

### 5.3 Stat Display

```
┌──────────────────────────────────────┐
│  STAMINA    ████████░░  78           │
│  DEBUGGING  ██████████  95  (+3)     │
│  STABILITY  ███████░░░  72           │
│  VELOCITY   █████░░░░░  54           │
│  WISDOM     ████████░░  81  (+1)     │
└──────────────────────────────────────┘
```

The `(+N)` shows recent gains from the current session.

---

## 6. XP & Leveling

### 6.1 XP Sources (Coding Activities)

| Activity | XP Earned | Stat Boosted | Detection Method |
|---------|----------|-------------|-----------------|
| Git commit | +15 | VELOCITY | PostToolUse: Bash `git commit` |
| Tests pass | +12 | STABILITY | PostToolUse: Bash test runner exit 0 |
| Tests written | +10 | STABILITY | PostToolUse: Write/Edit to `*.test.*` |
| Build success | +10 | STABILITY | PostToolUse: Bash build command exit 0 |
| Bug fix (error resolved) | +8 | DEBUGGING | Error count decreases between runs |
| Lint fix | +6 | DEBUGGING | PostToolUse: Bash lint with fixes |
| File created | +5 | VELOCITY | PostToolUse: Write new file |
| File edited | +3 | VELOCITY | PostToolUse: Edit existing file |
| Code search/read | +1 | WISDOM | PostToolUse: Grep, Read, Glob |
| Large refactor (50+ lines) | +20 | WISDOM | PostToolUse: Edit with large diff |
| Session started | +5 | STAMINA | SessionStart hook |
| 30-min session milestone | +10 | STAMINA | Timer in status line |
| Daily streak maintained | +15 | STAMINA | On first activity of day |

### 6.2 Level Formula

We use a simplified version of Pokemon's Medium Fast growth rate (n^3) but scaled down so leveling feels rewarding in a coding context:

```
XP needed for level N = floor(N^3 / 5)

Level 1:   0 XP
Level 5:   25 XP      (~5 commits)
Level 10:  200 XP     (~20 minutes of coding)
Level 16:  819 XP     (first evolution threshold)
Level 20:  1,600 XP
Level 30:  5,400 XP
Level 36:  9,331 XP   (second evolution threshold)
Level 50:  25,000 XP
Level 100: 200,000 XP
```

This means:
- **Level 5** after first real coding session (~30 min)
- **Level 16** (first evolution) after ~2-3 days of active coding
- **Level 36** (second evolution) after ~1-2 weeks
- **Level 50** after ~1 month
- **Level 100** is a long-term goal (months of daily coding)

### 6.3 Level-Up Event

When a Pokemon levels up:
1. Status line shows celebration animation
2. Claude mentions it: "Charmander grew to level 16!"
3. Stats are recalculated
4. Check for evolution trigger
5. Achievement check

---

## 7. Evolution System

### 7.1 Level-Based Evolution (Most Pokemon)

Follows the original Gen 1 levels exactly:
- Charmander → Charmeleon at level 16
- Charmeleon → Charizard at level 36
- Caterpie → Metapod at level 7 → Butterfree at level 10
- Dratini → Dragonair at level 30 → Dragonite at level 55

### 7.2 Stone Evolution → Milestone Evolution

Since we can't use evolution stones, we map them to coding milestones:

| Original Stone | Coding Equivalent | Trigger |
|---------------|------------------|---------|
| Fire Stone | **Blaze Badge** | 50 bugs fixed (DEBUGGING stat milestone) |
| Water Stone | **Flow Badge** | 100 tests passed (STABILITY milestone) |
| Thunder Stone | **Spark Badge** | 200 commits made (VELOCITY milestone) |
| Moon Stone | **Night Owl Badge** | 30-day coding streak (STAMINA milestone) |
| Leaf Stone | **Growth Badge** | 500 files edited (WISDOM milestone) |

Example: Pikachu doesn't evolve by level. Once you earn the **Spark Badge** (200 commits), you can evolve Pikachu → Raichu via `/buddy evolve`.

### 7.3 Trade Evolution → Collaboration Milestone

Original trade evolutions: Kadabra→Alakazam, Machoke→Machamp, Graveler→Golem, Haunter→Gengar

**Coding equivalent:** These Pokemon evolve when you reach a **collaboration milestone**:
- 10 PRs merged, OR
- 50 code reviews done, OR
- 20 pair-programming sessions (detected via shared branches)

This makes these evolutions feel special and hard-earned, just like in the original games where you needed a friend to trade with.

### 7.4 Eevee Branching Evolution

Eevee evolves based on which **coding stat is dominant** when you trigger evolution — your coding style determines which Eeveelution you get:

| Highest Stat | Evolution | Original Stone | Coding Style |
|-------------|-----------|---------------|--------------|
| DEBUGGING | Flareon | Fire Stone | Bug-hunting focused |
| STABILITY | Vaporeon | Water Stone | Testing/quality focused |
| VELOCITY | Jolteon | Thunder Stone | Speed/throughput focused |

Requires: Level 25+ AND the corresponding badge earned.

This creates a natural "which Eeveelution did you get?" conversation — users who want a specific one can deliberately focus their coding activity. If stats are tied, the user gets to choose.

### 7.5 Evolution Flow

```
1. Pokemon reaches evolution trigger (level/milestone)
2. Status line: "What? [Pokemon] is evolving!"
3. Evolution animation in status line (sprite morphing)
4. Claude announces: "[Old] evolved into [New]!"
5. Stats recalculated with new base stats
6. Pokedex updated
7. Achievement check
8. User can cancel evolution with /buddy cancel-evolve (like pressing B!)
```

---

## 8. MCP Server

### 8.1 Tools

| Tool | Description | Parameters |
|------|------------|-----------|
| `buddy_show` | Display Pokemon with full art, stats, level | `{ detail?: "full" \| "compact" }` |
| `buddy_stats` | Show stats card only | `{}` |
| `buddy_pet` | Pet your Pokemon (happiness +5) | `{}` |
| `buddy_rename` | Give a nickname | `{ name: string }` |
| `buddy_personality` | Set custom personality | `{ text: string }` |
| `buddy_evolve` | Trigger evolution (if eligible) | `{}` |
| `buddy_cancel_evolve` | Cancel pending evolution | `{}` |
| `buddy_achievements` | Show achievements & progress | `{}` |
| `buddy_pokedex` | Show Pokedex progress | `{ filter?: "caught" \| "seen" \| "all" }` |
| `buddy_party` | View/manage party | `{ action?: "list" \| "switch" \| "add", pokemonId?: number }` |
| `buddy_starter` | Pick starter from 3 random commons (first run) | `{ choice: 1 \| 2 \| 3 }` |
| `buddy_mute` / `buddy_unmute` | Toggle reactions | `{}` |
| `buddy_react` | Trigger a contextual reaction | `{ event: string, context?: string }` |
| `buddy_catch` | Catch a new Pokemon (at milestones) | `{ pokemonId: number }` |

### 8.2 Resources

| Resource | URI | Description |
|---------|-----|-------------|
| Active Pokemon | `buddy://active` | Current Pokemon state |
| Party | `buddy://party` | Full party listing |
| Pokedex | `buddy://pokedex` | Seen/caught status |
| Profile | `buddy://profile` | Trainer profile |

### 8.3 Dynamic Instructions

Injected into Claude's system prompt at session start:

```
You have a Pokemon companion named {name} ({species}), a Level {level} {type} type.
Personality: {personality_or_default}

Occasionally (not every message), naturally reference {name} in your responses.
When something relevant happens:
- Error found: {name} reacts based on type personality
- Tests pass: {name} celebrates
- Big refactor: {name} is impressed
- Level up: announce it naturally

Append invisible comments for the status line:
<!-- buddy: *{name} {reaction}* -->

Keep it subtle and charming. Don't force it. The user can mute with /buddy mute.
```

---

## 9. Hooks System

### 9.1 Hybrid Architecture (Bash + Bun)

**Key design decision:** Hooks use a hybrid approach:
- **Bash** does the fast pattern matching (no startup cost, sub-ms)
- **Bun script** handles XP math, level-up checks, evolution triggers (needs Gen 1 formulas)

This keeps hook latency under 200ms while avoiding reimplementing XP curves in bash.

```
PostToolUse event → bash pattern match (< 5ms)
  → if event detected → bun run award-xp.ts $REASON $XP (< 150ms)
    → load state → apply XP → check level-up → check evolution → write state
```

### 9.2 PostToolUse Hook (`hooks/post-tool-use.sh`)

Triggers after every tool use. Detects coding events and awards XP.

**Detection patterns:**

```bash
# Git commit
tool_name == "Bash" && output contains "git commit" → +15 XP, VELOCITY

# Test pass
tool_name == "Bash" && (output matches "passed|✓|PASS") && exit_code == 0 → +12 XP, STABILITY

# Test fail
tool_name == "Bash" && (output matches "failed|✗|FAIL") → buddy reacts (no XP)

# Build success
tool_name == "Bash" && (output matches "build|compile") && exit_code == 0 → +10 XP, STABILITY

# Error detected
tool_name == "Bash" && exit_code != 0 → buddy reacts

# File write
tool_name == "Write" → +5 XP, VELOCITY

# File edit
tool_name == "Edit" → +3 XP, VELOCITY

# Test file write
tool_name == "Write|Edit" && file matches "*.test.*|*.spec.*" → +10 XP, STABILITY

# Code search
tool_name == "Grep|Read|Glob" → +1 XP, WISDOM

# Large diff
tool_name == "Edit" && lines_changed > 50 → +20 XP, WISDOM
```

**Cooldown:** 30 seconds between reactions (configurable). XP always awarded, reactions throttled.

### 9.2 Stop Hook (`hooks/stop.sh`)

Extracts invisible buddy comments from Claude's response:
```
<!-- buddy: *Charmander wags its tail* -->
```
Passes to status line for speech bubble display.

### 9.3 UserPromptSubmit Hook (`hooks/user-prompt-submit.sh`)

Detects when user mentions their Pokemon's name → triggers immediate reaction.

### 9.4 Hook Registration (`hooks/hooks.json`)

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash|Write|Edit|Read|Grep|Glob",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_BUDDY_DIR/hooks/post-tool-use.sh",
        "timeout": 5000
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_BUDDY_DIR/hooks/stop.sh",
        "timeout": 3000
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_BUDDY_DIR/hooks/user-prompt-submit.sh",
        "timeout": 3000
      }]
    }]
  }
}
```

---

## 10. Sprite System

### 10.1 Source Sprites — pokemon-colorscripts (Hand-Crafted Terminal Art)

- **Source:** [pokemon-colorscripts](https://github.com/tageraf1n/pokemon-colorscripts) — hand-crafted colored ANSI terminal art
- **Storage:** `sprites/colorscripts/small/` and `sprites/colorscripts/large/`
- **Format:** Pre-rendered ANSI strings (escape codes + Unicode blocks), ready to `cat` or `console.log()`
- **1,329 sprites** covering ALL generations — future-proof for expansion beyond Gen 1
- **Two sizes:** Small (~11 lines, compact) and Large (~21 lines, detailed)
- **No image processing needed** — no sharp, no half-block conversion, no PNG-to-terminal pipeline

**Why pokemon-colorscripts over PokeAPI sprite conversion:**
- **Hand-crafted** by artists for terminal rendering — not auto-generated from images
- **Pixel-perfect** — uses full blocks (`██`) with precise ANSI colors, no blurriness
- **Recognizable** at terminal sizes — designed specifically for this use case
- **1,329 sprites** across all gens (PokeAPI `front_default` also covers all, but looks blurry in terminal)
- **Zero runtime dependencies** — just read a text file and print it

**License:** pokemon-colorscripts is MIT licensed. Pokemon artwork is copyrighted by Nintendo/Game Freak/The Pokemon Company. We add a disclaimer in README:
> "Pokemon is a trademark of Nintendo/Game Freak/The Pokemon Company. Claudemon is a fan project, not affiliated with or endorsed by them. Terminal art from pokemon-colorscripts (MIT)."

### 10.2 Sprite Display Approach

No rendering pipeline needed. The sprites are pre-rendered ANSI strings:

```
1. At build/install time: download colorscript files from GitHub repo
2. Store as .txt files in sprites/colorscripts/{small,large}/
3. At runtime: read the .txt file → return as MCP text content
4. Claude Code terminal renders the ANSI codes directly
```

### 10.3 Output Contexts

| Context | Size | Source | Notes |
|---------|------|--------|-------|
| `/buddy show` | Small (~11 lines) | `sprites/colorscripts/small/{id}-{name}.txt` | Inline in stats card |
| `/buddy evolve` | Large (~21 lines) | `sprites/colorscripts/large/{id}-{name}.txt` | Celebration display |
| Status line | Text only | N/A | Name + Lv + XP bar (no sprite — status line can't render ANSI art) |

### 10.4 Sprite File Format

Plain text files containing raw ANSI escape codes:
```
sprites/colorscripts/
├── small/
│   ├── 1-bulbasaur.txt     # ~11 lines, ANSI colored
│   ├── 2-ivysaur.txt
│   ├── ...
│   └── 151-mew.txt
└── large/
    ├── 1-bulbasaur.txt     # ~21 lines, ANSI colored
    ├── 2-ivysaur.txt
    ├── ...
    └── 151-mew.txt
```

No JSON wrapper needed — the files ARE the sprite (just `cat` them).

---

## 11. Status Line

### 11.1 Display Format

```
[Pokemon mini sprite] [Name] Lv.{level} [{XP bar}] {reaction bubble}
```

Example:
```
🔥 Charmander Lv.14 [████░░] *wags tail*
```

### 11.2 Animation

- **Idle:** 2-3 frame loop (sprite shift, blink)
- **Level up:** Celebration animation (sparkles, bouncing) + terminal bell (`\x07`)
- **Evolution:** Morphing animation (old sprite → glow → new sprite) + terminal bell
- **Wild encounter:** "Wild X appeared!" + terminal bell (`\x07`)
- **Reaction:** Speech bubble appears for 5 seconds
- **Refresh rate:** 500ms per frame (1s refresh interval in settings)

### 11.3 Status Line Script (`statusline/buddy-status.sh`)

- Reads current state from `~/.claudemon/status.json`
- Renders mini sprite + name + level + XP bar
- Right-aligned using Braille Blank (U+2800) for padding
- Walks process parent chain to detect terminal width
- Handles narrow terminals gracefully

---

## 12. Skill / Slash Command

### 12.1 SKILL.md

```markdown
---
name: buddy
description: Interact with your Pokemon coding companion
allowed-tools: mcp__claudemon__*
---

Route /buddy subcommands:

- `/buddy` or `/buddy show` → call buddy_show
- `/buddy stats` → call buddy_stats
- `/buddy pet` → call buddy_pet
- `/buddy rename <name>` → call buddy_rename
- `/buddy evolve` → call buddy_evolve
- `/buddy achievements` → call buddy_achievements
- `/buddy pokedex` → call buddy_pokedex
- `/buddy party` → call buddy_party
- `/buddy catch` → call buddy_catch
- `/buddy mute` / `/buddy unmute` → toggle reactions
- `/buddy starter <choice>` → call buddy_starter

Display all tool output EXACTLY as returned. Do not summarize.
Use $ARGUMENTS to route to the correct subcommand.
```

---

## 13. State Management

### 13.1 Storage Location

`~/.claudemon/`

### 13.2 Files

| File | Purpose | Updated By |
|------|---------|-----------|
| `profile.json` | Trainer profile, active Pokemon, party | MCP server |
| `pokedex.json` | Seen/caught/evolved for each of 151 | MCP server |
| `events.json` | Lifetime event counters | Hooks |
| `achievements.json` | Unlocked achievements with timestamps | MCP server |
| `streaks.json` | Daily streak data | Hooks |
| `status.json` | Compact state for status line | MCP server + hooks |
| `config.json` | User preferences (cooldown, mute, theme) | MCP server |
| `reaction.{sid}.json` | Transient reaction state per session | Hooks |

### 13.3 Profile Structure

```json
{
  "trainerId": "uuid",
  "trainerName": "Umang",
  "title": "Bug Catcher",
  "startedAt": "2026-04-13T00:00:00Z",
  "party": [
    {
      "pokemonId": 4,
      "nickname": "Blaze",
      "level": 14,
      "currentXp": 320,
      "totalXp": 2120,
      "codingStats": {
        "stamina": 45,
        "debugging": 62,
        "stability": 38,
        "velocity": 55,
        "wisdom": 41
      },
      "happiness": 180,
      "caughtAt": "2026-04-13T10:00:00Z",
      "evolvedAt": null,
      "isActive": true,
      "personality": null
    }
  ],
  "badges": [],
  "totalSessions": 12,
  "totalXpEarned": 2120
}
```

### 13.4 Atomic Writes

All state mutations use the temp-file + atomic-rename pattern:
```typescript
async function atomicWrite(path: string, data: unknown): Promise<void> {
  const tmp = `${path}.${Date.now()}.tmp`;
  await Bun.write(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, path);
}
```

---

## 14. Gamification Layer

### 14.1 Achievements

| Achievement | Condition | Reward |
|------------|-----------|--------|
| First Steps | Pick your starter | Pokeball icon |
| First Blood | First git commit with buddy active | +50 XP |
| Bug Hunter | Fix 10 errors | DEBUGGING +5 |
| Test Champion | Pass 50 test suites | STABILITY +5 |
| Centurion | 100 commits | Thunder Stone badge |
| Marathon | 5-day coding streak | STAMINA +10 |
| Unstoppable | 30-day coding streak | Moon Stone badge |
| Evolution | Evolve a Pokemon for the first time | +200 XP |
| Full Party | Have 6 Pokemon in your party | +100 XP |
| Collector | Catch 50 unique Pokemon | Rare encounter boost |
| Completionist | Fill the entire Pokedex (151) | Master Ball title |
| Master | Reach level 100 with any Pokemon | "Pokemon Master" title |
| Speed Runner | Reach level 50 in under 2 weeks | +500 XP |
| Night Owl | Code in 10 sessions after midnight | Ghost-type encounter |
| Early Bird | Code in 10 sessions before 7am | Flying-type encounter |

### 14.2 Catching Pokemon

Pokemon aren't random — they unlock based on coding activity and milestones. This replaces "wild encounters" with deterministic progression.

**Tier 1: Common Pokemon (~80 species)**
Unlocked by cumulative XP milestones. Every ~1000 total XP earned unlocks the next common Pokemon from a shuffled list. Examples:
- Pidgey: First file edited
- Rattata: 10 files edited in one session
- Zubat: 10 code searches (Grep/Read)
- Geodude: First build success
- Caterpie: 5 lint fixes

**Tier 2: Uncommon Pokemon (~40 species)**
Unlocked by specific coding achievements:
- Abra: 50 commits lifetime (flees if you don't commit for 3 days — re-appears after next commit)
- Machop: First large refactor (200+ line diff)
- Magikarp: Encounter 100 errors (then evolves to Gyarados at L20!)
- Eevee: Have 3 different Pokemon reach level 20
- Porygon: Write a test that passes on first run

**Tier 3: Rare Pokemon (~20 species)**
Unlocked by significant milestones:
- Dratini: Reach level 50 on any Pokemon
- Lapras: 30-day daily streak
- Snorlax: Code for 8+ hours in a single day
- Scyther: 50 lint fixes in one session
- Aerodactyl: Revive an abandoned branch (checkout branch untouched for 30+ days)

**Tier 4: Legendary Pokemon (5 species)**
Exceptional achievements, end-game rewards:

| Pokemon | Unlock Condition |
|---------|-----------------|
| Articuno | 100-day daily coding streak |
| Zapdos | 1000 tests passed lifetime |
| Moltres | 500 bugs fixed lifetime |
| Mewtwo | Fill 140/151 Pokedex entries |
| Mew | 365-day coding streak (the ultimate reward) |

**"Seen" vs "Caught":** The system teases upcoming Pokemon: "A wild Pidgey appeared! Earn 500 more XP to catch it." This gives the user a preview (Pokedex "seen") before actually catching it.

### 14.3 Trainer Titles

| Level Range | Title |
|------------|-------|
| 1-5 | Bug Catcher |
| 6-10 | Youngster |
| 11-20 | Hiker |
| 21-30 | Ace Trainer |
| 31-40 | Cooltrainer |
| 41-50 | Veteran |
| 51-60 | Elite Four |
| 61-75 | Champion |
| 76-90 | Pokemon Master |
| 91-100 | Professor |

### 14.4 Daily Streaks

- Tracked by calendar day (local timezone)
- Streak increments on first coding activity of the day
- Streak resets if a full calendar day is missed
- Streak milestones: 3, 7, 14, 30, 60, 100, 200, 365 days
- Each milestone gives bonus XP and potential Pokemon encounter

---

## 15. The Journey — Starter Selection & Pokemon Discovery

### 15.1 First Run: "Professor Oak" Moment

When the user first runs `/buddy` or installs Claudemon, they get the classic Pokemon professor experience — but with a twist. Instead of always offering Bulbasaur/Charmander/Squirtle, **3 random common Pokemon** are presented:

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   Professor Oak:                                         ║
║   "Welcome to the world of Claudemon!                    ║
║    I have 3 Pokemon here for you to choose from."        ║
║                                                          ║
║   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       ║
║   │  ░░░█░░░░   │ │  ░░████░░   │ │  ░░░░░░░░   │       ║
║   │  ░░█░█░░░   │ │  ░█░░░█░░   │ │  ░░██░██░   │       ║
║   │  ░█████░░   │ │  ░██████░░   │ │  ░██████░   │       ║
║   │  ░░███░░░   │ │  ░░█░█░░░   │ │  ░░░██░░░   │       ║
║   │             │ │             │ │             │       ║
║   │ [1] Pidgey  │ │ [2] Oddish  │ │ [3] Gastly  │       ║
║   │ Normal/Fly  │ │ Grass/Poison│ │ Ghost/Poison│       ║
║   └─────────────┘ └─────────────┘ └─────────────┘       ║
║                                                          ║
║   Choose wisely... your journey begins with one!         ║
╚══════════════════════════════════════════════════════════╝
```

**Starter Pool:** ~40 common Pokemon that are base-stage (first in their evolution chain). Randomized per user using a hash of their machine ID + timestamp. Always 3 choices. Examples of what might appear:

| Pokemon | Type | Evolution Path |
|---------|------|---------------|
| Pidgey | Normal/Flying | → Pidgeotto (18) → Pidgeot (36) |
| Rattata | Normal | → Raticate (20) |
| Oddish | Grass/Poison | → Gloom (21) → Vileplume (Leaf Badge) |
| Gastly | Ghost/Poison | → Haunter (25) → Gengar (Collab milestone) |
| Machop | Fighting | → Machoke (28) → Machamp (Collab milestone) |
| Geodude | Rock/Ground | → Graveler (25) → Golem (Collab milestone) |
| Abra | Psychic | → Kadabra (16) → Alakazam (Collab milestone) |
| Poliwag | Water | → Poliwhirl (25) → Poliwrath (Water Badge) |
| Caterpie | Bug | → Metapod (7) → Butterfree (10) |
| Zubat | Poison/Flying | → Golbat (22) |
| Nidoran-M | Poison | → Nidorino (16) → Nidoking (Moon Badge) |
| Nidoran-F | Poison | → Nidorina (16) → Nidoqueen (Moon Badge) |
| Bellsprout | Grass/Poison | → Weepinbell (21) → Victreebel (Leaf Badge) |
| Sandshrew | Ground | → Sandslash (22) |
| Ekans | Poison | → Arbok (22) |
| Mankey | Fighting | → Primeape (28) |
| Venonat | Bug/Poison | → Venomoth (31) |
| Diglett | Ground | → Dugtrio (26) |
| Meowth | Normal | → Persian (28) |
| Psyduck | Water | → Golduck (33) |
| Ponyta | Fire | → Rapidash (40) |
| Slowpoke | Water/Psychic | → Slowbro (37) |
| Magnemite | Electric | → Magneton (30) |
| Doduo | Normal/Flying | → Dodrio (31) |
| Krabby | Water | → Kingler (28) |
| Cubone | Ground | → Marowak (28) |
| Voltorb | Electric | → Electrode (30) |
| Horsea | Water | → Seadra (32) |
| Goldeen | Water | → Seaking (33) |
| Drowzee | Psychic | → Hypno (26) |
| Koffing | Poison | → Weezing (35) |
| Paras | Bug/Grass | → Parasect (24) |
| Spearow | Normal/Flying | → Fearow (20) |

**Why random commons instead of Bulbasaur/Charmander/Squirtle?**
- Every user gets a unique starting experience
- Makes the classic starters feel special when you eventually discover them
- Encourages diversity — "I started with Gastly, what did you get?"
- The 3 choices always span different types so the user has meaningful variety

### 15.2 The Journey — How You Discover & Catch Pokemon

After picking your starter, you begin your coding journey. New Pokemon appear through **4 discovery methods**:

#### Method 1: Wild Encounters (Activity-Based)

As you code, wild Pokemon appear based on what you're doing. The system tracks your coding activity and periodically triggers encounters:

```
┌────────────────────────────────────────────┐
│  Wild Pidgey appeared!                      │
│                                              │
│  ░░░█░░░                                    │
│  ░░█░█░░  Pidgey  Lv.3                     │
│  ░█████░  Normal/Flying                     │
│  ░░███░░                                    │
│                                              │
│  Your Gastly's WISDOM is high enough to     │
│  catch it! Use /buddy catch to add Pidgey   │
│  to your party!                             │
└────────────────────────────────────────────┘
```

**Encounter triggers by coding activity:**

| Activity Type | Pokemon Types That Appear | Examples |
|--------------|--------------------------|---------|
| Fixing bugs/errors | Bug, Poison | Caterpie, Weedle, Grimer, Koffing |
| Writing/passing tests | Fighting, Normal | Machop, Mankey, Rattata |
| Large refactors | Psychic, Dragon | Abra, Drowzee, Dratini (rare!) |
| API/network work | Water, Electric | Poliwag, Magnemite, Voltorb |
| Build/compile | Fire, Rock | Ponyta, Geodude, Vulpix |
| File exploration/search | Flying, Ground | Pidgey, Spearow, Sandshrew, Diglett |
| Long sessions (endurance) | Normal, Grass | Snorlax (rare!), Oddish, Bellsprout |
| Late night coding | Ghost, Dark | Gastly, Haunter, Zubat |

**Encounter rate:** ~1 encounter per 500 XP earned (roughly every 30-60 minutes of active coding). Not every encounter is catchable — your active Pokemon needs sufficient stats.

#### Method 2: Catch Conditions

Not every Pokemon you encounter can be caught immediately. Each species has a **catch condition** — a stat or achievement requirement:

```typescript
interface CatchCondition {
  // Minimum stat on your active Pokemon to catch this species
  requiredStat?: { stat: CodingStat; minValue: number };
  // OR minimum trainer achievement
  requiredAchievement?: string;
  // OR minimum active Pokemon level
  requiredLevel?: number;
  // Catch difficulty (affects whether encounter succeeds)
  catchRate: number; // 1-255 (higher = easier, same as Gen 1)
}
```

- **Common Pokemon** (catch rate 200-255): Just encounter them, catch easily
- **Uncommon Pokemon** (catch rate 100-199): Need decent stats or level
- **Rare Pokemon** (catch rate 30-99): Need high stats AND specific achievements
- **Legendary Pokemon** (catch rate 3-10): Need exceptional milestones

If your stats aren't high enough: "Wild Dratini appeared! ...but it fled. Reach WISDOM 60 to catch Dragon types."

**Flee behavior:** Pokemon that flee are NOT gone forever — they return in future encounters. The same species can appear multiple times and you can catch duplicates (just like the real games). Duplicates go to PC Box.

**Duplicate use cases:**
- Train different builds of the same Pokemon (high DEBUGGING Machop vs high VELOCITY Machop)
- Trade/release system in the future
- Completionist vibes — "I have 3 Pikachus"

This creates a **growth incentive** — you need to level up and improve your stats to catch rarer Pokemon.

#### Method 3: Milestone Discoveries

Specific Pokemon appear at specific coding milestones (guaranteed, not random):

| Milestone | Pokemon Discovered | Why |
|-----------|-------------------|-----|
| First commit | Pidgey | "Every journey starts with a first step" |
| 10 tests passed | Machop | "Your code is getting stronger" |
| First build success | Geodude | "Solid foundations" |
| 50 commits | Abra | "You're getting quick" |
| 100 errors fixed | Grimer → Muk | "You've seen some ugly code" |
| First PR merged | Magikarp | "Humble beginnings... just wait" |
| 200 commits | Magikarp → Gyarados | "All that persistence paid off!" |
| 7-day streak | Eevee | "Your dedication unlocks potential" |
| 30-day streak | Lapras | "A rare companion for the dedicated" |
| 100 tests written | Porygon | "A digital creation for a digital creator" |

#### Method 4: Legendary Quests

Legendaries don't just "appear" — they have multi-step **quest chains** visible in `/buddy legendary`:

```
┌─ LEGENDARY QUEST: Articuno ──────────────────┐
│                                                │
│  The Ice Bird of Endurance                     │
│                                                │
│  Step 1: ✅ Reach 30-day coding streak         │
│  Step 2: ✅ Have 3 Ice/Water Pokemon caught    │
│  Step 3: ░░ Reach 100-day coding streak        │
│  Step 4: ░░ Your active Pokemon reaches Lv.50  │
│                                                │
│  Progress: 2/4 steps complete                  │
│  "The frozen peak awaits..."                   │
└────────────────────────────────────────────────┘
```

### 15.3 Installation

#### One-Command Install

```bash
npx claudemon install
```

#### Install Steps

1. Check prerequisites (Bun runtime, Claude Code version)
2. Create `~/.claudemon/` directory
3. Register MCP server in Claude Code settings (`~/.claude.json`)
4. Install hooks in `~/.claude/settings.json`
5. Install skill in `~/.claude/skills/buddy/SKILL.md`
6. Configure status line in `~/.claude/settings.json`
7. Generate 3 random common starters → display Professor Oak TUI
8. User picks starter → initialize profile at Level 5
9. Display welcome message: "Your journey begins!"

#### Uninstall

```bash
npx claudemon uninstall
```

Reverses all config changes, optionally preserves `~/.claudemon/` data.

#### Doctor

```bash
npx claudemon doctor
```

Checks: MCP server reachable, hooks installed, skill registered, status line working, state files valid.

---

## 16. Phase Plan

### Phase 1: Foundation (MVP) — Core Loop
**Goal:** Pick a starter, see it, earn XP, level up

- [ ] Project setup (package.json, tsconfig, bunfig)
- [ ] Pokemon data file (151 Pokemon with stats, types, evolution chains)
- [ ] Core types & interfaces
- [ ] XP/leveling engine
- [ ] State management (profile, atomic IO)
- [ ] MCP server with basic tools: `buddy_show`, `buddy_stats`, `buddy_starter`, `buddy_pet`
- [ ] Basic sprite renderer (monochrome Unicode art for MCP output)
- [ ] CLI installer (register MCP server)
- [ ] PostToolUse hook (detect commits, tests, edits → award XP)
- [ ] Skill file (`/buddy` slash command)
- [ ] Basic tests

**Deliverable:** User installs, gets 3 random common starters, picks one, codes for a while, sees XP grow, levels up.

### Phase 2: Evolution & Sprites
**Goal:** Pokemon evolve, sprites look amazing

- [ ] Evolution engine (level-based, milestone-based, collaboration-based)
- [ ] Sprite generation pipeline (download PNG → ANSI half-block)
- [ ] Full-size sprite display (terminal)
- [ ] Mini sprite display (status line)
- [ ] Status line script (animated)
- [ ] Evolution animation
- [ ] Level-up animation
- [ ] Eevee branching evolution logic

**Deliverable:** Your starter evolves at the right level, retro Game Boy sprites render beautifully.

### Phase 3: Gamification
**Goal:** Achievements, catching, Pokedex

- [ ] Achievement system (definitions, tracking, unlock notifications)
- [ ] Wild encounter system (activity-based + milestone discoveries)
- [ ] Catch conditions (stat requirements, catch rates)
- [ ] Pokedex tracking (seen/caught/evolved)
- [ ] Party management (6 Pokemon max, switching)
- [ ] Badge system (stone evolution replacements)
- [ ] Daily streaks
- [ ] Trainer titles
- [ ] Stop hook (buddy comments in Claude responses)
- [ ] UserPromptSubmit hook (name reactions)

- [ ] Legendary quest chains (multi-step unlock)

**Deliverable:** Full journey loop — wild encounters appear, catch with stats, legendary quests visible.

### Phase 4: Polish & Distribution
**Goal:** Production-ready, publishable

- [ ] Dynamic instructions (buddy personality in Claude's prompt)
- [ ] Pokemon-type-specific reactions (all 15 types)
- [ ] Reaction cooldowns and frequency tuning
- [ ] Doctor CLI (diagnostics)
- [ ] Uninstall CLI
- [ ] Comprehensive tests (aim for 80%+ coverage)
- [ ] npm package publishing
- [ ] README with screenshots/GIFs
- [ ] Legendary Pokemon encounters

### Phase 5: Extended Features (Future)
- [ ] **Shiny Pokemon** — rare cosmetic variants (architecture ready: `shiny` flag on OwnedPokemon)
- [ ] **XP sharing** — passive XP for inactive party Pokemon (architecture ready: hook into XP award flow)
- [ ] **Full-color sprite mode** — toggle from retro grayscale to modern colored sprites
- [ ] Cross-session memory (buddy remembers past projects)
- [ ] Mood system (shifts based on code quality, time of day)
- [ ] Battle system (compare stats with other users?)
- [ ] Community Pokedex leaderboard
- [ ] Light theme color support
- [ ] More interactions (feed, train, play)
- [ ] Trade system (exchange Pokemon between users via shared keys)

---

## 17. Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single `state.json` vs multiple files | **Single file** (manifest pattern) | Atomic writes ensure consistency. 151 Pokemon with stats < 100KB |
| XP calculation location | **Hybrid bash+bun** | Bash for fast pattern matching, bun for Gen 1 XP math |
| Sprite storage | **Pre-rendered ANSI text files, committed** | No runtime deps. Just read .txt and print. ~1MB for all 151 in 2 sizes |
| Sprite source | **pokemon-colorscripts (hand-crafted)** | 1,329 sprites across all gens. Pixel-perfect in terminal. Replaces PokeAPI image conversion. |
| Level cap | **100** (faithful to Gen 1) | After 100, XP still tracks for achievements but level doesn't increase |
| Party size | **6** (faithful to Gen 1) | Overflow goes to PC Box, switch with `/buddy switch` |
| Eevee branching | **Dominant coding stat** | More interesting than arbitrary; creates "which did you get?" moments |
| Active Pokemon | **Only active gets XP** | Forces meaningful party management choices |
| Starter level | **Level 5** (like the games) | Familiar, gives immediate progress feel |
| Catch failure | **Pokemon returns later** | Not gone forever. Duplicates allowed (like real games) |
| Terminal bell | **Yes** (`\x07` BEL) | On level-ups AND wild encounters. Subtle audio cue |
| Shiny Pokemon | **Not v1, architecture ready** | `shiny` flag on OwnedPokemon, implement later |
| XP sharing | **Not v1, architecture ready** | Hook point in XP award flow, implement later |
| Starter pool | **~33 random commons** | Unique experience per user, classic starters are discoverable later |

---

## 18. Open Questions

### Resolved
- **Language?** → TypeScript with Bun
- **Start fresh?** → Yes, fresh start
- **Pokemon Gen?** → Gen 1 only (151)
- **Distribution?** → npm package

### Resolved (Updated)
- **Sprites?** → ~~Grayscale retro~~ → ~~`front_default` PNG~~ → **pokemon-colorscripts** (hand-crafted ANSI terminal art, 1,329 sprites, all gens). Pixel-perfect, no image conversion needed.
- **Party size?** → 6 (faithful to original games)
- **XP pacing?** → First evolution in 2-3 days, level 100 in 2-4 months
- **License?** → Use PokeAPI sprites with disclaimer. No purchase needed. Fan project.
- **Name?** → **Claudemon** ("Claude" + "Pokemon")
- **Starter selection?** → 3 random common Pokemon (not fixed Bulbasaur/Charmander/Squirtle)

### Resolved (Round 2)
- **Encounter rate?** → ~1 per 500 XP earned (~30-60 min of active coding)
- **Catch failure?** → Pokemon returns later (not gone forever). Same species can be caught multiple times (duplicates allowed, like the real games)
- **XP sharing?** → Not in v1. Leave architecture room for it (passive XP for inactive party). Future feature.
- **Shiny Pokemon?** → Not in v1. Leave architecture room for it (shiny flag on OwnedPokemon). Future feature.
- **Terminal bell?** → Yes, use `\x07` (BEL) on level-ups AND wild encounters. Subtle audio cue.

### All Questions Resolved
No open questions remain. Ready to build.

---

## Summary

**Claudemon** is a **Pokemon Gen 1 coding companion** that:
- Presents 3 random common Pokemon as starters on first install
- Levels up as you code (XP from commits, tests, edits, errors)
- Evolves at authentic Gen 1 levels (Pidgey → Pidgeotto at 18 → Pidgeot at 36)
- Shows hand-crafted colored Pokemon art in your terminal (pokemon-colorscripts, pixel-perfect)
- Reacts to your coding with type-appropriate personality
- Wild Pokemon appear based on your coding activity (bugs → Bug types, tests → Fighting types)
- Has a full Pokedex of 151 to discover and catch through your coding journey
- Legendary quests with multi-step challenge chains
- Features achievements, streaks, badges, and trainer titles
- Lives as an MCP server that survives every Claude Code update
- Installs in one command: `npx claudemon install`
