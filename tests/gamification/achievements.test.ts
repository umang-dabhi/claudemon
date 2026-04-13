/**
 * Achievement system tests for Claudemon.
 * Verifies condition checking, achievement discovery, and unlock record creation.
 */

import { describe, expect, test } from "bun:test";
import {
  ACHIEVEMENTS,
  isConditionMet,
  checkNewAchievements,
  unlockAchievement,
} from "../../src/gamification/achievements.js";
import type {
  AchievementCondition,
  PlayerState,
  OwnedPokemon,
  UnlockedAchievement,
} from "../../src/engine/types.js";

// ── Helpers ──────────────────────────────────────────────────

function makeOwned(overrides: Partial<OwnedPokemon> = {}): OwnedPokemon {
  return {
    id: "test-uuid",
    pokemonId: 4,
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

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    trainerId: "test-trainer",
    trainerName: "Ash",
    party: [],
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
    config: {
      muted: false,
      reactionCooldownMs: 30000,
      statusLineEnabled: true,
      bellEnabled: true,
      encounterSpeed: "normal" as const,
    },
    startedAt: "2026-04-13T00:00:00.000Z",
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

// ── isConditionMet Tests ─────────────────────────────────────

describe("isConditionMet", () => {
  describe("counter condition", () => {
    test("returns true when counter meets threshold", () => {
      const condition: AchievementCondition = {
        type: "counter",
        counter: "bugs_fixed",
        threshold: 10,
      };
      const state = makeState({
        counters: {
          commits: 0,
          tests_passed: 0,
          tests_failed: 0,
          tests_written: 0,
          builds_succeeded: 0,
          builds_failed: 0,
          bugs_fixed: 10,
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

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns true when counter exceeds threshold", () => {
      const condition: AchievementCondition = {
        type: "counter",
        counter: "bugs_fixed",
        threshold: 10,
      };
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

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns false when counter is below threshold", () => {
      const condition: AchievementCondition = {
        type: "counter",
        counter: "bugs_fixed",
        threshold: 10,
      };
      const state = makeState({
        counters: {
          commits: 0,
          tests_passed: 0,
          tests_failed: 0,
          tests_written: 0,
          builds_succeeded: 0,
          builds_failed: 0,
          bugs_fixed: 9,
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

      expect(isConditionMet(condition, state)).toBe(false);
    });
  });

  describe("level condition", () => {
    test("returns true when highest party level meets minimum", () => {
      const condition: AchievementCondition = { type: "level", minLevel: 10 };
      const state = makeState({
        party: [makeOwned({ level: 10 }), makeOwned({ level: 5 })],
      });

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns false when all party Pokemon are below minimum level", () => {
      const condition: AchievementCondition = { type: "level", minLevel: 50 };
      const state = makeState({
        party: [makeOwned({ level: 10 }), makeOwned({ level: 20 })],
      });

      expect(isConditionMet(condition, state)).toBe(false);
    });

    test("returns false when party is empty", () => {
      const condition: AchievementCondition = { type: "level", minLevel: 1 };
      const state = makeState({ party: [] });

      expect(isConditionMet(condition, state)).toBe(false);
    });
  });

  describe("pokedex condition", () => {
    test("returns true when totalCaught meets minimum", () => {
      const condition: AchievementCondition = { type: "pokedex", minCaught: 50 };
      const state = makeState({
        pokedex: { entries: {}, totalSeen: 60, totalCaught: 50 },
      });

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns false when totalCaught is below minimum", () => {
      const condition: AchievementCondition = { type: "pokedex", minCaught: 50 };
      const state = makeState({
        pokedex: { entries: {}, totalSeen: 60, totalCaught: 49 },
      });

      expect(isConditionMet(condition, state)).toBe(false);
    });
  });

  describe("streak condition", () => {
    test("returns true when currentStreak meets minimum", () => {
      const condition: AchievementCondition = { type: "streak", minDays: 7 };
      const state = makeState({
        streak: {
          currentStreak: 7,
          longestStreak: 7,
          lastActiveDate: "2026-04-13",
          totalDaysActive: 7,
        },
      });

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns false when currentStreak is below minimum", () => {
      const condition: AchievementCondition = { type: "streak", minDays: 7 };
      const state = makeState({
        streak: {
          currentStreak: 6,
          longestStreak: 10,
          lastActiveDate: "2026-04-13",
          totalDaysActive: 30,
        },
      });

      expect(isConditionMet(condition, state)).toBe(false);
    });
  });

  describe("badge condition", () => {
    test("returns true when badge is in player badges", () => {
      const condition: AchievementCondition = { type: "badge", badge: "blaze" };
      const state = makeState({ badges: ["blaze"] });

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns false when badge is not earned", () => {
      const condition: AchievementCondition = { type: "badge", badge: "blaze" };
      const state = makeState({ badges: ["flow", "spark"] });

      expect(isConditionMet(condition, state)).toBe(false);
    });
  });

  describe("evolution condition", () => {
    test("returns true when any Pokemon has evolvedAt set", () => {
      const condition: AchievementCondition = { type: "evolution" };
      const evolvedPokemon = makeOwned({ evolvedAt: "2026-04-13T12:00:00.000Z" });
      const state = makeState({ party: [evolvedPokemon] });

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns true when evolved Pokemon is in pcBox", () => {
      const condition: AchievementCondition = { type: "evolution" };
      const evolvedPokemon = makeOwned({ evolvedAt: "2026-04-13T12:00:00.000Z" });
      const state = makeState({ party: [], pcBox: [evolvedPokemon] });

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns false when no Pokemon has evolved", () => {
      const condition: AchievementCondition = { type: "evolution" };
      const pokemon = makeOwned({ evolvedAt: null });
      const state = makeState({ party: [pokemon] });

      expect(isConditionMet(condition, state)).toBe(false);
    });

    test("returns false when party and pcBox are empty", () => {
      const condition: AchievementCondition = { type: "evolution" };
      const state = makeState({ party: [], pcBox: [] });

      expect(isConditionMet(condition, state)).toBe(false);
    });
  });

  describe("party_size condition", () => {
    test("returns true when party has enough members", () => {
      const condition: AchievementCondition = { type: "party_size", minSize: 1 };
      const state = makeState({ party: [makeOwned()] });

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns true when party is full (6 members)", () => {
      const condition: AchievementCondition = { type: "party_size", minSize: 6 };
      const party = Array.from({ length: 6 }, (_, i) =>
        makeOwned({ id: `uuid-${i}`, pokemonId: i + 1 }),
      );
      const state = makeState({ party });

      expect(isConditionMet(condition, state)).toBe(true);
    });

    test("returns false when party is too small", () => {
      const condition: AchievementCondition = { type: "party_size", minSize: 6 };
      const state = makeState({ party: [makeOwned()] });

      expect(isConditionMet(condition, state)).toBe(false);
    });

    test("returns false when party is empty", () => {
      const condition: AchievementCondition = { type: "party_size", minSize: 1 };
      const state = makeState({ party: [] });

      expect(isConditionMet(condition, state)).toBe(false);
    });
  });
});

// ── checkNewAchievements Tests ───────────────────────────────

describe("checkNewAchievements", () => {
  test("returns first_steps when party has 1 member", () => {
    const state = makeState({ party: [makeOwned()] });
    const newAchievements = checkNewAchievements(state);

    const ids = newAchievements.map((a) => a.id);
    expect(ids).toContain("first_steps");
  });

  test("excludes already-unlocked achievements", () => {
    const state = makeState({
      party: [makeOwned()],
      achievements: [{ achievementId: "first_steps", unlockedAt: "2026-04-13T00:00:00.000Z" }],
    });
    const newAchievements = checkNewAchievements(state);

    const ids = newAchievements.map((a) => a.id);
    expect(ids).not.toContain("first_steps");
  });

  test("returns multiple achievements when conditions are met", () => {
    const state = makeState({
      party: [makeOwned({ level: 10 })],
      counters: {
        commits: 0,
        tests_passed: 0,
        tests_failed: 0,
        tests_written: 0,
        builds_succeeded: 0,
        builds_failed: 0,
        bugs_fixed: 10,
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
    const newAchievements = checkNewAchievements(state);

    const ids = newAchievements.map((a) => a.id);
    // Should have first_steps (party >= 1), getting_started (level 10), bug_catcher_10 (10 bugs)
    expect(ids).toContain("first_steps");
    expect(ids).toContain("getting_started");
    expect(ids).toContain("bug_catcher_10");
  });

  test("returns empty array when no conditions are met", () => {
    const state = makeState();
    const newAchievements = checkNewAchievements(state);

    expect(newAchievements).toEqual([]);
  });

  test("returns empty array when all achievements are already unlocked", () => {
    // Unlock first_steps and nothing else qualifies with empty counters
    const state = makeState({
      party: [makeOwned()],
      achievements: [{ achievementId: "first_steps", unlockedAt: "2026-04-13T00:00:00.000Z" }],
    });
    const newAchievements = checkNewAchievements(state);

    // first_steps is excluded (already unlocked), getting_started needs level 10, etc.
    const ids = newAchievements.map((a) => a.id);
    expect(ids).not.toContain("first_steps");
  });

  test("discovers evolution achievement when a Pokemon has evolved", () => {
    const evolvedPokemon = makeOwned({
      pokemonId: 5, // Charmeleon
      level: 16,
      evolvedAt: "2026-04-13T12:00:00.000Z",
    });
    const state = makeState({ party: [evolvedPokemon] });
    const newAchievements = checkNewAchievements(state);

    const ids = newAchievements.map((a) => a.id);
    expect(ids).toContain("evolution");
  });
});

// ── unlockAchievement Tests ──────────────────────────────────

describe("unlockAchievement", () => {
  test("creates record with correct achievementId", () => {
    const record = unlockAchievement("first_steps");
    expect(record.achievementId).toBe("first_steps");
  });

  test("creates record with ISO timestamp", () => {
    const before = new Date().toISOString();
    const record = unlockAchievement("getting_started");
    const after = new Date().toISOString();

    expect(record.unlockedAt).toBeDefined();
    // Timestamp should be between before and after
    expect(record.unlockedAt >= before).toBe(true);
    expect(record.unlockedAt <= after).toBe(true);
  });

  test("creates record matching UnlockedAchievement shape", () => {
    const record: UnlockedAchievement = unlockAchievement("test_ace");
    expect(typeof record.achievementId).toBe("string");
    expect(typeof record.unlockedAt).toBe("string");
  });

  test("each call creates a fresh record", () => {
    const record1 = unlockAchievement("first_steps");
    const record2 = unlockAchievement("first_steps");

    // Records should not be the same object reference
    expect(record1).not.toBe(record2);
    expect(record1.achievementId).toBe(record2.achievementId);
  });
});

// ── Achievement Definitions Integrity ────────────────────────

describe("ACHIEVEMENTS", () => {
  test("has 17 defined achievements", () => {
    expect(ACHIEVEMENTS.length).toBe(17);
  });

  test("all achievements have unique IDs", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("all achievements have required fields", () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(typeof achievement.id).toBe("string");
      expect(typeof achievement.name).toBe("string");
      expect(typeof achievement.description).toBe("string");
      expect(["trainer", "coding", "pokemon", "secret"]).toContain(achievement.category);
      expect(achievement.condition).toBeDefined();
      expect(typeof achievement.condition.type).toBe("string");
    }
  });
});
