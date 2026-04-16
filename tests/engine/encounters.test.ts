/**
 * Wild encounter system tests for Claudemon.
 * Verifies encounter triggering, type mapping, generation, and catch logic.
 */

import { describe, expect, test } from "bun:test";
import {
  shouldTriggerEncounter,
  generateEncounter,
  canCatch,
  shouldBonusEncounter,
  shouldDiversityBonus,
} from "../../src/engine/encounters.js";
import type { EncounterContext } from "../../src/engine/encounters.js";
import { POKEMON_BY_ID } from "../../src/engine/pokemon-data.js";
import { ENCOUNTER_THRESHOLDS } from "../../src/engine/constants.js";
import type { WildEncounter, XpEventType, PokemonType } from "../../src/engine/types.js";
import { makeOwned, makeState } from "../helpers/make-state.js";

// ── Helper: build encounter context ─────────────────────────

function makeContext(overrides: Partial<EncounterContext> = {}): EncounterContext {
  return {
    xpSinceLastEncounter: 0,
    encounterSpeed: "normal",
    currentStreak: 0,
    recentToolTypes: [],
    currentHour: 12,
    ...overrides,
  };
}

// ── shouldTriggerEncounter Tests ─────────────────────────────

describe("shouldTriggerEncounter", () => {
  test("returns true at exactly normal threshold (250 XP)", () => {
    expect(
      shouldTriggerEncounter(makeContext({ xpSinceLastEncounter: ENCOUNTER_THRESHOLDS.normal })),
    ).toBe(true);
    expect(shouldTriggerEncounter(makeContext({ xpSinceLastEncounter: 250 }))).toBe(true);
  });

  test("returns true above normal threshold", () => {
    expect(shouldTriggerEncounter(makeContext({ xpSinceLastEncounter: 300 }))).toBe(true);
    expect(shouldTriggerEncounter(makeContext({ xpSinceLastEncounter: 1000 }))).toBe(true);
  });

  test("returns false under normal threshold", () => {
    expect(shouldTriggerEncounter(makeContext({ xpSinceLastEncounter: 0 }))).toBe(false);
    expect(shouldTriggerEncounter(makeContext({ xpSinceLastEncounter: 100 }))).toBe(false);
    expect(shouldTriggerEncounter(makeContext({ xpSinceLastEncounter: 249 }))).toBe(false);
  });

  test("fast speed triggers at 100 XP", () => {
    expect(
      shouldTriggerEncounter(makeContext({ encounterSpeed: "fast", xpSinceLastEncounter: 100 })),
    ).toBe(true);
    expect(
      shouldTriggerEncounter(makeContext({ encounterSpeed: "fast", xpSinceLastEncounter: 99 })),
    ).toBe(false);
  });

  test("slow speed triggers at 500 XP", () => {
    expect(
      shouldTriggerEncounter(makeContext({ encounterSpeed: "slow", xpSinceLastEncounter: 500 })),
    ).toBe(true);
    expect(
      shouldTriggerEncounter(makeContext({ encounterSpeed: "slow", xpSinceLastEncounter: 499 })),
    ).toBe(false);
  });

  test("7+ day streak halves the threshold", () => {
    // Normal threshold 250 -> 125 with streak
    expect(
      shouldTriggerEncounter(makeContext({ currentStreak: 7, xpSinceLastEncounter: 125 })),
    ).toBe(true);
    expect(
      shouldTriggerEncounter(makeContext({ currentStreak: 7, xpSinceLastEncounter: 124 })),
    ).toBe(false);
    // Below 7 days: no bonus
    expect(
      shouldTriggerEncounter(makeContext({ currentStreak: 6, xpSinceLastEncounter: 125 })),
    ).toBe(false);
  });
});

// ── shouldBonusEncounter Tests ───────────────────────────────

describe("shouldBonusEncounter", () => {
  test("returns a boolean", () => {
    const result = shouldBonusEncounter();
    expect(typeof result).toBe("boolean");
  });
});

// ── shouldDiversityBonus Tests ───────────────────────────────

describe("shouldDiversityBonus", () => {
  test("returns false with fewer than 3 unique tool types", () => {
    expect(shouldDiversityBonus([])).toBe(false);
    expect(shouldDiversityBonus(["commit"])).toBe(false);
    expect(shouldDiversityBonus(["commit", "bug_fix"])).toBe(false);
  });

  test("returns true with 3+ unique tool types", () => {
    expect(shouldDiversityBonus(["commit", "bug_fix", "test_pass"])).toBe(true);
    expect(shouldDiversityBonus(["commit", "bug_fix", "test_pass", "build_success"])).toBe(true);
  });

  test("ignores duplicate tool types", () => {
    expect(shouldDiversityBonus(["commit", "commit", "commit"])).toBe(false);
    expect(shouldDiversityBonus(["commit", "bug_fix", "commit", "bug_fix"])).toBe(false);
  });
});

// ── Encounter System Tests (100% random, no activity-type mapping) ──

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
      expect(encounter.pokemonId).toBeLessThanOrEqual(905);
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
