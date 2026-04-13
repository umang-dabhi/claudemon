/**
 * Wild encounter system tests for Claudemon.
 * Verifies encounter triggering, type mapping, generation, and catch logic.
 */

import { describe, expect, test } from "bun:test";
import {
  shouldTriggerEncounter,
  getEncounterTypes,
  generateEncounter,
  canCatch,
} from "../../src/engine/encounters.js";
import { POKEMON_BY_ID } from "../../src/engine/pokemon-data.js";
import { XP_PER_ENCOUNTER } from "../../src/engine/constants.js";
import type {
  OwnedPokemon,
  PlayerState,
  WildEncounter,
  XpEventType,
  PokemonType,
} from "../../src/engine/types.js";

// ── Helpers ──────────────────────────────────────────────────

function makeOwned(overrides: Partial<OwnedPokemon> = {}): OwnedPokemon {
  return {
    id: "test-uuid",
    pokemonId: 4, // Charmander
    nickname: null,
    level: 30,
    currentXp: 0,
    totalXp: 5000,
    codingStats: { stamina: 40, debugging: 50, stability: 45, velocity: 55, wisdom: 40 },
    happiness: 70,
    caughtAt: "2026-04-13T00:00:00.000Z",
    evolvedAt: null,
    isActive: true,
    personality: null,
    shiny: false,
    isStarter: true,
    ...overrides,
  };
}

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  const activePokemon = makeOwned();
  return {
    trainerId: "test-trainer",
    trainerName: "Ash",
    party: [activePokemon],
    pcBox: [],
    pokedex: { entries: {}, totalSeen: 0, totalCaught: 0 },
    badges: [],
    achievements: [],
    counters: {
      commits: 0,
      tests_passed: 0,
      tests_failed: 0,
      tests_written: 0,
      builds_succeeded: 0,
      builds_failed: 0,
      bugs_fixed: 0,
      lint_fixes: 0,
      files_created: 0,
      files_edited: 0,
      searches: 0,
      large_refactors: 0,
      errors_encountered: 0,
      sessions: 0,
      prs_merged: 0,
    },
    streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalDaysActive: 0 },
    config: { muted: false, reactionCooldownMs: 30000, statusLineEnabled: true, bellEnabled: true },
    startedAt: "2026-04-13T00:00:00.000Z",
    totalXpEarned: 0,
    totalSessions: 0,
    pendingEncounter: null,
    xpSinceLastEncounter: 0,
    ...overrides,
  };
}

// ── shouldTriggerEncounter Tests ─────────────────────────────

describe("shouldTriggerEncounter", () => {
  test("returns true at exactly 500 XP (XP_PER_ENCOUNTER)", () => {
    expect(shouldTriggerEncounter(XP_PER_ENCOUNTER)).toBe(true);
    expect(shouldTriggerEncounter(500)).toBe(true);
  });

  test("returns true above 500 XP", () => {
    expect(shouldTriggerEncounter(600)).toBe(true);
    expect(shouldTriggerEncounter(1000)).toBe(true);
  });

  test("returns false under 500 XP", () => {
    expect(shouldTriggerEncounter(0)).toBe(false);
    expect(shouldTriggerEncounter(100)).toBe(false);
    expect(shouldTriggerEncounter(499)).toBe(false);
  });
});

// ── getEncounterTypes Tests ──────────────────────────────────

