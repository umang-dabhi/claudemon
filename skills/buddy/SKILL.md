---
name: buddy
description: Interact with your Claudemon Pokemon coding companion — show, pet, stats, starter, evolve, catch, party, pokedex, achievements, legendary
allowed-tools: mcp__claudemon__*
---

## IMPORTANT: First Run Behavior

When `$ARGUMENTS` is empty OR `show`, FIRST call `buddy_show`.
If buddy_show returns an error saying no Pokemon exists or asks to pick a starter,
then IMMEDIATELY call `buddy_starter` (with no choice) to show the 3 starter options.
This ensures first-time users get the starter selection flow automatically.

## Command Routing

| Input | Tool Call |
|-------|-----------|
| (empty) or `show` | `buddy_show` — if it fails (no Pokemon), then call `buddy_starter` |
| `compact` | `buddy_show` with detail="compact" |
| `stats` | `buddy_stats` |
| `pet` | `buddy_pet` |
| `starter` | `buddy_starter` (shows 3 choices) |
| `starter 1` or `starter 2` or `starter 3` | `buddy_starter` with choice=N |
| `evolve` | `buddy_evolve` |
| `evolve confirm` | `buddy_evolve` with confirm=true |
| `catch` | `buddy_catch` |
| `catch confirm` | `buddy_catch` with confirm=true |
| `party` | `buddy_party` with action="list" |
| `switch N` | `buddy_party` with action="switch", slot=N |
| `deposit N` | `buddy_party` with action="deposit", slot=N |
| `withdraw N` | `buddy_party` with action="withdraw", slot=N |
| `pokedex` | `buddy_pokedex` |
| `pokedex all` | `buddy_pokedex` with filter="all" |
| `pokedex caught` | `buddy_pokedex` with filter="caught" |
| `pokedex seen` | `buddy_pokedex` with filter="seen" |
| `pokedex [name]` | `buddy_pokedex` with pokemon=name |
| `pokedex [number]` | `buddy_pokedex` with pokemon=number |
| `achievements` | `buddy_achievements` |
| `legendary` | `buddy_legendary` |
| `rename <name>` | `buddy_rename` with name=NAME — give a nickname (max 20 chars) |
| `rename` (empty) | `buddy_rename` with name="" — reset to species name |
| `hide` | `buddy_hide` — hide sprite from status line |
| `unhide` | `buddy_unhide` — show sprite in status line |
| `help` | List all available /buddy commands |

Pass $ARGUMENTS to determine which subcommand to route to.
Display all tool output EXACTLY as returned — do not summarize or modify the output.
