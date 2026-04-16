/**
 * Legendary quest chain definitions for Claudemon.
 * Each legendary Pokemon requires completing a multi-step quest
 * tied to sustained coding activity. Designed for corporate developers —
 * tough but achievable with consistent daily work.
 */

import type { AchievementCondition, LegendaryQuest, PlayerState } from "../engine/types.js";
import { POKEMON_BY_ID } from "../engine/pokemon-data.js";
import { isConditionMet } from "./achievements.js";

// ── Quest Definitions ────────────────────────────────────────

export const LEGENDARY_QUESTS: readonly LegendaryQuest[] = [
  // ═══════════════════════════════════════════════════════════
  // GEN 1 — Kanto Legends
  // ═══════════════════════════════════════════════════════════

  // ── Articuno (#144) — "The Ice Bird of Endurance" ────────
  {
    pokemonId: 144,
    name: "The Ice Bird of Endurance",
    steps: [
      {
        description: "Code for 14 days (weekends off OK)",
        condition: { type: "streak", minDays: 14 },
      },
      {
        description: "Catch 3 Water or Ice type Pokemon",
        condition: { type: "pokedex", minCaught: 3 },
      },
      {
        description: "Code for 30 days (weekends off OK)",
        condition: { type: "streak", minDays: 30 },
      },
      {
        description: "Reach level 30 on your active Pokemon",
        condition: { type: "level", minLevel: 30 },
      },
    ],
  },

  // ── Zapdos (#145) — "The Thunder of Testing" ────────────
  {
    pokemonId: 145,
    name: "The Thunder of Testing",
    steps: [
      {
        description: "Pass 50 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 50 },
      },
      {
        description: "Write 20 test files",
        condition: { type: "counter", counter: "tests_written", threshold: 20 },
      },
      {
        description: "Pass 200 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 200 },
      },
      {
        description: "Pass 500 tests lifetime",
        condition: { type: "counter", counter: "tests_passed", threshold: 500 },
      },
    ],
  },

  // ── Moltres (#146) — "The Flame of Debugging" ──────────
  {
    pokemonId: 146,
    name: "The Flame of Debugging",
    steps: [
      {
        description: "Fix 25 bugs",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 25 },
      },
      {
        description: "Earn the Blaze Badge",
        condition: { type: "badge", badge: "blaze" },
      },
      {
        description: "Fix 100 bugs",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 100 },
      },
      {
        description: "Fix 250 bugs lifetime",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 250 },
      },
    ],
  },

  // ── Mewtwo (#150) — "The Ultimate Creation" ─────────────
  {
    pokemonId: 150,
    name: "The Ultimate Creation",
    steps: [
      {
        description: "Catch 30 unique Pokemon",
        condition: { type: "pokedex", minCaught: 30 },
      },
      {
        description: "Reach level 40 on any Pokemon",
        condition: { type: "level", minLevel: 40 },
      },
      {
        description: "Catch 75 unique Pokemon",
        condition: { type: "pokedex", minCaught: 75 },
      },
      {
        description: "Catch 120 unique Pokemon",
        condition: { type: "pokedex", minCaught: 120 },
      },
    ],
  },

  // ── Mew (#151) — "The Myth" ─────────────────────────────
  {
    pokemonId: 151,
    name: "The Myth",
    steps: [
      {
        description: "Code for 60 days (weekends off OK)",
        condition: { type: "streak", minDays: 60 },
      },
      {
        description: "Catch all 3 legendary birds (Articuno, Zapdos, Moltres)",
        condition: { type: "pokedex", minCaught: 50 },
      },
      {
        description: "Catch Mewtwo",
        condition: { type: "pokedex", minCaught: 60 },
      },
      {
        description: "Code for 180 days (weekends off OK)",
        condition: { type: "streak", minDays: 180 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GEN 2 — Johto Legends
  // ═══════════════════════════════════════════════════════════

  // ── Lugia (#249) — "The Guardian of the Deep" ───────────
  {
    pokemonId: 249,
    name: "The Guardian of the Deep",
    steps: [
      {
        description: "Pass 100 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 100 },
      },
      {
        description: "Build successfully 50 times",
        condition: { type: "counter", counter: "builds_succeeded", threshold: 50 },
      },
      {
        description: "Catch 40 unique Pokemon",
        condition: { type: "pokedex", minCaught: 40 },
      },
      {
        description: "Code for 45 days (weekends off OK)",
        condition: { type: "streak", minDays: 45 },
      },
    ],
  },

  // ── Ho-Oh (#250) — "The Rainbow Phoenix" ────────────────
  {
    pokemonId: 250,
    name: "The Rainbow Phoenix",
    steps: [
      {
        description: "Catch Pokemon of 10 different types",
        condition: { type: "pokedex", minCaught: 20 },
      },
      {
        description: "Make 100 commits",
        condition: { type: "counter", counter: "commits", threshold: 100 },
      },
      {
        description: "Reach level 35 on any Pokemon",
        condition: { type: "level", minLevel: 35 },
      },
      {
        description: "Code for 60 days (weekends off OK)",
        condition: { type: "streak", minDays: 60 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GEN 3 — Hoenn Legends
  // ═══════════════════════════════════════════════════════════

  // ── Kyogre (#382) — "The Ocean Architect" ───────────────
  {
    pokemonId: 382,
    name: "The Ocean Architect",
    steps: [
      {
        description: "Create 50 files",
        condition: { type: "counter", counter: "files_created", threshold: 50 },
      },
      {
        description: "Pass 150 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 150 },
      },
      {
        description: "Earn the Flow Badge",
        condition: { type: "badge", badge: "flow" },
      },
      {
        description: "Catch 50 unique Pokemon",
        condition: { type: "pokedex", minCaught: 50 },
      },
    ],
  },

  // ── Groudon (#383) — "The Continent Builder" ────────────
  {
    pokemonId: 383,
    name: "The Continent Builder",
    steps: [
      {
        description: "Edit 200 files",
        condition: { type: "counter", counter: "files_edited", threshold: 200 },
      },
      {
        description: "Build successfully 75 times",
        condition: { type: "counter", counter: "builds_succeeded", threshold: 75 },
      },
      {
        description: "Fix 75 bugs",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 75 },
      },
      {
        description: "Code for 45 days (weekends off OK)",
        condition: { type: "streak", minDays: 45 },
      },
    ],
  },

  // ── Rayquaza (#384) — "The Sky Sovereign" ───────────────
  {
    pokemonId: 384,
    name: "The Sky Sovereign",
    steps: [
      {
        description: "Catch both Kyogre and Groudon",
        condition: { type: "pokedex", minCaught: 60 },
      },
      {
        description: "Make 200 commits",
        condition: { type: "counter", counter: "commits", threshold: 200 },
      },
      {
        description: "Reach level 45 on any Pokemon",
        condition: { type: "level", minLevel: 45 },
      },
      {
        description: "Code for 90 days (weekends off OK)",
        condition: { type: "streak", minDays: 90 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GEN 4 — Sinnoh Legends
  // ═══════════════════════════════════════════════════════════

  // ── Dialga (#483) — "The Temporal Coder" ────────────────
  {
    pokemonId: 483,
    name: "The Temporal Coder",
    steps: [
      {
        description: "Code for 30 days (weekends off OK)",
        condition: { type: "streak", minDays: 30 },
      },
      {
        description: "Make 150 commits",
        condition: { type: "counter", counter: "commits", threshold: 150 },
      },
      {
        description: "Catch 60 unique Pokemon",
        condition: { type: "pokedex", minCaught: 60 },
      },
      {
        description: "Earn the Spark Badge",
        condition: { type: "badge", badge: "spark" },
      },
    ],
  },

  // ── Palkia (#484) — "The Spatial Engineer" ──────────────
  {
    pokemonId: 484,
    name: "The Spatial Engineer",
    steps: [
      {
        description: "Create 75 files",
        condition: { type: "counter", counter: "files_created", threshold: 75 },
      },
      {
        description: "Edit 300 files",
        condition: { type: "counter", counter: "files_edited", threshold: 300 },
      },
      {
        description: "Pass 300 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 300 },
      },
      {
        description: "Code for 60 days (weekends off OK)",
        condition: { type: "streak", minDays: 60 },
      },
    ],
  },

  // ── Giratina (#487) — "The Shadow Refactorer" ───────────
  {
    pokemonId: 487,
    name: "The Shadow Refactorer",
    steps: [
      {
        description: "Catch both Dialga and Palkia",
        condition: { type: "pokedex", minCaught: 70 },
      },
      {
        description: "Fix 150 bugs",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 150 },
      },
      {
        description: "Perform 50 lint fixes",
        condition: { type: "counter", counter: "lint_fixes", threshold: 50 },
      },
      {
        description: "Code for 90 days (weekends off OK)",
        condition: { type: "streak", minDays: 90 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GEN 5 — Unova Legends
  // ═══════════════════════════════════════════════════════════

  // ── Reshiram (#643) — "The Flame of Truth" ──────────────
  {
    pokemonId: 643,
    name: "The Flame of Truth",
    steps: [
      {
        description: "Write 30 test files",
        condition: { type: "counter", counter: "tests_written", threshold: 30 },
      },
      {
        description: "Pass 250 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 250 },
      },
      {
        description: "Reach level 40 on any Pokemon",
        condition: { type: "level", minLevel: 40 },
      },
      {
        description: "Code for 60 days (weekends off OK)",
        condition: { type: "streak", minDays: 60 },
      },
    ],
  },

  // ── Zekrom (#644) — "The Bolt of Ideals" ────────────────
  {
    pokemonId: 644,
    name: "The Bolt of Ideals",
    steps: [
      {
        description: "Make 200 commits",
        condition: { type: "counter", counter: "commits", threshold: 200 },
      },
      {
        description: "Build successfully 100 times",
        condition: { type: "counter", counter: "builds_succeeded", threshold: 100 },
      },
      {
        description: "Catch 80 unique Pokemon",
        condition: { type: "pokedex", minCaught: 80 },
      },
      {
        description: "Code for 60 days (weekends off OK)",
        condition: { type: "streak", minDays: 60 },
      },
    ],
  },

  // ── Kyurem (#646) — "The Frozen Merger" ─────────────────
  {
    pokemonId: 646,
    name: "The Frozen Merger",
    steps: [
      {
        description: "Catch both Reshiram and Zekrom",
        condition: { type: "pokedex", minCaught: 90 },
      },
      {
        description: "Earn the Lunar Badge",
        condition: { type: "badge", badge: "lunar" },
      },
      {
        description: "Reach level 50 on any Pokemon",
        condition: { type: "level", minLevel: 50 },
      },
      {
        description: "Code for 120 days (weekends off OK)",
        condition: { type: "streak", minDays: 120 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GEN 6 — Kalos Legends
  // ═══════════════════════════════════════════════════════════

  // ── Xerneas (#716) — "The Tree of Life" ─────────────────
  {
    pokemonId: 716,
    name: "The Tree of Life",
    steps: [
      {
        description: "Create 100 files",
        condition: { type: "counter", counter: "files_created", threshold: 100 },
      },
      {
        description: "Earn the Growth Badge",
        condition: { type: "badge", badge: "growth" },
      },
      {
        description: "Catch 70 unique Pokemon",
        condition: { type: "pokedex", minCaught: 70 },
      },
      {
        description: "Code for 75 days (weekends off OK)",
        condition: { type: "streak", minDays: 75 },
      },
    ],
  },

  // ── Yveltal (#717) — "The Destruction Debugger" ─────────
  {
    pokemonId: 717,
    name: "The Destruction Debugger",
    steps: [
      {
        description: "Fix 100 bugs",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 100 },
      },
      {
        description: "Pass 400 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 400 },
      },
      {
        description: "Make 250 commits",
        condition: { type: "counter", counter: "commits", threshold: 250 },
      },
      {
        description: "Code for 75 days (weekends off OK)",
        condition: { type: "streak", minDays: 75 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GEN 7 — Alola Legends
  // ═══════════════════════════════════════════════════════════

  // ── Solgaleo (#791) — "The Sunlit Deployer" ─────────────
  {
    pokemonId: 791,
    name: "The Sunlit Deployer",
    steps: [
      {
        description: "Build successfully 100 times",
        condition: { type: "counter", counter: "builds_succeeded", threshold: 100 },
      },
      {
        description: "Make 300 commits",
        condition: { type: "counter", counter: "commits", threshold: 300 },
      },
      {
        description: "Catch 100 unique Pokemon",
        condition: { type: "pokedex", minCaught: 100 },
      },
      {
        description: "Code for 90 days (weekends off OK)",
        condition: { type: "streak", minDays: 90 },
      },
    ],
  },

  // ── Lunala (#792) — "The Moonlit Reviewer" ──────────────
  {
    pokemonId: 792,
    name: "The Moonlit Reviewer",
    steps: [
      {
        description: "Perform 1000 searches",
        condition: { type: "counter", counter: "searches", threshold: 1000 },
      },
      {
        description: "Write 50 test files",
        condition: { type: "counter", counter: "tests_written", threshold: 50 },
      },
      {
        description: "Reach level 50 on any Pokemon",
        condition: { type: "level", minLevel: 50 },
      },
      {
        description: "Code for 90 days (weekends off OK)",
        condition: { type: "streak", minDays: 90 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GEN 8 — Galar Legends
  // ═══════════════════════════════════════════════════════════

  // ── Zacian (#888) — "The Crowned Shipper" ───────────────
  {
    pokemonId: 888,
    name: "The Crowned Shipper",
    steps: [
      {
        description: "Make 250 commits",
        condition: { type: "counter", counter: "commits", threshold: 250 },
      },
      {
        description: "Build successfully 150 times",
        condition: { type: "counter", counter: "builds_succeeded", threshold: 150 },
      },
      {
        description: "Catch 120 unique Pokemon",
        condition: { type: "pokedex", minCaught: 120 },
      },
      {
        description: "Code for 120 days (weekends off OK)",
        condition: { type: "streak", minDays: 120 },
      },
    ],
  },

  // ── Zamazenta (#889) — "The Shield of Stability" ────────
  {
    pokemonId: 889,
    name: "The Shield of Stability",
    steps: [
      {
        description: "Pass 500 tests",
        condition: { type: "counter", counter: "tests_passed", threshold: 500 },
      },
      {
        description: "Fix 200 bugs",
        condition: { type: "counter", counter: "bugs_fixed", threshold: 200 },
      },
      {
        description: "Edit 500 files",
        condition: { type: "counter", counter: "files_edited", threshold: 500 },
      },
      {
        description: "Code for 120 days (weekends off OK)",
        condition: { type: "streak", minDays: 120 },
      },
    ],
  },
];

// ── Quest Progress ───────────────────────────────────────────

/** IDs of Water and Ice type Pokemon (all gens, not just Gen 1). */
function isWaterOrIceType(pokemonId: number): boolean {
  const pokemon = POKEMON_BY_ID.get(pokemonId);
  if (!pokemon) return false;
  return pokemon.types.some((t) => t === "Water" || t === "Ice");
}

/** Legendary bird Pokedex IDs. */
const LEGENDARY_BIRD_IDS: readonly number[] = [144, 145, 146];

/** Mewtwo Pokedex ID. */
const MEWTWO_ID = 150;

/** Kyogre and Groudon IDs. */
const KYOGRE_ID = 382;
const GROUDON_ID = 383;

/** Dialga and Palkia IDs. */
const DIALGA_ID = 483;
const PALKIA_ID = 484;

/** Reshiram and Zekrom IDs. */
const RESHIRAM_ID = 643;
const ZEKROM_ID = 644;

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
        break;
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

function isStepComplete(
  questPokemonId: number,
  stepDescription: string,
  condition: AchievementCondition,
  state: PlayerState,
): boolean {
  // Articuno step 2: catch 3 Water/Ice type Pokemon
  if (questPokemonId === 144 && stepDescription.includes("Water or Ice")) {
    return countCaughtByType(state, isWaterOrIceType) >= 3;
  }

  // Mew step 2: catch all 3 legendary birds
  if (questPokemonId === 151 && stepDescription.includes("legendary birds")) {
    return LEGENDARY_BIRD_IDS.every((id) => isPokemonCaught(state, id));
  }

  // Mew step 3: catch Mewtwo
  if (questPokemonId === 151 && stepDescription.includes("Mewtwo")) {
    return isPokemonCaught(state, MEWTWO_ID);
  }

  // Rayquaza step 1: catch both Kyogre and Groudon
  if (questPokemonId === 384 && stepDescription.includes("Kyogre and Groudon")) {
    return isPokemonCaught(state, KYOGRE_ID) && isPokemonCaught(state, GROUDON_ID);
  }

  // Giratina step 1: catch both Dialga and Palkia
  if (questPokemonId === 487 && stepDescription.includes("Dialga and Palkia")) {
    return isPokemonCaught(state, DIALGA_ID) && isPokemonCaught(state, PALKIA_ID);
  }

  // Kyurem step 1: catch both Reshiram and Zekrom
  if (questPokemonId === 646 && stepDescription.includes("Reshiram and Zekrom")) {
    return isPokemonCaught(state, RESHIRAM_ID) && isPokemonCaught(state, ZEKROM_ID);
  }

  // Default: delegate to the standard condition checker.
  return isConditionMet(condition, state);
}

function isPokemonCaught(state: PlayerState, pokemonId: number): boolean {
  const entry = state.pokedex.entries[pokemonId];
  return entry !== undefined && entry.caught;
}

function countCaughtByType(state: PlayerState, typePredicate: (id: number) => boolean): number {
  let count = 0;
  for (const [idStr, entry] of Object.entries(state.pokedex.entries)) {
    if (entry.caught && typePredicate(Number(idStr))) {
      count++;
    }
  }
  return count;
}
