# Claudemon

> Pokemon coding companion for Claude Code -- Gotta code 'em all!

## What is Claudemon?

A gamified coding companion that lives inside Claude Code. Pick a starter Pokemon,
earn XP from your coding activity, level up, evolve, catch wild Pokemon, and
fill your Pokedex -- all while you code.

## Features

- **905 Pokemon** (Gen 1-8) with authentic base stats and evolution chains
- **18 types** including Steel, Dark, and Fairy
- **XP from coding** -- commits, tests, builds, edits, and more
- **Level up & evolve** -- Charmander -> Charmeleon -> Charizard
- **Wild encounters** -- Pokemon appear based on your coding activity
- **Catch 'em all** -- fill your 905-entry Pokedex
- **Share codes** -- compare Pokemon & stats with friends (no server needed)
- **PC Box** -- browse and manage stored Pokemon
- **Achievements** -- 17 milestones to unlock
- **Legendary quests** -- multi-step challenges for Articuno, Zapdos, Moltres, Mewtwo, Mew
- **Colored terminal sprites** -- 905 hand-crafted pixel art sprites in your terminal
- **Status line** -- sprite + name + model + buddy speech on the prompt line
- **Type personalities** -- 18 unique reaction styles
- **Nickname your Pokemon** -- shown as "Sparky (Pikachu)" everywhere

## Install

**Recommended (global install — persistent):**
```bash
npm install -g @umang-boss/claudemon
claudemon install
```

**Or quick try (npx — may need reinstall after cache clear):**
```bash
npx @umang-boss/claudemon install
```

Start a new Claude Code session and type `/buddy` to begin!

**Requirements:** Node.js 18+ (Bun optional, auto-detected for faster startup)

### Other CLI Commands

```bash
claudemon doctor     # Check installation health
claudemon update     # Re-register after updates
claudemon uninstall  # Remove (preserves save data)
```

> **Note:** `npm install -g` is recommended over `npx` because the MCP server path needs to persist. With `npx`, the path points to a temporary cache that may be cleaned up.

## Commands

Once installed, use `/buddy` in Claude Code:

| Command | What it does |
|---------|-------------|
| `/buddy` | Show your Pokemon |
| `/buddy pet` | Bond with your buddy (+XP, +happiness) |
| `/buddy stats` | Detailed stat breakdown |
| `/buddy rename Sparky` | Give a nickname |
| `/buddy rename` | Reset to species name |
| `/buddy evolve` | Check/trigger evolution |
| `/buddy catch` | Catch wild Pokemon |
| `/buddy catch confirm` | Throw a Pokeball! |
| `/buddy party` | View party (6 max) |
| `/buddy switch 2` | Switch active Pokemon |
| `/buddy box` | Browse PC Box |
| `/buddy pokedex` | Track your 905 collection |
| `/buddy achievements` | View progress |
| `/buddy legendary` | Legendary quest chains |
| `/buddy share` | Generate share code for your Pokemon |
| `/buddy share party` | Share your full trainer profile |
| `/buddy compare <code>` | Compare with a friend's share code |
| `/buddy feed` | Feed your Pokemon (+happiness) |
| `/buddy train` | Train a stat (+XP) |
| `/buddy play` | Pokemon trivia quiz |
| `/buddy help` | Categorized command reference |
| `/buddy hide` | Hide sprite from status line |
| `/buddy unhide` | Show sprite |

## How It Works

Claudemon runs as an MCP (Model Context Protocol) server alongside Claude Code.
It uses hooks to detect your coding activity and award XP automatically.

```
Claude Code -> MCP Server (Claudemon)
           -> Hooks (PostToolUse, Stop, UserPromptSubmit)
           -> Status Line (sprite + name + model + speech)
           -> /buddy Skill (slash commands)
```

### XP Sources

| Activity | XP | Stat Boosted |
|----------|-----|-------------|
| Git commit | +15 | VELOCITY |
| Tests pass | +12 | STABILITY |
| Test written | +10 | STABILITY |
| Build success | +10 | STABILITY |
| Bug fix | +8 | DEBUGGING |
| Lint fix | +6 | DEBUGGING |
| File created | +5 | VELOCITY |
| File edited | +3 | VELOCITY |
| Large refactor | +20 | WISDOM |

### Evolution

Pokemon evolve at the same levels as the original games:
- **Level-based:** Charmander -> Charmeleon (L16) -> Charizard (L36)
- **Badge-based:** Pikachu -> Raichu (Spark Badge -- 200 commits)
- **Collaboration:** Kadabra -> Alakazam (10 PRs merged)
- **Stat-based:** Eevee -> Flareon/Vaporeon/Jolteon (dominant coding stat)

### Badges

| Badge | Condition | Unlocks |
|-------|-----------|---------|
| Blaze Badge | Fix 50 bugs | Fire Stone evolutions |
| Flow Badge | Pass 100 tests | Water Stone evolutions |
| Spark Badge | 200 commits | Thunder Stone evolutions |
| Lunar Badge | 30-day streak | Moon Stone evolutions |
| Growth Badge | Edit 500 files | Leaf Stone evolutions |

### Wild Encounters

As you code, wild Pokemon appear based on your activity:
- Fixing bugs -> Bug/Poison types
- Writing tests -> Fighting/Normal types
- Large refactors -> Psychic/Dragon types
- Build/compile -> Fire/Steel types
- Late night coding -> Ghost/Dark types
- Morning sessions -> Grass/Fairy types

Encounters trigger roughly every 250 XP earned (configurable). Use `/buddy catch` to try catching them!

### Legendary Quests

5 multi-step quest chains for legendary Pokemon:
- **Articuno** -- The Ice Bird of Endurance (100-day streak)
- **Zapdos** -- The Thunder of Testing (1000 tests passed)
- **Moltres** -- The Flame of Debugging (500 bugs fixed)
- **Mewtwo** -- The Ultimate Creation (140 Pokedex entries)
- **Mew** -- The Myth (365-day coding streak)

## Status Line

The status line shows your Pokemon sprite on the right side of the input prompt:

```
*Pikachu hums softly*  Pikachu Lv.10
Opus 4.6                [colored sprite]
                        [colored sprite]
                        [colored sprite]
```

- Buddy speech rotates every 30 seconds (zero API cost -- hardcoded messages)
- Model name from Claude Code
- `/buddy hide` to toggle sprite visibility

## Development

```bash
# Clone and install
git clone https://github.com/umang-dabhi/claudemon.git
cd claudemon
bun install

# Run tests (350 tests)
bun test

# Type checking
bun run typecheck

# Format
bun run format

# Build for npm (compiles TS to JS)
npm run build
```

## Requirements

- [Claude Code](https://claude.ai/code)
- Node.js 18+ (or [Bun](https://bun.sh) for faster startup)
- `jq` for status line (`sudo apt install jq` on Ubuntu)

## Disclaimer

Pokemon is a trademark of Nintendo/Game Freak/The Pokemon Company.
Claudemon is a fan project, not affiliated with or endorsed by them.
Terminal art from [pokemon-colorscripts](https://github.com/tageraf1n/pokemon-colorscripts) (MIT).

## License

MIT
