/**
 * award-xp.ts — Lightweight bun script called by the PostToolUse hook.
 * Usage: bun run award-xp.ts <event_type> <counter_key>
 *
 * Loads state, awards XP to the active Pokemon, applies stat boosts,
 * increments the event counter, updates the streak, and saves.
 * Supports enhanced encounter triggers: streak bonuses, time-of-day bias,
 * bonus encounters (10%), and tool diversity encounters.
 * Emits a terminal bell on level-up.
 */

import type { XpEventType, EventCounterKey } from "../engine/types.js";
import { BELL } from "../engine/constants.js";
import { StateManager } from "../state/state-manager.js";
import { addXp, createXpEvent } from "../engine/xp.js";
import { applyStatBoost } from "../engine/stats.js";
import { POKEMON_BY_ID } from "../engine/pokemon-data.js";
import { checkEvolution, getNewlyEarnedBadges } from "../engine/evolution.js";
import {
  shouldTriggerEncounter,
  generateEncounter,
  shouldBonusEncounter,
  shouldDiversityBonus,
  getTimeOfDayBias,
} from "../engine/encounters.js";
import type { EncounterContext } from "../engine/encounters.js";
import { calculateMood } from "../engine/mood.js";

const MAX_RECENT_TOOL_TYPES = 20;

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

// XP sharing: give inactive party members a percentage
const sharePercent = state.config.xpSharePercent ?? 0;
if (sharePercent > 0 && state.party.length > 1) {
  const sharedXp = Math.floor((xpEvent.xp * sharePercent) / 100);
  if (sharedXp > 0) {
    for (const member of state.party) {
      if (member.isActive) continue;
      const memberSpecies = POKEMON_BY_ID.get(member.pokemonId);
      if (memberSpecies) {
        addXp(member, sharedXp, memberSpecies);
      }
    }
  }
}

// Track total XP earned by the trainer
state.totalXpEarned += xpEvent.xp;

// Increment the event counter directly on state (avoids extra save from incrementCounter)
if (counterKey) {
  state.counters[counterKey] += 1;
}

// Track tool type for diversity bonus (keep last MAX_RECENT_TOOL_TYPES entries)
const recentToolTypes = state.recentToolTypes ?? [];
recentToolTypes.push(eventType);
if (recentToolTypes.length > MAX_RECENT_TOOL_TYPES) {
  recentToolTypes.splice(0, recentToolTypes.length - MAX_RECENT_TOOL_TYPES);
}
state.recentToolTypes = recentToolTypes;

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

// Build encounter context for the enhanced trigger system
const encounterSpeed = state.config.encounterSpeed ?? "normal";
const currentHour = new Date().getHours();
const timeOfDayTypes = getTimeOfDayBias(currentHour);

const encounterCtx: EncounterContext = {
  xpSinceLastEncounter: (state.xpSinceLastEncounter ?? 0) + xpEvent.xp,
  encounterSpeed,
  currentStreak: streak.currentStreak,
  recentToolTypes: state.recentToolTypes,
  currentHour,
};

// Track XP toward next encounter
state.xpSinceLastEncounter = encounterCtx.xpSinceLastEncounter;
let encounterTriggered = false;

if (shouldTriggerEncounter(encounterCtx) && !state.pendingEncounter) {
  const encounter = generateEncounter(eventType, state, timeOfDayTypes);
  if (encounter) {
    state.pendingEncounter = encounter;
    state.xpSinceLastEncounter = 0;
    state.lastEncounterTime = Date.now();
    encounterTriggered = true;

    // 10% chance for a bonus encounter after a regular one
    // (bonus replaces the pending encounter with a second roll)
    if (shouldBonusEncounter()) {
      const bonusEncounter = generateEncounter(eventType, state, timeOfDayTypes);
      if (bonusEncounter) {
        // The bonus encounter replaces the first; first is already set as pending
        // In practice the player still sees one encounter per trigger,
        // but the bonus gives them a fresh roll (potentially rarer Pokemon)
        state.pendingEncounter = bonusEncounter;
      }
    }
  }
}

// Tool diversity bonus: if 3+ unique tool types used recently and no pending encounter,
// grant an extra encounter opportunity
if (!encounterTriggered && !state.pendingEncounter && shouldDiversityBonus(state.recentToolTypes)) {
  const diversityEncounter = generateEncounter(eventType, state, timeOfDayTypes);
  if (diversityEncounter) {
    state.pendingEncounter = diversityEncounter;
    state.xpSinceLastEncounter = 0;
    state.lastEncounterTime = Date.now();
    // Clear recent tool types after diversity bonus triggers
    state.recentToolTypes = [];
    encounterTriggered = true;
  }
}

// Calculate mood based on the event that just happened
const newMood = calculateMood(
  eventType,
  state.counters,
  currentHour,
  state.mood ?? "neutral",
  state.moodSetAt ?? 0,
  evolutionReady, // evolution ready counts as a proud trigger
  false, // achievements are checked in catch/evolve tools
  false, // catches are handled in the catch tool
);

if (newMood !== (state.mood ?? "neutral")) {
  state.mood = newMood;
  state.moodSetAt = Date.now();
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

// Flush any pending debounced status write before the process exits
await stateManager.flushStatus();

// Terminal bell on level-up, evolution available, or encounter (written to stderr so it reaches the terminal)
if ((levelUp || evolutionReady || encounterTriggered) && state.config.bellEnabled) {
  process.stderr.write(BELL);
}
