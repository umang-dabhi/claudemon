/**
 * Coding stats system tests for Claudemon.
 * Verifies stat initialization, display calculation, boosting, rendering, and trainer titles.
 */

import { describe, expect, test } from "bun:test";
import {
  initCodingStats,
  calculateDisplayStat,
  applyStatBoost,
  renderStatBar,
  getTrainerTitle,
} from "../../src/engine/stats.js";
import type { BaseStats, CodingStats } from "../../src/engine/types.js";
import { makeOwned } from "../helpers/make-state.js";

// ── initCodingStats Tests ────────────────────────────────────

describe("initCodingStats", () => {
  test("creates stats from Charmander base stats", () => {
    // Charmander: hp=39, attack=52, defense=43, speed=65, special=50
    const baseStats: BaseStats = { hp: 39, attack: 52, defense: 43, speed: 65, special: 50 };
    const stats = initCodingStats(baseStats);

    expect(stats.stamina).toBe(Math.floor(39 * 0.5)); // 19
    expect(stats.debugging).toBe(Math.floor(52 * 0.5)); // 26
    expect(stats.stability).toBe(Math.floor(43 * 0.5)); // 21
    expect(stats.velocity).toBe(Math.floor(65 * 0.5)); // 32
    expect(stats.wisdom).toBe(Math.floor(50 * 0.5)); // 25
  });

  test("creates stats from Pikachu base stats", () => {
    // Pikachu: hp=35, attack=55, defense=30, speed=90, special=50
    const baseStats: BaseStats = { hp: 35, attack: 55, defense: 30, speed: 90, special: 50 };
    const stats = initCodingStats(baseStats);

    expect(stats.stamina).toBe(17);
    expect(stats.debugging).toBe(27);
    expect(stats.stability).toBe(15);
    expect(stats.velocity).toBe(45);
    expect(stats.wisdom).toBe(25);
  });

  test("handles perfectly even base stats", () => {
    // Mew: all stats 100
    const baseStats: BaseStats = { hp: 100, attack: 100, defense: 100, speed: 100, special: 100 };
    const stats = initCodingStats(baseStats);

    expect(stats.stamina).toBe(50);
    expect(stats.debugging).toBe(50);
    expect(stats.stability).toBe(50);
    expect(stats.velocity).toBe(50);
    expect(stats.wisdom).toBe(50);
  });

  test("floors fractional values", () => {
    // Odd base stats produce fractional results that should be floored
    const baseStats: BaseStats = { hp: 45, attack: 49, defense: 49, speed: 45, special: 65 };
    const stats = initCodingStats(baseStats);

    expect(stats.stamina).toBe(22); // 45 * 0.5 = 22.5 → 22
    expect(stats.debugging).toBe(24); // 49 * 0.5 = 24.5 → 24
    expect(stats.stability).toBe(24);
    expect(stats.velocity).toBe(22);
    expect(stats.wisdom).toBe(32); // 65 * 0.5 = 32.5 → 32
  });

  test("creates zero stats from zero base stats", () => {
    const baseStats: BaseStats = { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 };
    const stats = initCodingStats(baseStats);

    expect(stats.stamina).toBe(0);
    expect(stats.debugging).toBe(0);
    expect(stats.stability).toBe(0);
    expect(stats.velocity).toBe(0);
    expect(stats.wisdom).toBe(0);
  });
});

// ── calculateDisplayStat Tests ───────────────────────────────

describe("calculateDisplayStat", () => {
  test("at level 1 with zero bonus, uses 0.505 multiplier", () => {
    // floor(100 * (0.5 + 1/200)) + 0 = floor(100 * 0.505) = floor(50.5) = 50
    expect(calculateDisplayStat(100, 1, 0)).toBe(50);
  });

  test("at level 100, uses 1.0 multiplier", () => {
    // floor(100 * (0.5 + 100/200)) + 0 = floor(100 * 1.0) = 100
    expect(calculateDisplayStat(100, 100, 0)).toBe(100);
  });

  test("at level 50, uses 0.75 multiplier", () => {
    // floor(100 * (0.5 + 50/200)) + 0 = floor(100 * 0.75) = 75
    expect(calculateDisplayStat(100, 50, 0)).toBe(75);
  });

  test("includes activity bonus in result", () => {
    // floor(100 * 0.75) + 20 = 75 + 20 = 95
    expect(calculateDisplayStat(100, 50, 20)).toBe(95);
  });

  test("Charmander speed at level 5", () => {
    // base speed = 65, level = 5
    // floor(65 * (0.5 + 5/200)) + 0 = floor(65 * 0.525) = floor(34.125) = 34
    expect(calculateDisplayStat(65, 5, 0)).toBe(34);
  });

  test("high level with large bonus", () => {
    // floor(130 * (0.5 + 80/200)) + 50 = floor(130 * 0.9) + 50 = 117 + 50 = 167
    expect(calculateDisplayStat(130, 80, 50)).toBe(167);
  });

  test("zero base stat returns only the bonus", () => {
    expect(calculateDisplayStat(0, 50, 30)).toBe(30);
  });
});

// ── applyStatBoost Tests ─────────────────────────────────────

