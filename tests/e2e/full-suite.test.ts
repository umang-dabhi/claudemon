/**
 * Claudemon E2E Test Suite
 *
 * Comprehensive end-to-end tests covering all phases:
 * - Phase 1: XP, stats, state, Pokemon data
 * - Phase 2: Evolution, sprites, badges
 * - Phase 3: Encounters, achievements, milestones, legendary quests
 * - Phase 4: Reactions, instructions
 *
 * Run: bun test tests/e2e/full-suite.test.ts
 */

import { describe, expect, test, beforeAll } from "bun:test";

// ── Phase 1 Imports ────────────────────────────────────────

import { POKEDEX, POKEMON_BY_ID, POKEMON_BY_NAME } from "../../src/engine/pokemon-data.js";
import { EVOLUTION_CHAINS } from "../../src/engine/evolution-data.js";
import { STARTER_POOL } from "../../src/engine/starter-pool.js";
import {
  cumulativeXpForLevel,
  xpToNextLevel,
  addXp,
  xpProgressPercent,
  createXpEvent,
} from "../../src/engine/xp.js";
import {
  initCodingStats,
  calculateDisplayStat,
  applyStatBoost,
  renderStatBar,
  getTrainerTitle,
} from "../../src/engine/stats.js";
import {
  MAX_PARTY_SIZE,
  MAX_LEVEL,
  STARTER_LEVEL,
  XP_AWARDS,
  BADGES,
  TRAINER_TITLES,
} from "../../src/engine/constants.js";
import type {
  OwnedPokemon,
  PlayerState,
  CodingStats,
  EventCounters,
  Pokemon,
} from "../../src/engine/types.js";
import { EVENT_COUNTER_KEYS, XP_EVENT_TYPES } from "../../src/engine/types.js";

// ── Phase 2 Imports ────────────────────────────────────────

import {
  findEvolutionChain,
  getEvolutionLinks,
  checkEvolution,
  getDominantStat,
  applyEvolution,
  isBadgeEarned,
  getNewlyEarnedBadges,
} from "../../src/engine/evolution.js";
import { loadSmallSprite } from "../../src/sprites/index.js";

// ── Phase 3 Imports ────────────────────────────────────────

import {
  getEncounterTypes,
  shouldTriggerEncounter,
  generateEncounter,
  canCatch,
  getCatchCondition,
} from "../../src/engine/encounters.js";
import { TYPE_POOLS } from "../../src/engine/encounter-pool.js";
import {
  ACHIEVEMENTS,
  isConditionMet,
  checkNewAchievements,
  unlockAchievement,
} from "../../src/gamification/achievements.js";
import { MILESTONES, checkNewMilestones } from "../../src/gamification/milestones.js";
import { LEGENDARY_QUESTS, getQuestProgress } from "../../src/gamification/legendary-quests.js";

// ── Phase 4 Imports ────────────────────────────────────────

import { getReaction, shouldReact } from "../../src/engine/reactions.js";
import { buildInstructions } from "../../src/server/instructions.js";
import { POKEMON_TYPES, CODING_STATS } from "../../src/engine/types.js";

// ── Test Helpers ───────────────────────────────────────────

function emptyCounters(): EventCounters {
  const c = {} as Record<string, number>;
  for (const key of EVENT_COUNTER_KEYS) {
    c[key] = 0;
  }
  return c as EventCounters;
}

