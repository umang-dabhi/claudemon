/**
 * Evolution engine tests for Claudemon.
 * Verifies evolution chains, eligibility checks, stat-based branching,
 * badge earning, and evolution application.
 */

import { describe, expect, test } from "bun:test";
import {
  findEvolutionChain,
  getEvolutionLinks,
  checkEvolution,
  getDominantStat,
  applyEvolution,
  isBadgeEarned,
  getNewlyEarnedBadges,
} from "../../src/engine/evolution.js";
import { POKEMON_BY_ID } from "../../src/engine/pokemon-data.js";
import type { CodingStats, BadgeType } from "../../src/engine/types.js";
import { makeOwned, makeState } from "../helpers/make-state.js";

// ── findEvolutionChain Tests ─────────────────────────────────

describe("findEvolutionChain", () => {
  test("returns correct chain for Charmander (id=4)", () => {
    const chain = findEvolutionChain(4);
    expect(chain).not.toBeNull();
    expect(chain!.id).toBe(2); // Charmander line is chain 2
    expect(chain!.links.length).toBe(2); // Charmander → Charmeleon → Charizard
  });

  test("returns correct chain for Pikachu (id=25)", () => {
    const chain = findEvolutionChain(25);
    expect(chain).not.toBeNull();
    expect(chain!.id).toBe(10); // Pikachu line is chain 10
    expect(chain!.links.length).toBe(1); // Pikachu → Raichu (badge-based)
  });

  test("returns correct chain for Eevee (id=133)", () => {
    const chain = findEvolutionChain(133);
    expect(chain).not.toBeNull();
    expect(chain!.id).toBe(68); // Eevee line is chain 68
    expect(chain!.links.length).toBe(3); // Vaporeon, Jolteon, Flareon (stat-based)
  });

  test("returns null for single-stage Pokemon (Farfetch'd, id=83)", () => {
    // Farfetch'd has no evolution in Gen 1 chains (Sirfetch'd is a regional variant)
    const chain = findEvolutionChain(83);
    expect(chain).toBeNull();
  });

  test("returns chain for evolved Pokemon too (Charmeleon, id=5)", () => {
    const chain = findEvolutionChain(5);
    expect(chain).not.toBeNull();
    expect(chain!.id).toBe(2); // Same chain as Charmander
  });
});

// ── getEvolutionLinks Tests ──────────────────────────────────

describe("getEvolutionLinks", () => {
  test("Charmander has 1 outgoing link", () => {
    const links = getEvolutionLinks(4);
    expect(links.length).toBe(1);
    expect(links[0]!.from).toBe(4);
    expect(links[0]!.to).toBe(5); // Charmeleon
  });

  test("Eevee has 3 outgoing links (stat-based)", () => {
    const links = getEvolutionLinks(133);
    expect(links.length).toBe(3);
    const targets = links.map((l) => l.to).sort();
    expect(targets).toEqual([134, 135, 136]); // Vaporeon, Jolteon, Flareon
  });

  test("Charizard (final form) has 0 outgoing links", () => {
    const links = getEvolutionLinks(6);
    expect(links.length).toBe(0);
  });

  test("Farfetch'd has 0 outgoing links", () => {
    const links = getEvolutionLinks(83);
    expect(links.length).toBe(0);
  });

  test("Charmeleon has 1 outgoing link to Charizard", () => {
    const links = getEvolutionLinks(5);
    expect(links.length).toBe(1);
    expect(links[0]!.to).toBe(6); // Charizard
  });
});

// ── checkEvolution Tests ─────────────────────────────────────

describe("checkEvolution", () => {
  test("returns null when level too low for level-based evolution", () => {
    // Charmander evolves at L16; test with L10
    const pokemon = makeOwned({ pokemonId: 4, level: 10 });
    const state = makeState({ party: [pokemon] });

    const result = checkEvolution(pokemon, state);
    expect(result).toBeNull();
  });

  test("returns link when level requirement is met", () => {
    // Charmander evolves at L16
    const pokemon = makeOwned({ pokemonId: 4, level: 16 });
    const state = makeState({ party: [pokemon] });

    const result = checkEvolution(pokemon, state);
    expect(result).not.toBeNull();
    expect(result!.from).toBe(4);
    expect(result!.to).toBe(5); // Charmeleon
  });

  test("returns link when level exceeds requirement", () => {
    const pokemon = makeOwned({ pokemonId: 4, level: 20 });
    const state = makeState({ party: [pokemon] });

    const result = checkEvolution(pokemon, state);
    expect(result).not.toBeNull();
    expect(result!.to).toBe(5);
  });

  test("badge-based: returns null when badge not earned", () => {
    // Pikachu → Raichu requires spark badge
    const pokemon = makeOwned({ pokemonId: 25, level: 50 });
    const state = makeState({ party: [pokemon], badges: [] });

    const result = checkEvolution(pokemon, state);
    expect(result).toBeNull();
  });

  test("badge-based: returns link when badge is earned", () => {
    const pokemon = makeOwned({ pokemonId: 25, level: 50 });
    const state = makeState({ party: [pokemon], badges: ["spark"] });

    const result = checkEvolution(pokemon, state);
    expect(result).not.toBeNull();
    expect(result!.to).toBe(26); // Raichu
  });

  test("collaboration-based: returns link when PRs merged >= 10", () => {
    // Kadabra → Alakazam via collaboration (10 PRs merged)
    const pokemon = makeOwned({ pokemonId: 64, level: 30 });
    const state = makeState({
      party: [pokemon],
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
        prs_merged: 10,
      },
    });

    const result = checkEvolution(pokemon, state);
    expect(result).not.toBeNull();
    expect(result!.to).toBe(65); // Alakazam
  });

  test("returns null for Pokemon with no evolution", () => {
    const pokemon = makeOwned({ pokemonId: 83, level: 100 }); // Farfetch'd
    const state = makeState({ party: [pokemon] });

    const result = checkEvolution(pokemon, state);
    expect(result).toBeNull();
  });
});

