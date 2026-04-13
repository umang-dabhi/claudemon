/**
 * Achievement definitions and unlock-checking logic for Claudemon.
 * All achievements are derived from PlayerState — pure functions, no side effects.
 */

import type {
  Achievement,
  AchievementCondition,
  PlayerState,
  UnlockedAchievement,
} from "../engine/types.js";

// ── Achievement Definitions ──────────────────────────────────

export const ACHIEVEMENTS: readonly Achievement[] = [
  // ── Trainer Milestones ───────────────────────────────────
  {
    id: "first_steps",
    name: "First Steps",
    description: "Pick your starter Pokemon",
    category: "trainer",
    condition: { type: "party_size", minSize: 1 },
  },
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Reach level 10",
    category: "trainer",
    condition: { type: "level", minLevel: 10 },
  },
  {
    id: "seasoned",
    name: "Seasoned Trainer",
    description: "Reach level 50",
    category: "trainer",
    condition: { type: "level", minLevel: 50 },
  },
  {
    id: "master",
    name: "Pokemon Master",
    description: "Reach level 100",
    category: "trainer",
    condition: { type: "level", minLevel: 100 },
  },
  {
    id: "full_party",
    name: "Full Party",
    description: "Have 6 Pokemon in your party",
    category: "trainer",
    condition: { type: "party_size", minSize: 6 },
  },
  {
    id: "collector_50",
    name: "Collector",
    description: "Catch 50 unique Pokemon",
    category: "trainer",
    condition: { type: "pokedex", minCaught: 50 },
  },
  {
    id: "completionist",
    name: "Completionist",
    description: "Catch all 151 Pokemon",
    category: "trainer",
    condition: { type: "pokedex", minCaught: 151 },
  },

  // ── Coding Achievements ──────────────────────────────────
  {
    id: "bug_catcher_10",
    name: "Bug Catcher",
    description: "Fix 10 errors",
    category: "coding",
    condition: { type: "counter", counter: "bugs_fixed", threshold: 10 },
  },
  {
    id: "exterminator",
    name: "Exterminator",
    description: "Fix 100 errors",
    category: "coding",
    condition: { type: "counter", counter: "bugs_fixed", threshold: 100 },
  },
  {
    id: "test_ace",
    name: "Test Ace",
    description: "Pass 100 tests",
    category: "coding",
    condition: { type: "counter", counter: "tests_passed", threshold: 100 },
  },
  {
    id: "ci_champion",
    name: "CI Champion",
    description: "50 successful builds",
    category: "coding",
    condition: { type: "counter", counter: "builds_succeeded", threshold: 50 },
  },
  {
    id: "refactor_king",
    name: "Refactor King",
    description: "Complete 10 large refactors",
    category: "coding",
    condition: { type: "counter", counter: "large_refactors", threshold: 10 },
  },
  {
    id: "iron_coder",
    name: "Iron Coder",
    description: "Code for 7 days (weekends off OK)",
    category: "coding",
    condition: { type: "streak", minDays: 7 },
  },
  {
    id: "marathon",
    name: "Marathon",
    description: "Code for 30 days (weekends off OK)",
    category: "coding",
    condition: { type: "streak", minDays: 30 },
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Code for 100 days (weekends off OK)",
    category: "coding",
    condition: { type: "streak", minDays: 100 },
  },

  // ── Pokemon Achievements ─────────────────────────────────
  {
    id: "evolution",
    name: "Evolutionary",
    description: "Evolve a Pokemon",
    category: "pokemon",
    condition: { type: "evolution" },
  },
  {
    id: "badge_collector",
    name: "Badge Collector",
    description: "Earn your first badge",
    category: "pokemon",
    condition: { type: "badge", badge: "blaze" },
  },
];

// ── Condition Checker ────────────────────────────────────────

/** Check whether a single achievement condition is satisfied by the current player state. */
export function isConditionMet(condition: AchievementCondition, state: PlayerState): boolean {
  switch (condition.type) {
    case "counter":
      return (state.counters[condition.counter] ?? 0) >= condition.threshold;

    case "level": {
      const highestLevel = getHighestPartyLevel(state);
      return highestLevel >= condition.minLevel;
    }

    case "pokedex":
      return state.pokedex.totalCaught >= condition.minCaught;

    case "streak":
      return state.streak.currentStreak >= condition.minDays;

    case "badge":
      return state.badges.includes(condition.badge);

    case "evolution":
      return hasAnyEvolvedPokemon(state);

    case "party_size":
      return state.party.length >= condition.minSize;
  }
}

// ── Achievement Discovery ────────────────────────────────────

/** Return achievements that are newly unlocked (not already in state.achievements). */
export function checkNewAchievements(state: PlayerState): Achievement[] {
  const alreadyUnlocked = new Set(state.achievements.map((a) => a.achievementId));

  return ACHIEVEMENTS.filter(
    (achievement) =>
      !alreadyUnlocked.has(achievement.id) && isConditionMet(achievement.condition, state),
  );
}

/** Create a timestamped unlock record for an achievement. */
export function unlockAchievement(achievementId: string): UnlockedAchievement {
  return {
    achievementId,
    unlockedAt: new Date().toISOString(),
  };
}

// ── Internal Helpers ─────────────────────────────────────────

/** Get the highest level among all party Pokemon (0 if party is empty). */
function getHighestPartyLevel(state: PlayerState): number {
  if (state.party.length === 0) return 0;
  return Math.max(...state.party.map((p) => p.level));
}

/** Check whether any Pokemon in party or PC box has evolved (evolvedAt is set). */
function hasAnyEvolvedPokemon(state: PlayerState): boolean {
  const allPokemon = [...state.party, ...state.pcBox];
  return allPokemon.some((p) => p.evolvedAt !== null);
}