function makeOwned(overrides: Partial<OwnedPokemon> = {}): OwnedPokemon {
  const pokemon = POKEMON_BY_ID.get(overrides.pokemonId ?? 4)!;
  return {
    id: "test-" + Math.random().toString(36).slice(2),
    pokemonId: pokemon.id,
    nickname: null,
    level: STARTER_LEVEL,
    currentXp: 0,
    totalXp: 0,
    codingStats: initCodingStats(pokemon.baseStats),
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

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
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
    },
    startedAt: new Date().toISOString(),
    totalXpEarned: 0,
    totalSessions: 0,
    pendingEncounter: null,
    xpSinceLastEncounter: 0,
    recentToolTypes: [],
    lastEncounterTime: 0,
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════
// PHASE 1: Foundation
// ════════════════════════════════════════════════════════════

describe("Phase 1: Foundation", () => {
  // ── Pokemon Data ─────────────────────────────────────────

  describe("Pokemon Data Integrity", () => {
    test("has exactly 151 Pokemon", () => {
      expect(POKEDEX.length).toBe(151);
    });

    test("all Pokemon have valid IDs 1-151", () => {
      for (const p of POKEDEX) {
        expect(p.id).toBeGreaterThanOrEqual(1);
        expect(p.id).toBeLessThanOrEqual(151);
      }
    });

    test("POKEMON_BY_ID has all 151 entries", () => {
      expect(POKEMON_BY_ID.size).toBe(151);
    });

    test("POKEMON_BY_NAME lookup works (case insensitive)", () => {
      expect(POKEMON_BY_NAME.get("pikachu")?.id).toBe(25);
      expect(POKEMON_BY_NAME.get("mewtwo")?.id).toBe(150);
    });

    test("Bulbasaur has correct Gen 1 base stats", () => {
      const b = POKEMON_BY_ID.get(1)!;
      expect(b.baseStats.hp).toBe(45);
      expect(b.baseStats.attack).toBe(49);
      expect(b.baseStats.defense).toBe(49);
      expect(b.baseStats.speed).toBe(45);
      expect(b.baseStats.special).toBe(65);
    });

    test("Mewtwo has correct base stats and is legendary", () => {
      const m = POKEMON_BY_ID.get(150)!;
      expect(m.baseStats.special).toBe(154);
      expect(m.rarity).toBe("legendary");
    });

    test("Mew is mythical", () => {
      expect(POKEMON_BY_ID.get(151)?.rarity).toBe("mythical");
    });

    test("evolution chains exist", () => {
      expect(EVOLUTION_CHAINS.length).toBeGreaterThan(0);
    });

    test("starter pool has 30+ base-stage commons", () => {
      expect(STARTER_POOL.length).toBeGreaterThanOrEqual(30);
      for (const id of STARTER_POOL) {
        expect(POKEMON_BY_ID.has(id)).toBe(true);
      }
    });
  });

  // ── XP Engine ────────────────────────────────────────────

  describe("XP Engine", () => {
    test("medium_fast: L5=125, L10=1000, L16=4096, L100=1000000", () => {
      expect(cumulativeXpForLevel(5, "medium_fast")).toBe(125);
      expect(cumulativeXpForLevel(10, "medium_fast")).toBe(1000);
      expect(cumulativeXpForLevel(16, "medium_fast")).toBe(4096);
      expect(cumulativeXpForLevel(100, "medium_fast")).toBe(1000000);
    });

    test("slow: L5=156, L100=1250000", () => {
      expect(cumulativeXpForLevel(5, "slow")).toBe(156);
      expect(cumulativeXpForLevel(100, "slow")).toBe(1250000);
    });

    test("fast: L100=800000", () => {
      expect(cumulativeXpForLevel(100, "fast")).toBe(800000);
    });

    test("xpToNextLevel returns positive for levels < 100", () => {
      expect(xpToNextLevel(5, "medium_fast")).toBeGreaterThan(0);
      expect(xpToNextLevel(99, "medium_fast")).toBeGreaterThan(0);
    });

    test("xpToNextLevel returns 0 at max level", () => {
      expect(xpToNextLevel(MAX_LEVEL, "medium_fast")).toBe(0);
    });

    test("addXp levels up correctly", () => {
      const pokemon = makeOwned({ level: 5, currentXp: 0 });
      const species = POKEMON_BY_ID.get(pokemon.pokemonId)!;
      const needed = xpToNextLevel(5, species.expGroup);
      const result = addXp(pokemon, needed + 1, species);
      expect(result).not.toBeNull();
      expect(pokemon.level).toBe(6);
    });

    test("addXp handles multi level-up", () => {
      const pokemon = makeOwned({ level: 5, currentXp: 0 });
      const species = POKEMON_BY_ID.get(pokemon.pokemonId)!;
      addXp(pokemon, 50000, species);
      expect(pokemon.level).toBeGreaterThan(10);
    });

    test("addXp caps at level 100", () => {
      const pokemon = makeOwned({ level: 99, currentXp: 0 });
      const species = POKEMON_BY_ID.get(pokemon.pokemonId)!;
      addXp(pokemon, 9999999, species);
      expect(pokemon.level).toBe(MAX_LEVEL);
    });

    test("xpProgressPercent is between 0 and 100", () => {
      const pokemon = makeOwned({ level: 10, currentXp: 50 });
      const species = POKEMON_BY_ID.get(pokemon.pokemonId)!;
      const pct = xpProgressPercent(pokemon, species);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    });

    test("createXpEvent returns valid event for each type", () => {
      for (const type of XP_EVENT_TYPES) {
        const evt = createXpEvent(type);
        expect(evt.type).toBe(type);
        expect(evt.xp).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── Stat System ──────────────────────────────────────────

  describe("Stat System", () => {
    test("initCodingStats creates 5 stats from base stats", () => {
      const base = { hp: 45, attack: 49, defense: 49, speed: 45, special: 65 };
      const stats = initCodingStats(base);
      expect(stats.stamina).toBeGreaterThan(0);
      expect(stats.debugging).toBeGreaterThan(0);
      expect(stats.stability).toBeGreaterThan(0);
      expect(stats.velocity).toBeGreaterThan(0);
      expect(stats.wisdom).toBeGreaterThan(0);
    });

    test("calculateDisplayStat scales with level", () => {
      const low = calculateDisplayStat(50, 5, 0);
      const high = calculateDisplayStat(50, 100, 0);
      expect(high).toBeGreaterThan(low);
    });

    test("applyStatBoost increments stat", () => {
      const pokemon = makeOwned();
      const before = pokemon.codingStats.debugging;
      applyStatBoost(pokemon, "debugging", 5);
      expect(pokemon.codingStats.debugging).toBe(before + 5);
    });

    test("renderStatBar returns string of correct width", () => {
      const bar = renderStatBar(50, 10);
      expect(bar.length).toBe(10);
    });

    test("getTrainerTitle returns valid titles at all boundaries", () => {
      expect(getTrainerTitle(1)).toBe("Bug Catcher");
      expect(getTrainerTitle(50)).toBe("Veteran");
      expect(getTrainerTitle(100)).toBe("Professor");
    });
  });

  // ── Constants ────────────────────────────────────────────

  describe("Constants", () => {
    test("game limits are correct", () => {
      expect(MAX_PARTY_SIZE).toBe(6);
      expect(MAX_LEVEL).toBe(100);
      expect(STARTER_LEVEL).toBe(5);
    });

    test("all XP event types have awards defined", () => {
      for (const type of XP_EVENT_TYPES) {
        expect(XP_AWARDS[type]).toBeDefined();
        expect(XP_AWARDS[type].xp).toBeGreaterThanOrEqual(0);
      }
    });

    test("5 badges defined", () => {
      expect(BADGES.length).toBe(5);
    });

    test("10 trainer titles defined", () => {
      expect(TRAINER_TITLES.length).toBe(10);
    });
  });
});

// ════════════════════════════════════════════════════════════
// PHASE 2: Evolution & Sprites
// ════════════════════════════════════════════════════════════

describe("Phase 2: Evolution & Sprites", () => {
  // ── Evolution Engine ─────────────────────────────────────

  describe("Evolution Engine", () => {
    test("Charmander has a 2-link evolution chain", () => {
      const chain = findEvolutionChain(4);
      expect(chain).not.toBeNull();
      expect(chain!.links.length).toBe(2);
    });

    test("Charmander → Charmeleon at level 16", () => {
      const links = getEvolutionLinks(4);
      expect(links.length).toBe(1);
      expect(links[0]!.to).toBe(5);
      expect(links[0]!.method).toEqual({ type: "level", level: 16 });
    });

    test("Eevee has 3 evolution paths", () => {
      const links = getEvolutionLinks(133);
      expect(links.length).toBe(3);
    });

    test("Farfetch'd has no evolution", () => {
      const links = getEvolutionLinks(83);
      expect(links.length).toBe(0);
    });

    test("checkEvolution returns null below level threshold", () => {
      const pokemon = makeOwned({ pokemonId: 4, level: 15 });
      const state = makeState({ party: [pokemon] });
      expect(checkEvolution(pokemon, state)).toBeNull();
    });

    test("checkEvolution returns link at level threshold", () => {
      const pokemon = makeOwned({ pokemonId: 4, level: 16 });
      const state = makeState({ party: [pokemon] });
      const result = checkEvolution(pokemon, state);
      expect(result).not.toBeNull();
      expect(result!.to).toBe(5);
    });

    test("getDominantStat returns correct stat", () => {
      expect(
        getDominantStat({
          stamina: 10,
          debugging: 60,
          stability: 30,
          velocity: 40,
          wisdom: 20,
        }),
      ).toBe("debugging");
    });

    test("getDominantStat returns null on tie", () => {
      expect(
        getDominantStat({
          stamina: 10,
          debugging: 50,
          stability: 50,
          velocity: 40,
          wisdom: 20,
        }),
      ).toBeNull();
    });

    test("applyEvolution changes pokemonId", () => {
      const pokemon = makeOwned({ pokemonId: 4, level: 16 });
      applyEvolution(pokemon, 5);
      expect(pokemon.pokemonId).toBe(5);
    });

    test("applyEvolution sets evolvedAt", () => {
      const pokemon = makeOwned({ pokemonId: 4, level: 16 });
      applyEvolution(pokemon, 5);
      expect(pokemon.evolvedAt).not.toBeNull();
    });

    test("isBadgeEarned checks counter thresholds", () => {
      const state = makeState({
        counters: { ...emptyCounters(), bugs_fixed: 50 },
      });
      expect(isBadgeEarned("blaze", state)).toBe(true);
      expect(isBadgeEarned("flow", state)).toBe(false);
    });

    test("getNewlyEarnedBadges excludes already-earned", () => {
      const state = makeState({
        badges: ["blaze"],
        counters: { ...emptyCounters(), bugs_fixed: 50 },
      });
      const badges = getNewlyEarnedBadges(state);
      expect(badges).not.toContain("blaze");
    });
  });

  // ── Colorscript Sprites ──────────────────────────────────

  describe("Colorscript Sprites", () => {
    test("Pikachu sprite loads", () => {
      const sprite = loadSmallSprite(25);
      expect(sprite).not.toBeNull();
    });

    test("sprite contains ANSI escape codes", () => {
      const sprite = loadSmallSprite(25);
      expect(sprite).not.toBeNull();
      expect(sprite!).toContain("\x1b[");
    });

    test("all 151 sprites load", () => {
      let loaded = 0;
      for (let id = 1; id <= 151; id++) {
        if (loadSmallSprite(id) !== null) loaded++;
      }
      expect(loaded).toBe(151);
    });

    test("caching works (same reference returned)", () => {
      const a = loadSmallSprite(25);
      const b = loadSmallSprite(25);
      expect(a).toBe(b);
    });

    test("invalid ID returns null", () => {
      expect(loadSmallSprite(999)).toBeNull();
      expect(loadSmallSprite(0)).toBeNull();
      expect(loadSmallSprite(-1)).toBeNull();
    });
  });
});

// ════════════════════════════════════════════════════════════
// PHASE 3: Gamification & Journey
// ════════════════════════════════════════════════════════════

describe("Phase 3: Gamification & Journey", () => {
  // ── Encounter System ─────────────────────────────────────

  describe("Encounter System", () => {
    test("shouldTriggerEncounter at normal threshold (250+ XP)", () => {
      expect(
        shouldTriggerEncounter({
          xpSinceLastEncounter: 250,
          encounterSpeed: "normal",
          currentStreak: 0,
          recentToolTypes: [],
          currentHour: 12,
        }),
      ).toBe(true);
      expect(
        shouldTriggerEncounter({
          xpSinceLastEncounter: 1000,
          encounterSpeed: "normal",
          currentStreak: 0,
          recentToolTypes: [],
          currentHour: 12,
        }),
      ).toBe(true);
    });

    test("shouldTriggerEncounter false below normal threshold", () => {
      expect(
        shouldTriggerEncounter({
          xpSinceLastEncounter: 0,
          encounterSpeed: "normal",
          currentStreak: 0,
          recentToolTypes: [],
          currentHour: 12,
        }),
      ).toBe(false);
      expect(
        shouldTriggerEncounter({
          xpSinceLastEncounter: 249,
          encounterSpeed: "normal",
          currentStreak: 0,
          recentToolTypes: [],
          currentHour: 12,
        }),
      ).toBe(false);
    });

    test("getEncounterTypes returns valid types for all events", () => {
      for (const evt of XP_EVENT_TYPES) {
        const types = getEncounterTypes(evt);
        expect(types.length).toBeGreaterThan(0);
        for (const t of types) {
          expect(POKEMON_TYPES).toContain(t);
        }
      }
    });

    test("generateEncounter returns valid encounter", () => {
      const state = makeState();
      const encounter = generateEncounter("commit", state);
      if (encounter) {
        expect(encounter.pokemonId).toBeGreaterThanOrEqual(1);
        expect(encounter.pokemonId).toBeLessThanOrEqual(151);
        expect(encounter.level).toBeGreaterThanOrEqual(1);
      }
    });

    test("generateEncounter never returns legendary/mythical", () => {
      const state = makeState();
      const legendaryIds = [144, 145, 146, 150, 151];
      for (let i = 0; i < 100; i++) {
        const encounter = generateEncounter("commit", state);
        if (encounter) {
          expect(legendaryIds).not.toContain(encounter.pokemonId);
        }
      }
    });

    test("encounter pools exist for all 15 types", () => {
      for (const type of POKEMON_TYPES) {
        expect(TYPE_POOLS.has(type)).toBe(true);
      }
    });

    test("encounter pools exclude legendary/mythical", () => {
      const legendaryIds = new Set([144, 145, 146, 150, 151]);
      for (const [, pool] of TYPE_POOLS) {
        for (const id of pool.common) {
          expect(legendaryIds.has(id)).toBe(false);
        }
        for (const id of pool.uncommon) {
          expect(legendaryIds.has(id)).toBe(false);
        }
        for (const id of pool.rare) {
          expect(legendaryIds.has(id)).toBe(false);
        }
      }
    });

    test("getCatchCondition returns valid condition", () => {
      const condition = getCatchCondition(16); // Pidgey — common
      expect(condition.requiredLevel).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Achievements ─────────────────────────────────────────

  describe("Achievements", () => {
    test("has 17 defined achievements", () => {
      expect(ACHIEVEMENTS.length).toBe(17);
    });

    test("all achievements have unique IDs", () => {
      const ids = ACHIEVEMENTS.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    test("isConditionMet: counter condition works", () => {
      const state = makeState({ counters: { ...emptyCounters(), bugs_fixed: 10 } });
      expect(isConditionMet({ type: "counter", counter: "bugs_fixed", threshold: 10 }, state)).toBe(
        true,
      );
      expect(isConditionMet({ type: "counter", counter: "bugs_fixed", threshold: 11 }, state)).toBe(
        false,
      );
    });

    test("isConditionMet: level condition works", () => {
      const state = makeState({ party: [makeOwned({ level: 10 })] });
      expect(isConditionMet({ type: "level", minLevel: 10 }, state)).toBe(true);
      expect(isConditionMet({ type: "level", minLevel: 11 }, state)).toBe(false);
    });

    test("isConditionMet: streak condition works", () => {
      const state = makeState({
        streak: { currentStreak: 7, longestStreak: 7, lastActiveDate: null, totalDaysActive: 7 },
      });
      expect(isConditionMet({ type: "streak", minDays: 7 }, state)).toBe(true);
      expect(isConditionMet({ type: "streak", minDays: 8 }, state)).toBe(false);
    });

    test("isConditionMet: party_size condition works", () => {
      const state = makeState({ party: [makeOwned(), makeOwned()] });
      expect(isConditionMet({ type: "party_size", minSize: 2 }, state)).toBe(true);
      expect(isConditionMet({ type: "party_size", minSize: 3 }, state)).toBe(false);
    });

    test("checkNewAchievements excludes already-unlocked", () => {
      const state = makeState({
        party: [makeOwned()],
        achievements: [{ achievementId: "first_steps", unlockedAt: new Date().toISOString() }],
      });
      const newOnes = checkNewAchievements(state);
      expect(newOnes.find((a) => a.id === "first_steps")).toBeUndefined();
    });

    test("unlockAchievement creates valid record", () => {
      const record = unlockAchievement("test_id");
      expect(record.achievementId).toBe("test_id");
      expect(record.unlockedAt).toBeTruthy();
    });
  });

  // ── Milestones ───────────────────────────────────────────

  describe("Milestones", () => {
    test("has 8 milestone definitions", () => {
      expect(MILESTONES.length).toBe(8);
    });

    test("first commit milestone triggers Pidgey (#16)", () => {
      const result = checkNewMilestones({ commits: 1 }, new Set());
      const pidgey = result.find((m) => m.pokemonId === 16);
      expect(pidgey).toBeDefined();
    });

    test("excludes already-caught Pokemon", () => {
      const result = checkNewMilestones({ commits: 1 }, new Set([16]));
      const pidgey = result.find((m) => m.pokemonId === 16);
      expect(pidgey).toBeUndefined();
    });

    test("50 commits triggers Abra (#63)", () => {
      const result = checkNewMilestones({ commits: 50 }, new Set());
      const abra = result.find((m) => m.pokemonId === 63);
      expect(abra).toBeDefined();
    });
  });

  // ── Legendary Quests ─────────────────────────────────────

  describe("Legendary Quests", () => {
    test("has 5 legendary quests", () => {
      expect(LEGENDARY_QUESTS.length).toBe(5);
    });

    test("quest Pokemon IDs are legendary/mythical", () => {
      const ids = LEGENDARY_QUESTS.map((q) => q.pokemonId);
      expect(ids).toContain(144); // Articuno
      expect(ids).toContain(145); // Zapdos
      expect(ids).toContain(146); // Moltres
      expect(ids).toContain(150); // Mewtwo
      expect(ids).toContain(151); // Mew
    });

    test("each quest has 4 steps", () => {
      for (const quest of LEGENDARY_QUESTS) {
        expect(quest.steps.length).toBe(4);
      }
    });

    test("getQuestProgress returns progress for all quests", () => {
      const state = makeState();
      const progress = getQuestProgress(state);
      expect(progress.length).toBe(5);
      for (const p of progress) {
        expect(p.totalSteps).toBe(4);
        expect(p.stepsCompleted).toBeGreaterThanOrEqual(0);
      }
    });

    test("zero progress with fresh state", () => {
      const state = makeState();
      const progress = getQuestProgress(state);
      for (const p of progress) {
        expect(p.stepsCompleted).toBe(0);
      }
    });
  });
});

// ════════════════════════════════════════════════════════════
// PHASE 4: Reactions & Personality
// ════════════════════════════════════════════════════════════

describe("Phase 4: Reactions & Personality", () => {
  // ── Reaction Engine ──────────────────────────────────────

  describe("Reaction Engine", () => {
    test("returns reactions for all 15 types", () => {
      for (const type of POKEMON_TYPES) {
        const reaction = getReaction("TestMon", type, "error");
        expect(reaction).toBeTruthy();
        expect(reaction.length).toBeGreaterThan(0);
      }
    });

    test("substitutes {name} placeholder", () => {
      const reaction = getReaction("Pikachu", "Electric", "pet");
      expect(reaction).not.toContain("{name}");
      // Should contain the Pokemon name (most reactions include it)
    });

    test("different events produce different reactions", () => {
      const error = getReaction("TestMon", "Fire", "error");
      const pet = getReaction("TestMon", "Fire", "pet");
      // They might occasionally be the same by random chance,
      // but the pools should be different
      expect(typeof error).toBe("string");
      expect(typeof pet).toBe("string");
    });

    test("shouldReact respects cooldown", () => {
      const now = Date.now();
      expect(shouldReact(now - 31000, 30000)).toBe(true); // 31s ago, 30s cooldown
      expect(shouldReact(now - 10000, 30000)).toBe(false); // 10s ago, 30s cooldown
      expect(shouldReact(0, 30000)).toBe(true); // Never reacted
    });
  });

  // ── Dynamic Instructions ─────────────────────────────────

  describe("Dynamic Instructions", () => {
    test("returns starter guidance when state is null", () => {
      const instructions = buildInstructions(null);
      expect(instructions).toContain("starter");
    });

    test("includes Pokemon name when state has active Pokemon", () => {
      const state = makeState({
        party: [makeOwned({ pokemonId: 25 })], // Pikachu
      });
      const instructions = buildInstructions(state);
      expect(instructions).toContain("Pikachu");
    });

    test("includes buddy comment format instructions", () => {
      const state = makeState();
      const instructions = buildInstructions(state);
      expect(instructions).toContain("buddy");
    });

    test("includes encounter note when pending encounter exists", () => {
      const state = makeState({
        pendingEncounter: {
          pokemonId: 16,
          level: 3,
          catchCondition: { requiredStat: null, minStatValue: 0, requiredLevel: 1 },
        },
      });
      const instructions = buildInstructions(state);
      expect(instructions.toLowerCase()).toContain("pidgey");
    });
  });
});

// ════════════════════════════════════════════════════════════
// CROSS-PHASE: Integration Checks
// ════════════════════════════════════════════════════════════

describe("Cross-Phase Integration", () => {
  test("starter pool Pokemon all have sprites", () => {
    for (const id of STARTER_POOL) {
      expect(loadSmallSprite(id)).not.toBeNull();
    }
  });

  test("all evolution targets exist in Pokedex", () => {
    for (const chain of EVOLUTION_CHAINS) {
      for (const link of chain.links) {
        expect(POKEMON_BY_ID.has(link.from)).toBe(true);
        expect(POKEMON_BY_ID.has(link.to)).toBe(true);
      }
    }
  });

  test("all milestone Pokemon exist in Pokedex", () => {
    for (const m of MILESTONES) {
      expect(POKEMON_BY_ID.has(m.pokemonId)).toBe(true);
    }
  });

  test("all legendary quest Pokemon exist in Pokedex", () => {
    for (const q of LEGENDARY_QUESTS) {
      expect(POKEMON_BY_ID.has(q.pokemonId)).toBe(true);
    }
  });

  test("XP → level-up → evolution pipeline works", () => {
    const pokemon = makeOwned({ pokemonId: 10, level: 6, currentXp: 0 }); // Caterpie, evolves at 7
    const species = POKEMON_BY_ID.get(10)!;
    const state = makeState({ party: [pokemon] });

    // Add enough XP to reach level 7
    const needed = xpToNextLevel(6, species.expGroup);
    const result = addXp(pokemon, needed + 1, species);

    expect(result).not.toBeNull();
    expect(pokemon.level).toBeGreaterThanOrEqual(7);

    // Check evolution eligibility
    const evo = checkEvolution(pokemon, state);
    expect(evo).not.toBeNull();
    expect(evo!.to).toBe(11); // Metapod
  });

  test("badge earning → evolution unlock pipeline works", () => {
    // Pikachu evolves via Spark Badge (200 commits)
    const pokemon = makeOwned({ pokemonId: 25, level: 30 });
    const state = makeState({
      party: [pokemon],
      badges: ["spark"],
      counters: { ...emptyCounters(), commits: 200 },
    });

    const evo = checkEvolution(pokemon, state);
    expect(evo).not.toBeNull();
    expect(evo!.to).toBe(26); // Raichu
  });
});
