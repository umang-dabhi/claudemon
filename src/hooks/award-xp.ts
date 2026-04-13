/**
 * award-xp.ts — Lightweight bun script called by the PostToolUse hook.
 * Usage: bun run award-xp.ts <event_type> <counter_key>
 *
 * Loads state, awards XP to the active Pokemon, applies stat boosts,
 * increments the event counter, updates the streak, and saves.
 * Emits a terminal bell on level-up.
 */

import type { XpEventType, EventCounterKey } from "../engine/types.js";
import { BELL } from "../engine/constants.js";
import { StateManager } from "../state/state-manager.js";
import { addXp, createXpEvent } from "../engine/xp.js";
import { applyStatBoost } from "../engine/stats.js";
import { POKEMON_BY_ID } from "../engine/pokemon-data.js";
import { checkEvolution, getNewlyEarnedBadges } from "../engine/evolution.js";
import { shouldTriggerEncounter, generateEncounter } from "../engine/encounters.js";

const eventType = process.argv[2] as XpEventType;
const counterKey = process.argv[3] as EventCounterKey | undefined;

if (!eventType) {
  process.exit(0);
}

const stateManager = StateManager.getInstance();
const state = await stateManager.load();

// No state file = first run, nothing to do yet
if (!state) {
  process.exit(0);
}

const pokemon = stateManager.getActivePokemon();
if (!pokemon) {
  process.exit(0);
}

const pokemonData = POKEMON_BY_ID.get(pokemon.pokemonId);
if (!pokemonData) {
  process.exit(0);
}

// Create XP event from the event type
const xpEvent = createXpEvent(eventType);

// Award XP and check for level-up
const levelUp = addXp(pokemon, xpEvent.xp, pokemonData);

// Apply stat boost if the event provides one
if (xpEvent.statBoost && xpEvent.boostAmount > 0) {
  applyStatBoost(pokemon, xpEvent.statBoost, xpEvent.boostAmount);
}

// Track total XP earned by the trainer
state.totalXpEarned += xpEvent.xp;

// Increment the event counter directly on state (avoids extra save from incrementCounter)
if (counterKey) {
  state.counters[counterKey] += 1;
}

// Update the daily coding streak
// Inline the streak logic to avoid the extra save from updateStreak()
const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const { streak } = state;

if (streak.lastActiveDate !== todayStr) {
  if (streak.lastActiveDate === null) {
    streak.currentStreak = 1;
    streak.totalDaysActive = 1;
  } else {
    const last = new Date(streak.lastActiveDate);
    const now = new Date(todayStr);
    const diffMs = now.getTime() - last.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }
    streak.totalDaysActive += 1;
  }

  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  streak.lastActiveDate = todayStr;
}

// Check for newly earned badges
const newBadges = getNewlyEarnedBadges(state);
for (const badge of newBadges) {
  state.badges.push(badge);
}

// Check if evolution is available (sets flag in status for status line indicator)
const evolutionReady = checkEvolution(pokemon, state) !== null;

// Track XP toward next encounter and trigger if threshold met
state.xpSinceLastEncounter = (state.xpSinceLastEncounter ?? 0) + xpEvent.xp;
let encounterTriggered = false;

if (shouldTriggerEncounter(state.xpSinceLastEncounter) && !state.pendingEncounter) {
  const encounter = generateEncounter(eventType, state);
  if (encounter) {
    state.pendingEncounter = encounter;
    state.xpSinceLastEncounter = 0;
    encounterTriggered = true;
  }
}

// Single atomic save for all mutations
await stateManager.save();

// Write status for the status line (includes evolution flag and encounter notification)
if (encounterTriggered && state.pendingEncounter) {
  const encSpecies = POKEMON_BY_ID.get(state.pendingEncounter.pokemonId);
  const encName = encSpecies?.name ?? "???";
  await stateManager.writeEncounterStatus(encName);
} else {
  await stateManager.writeStatus(evolutionReady);
}

// Terminal bell on level-up, evolution available, or encounter (written to stderr so it reaches the terminal)
if ((levelUp || evolutionReady || encounterTriggered) && state.config.bellEnabled) {
  process.stderr.write(BELL);
}
