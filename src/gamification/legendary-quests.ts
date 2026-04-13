/**
 * Legendary quest chain definitions for Claudemon.
 * Each legendary Pokemon requires completing a multi-step quest
 * tied to sustained coding activity.
 */

import type { AchievementCondition, LegendaryQuest, PlayerState } from "../engine/types.js";
import { isConditionMet } from "./achievements.js";

// ── Quest Definitions ────────────────────────────────────────

export const LEGENDARY_QUESTS: readonly LegendaryQuest[] = [
  // ── Articuno (#144) — "The Ice Bird of Endurance" ────────
  {
    pokemonId: 144,
    name: "The Ice Bird of Endurance",
    steps: [
      {
        description: "Code for 30 days (weekends off OK)",
        condition: { type: "streak", minDays: 30 },
      },
      {
        description: "Catch 3 Water or Ice type Pokemon",
        // Approximated as pokedex gate; real type-check in getQuestProgress.
        condition: { type: "pokedex", minCaught: 3 },
      },
      {
        description: "Code for 100 days (weekends off OK)",
        condition: { type: "streak", minDays: 100 },
      },
      {
        description: "Reach level 50 on your active Pokemon",
        condition: { type: "level", minLevel: 50 },
      },
    ],
  },

  // ── Zapdos (#145) — "The Thunder of Testing" ────────────
  {
    pokemonId: 145,
    name: "The Thunder of Testing",
    steps: [
      {
        description: "Pass 100 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 100 },
      },
      {
        description: "Write 50 test files",
        condition: { type: "counter", counter: "tests_written", threshold: 50 },
      },
      {
        description: "Pass 500 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 500 },
      },
      {
        description: "Pass 1000 tests lifetime",
        condition: { type: "counter", counter: "tests_passed", threshold: 1000 },
      },
    ],
  },

  // ── Moltres (#146) — "The Flame of Debugging" ──────────
  {
    pokemonId: 146,
    name: "The Flame of Debugging",
    steps: [
      {
        description: "Fix 50 bugs",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 50 },
      },
      {
        description: "Earn the Blaze Badge",
        condition: { type: "badge", badge: "blaze" },
      },
      {
        description: "Fix 200 bugs",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 200 },
      },
      {
        description: "Fix 500 bugs lifetime",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 500 },
      },
    ],
  },

  // ── Mewtwo (#150) — "The Ultimate Creation" ─────────────
  {
    pokemonId: 150,
    name: "The Ultimate Creation",
    steps: [
      {
        description: "Catch 50 unique Pokemon",
        condition: { type: "pokedex", minCaught: 50 },
      },
      {
        description: "Reach level 75 on any Pokemon",
        condition: { type: "level", minLevel: 75 },
      },
      {
        description: "Catch 100 unique Pokemon",
        condition: { type: "pokedex", minCaught: 100 },
      },
      {
        description: "Catch 140 unique Pokemon",
        condition: { type: "pokedex", minCaught: 140 },
      },
    ],
  },

  // ── Mew (#151) — "The Myth" ─────────────────────────────
  {
    pokemonId: 151,
    name: "The Myth",
    steps: [
      {
        description: "Code for 100 days (weekends off OK)",
        condition: { type: "streak", minDays: 100 },
      },
      {
        description: "Catch all 3 legendary birds (Articuno, Zapdos, Moltres)",
        // Gate: must have at least 148 caught (birds are #144-146).
        // Real check in getQuestProgress verifies specific IDs.
        condition: { type: "pokedex", minCaught: 148 },
      },
      {
        description: "Catch Mewtwo",
        // Gate: must have at least 149 caught (Mewtwo is #150).
        // Real check in getQuestProgress verifies specific ID.
        condition: { type: "pokedex", minCaught: 149 },
      },
      {
        description: "Code for 365 days (weekends off OK)",
        condition: { type: "streak", minDays: 365 },
      },
    ],
  },
];