// ── getDominantStat Tests ────────────────────────────────────

describe("getDominantStat", () => {
  test("returns debugging when it is highest", () => {
    const stats: CodingStats = {
      stamina: 10,
      debugging: 60,
      stability: 30,
      velocity: 40,
      wisdom: 20,
    };
    expect(getDominantStat(stats)).toBe("debugging");
  });

  test("returns stability when it is highest", () => {
    const stats: CodingStats = {
      stamina: 10,
      debugging: 20,
      stability: 55,
      velocity: 30,
      wisdom: 20,
    };
    expect(getDominantStat(stats)).toBe("stability");
  });

  test("returns velocity when it is highest", () => {
    const stats: CodingStats = {
      stamina: 10,
      debugging: 20,
      stability: 30,
      velocity: 70,
      wisdom: 20,
    };
    expect(getDominantStat(stats)).toBe("velocity");
  });

  test("returns null when top stats are tied", () => {
    const stats: CodingStats = {
      stamina: 10,
      debugging: 50,
      stability: 50,
      velocity: 30,
      wisdom: 20,
    };
    expect(getDominantStat(stats)).toBeNull();
  });

  test("only considers debugging, stability, velocity (not stamina or wisdom)", () => {
    // Wisdom is highest overall, but only the three branch stats matter
    const stats: CodingStats = {
      stamina: 100,
      debugging: 20,
      stability: 30,
      velocity: 40,
      wisdom: 100,
    };
    expect(getDominantStat(stats)).toBe("velocity");
  });

  test("returns null when all three branch stats are equal", () => {
    const stats: CodingStats = {
      stamina: 100,
      debugging: 50,
      stability: 50,
      velocity: 50,
      wisdom: 100,
    };
    expect(getDominantStat(stats)).toBeNull();
  });
});

// ── applyEvolution Tests ─────────────────────────────────────

describe("applyEvolution", () => {
  test("changes pokemonId to the target species", () => {
    const pokemon = makeOwned({ pokemonId: 4, level: 16 }); // Charmander
    const result = applyEvolution(pokemon, 5); // Charmeleon

    expect(pokemon.pokemonId).toBe(5);
    expect(result.newName).toBe("Charmeleon");
  });

  test("recalculates coding stats with new base stats", () => {
    const pokemon = makeOwned({
      pokemonId: 4,
      level: 16,
      codingStats: { stamina: 19, debugging: 26, stability: 21, velocity: 32, wisdom: 25 },
    });

    const oldStats = { ...pokemon.codingStats };
    applyEvolution(pokemon, 5); // Evolve to Charmeleon

    // Charmeleon has higher base stats, so coding stats should change
    // New base contribution will differ from old base contribution
    expect(pokemon.codingStats).not.toEqual(oldStats);
  });

  test("sets evolvedAt timestamp", () => {
    const pokemon = makeOwned({ pokemonId: 4, level: 16, evolvedAt: null });
    applyEvolution(pokemon, 5);

    expect(pokemon.evolvedAt).not.toBeNull();
    // Should be a valid ISO date string
    const evolvedAt = pokemon.evolvedAt;
    expect(evolvedAt).not.toBeNull();
    if (evolvedAt) {
      expect(new Date(evolvedAt).toISOString()).toBe(evolvedAt);
    }
  });

  test("returns correct new types", () => {
    const pokemon = makeOwned({ pokemonId: 4, level: 36 }); // Charmander
    const result = applyEvolution(pokemon, 6); // Charizard

    expect(result.newName).toBe("Charizard");
    expect(result.newTypes).toEqual(["Fire", "Flying"]);
  });

  test("preserves activity bonuses through evolution", () => {
    // Give Charmander a large activity bonus on debugging
    const charmander = POKEMON_BY_ID.get(4)!;
    const oldBaseDebugging = Math.floor(charmander.baseStats.attack * 0.5); // attack → debugging
    const activityBonus = 50;

    const pokemon = makeOwned({
      pokemonId: 4,
      level: 16,
      codingStats: {
        stamina: Math.floor(charmander.baseStats.hp * 0.5),
        debugging: oldBaseDebugging + activityBonus,
        stability: Math.floor(charmander.baseStats.defense * 0.5),
        velocity: Math.floor(charmander.baseStats.speed * 0.5),
        wisdom: Math.floor(charmander.baseStats.special * 0.5),
      },
    });

    applyEvolution(pokemon, 5); // Charmeleon

    const charmeleon = POKEMON_BY_ID.get(5)!;
    const newBaseDebugging = Math.floor(charmeleon.baseStats.attack * 0.5);

    // The activity bonus should be preserved: new base contribution + old activity bonus
    expect(pokemon.codingStats.debugging).toBe(newBaseDebugging + activityBonus);
  });

  test("throws for unknown source Pokemon ID", () => {
    const pokemon = makeOwned({ pokemonId: 9999 });
    expect(() => applyEvolution(pokemon, 5)).toThrow("Unknown source Pokemon ID: 9999");
  });

  test("throws for unknown target Pokemon ID", () => {
    const pokemon = makeOwned({ pokemonId: 4 });
    expect(() => applyEvolution(pokemon, 9999)).toThrow("Unknown target Pokemon ID: 9999");
  });
});

