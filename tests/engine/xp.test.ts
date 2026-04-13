/**
 * XP engine tests for Claudemon.
 * Verifies Gen 1 XP formulas, level-up logic, and XP event creation.
 */

import { describe, expect, test } from "bun:test";
import {
  cumulativeXpForLevel,
  xpToNextLevel,
  addXp,
  xpProgressPercent,
  createXpEvent,
} from "../../src/engine/xp.js";
import { POKEMON_BY_ID } from "../../src/engine/pokemon-data.js";
import type { OwnedPokemon, Pokemon, XpEventType } from "../../src/engine/types.js";
import { XP_AWARDS } from "../../src/engine/constants.js";

// ── Helpers ──────────────────────────────────────────────────

/** Create a minimal OwnedPokemon for testing. */
function makeOwned(overrides: Partial<OwnedPokemon> = {}): OwnedPokemon {
  return {
    id: "test-uuid",
    pokemonId: 4, // Charmander
    nickname: null,
    level: 5,
    currentXp: 0,
    totalXp: 0,
    codingStats: { stamina: 19, debugging: 26, stability: 21, velocity: 32, wisdom: 25 },
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

// ── Gen 1 XP Formula Tests ───────────────────────────────────

describe("cumulativeXpForLevel", () => {
  describe("medium_fast (n^3)", () => {
    test("L5 = 125", () => {
      expect(cumulativeXpForLevel(5, "medium_fast")).toBe(125);
    });

    test("L10 = 1000", () => {
      expect(cumulativeXpForLevel(10, "medium_fast")).toBe(1000);
    });

    test("L16 = 4096", () => {
      expect(cumulativeXpForLevel(16, "medium_fast")).toBe(4096);
    });

    test("L100 = 1000000", () => {
      expect(cumulativeXpForLevel(100, "medium_fast")).toBe(1000000);
    });

    test("L1 = 1", () => {
      expect(cumulativeXpForLevel(1, "medium_fast")).toBe(1);
    });
  });

  describe("fast (0.8 * n^3)", () => {
    test("L5 = 100", () => {
      expect(cumulativeXpForLevel(5, "fast")).toBe(100);
    });

    test("L10 = 800", () => {
      expect(cumulativeXpForLevel(10, "fast")).toBe(800);
    });

    test("L50 = 100000", () => {
      expect(cumulativeXpForLevel(50, "fast")).toBe(100000);
    });

    test("L100 = 800000", () => {
      expect(cumulativeXpForLevel(100, "fast")).toBe(800000);
    });
  });

  describe("medium_slow (1.2n^3 - 15n^2 + 100n - 140)", () => {
    test("L5 = 135", () => {
      // 1.2*125 - 15*25 + 100*5 - 140 = 150 - 375 + 500 - 140 = 135
      expect(cumulativeXpForLevel(5, "medium_slow")).toBe(135);
    });

    test("L10 = 560", () => {
      // 1.2*1000 - 15*100 + 100*10 - 140 = 1200 - 1500 + 1000 - 140 = 560
      expect(cumulativeXpForLevel(10, "medium_slow")).toBe(560);
    });

    test("L100 = 1059860", () => {
      // 1.2*1000000 - 15*10000 + 100*100 - 140 = 1200000 - 150000 + 10000 - 140 = 1059860
      expect(cumulativeXpForLevel(100, "medium_slow")).toBe(1059860);
    });

    test("L1 floors to 0 when formula gives negative", () => {
      // 1.2*1 - 15*1 + 100*1 - 140 = 1.2 - 15 + 100 - 140 = -53.8 → max(0, floor(-53.8)) = 0
      expect(cumulativeXpForLevel(1, "medium_slow")).toBe(0);
    });
  });

  describe("slow (1.25 * n^3)", () => {
    test("L5 = 156", () => {
      // 1.25 * 125 = 156.25 → 156
      expect(cumulativeXpForLevel(5, "slow")).toBe(156);
    });

    test("L10 = 1250", () => {
      expect(cumulativeXpForLevel(10, "slow")).toBe(1250);
    });

    test("L100 = 1250000", () => {
      expect(cumulativeXpForLevel(100, "slow")).toBe(1250000);
    });
  });
});

// ── xpToNextLevel Tests ──────────────────────────────────────

describe("xpToNextLevel", () => {
  test("returns positive delta between levels", () => {
    const delta = xpToNextLevel(5, "medium_fast");
    // L6 = 216, L5 = 125, delta = 91
    expect(delta).toBe(216 - 125);
  });

  test("returns 0 at max level", () => {
    expect(xpToNextLevel(100, "medium_fast")).toBe(0);
  });

  test("returns increasing deltas as level increases", () => {
    const delta5 = xpToNextLevel(5, "medium_fast");
    const delta50 = xpToNextLevel(50, "medium_fast");
    expect(delta50).toBeGreaterThan(delta5);
  });
});

// ── addXp Tests ──────────────────────────────────────────────

describe("addXp", () => {
  test("single level-up", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 5, currentXp: 0 });

    // XP to go from L5 to L6 for medium_slow: cumulativeXpForLevel(6) - cumulativeXpForLevel(5)
    const xpNeeded =
      cumulativeXpForLevel(6, "medium_slow") - cumulativeXpForLevel(5, "medium_slow");
    const result = addXp(pokemon, xpNeeded + 10, charmander);

    expect(result).not.toBeNull();
    expect(result!.previousLevel).toBe(5);
    expect(result!.newLevel).toBe(6);
    expect(pokemon.level).toBe(6);
    expect(pokemon.currentXp).toBe(10); // leftover XP
  });

  test("multi level-up from large XP gain", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 5, currentXp: 0 });

    // Give enough XP to jump several levels
    const result = addXp(pokemon, 50000, charmander);

    expect(result).not.toBeNull();
    expect(result!.previousLevel).toBe(5);
    expect(result!.newLevel).toBeGreaterThan(10); // Should jump well past level 10
    expect(pokemon.level).toBe(result!.newLevel);
  });

  test("caps at level 100", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 98, currentXp: 0 });

    // Give massive XP to try to exceed 100
    const result = addXp(pokemon, 10_000_000, charmander);

    expect(result).not.toBeNull();
    expect(pokemon.level).toBe(100);
    expect(pokemon.currentXp).toBe(0); // Overflow discarded at max level
  });

  test("returns null when already at max level", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 100, currentXp: 0 });

    const result = addXp(pokemon, 1000, charmander);
    expect(result).toBeNull();
  });

  test("returns null when XP is zero or negative", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 5, currentXp: 0 });

    expect(addXp(pokemon, 0, charmander)).toBeNull();
    expect(addXp(pokemon, -10, charmander)).toBeNull();
  });

  test("returns null when XP is not enough to level up", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 5, currentXp: 0 });

    const result = addXp(pokemon, 1, charmander);
    expect(result).toBeNull();
    expect(pokemon.level).toBe(5);
    expect(pokemon.currentXp).toBe(1);
    expect(pokemon.totalXp).toBe(1);
  });

  test("tracks totalXp across multiple awards", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 5, currentXp: 0, totalXp: 100 });

    addXp(pokemon, 50, charmander);
    expect(pokemon.totalXp).toBe(150);
  });
});

