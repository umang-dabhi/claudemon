/**
 * Shared test helper factories for Claudemon tests.
 * Centralizes makeOwned(), makeState(), and emptyCounters() to eliminate
 * duplication across test files.
 */

import type { OwnedPokemon, PlayerState, EventCounters } from "../../src/engine/types.js";
import { EVENT_COUNTER_KEYS } from "../../src/engine/types.js";

/** Build a zeroed-out EventCounters record */
export function emptyCounters(): EventCounters {
  const counters = {} as Record<string, number>;
  for (const key of EVENT_COUNTER_KEYS) {
    counters[key] = 0;
  }
  return counters as EventCounters;
}

/** Create a minimal OwnedPokemon for testing with optional overrides. */
export function makeOwned(overrides: Partial<OwnedPokemon> = {}): OwnedPokemon {
  return {
    id: "test-" + Math.random().toString(36).slice(2),
    pokemonId: 4, // Charmander
    nickname: null,
    level: 5,
    currentXp: 0,
    totalXp: 0,
    codingStats: { stamina: 19, debugging: 26, stability: 21, velocity: 32, wisdom: 25 },
    happiness: 70,
    caughtAt: new Date().toISOString(),
    evolvedAt: null,
    isActive: true,
    personality: null,
    shiny: false,
    isStarter: true,
    ...overrides,
  };
}

/** Create a full PlayerState for testing with optional overrides. */
export function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    trainerId: "test-trainer",
    trainerName: "Tester",
    party: [makeOwned()],
    pcBox: [],
    pokedex: { entries: {}, totalSeen: 0, totalCaught: 0 },
    badges: [],
    achievements: [],
    counters: emptyCounters(),
    streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalDaysActive: 0 },
    config: {
      muted: false,
      reactionCooldownMs: 30000,
      statusLineEnabled: true,
      bellEnabled: true,
      encounterSpeed: "normal" as const,
      xpSharePercent: 25,
    },
    startedAt: new Date().toISOString(),
    totalXpEarned: 0,
    totalSessions: 0,
    pendingEncounter: null,
    xpSinceLastEncounter: 0,
    recentToolTypes: [],
    lastEncounterTime: 0,
    mood: "neutral" as const,
    moodSetAt: 0,
    lastFedAt: 0,
    lastTrainedAt: 0,
    lastPlayedAt: 0,
    pendingQuiz: null,
    ...overrides,
  };
}