describe("applyStatBoost", () => {
  test("increments debugging stat correctly", () => {
    const pokemon = makeOwned();
    const original = pokemon.codingStats.debugging;

    applyStatBoost(pokemon, "debugging", 5);
    expect(pokemon.codingStats.debugging).toBe(original + 5);
  });

  test("increments velocity stat correctly", () => {
    const pokemon = makeOwned();
    const original = pokemon.codingStats.velocity;

    applyStatBoost(pokemon, "velocity", 1);
    expect(pokemon.codingStats.velocity).toBe(original + 1);
  });

  test("increments wisdom stat correctly", () => {
    const pokemon = makeOwned();
    const original = pokemon.codingStats.wisdom;

    applyStatBoost(pokemon, "wisdom", 2);
    expect(pokemon.codingStats.wisdom).toBe(original + 2);
  });

  test("mutates the pokemon in place", () => {
    const pokemon = makeOwned();
    const ref = pokemon.codingStats;

    applyStatBoost(pokemon, "stamina", 10);
    // Should be the same reference, mutated in place
    expect(pokemon.codingStats).toBe(ref);
    expect(ref.stamina).toBe(19 + 10);
  });

  test("handles multiple boosts to the same stat", () => {
    const pokemon = makeOwned();
    const original = pokemon.codingStats.stability;

    applyStatBoost(pokemon, "stability", 3);
    applyStatBoost(pokemon, "stability", 7);
    expect(pokemon.codingStats.stability).toBe(original + 10);
  });

  test("boost of zero does not change stat", () => {
    const pokemon = makeOwned();
    const original = pokemon.codingStats.debugging;

    applyStatBoost(pokemon, "debugging", 0);
    expect(pokemon.codingStats.debugging).toBe(original);
  });
});

// ── renderStatBar Tests ──────────────────────────────────────

describe("renderStatBar", () => {
  test("renders full bar at value 100", () => {
    const bar = renderStatBar(100, 10);
    expect(bar.length).toBe(10);
    // All filled blocks
    expect(bar).toBe("#".repeat(10));
  });

  test("renders empty bar at value 0", () => {
    const bar = renderStatBar(0, 10);
    expect(bar.length).toBe(10);
    // All empty blocks
    expect(bar).toBe("-".repeat(10));
  });

  test("renders half bar at value 50", () => {
    const bar = renderStatBar(50, 10);
    expect(bar.length).toBe(10);
    expect(bar).toBe("#".repeat(5) + "-".repeat(5));
  });

  test("clamps values above 100", () => {
    const bar = renderStatBar(150, 10);
    expect(bar.length).toBe(10);
    expect(bar).toBe("#".repeat(10));
  });

  test("clamps values below 0", () => {
    const bar = renderStatBar(-10, 10);
    expect(bar.length).toBe(10);
    expect(bar).toBe("-".repeat(10));
  });

  test("respects custom maxWidth", () => {
    const bar = renderStatBar(100, 20);
    expect(bar.length).toBe(20);
    expect(bar).toBe("#".repeat(20));
  });

  test("uses default maxWidth of 10", () => {
    const bar = renderStatBar(100);
    expect(bar.length).toBe(10);
  });

  test("correctly rounds partial blocks", () => {
    // 30% of 10 = 3
    const bar = renderStatBar(30, 10);
    expect(bar).toBe("#".repeat(3) + "-".repeat(7));
  });
});

// ── getTrainerTitle Tests ────────────────────────────────────

describe("getTrainerTitle", () => {
  test("returns Bug Catcher at level 1", () => {
    expect(getTrainerTitle(1)).toBe("Bug Catcher");
  });

  test("returns Bug Catcher at level 5", () => {
    expect(getTrainerTitle(5)).toBe("Bug Catcher");
  });

  test("returns Youngster at level 6", () => {
    expect(getTrainerTitle(6)).toBe("Youngster");
  });

  test("returns Hiker at level 11", () => {
    expect(getTrainerTitle(11)).toBe("Hiker");
  });

  test("returns Ace Trainer at level 21", () => {
    expect(getTrainerTitle(21)).toBe("Ace Trainer");
  });

  test("returns Cooltrainer at level 31", () => {
    expect(getTrainerTitle(31)).toBe("Cooltrainer");
  });

  test("returns Veteran at level 41", () => {
    expect(getTrainerTitle(41)).toBe("Veteran");
  });

  test("returns Elite Four at level 51", () => {
    expect(getTrainerTitle(51)).toBe("Elite Four");
  });

  test("returns Champion at level 61", () => {
    expect(getTrainerTitle(61)).toBe("Champion");
  });

  test("returns Pokemon Master at level 76", () => {
    expect(getTrainerTitle(76)).toBe("Pokemon Master");
  });

  test("returns Professor at level 91", () => {
    expect(getTrainerTitle(91)).toBe("Professor");
  });

  test("returns Professor at level 100", () => {
    expect(getTrainerTitle(100)).toBe("Professor");
  });

  test("returns Bug Catcher for level 0 (fallback)", () => {
    expect(getTrainerTitle(0)).toBe("Bug Catcher");
  });

  test("handles mid-range levels correctly", () => {
    // Level 20 is still Hiker (minLevel 21 is Ace Trainer)
    expect(getTrainerTitle(20)).toBe("Hiker");
    // Level 50 is still Veteran (minLevel 51 is Elite Four)
    expect(getTrainerTitle(50)).toBe("Veteran");
  });
});