// ── Quest Progress ───────────────────────────────────────────

/** IDs of Water and Ice type Pokemon in Gen 1 Pokedex. */
const WATER_ICE_POKEMON_IDS: ReadonlySet<number> = new Set([
  // Water types
  7,
  8,
  9, // Squirtle line
  54,
  55, // Psyduck, Golduck
  60,
  61,
  62, // Poliwag line
  72,
  73, // Tentacool, Tentacruel
  79,
  80, // Slowpoke, Slowbro
  86,
  87, // Seel, Dewgong (also Ice)
  90,
  91, // Shellder, Cloyster (also Ice)
  98,
  99, // Krabby, Kingler
  116,
  117, // Horsea, Seadra
  118,
  119, // Goldeen, Seaking
  120,
  121, // Staryu, Starmie
  129,
  130, // Magikarp, Gyarados
  131, // Lapras (Water/Ice)
  134, // Vaporeon
  138,
  139, // Omanyte, Omastar
  140,
  141, // Kabuto, Kabutops
  // Ice types (not already listed)
  124, // Jynx (Ice/Psychic)
  144, // Articuno (Ice/Flying)
]);

/** Legendary bird Pokedex IDs. */
const LEGENDARY_BIRD_IDS: readonly number[] = [144, 145, 146];

/** Mewtwo Pokedex ID. */
const MEWTWO_ID = 150;

export interface QuestProgress {
  readonly quest: LegendaryQuest;
  readonly stepsCompleted: number;
  readonly totalSteps: number;
}

/**
 * Calculate completion progress for every legendary quest.
 * Steps are checked sequentially — a later step cannot complete
 * until all earlier steps are done.
 */
export function getQuestProgress(state: PlayerState): QuestProgress[] {
  return LEGENDARY_QUESTS.map((quest) => {
    let stepsCompleted = 0;

    for (const step of quest.steps) {
      if (isStepComplete(quest.pokemonId, step.description, step.condition, state)) {
        stepsCompleted++;
      } else {
        break; // Steps are sequential — stop at first incomplete.
      }
    }

    return {
      quest,
      stepsCompleted,
      totalSteps: quest.steps.length,
    };
  });
}

// ── Internal Helpers ─────────────────────────────────────────

/**
 * Check whether a quest step is complete.
 * Uses isConditionMet for standard conditions, with overrides
 * for steps that require specific-Pokemon or type-based checks.
 */
function isStepComplete(
  questPokemonId: number,
  stepDescription: string,
  condition: AchievementCondition,
  state: PlayerState,
): boolean {
  // Articuno step 2: catch 3 Water/Ice type Pokemon
  if (questPokemonId === 144 && stepDescription.includes("Water or Ice")) {
    return countCaughtByIds(state, WATER_ICE_POKEMON_IDS) >= 3;
  }

  // Mew step 2: catch all 3 legendary birds
  if (questPokemonId === 151 && stepDescription.includes("legendary birds")) {
    return LEGENDARY_BIRD_IDS.every((id) => isPokemonCaught(state, id));
  }

  // Mew step 3: catch Mewtwo
  if (questPokemonId === 151 && stepDescription.includes("Mewtwo")) {
    return isPokemonCaught(state, MEWTWO_ID);
  }

  // Default: delegate to the standard condition checker.
  return isConditionMet(condition, state);
}

/** Check whether a specific Pokemon ID has been caught in the Pokedex. */
function isPokemonCaught(state: PlayerState, pokemonId: number): boolean {
  const entry = state.pokedex.entries[pokemonId];
  return entry !== undefined && entry.caught;
}

/** Count how many Pokemon from a given ID set have been caught. */
function countCaughtByIds(state: PlayerState, ids: ReadonlySet<number>): number {
  let count = 0;
  for (const id of ids) {
    if (isPokemonCaught(state, id)) {
      count++;
    }
  }
  return count;
}