// ── isBadgeEarned Tests ──────────────────────────────────────

describe("isBadgeEarned", () => {
  test("blaze badge requires 50 bugs_fixed", () => {
    const state = makeState({
      counters: {
        commits: 0,
        tests_passed: 0,
        tests_failed: 0,
        tests_written: 0,
        builds_succeeded: 0,
        builds_failed: 0,
        bugs_fixed: 50,
        lint_fixes: 0,
        files_created: 0,
        files_edited: 0,
        searches: 0,
        large_refactors: 0,
        errors_encountered: 0,
        sessions: 0,
        prs_merged: 0,
      },
    });
    expect(isBadgeEarned("blaze", state)).toBe(true);
  });

  test("blaze badge not earned with fewer than 50 bugs", () => {
    const state = makeState({
      counters: {
        commits: 0,
        tests_passed: 0,
        tests_failed: 0,
        tests_written: 0,
        builds_succeeded: 0,
        builds_failed: 0,
        bugs_fixed: 49,
        lint_fixes: 0,
        files_created: 0,
        files_edited: 0,
        searches: 0,
        large_refactors: 0,
        errors_encountered: 0,
        sessions: 0,
        prs_merged: 0,
      },
    });
    expect(isBadgeEarned("blaze", state)).toBe(false);
  });

  test("spark badge requires 200 commits", () => {
    const state = makeState({
      counters: {
        commits: 200,
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
    });
    expect(isBadgeEarned("spark", state)).toBe(true);
  });

  test("lunar badge requires 30-day streak", () => {
    const state = makeState({
      streak: {
        currentStreak: 30,
        longestStreak: 30,
        lastActiveDate: "2026-04-13",
        totalDaysActive: 30,
      },
    });
    expect(isBadgeEarned("lunar", state)).toBe(true);
  });

  test("lunar badge not earned with shorter streak", () => {
    const state = makeState({
      streak: {
        currentStreak: 29,
        longestStreak: 29,
        lastActiveDate: "2026-04-13",
        totalDaysActive: 29,
      },
    });
    expect(isBadgeEarned("lunar", state)).toBe(false);
  });

  test("flow badge requires 100 tests_passed", () => {
    const state = makeState({
      counters: {
        commits: 0,
        tests_passed: 100,
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
    });
    expect(isBadgeEarned("flow", state)).toBe(true);
  });
});

// ── getNewlyEarnedBadges Tests ───────────────────────────────

describe("getNewlyEarnedBadges", () => {
  test("returns badges that are earned but not collected", () => {
    const state = makeState({
      badges: [], // No badges collected yet
      counters: {
        commits: 200,
        tests_passed: 100,
        tests_failed: 0,
        tests_written: 0,
        builds_succeeded: 0,
        builds_failed: 0,
        bugs_fixed: 50,
        lint_fixes: 0,
        files_created: 0,
        files_edited: 0,
        searches: 0,
        large_refactors: 0,
        errors_encountered: 0,
        sessions: 0,
        prs_merged: 0,
      },
    });

    const newBadges = getNewlyEarnedBadges(state);
    expect(newBadges).toContain("blaze");
    expect(newBadges).toContain("flow");
    expect(newBadges).toContain("spark");
  });

  test("excludes badges already collected", () => {
    const state = makeState({
      badges: ["blaze", "flow"] as BadgeType[],
      counters: {
        commits: 200,
        tests_passed: 100,
        tests_failed: 0,
        tests_written: 0,
        builds_succeeded: 0,
        builds_failed: 0,
        bugs_fixed: 50,
        lint_fixes: 0,
        files_created: 0,
        files_edited: 0,
        searches: 0,
        large_refactors: 0,
        errors_encountered: 0,
        sessions: 0,
        prs_merged: 0,
      },
    });

    const newBadges = getNewlyEarnedBadges(state);
    expect(newBadges).not.toContain("blaze");
    expect(newBadges).not.toContain("flow");
    expect(newBadges).toContain("spark"); // Not yet collected
  });

  test("returns empty array when no badges are newly earned", () => {
    const state = makeState();
    const newBadges = getNewlyEarnedBadges(state);
    expect(newBadges).toEqual([]);
  });
});
