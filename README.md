# Claudemon

> Pokemon Gen 1 coding companion for Claude Code -- Gotta code 'em all!

## What is Claudemon?

A gamified coding companion that lives inside Claude Code. Pick a starter Pokemon,
earn XP from your coding activity, level up, evolve, catch wild Pokemon, and
fill your Pokedex -- all while you code.

## Features

- **151 Gen 1 Pokemon** with authentic base stats and evolution chains
- **XP from coding** -- commits, tests, builds, edits, and more
- **Level up & evolve** -- Charmander -> Charmeleon -> Charizard
- **Wild encounters** -- Pokemon appear based on your coding activity
- **Catch 'em all** -- fill your 151-entry Pokedex
- **Achievements** -- 17 milestones to unlock
- **Legendary quests** -- multi-step challenges for Articuno, Zapdos, Moltres, Mewtwo, Mew
- **Colored terminal sprites** -- hand-crafted pixel art in your terminal
- **Status line** -- sprite + name + model + buddy speech on the prompt line
- **Type personalities** -- 15 unique reaction styles
- **Nickname your Pokemon** -- give them custom names

## Install

```bash
npx @umang-boss/claudemon install
```

That's it! Start a new Claude Code session and type `/buddy`.

**Requirements:** Node.js 18+ (Bun optional, auto-detected for faster startup)

### Other CLI Commands

```bash
npx @umang-boss/claudemon doctor     # Check installation health
npx @umang-boss/claudemon update     # Re-register after updates
npx @umang-boss/claudemon uninstall  # Remove (preserves save data)
```

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
| `/buddy pokedex` | Track your 151 collection |
| `/buddy achievements` | View progress |
| `/buddy legendary` | Legendary quest chains |
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

Pokemon evolve at the same levels as the original Gen 1 games:
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
- Build/compile -> Fire/Rock types

Encounters trigger roughly every 500 XP earned. Use `/buddy catch` to try catching them!

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

# Run tests (309 tests)
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
