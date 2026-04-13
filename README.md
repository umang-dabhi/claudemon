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
- **Achievements** -- 18 milestones to unlock
- **Legendary quests** -- multi-step challenges for Articuno, Zapdos, Moltres, Mewtwo, Mew
- **Colored terminal sprites** -- hand-crafted pixel art in your terminal
- **Type personalities** -- 15 unique reaction styles

## Quick Start

```bash
# Install
bun run cli/install.ts

# Start a new Claude Code session, then:
/buddy              # Pick your starter
/buddy show         # See your Pokemon
/buddy pet          # Bond with your companion
/buddy stats        # Detailed stats
/buddy evolve       # Check evolution status
/buddy catch        # Catch wild Pokemon
/buddy party        # Manage your party
/buddy pokedex      # Track your collection
/buddy achievements # View progress
/buddy legendary    # Legendary quest chains
```

## How It Works

Claudemon runs as an MCP (Model Context Protocol) server alongside Claude Code.
It uses hooks to detect your coding activity and award XP automatically.

### Architecture

```
Claude Code -> MCP Server (Claudemon)
           -> Hooks (PostToolUse, Stop, UserPromptSubmit)
           -> Status Line (name + level + XP bar)
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
- Level-based: Charmander -> Charmeleon (L16) -> Charizard (L36)
- Badge-based: Pikachu -> Raichu (Spark Badge -- 200 commits)
- Collaboration: Kadabra -> Alakazam (10 PRs merged)
- Stat-based: Eevee -> Flareon/Vaporeon/Jolteon (dominant coding stat)

### Badges

| Badge | Condition | Unlocks |
|-------|-----------|---------|
| Blaze Badge | Fix 50 bugs | Fire Stone evolutions |
| Flow Badge | Pass 100 tests | Water Stone evolutions |
| Spark Badge | 200 commits | Thunder Stone evolutions |
| Lunar Badge | 30-day streak | Moon Stone evolutions |
| Growth Badge | Edit 500 files | Leaf Stone evolutions |

### Trainer Titles

Your title progresses as your Pokemon levels up:

| Level | Title |
|-------|-------|
| 1 | Bug Catcher |
| 6 | Youngster |
| 11 | Hiker |
| 21 | Ace Trainer |
| 31 | Cooltrainer |
| 41 | Veteran |
| 51 | Elite Four |
| 61 | Champion |
| 76 | Pokemon Master |
| 91 | Professor |

## CLI Tools

```bash
# Install Claudemon into Claude Code
bun run cli/install.ts

# Uninstall (preserves your save data)
bun run cli/uninstall.ts

# Diagnose installation issues
bun run cli/doctor.ts
```

## Development

```bash
# Run the MCP server directly
bun run server

# Run tests
bun test

# Type checking
bun run typecheck

# Format code
bun run format
```

### Project Structure

```
src/
  engine/          # Game logic: XP, evolution, encounters, stats
  gamification/    # Achievements, milestones, legendary quests
  server/          # MCP server and tool handlers
  sprites/         # Terminal sprite rendering
  state/           # Save state management
cli/               # Install, uninstall, doctor scripts
hooks/             # PostToolUse, Stop, UserPromptSubmit shell scripts
skills/buddy/      # /buddy slash command definition
sprites/full/      # 151 colored terminal sprite files
statusline/        # Status bar shell script
tests/             # Test suites
```

## Requirements

- [Claude Code](https://claude.ai/code) v2.1.80+
- [Bun](https://bun.sh) v1.0+

## Disclaimer

Pokemon is a trademark of Nintendo/Game Freak/The Pokemon Company.
Claudemon is a fan project, not affiliated with or endorsed by them.
Terminal art from [pokemon-colorscripts](https://github.com/tageraf1n/pokemon-colorscripts) (MIT).

## License

MIT