// ── xpProgressPercent Tests ──────────────────────────────────

describe("xpProgressPercent", () => {
  test("returns 0 with no currentXp", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 5, currentXp: 0 });

    expect(xpProgressPercent(pokemon, charmander)).toBe(0);
  });

  test("returns 100 at max level", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 100, currentXp: 0 });

    expect(xpProgressPercent(pokemon, charmander)).toBe(100);
  });

  test("returns percentage between 0 and 100", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const xpNeeded =
      cumulativeXpForLevel(6, "medium_slow") - cumulativeXpForLevel(5, "medium_slow");
    const halfXp = Math.floor(xpNeeded / 2);
    const pokemon = makeOwned({ level: 5, currentXp: halfXp });

    const percent = xpProgressPercent(pokemon, charmander);
    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThanOrEqual(100);
    // Should be approximately 50%
    expect(percent).toBeGreaterThanOrEqual(40);
    expect(percent).toBeLessThanOrEqual(60);
  });

  test("never exceeds 100", () => {
    const charmander = POKEMON_BY_ID.get(4)!;
    const pokemon = makeOwned({ level: 5, currentXp: 999999 });

    expect(xpProgressPercent(pokemon, charmander)).toBeLessThanOrEqual(100);
  });
});

// ── createXpEvent Tests ──────────────────────────────────────

describe("createXpEvent", () => {
  test("commit event returns correct XP and stat boost", () => {
    const event = createXpEvent("commit");
    expect(event.type).toBe("commit");
    expect(event.xp).toBe(15);
    expect(event.statBoost).toBe("velocity");
    expect(event.boostAmount).toBe(1);
  });

  test("test_pass event returns correct values", () => {
    const event = createXpEvent("test_pass");
    expect(event.xp).toBe(12);
    expect(event.statBoost).toBe("stability");
    expect(event.boostAmount).toBe(1);
  });

  test("bug_fix event returns correct values", () => {
    const event = createXpEvent("bug_fix");
    expect(event.xp).toBe(8);
    expect(event.statBoost).toBe("debugging");
    expect(event.boostAmount).toBe(1);
  });

  test("large_refactor event returns correct values", () => {
    const event = createXpEvent("large_refactor");
    expect(event.xp).toBe(20);
    expect(event.statBoost).toBe("wisdom");
    expect(event.boostAmount).toBe(2);
  });

  test("pet event has no stat boost", () => {
    const event = createXpEvent("pet");
    expect(event.xp).toBe(2);
    expect(event.statBoost).toBeNull();
    expect(event.boostAmount).toBe(0);
  });

  test("file_create event has zero boost amount", () => {
    const event = createXpEvent("file_create");
    expect(event.xp).toBe(5);
    expect(event.statBoost).toBe("velocity");
    expect(event.boostAmount).toBe(0);
  });

  test("all event types produce valid events", () => {
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

    for (const type of eventTypes) {
      const event = createXpEvent(type);
      expect(event.type).toBe(type);
      expect(event.xp).toBeGreaterThan(0);
      expect(event.xp).toBe(XP_AWARDS[type].xp);
      expect(event.statBoost).toBe(XP_AWARDS[type].stat);
      expect(event.boostAmount).toBe(XP_AWARDS[type].boost);
    }
  });
});