describe("getEncounterTypes", () => {
  test("commit returns Normal and Flying types", () => {
    const types = getEncounterTypes("commit");
    expect(types).toContain("Normal");
    expect(types).toContain("Flying");
  });

  test("test_pass returns Fighting and Normal types", () => {
    const types = getEncounterTypes("test_pass");
    expect(types).toContain("Fighting");
    expect(types).toContain("Normal");
  });

  test("bug_fix returns Bug and Poison types", () => {
    const types = getEncounterTypes("bug_fix");
    expect(types).toContain("Bug");
    expect(types).toContain("Poison");
  });

  test("large_refactor returns Psychic and Dragon types", () => {
    const types = getEncounterTypes("large_refactor");
    expect(types).toContain("Psychic");
    expect(types).toContain("Dragon");
  });

  test("build_success returns Fire and Rock types", () => {
    const types = getEncounterTypes("build_success");
    expect(types).toContain("Fire");
    expect(types).toContain("Rock");
  });

  test("daily_streak returns Water and Electric types", () => {
    const types = getEncounterTypes("daily_streak");
    expect(types).toContain("Water");
    expect(types).toContain("Electric");
  });

  test("all event types return valid Pokemon types", () => {
    const validTypes: PokemonType[] = [
      "Normal",
      "Fire",
      "Water",
      "Electric",
      "Grass",
      "Ice",
      "Fighting",
      "Poison",
      "Ground",
      "Flying",
      "Psychic",
      "Bug",
      "Rock",
      "Ghost",
      "Dragon",
    ];

    const eventTypes: XpEventType[] = [
      "commit",
      "test_pass",
      "test_written",
      "build_success",
      "bug_fix",
      "lint_fix",
      "file_create",
      "file_edit",
      "search",
      "large_refactor",
      "session_start",
      "daily_streak",
      "pet",
    ];

    for (const eventType of eventTypes) {
      const types = getEncounterTypes(eventType);
      expect(types.length).toBeGreaterThan(0);
      for (const type of types) {
        expect(validTypes).toContain(type);
      }
    }
  });
});

// ── generateEncounter Tests ──────────────────────────────────

describe("generateEncounter", () => {
  test("returns a WildEncounter with valid Pokemon ID", () => {
    const state = makeState();
    const encounter = generateEncounter("commit", state);

    // Could be null if pool is empty for edge cases, but for "commit" with
    // Normal/Flying types there should always be candidates
    expect(encounter).not.toBeNull();
    if (encounter) {
      expect(encounter.pokemonId).toBeGreaterThanOrEqual(1);
      expect(encounter.pokemonId).toBeLessThanOrEqual(151);
      expect(POKEMON_BY_ID.has(encounter.pokemonId)).toBe(true);
    }
  });

  test("encounter has valid level", () => {
    const state = makeState();
    const encounter = generateEncounter("commit", state);

    expect(encounter).not.toBeNull();
    if (encounter) {
      expect(encounter.level).toBeGreaterThanOrEqual(2);
      expect(encounter.level).toBeLessThanOrEqual(100);
    }
  });

  test("encounter has a catch condition", () => {
    const state = makeState();
    const encounter = generateEncounter("commit", state);

    expect(encounter).not.toBeNull();
    if (encounter) {
      expect(encounter.catchCondition).toBeDefined();
      expect(encounter.catchCondition.requiredLevel).toBeGreaterThanOrEqual(1);
      expect(encounter.catchCondition.minStatValue).toBeGreaterThanOrEqual(0);
    }
  });

  test("excludes legendary and mythical Pokemon", () => {
    const state = makeState();

    // Run multiple encounters to check — legendaries should never appear
    for (let i = 0; i < 20; i++) {
      const encounter = generateEncounter("large_refactor", state);
      if (encounter) {
        const pokemon = POKEMON_BY_ID.get(encounter.pokemonId);
        expect(pokemon).toBeDefined();
        expect(pokemon!.rarity).not.toBe("legendary");
        expect(pokemon!.rarity).not.toBe("mythical");
      }
    }
  });

  test("generates encounters for various event types", () => {
    const state = makeState();
    const eventTypes: XpEventType[] = ["commit", "bug_fix", "build_success", "test_pass"];

    for (const eventType of eventTypes) {
      const encounter = generateEncounter(eventType, state);
      // Each type should be able to produce encounters
      expect(encounter).not.toBeNull();
    }
  });

  test("encounter level scales with player level", () => {
    const lowLevelState = makeState({
      party: [makeOwned({ level: 5 })],
    });
    const highLevelState = makeState({
      party: [makeOwned({ level: 80 })],
    });

    const lowEncounter = generateEncounter("commit", lowLevelState);
    const highEncounter = generateEncounter("commit", highLevelState);

    if (lowEncounter && highEncounter) {
      // High-level player should see higher-level encounters on average
      // (deterministic seed may vary, but the minimum level threshold differs)
      expect(highEncounter.level).toBeGreaterThanOrEqual(lowEncounter.level);
    }
  });
});

// ── canCatch Tests ───────────────────────────────────────────

describe("canCatch", () => {
  test("succeeds for common Pokemon with sufficient stats", () => {
    // Common Pokemon have no stat requirement and level 1 requirement
    // Use a Pokemon with high catch rate
    const encounter: WildEncounter = {
      pokemonId: 19, // Rattata — common, catchRate 255
      level: 5,
      catchCondition: { requiredStat: null, minStatValue: 0, requiredLevel: 1 },
    };

    const active = makeOwned({ level: 30 });
    const result = canCatch(encounter, active);

    // Should either succeed or fail on catch-rate roll, but not on requirements
    // With catchRate 255 and roll < 255, should always succeed
    expect(result.reason).toBeDefined();
    // Level check passes, stat check passes (no requirement)
    expect(result.reason).not.toContain("Need level");
    expect(result.reason).not.toContain("Need ");
  });

  test("fails with insufficient level", () => {
    const encounter: WildEncounter = {
      pokemonId: 147, // Dratini — rare, requires level 25
      level: 20,
      catchCondition: { requiredStat: "wisdom", minStatValue: 40, requiredLevel: 25 },
    };

    const active = makeOwned({ level: 10 }); // Too low
    const result = canCatch(encounter, active);

    expect(result.success).toBe(false);
    expect(result.reason).toContain("Need level");
  });

  test("fails with insufficient stat", () => {
    const encounter: WildEncounter = {
      pokemonId: 63, // Abra — uncommon Psychic, requires wisdom
      level: 10,
      catchCondition: { requiredStat: "wisdom", minStatValue: 20, requiredLevel: 10 },
    };

    const active = makeOwned({
      level: 30,
      codingStats: { stamina: 40, debugging: 50, stability: 45, velocity: 55, wisdom: 10 },
    });
    const result = canCatch(encounter, active);

    expect(result.success).toBe(false);
    expect(result.reason).toContain("WISDOM");
  });

  test("returns reason string on failure", () => {
    const encounter: WildEncounter = {
      pokemonId: 147,
      level: 20,
      catchCondition: { requiredStat: "wisdom", minStatValue: 40, requiredLevel: 25 },
    };

    const active = makeOwned({ level: 5 });
    const result = canCatch(encounter, active);

    expect(result.success).toBe(false);
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  test("returns failure for unknown Pokemon ID", () => {
    const encounter: WildEncounter = {
      pokemonId: 9999,
      level: 10,
      catchCondition: { requiredStat: null, minStatValue: 0, requiredLevel: 1 },
    };

    const active = makeOwned({ level: 50 });
    const result = canCatch(encounter, active);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("Unknown Pokemon");
  });

  test("stat check uses the specific stat from catch condition", () => {
    // Require high debugging, but give the Pokemon high wisdom instead
    const encounter: WildEncounter = {
      pokemonId: 58, // Growlithe — Fire type, requires debugging
      level: 10,
      catchCondition: { requiredStat: "debugging", minStatValue: 60, requiredLevel: 10 },
    };

    const active = makeOwned({
      level: 30,
      codingStats: { stamina: 80, debugging: 10, stability: 80, velocity: 80, wisdom: 80 },
    });
    const result = canCatch(encounter, active);

    expect(result.success).toBe(false);
    expect(result.reason).toContain("DEBUGGING");
  });
});
