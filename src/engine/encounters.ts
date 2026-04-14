/**
 * Wild encounter system.
 * Pokemon appear based on coding activity type, streak bonuses,
 * tool diversity, and time-of-day biases. Catch eligibility is
 * determined by the active Pokemon's stats and level.
 */

import type {
  XpEventType,
  PokemonType,
  PlayerState,
  WildEncounter,
  OwnedPokemon,
  CatchCondition,
  CodingStat,
  RarityTier,
} from "./types.js";
import { ENCOUNTER_THRESHOLDS } from "./constants.js";
import type { EncounterSpeed } from "./constants.js";
import { POKEMON_BY_ID } from "./pokemon-data.js";
import { TYPE_POOLS } from "./encounter-pool.js";

// ── Activity to Pokemon Type Mapping ──────────────────────────

const ENCOUNTER_TYPE_MAP: Readonly<Record<XpEventType, readonly PokemonType[]>> = {
  commit: ["Normal", "Flying"],
  test_pass: ["Fighting", "Normal"],
  test_written: ["Fighting", "Normal"],
  build_success: ["Fire", "Rock"],
  bug_fix: ["Bug", "Poison"],
  lint_fix: ["Bug", "Poison"],
  file_create: ["Normal", "Ground"],
  file_edit: ["Normal", "Ground"],
  search: ["Flying", "Ground"],
  large_refactor: ["Psychic", "Dragon"],
  session_start: ["Grass", "Fairy"],
  daily_streak: ["Water", "Electric"],
  pet: ["Normal", "Fairy"],
};

/** Maps an XP event type to the Pokemon types that can appear. */
export function getEncounterTypes(eventType: XpEventType): readonly PokemonType[] {
  return ENCOUNTER_TYPE_MAP[eventType];
}

// ── Encounter Context ─────────────────────────────────────────

export interface EncounterContext {
  xpSinceLastEncounter: number;
  encounterSpeed: EncounterSpeed;
  currentStreak: number;
  recentToolTypes: string[]; // tool types used recently
  currentHour: number; // 0-23
}

// ── Encounter Trigger ─────────────────────────────────────────

/**
 * Check if a wild encounter should trigger based on XP earned,
 * encounter speed setting, and streak bonus.
 * Streak bonus: 7+ day streak halves the threshold.
 */
export function shouldTriggerEncounter(ctx: EncounterContext): boolean {
  const threshold = ENCOUNTER_THRESHOLDS[ctx.encounterSpeed];

  // Streak bonus: 7+ day streak = halve the threshold
  const streakMultiplier = ctx.currentStreak >= 7 ? 0.5 : 1;
  const effectiveThreshold = Math.floor(threshold * streakMultiplier);

  if (ctx.xpSinceLastEncounter < effectiveThreshold) return false;

  return true;
}

/** Check for bonus encounter (10% chance after a regular encounter). */
export function shouldBonusEncounter(): boolean {
  return Math.random() < 0.1;
}

/** Check for activity diversity bonus (3+ unique tool types in recent history). */
export function shouldDiversityBonus(recentToolTypes: string[]): boolean {
  const uniqueTypes = new Set(recentToolTypes);
  return uniqueTypes.size >= 3;
}

// ── Time-of-Day Bias ──────────────────────────────────────────

/** Get time-of-day type biases for encounter generation. */
export function getTimeOfDayBias(hour: number): PokemonType[] {
  if (hour >= 22 || hour < 5) return ["Ghost", "Dark"]; // Night: Ghost/Dark types
  if (hour >= 5 && hour < 9) return ["Grass", "Fairy"]; // Morning: Grass/Fairy types
  if (hour >= 12 && hour < 14) return ["Fire", "Steel"]; // Midday: Fire/Steel types
  if (hour >= 17 && hour < 20) return ["Water", "Flying"]; // Evening: Water types
  return []; // No bias
}

// ── Rarity Weights ────────────────────────────────────────────

/** Relative weights for rarity-based selection. Higher = more likely to appear. */
const RARITY_WEIGHTS: Readonly<Record<"common" | "uncommon" | "rare", number>> = {
  common: 70,
  uncommon: 25,
  rare: 5,
};

// ── Catch Condition Mapping ───────────────────────────────────

/**
 * Stat most relevant to each Pokemon type for catch condition evaluation.
 * Used for uncommon+ encounters to determine the required stat.
 */
const TYPE_TO_STAT: Readonly<Record<PokemonType, CodingStat>> = {
  Normal: "velocity",
  Fire: "debugging",
  Water: "stability",
  Electric: "velocity",
  Grass: "stamina",
  Ice: "stability",
  Fighting: "debugging",
  Poison: "debugging",
  Ground: "stability",
  Flying: "velocity",
  Psychic: "wisdom",
  Bug: "debugging",
  Rock: "stability",
  Ghost: "wisdom",
  Dragon: "wisdom",
  Steel: "stability",
  Dark: "debugging",
  Fairy: "wisdom",
};

/** Minimum stat thresholds by rarity tier. */
const RARITY_STAT_THRESHOLD: Readonly<Record<RarityTier, number>> = {
  common: 0,
  uncommon: 20,
  rare: 40,
  legendary: 60,
  mythical: 80,
};

/** Minimum Pokemon level required to catch by rarity tier. */
const RARITY_LEVEL_THRESHOLD: Readonly<Record<RarityTier, number>> = {
  common: 1,
  uncommon: 10,
  rare: 25,
  legendary: 50,
  mythical: 75,
};

// ── Catch Condition ───────────────────────────────────────────

/** Get the catch condition for a Pokemon based on its rarity. */
export function getCatchCondition(pokemonId: number): CatchCondition {
  const pokemon = POKEMON_BY_ID.get(pokemonId);
  if (!pokemon) {
    return { requiredStat: null, minStatValue: 0, requiredLevel: 1 };
  }

  const rarity = pokemon.rarity;
  const requiredLevel = RARITY_LEVEL_THRESHOLD[rarity];
  const minStatValue = RARITY_STAT_THRESHOLD[rarity];

  // Common Pokemon have no stat requirement
  if (rarity === "common") {
    return { requiredStat: null, minStatValue: 0, requiredLevel };
  }

  // Use the primary type to determine which stat is required
  const primaryType = pokemon.types[0];
  const requiredStat = TYPE_TO_STAT[primaryType];

  return { requiredStat, minStatValue, requiredLevel };
}

// ── Encounter Generation ──────────────────────────────────────

/**
 * Collect all candidate Pokemon IDs for a set of types, respecting
 * ownership rules and rarity constraints.
 */
function buildCandidatePool(
  types: readonly PokemonType[],
  state: PlayerState,
): { id: number; weight: number }[] {
  const candidates: { id: number; weight: number }[] = [];
  const seen = new Set<number>();

  // Determine the player's starter Pokemon ID
  const starterPokemon = [...state.party, ...state.pcBox].find((p) => p.isStarter);
  const starterPokemonId = starterPokemon?.pokemonId ?? -1;

  // Set of already-caught Pokemon IDs (for duplicate filtering)
  const caughtIds = new Set<number>();
  for (const [idStr, entry] of Object.entries(state.pokedex.entries)) {
    if (entry.caught) {
      caughtIds.add(Number(idStr));
    }
  }

  for (const pokemonType of types) {
    const pool = TYPE_POOLS.get(pokemonType);
    if (!pool) continue;

    for (const rarity of ["common", "uncommon", "rare"] as const) {
      const ids = pool[rarity];
      const weight = RARITY_WEIGHTS[rarity];

      for (const id of ids) {
        // Skip if already added from another type overlap
        if (seen.has(id)) continue;
        seen.add(id);

        // Exclude the player's starter from wild encounters
        if (id === starterPokemonId) continue;

        // Common Pokemon: always available, duplicates allowed
        // Uncommon+: skip if already caught
        if (rarity !== "common" && caughtIds.has(id)) continue;

        candidates.push({ id, weight });
      }
    }
  }

  return candidates;
}

/**
 * Deterministic pseudo-random number generator seeded by the current second.
 * Uses a simple mulberry32 approach for reproducibility within the same second.
 */
function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Select a Pokemon ID from the weighted candidate pool using a deterministic seed.
 * Returns null if the pool is empty.
 */
function weightedSelect(
  candidates: readonly { id: number; weight: number }[],
  seed: number,
): number | null {
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  const roll = seededRandom(seed) * totalWeight;

  let cumulative = 0;
  for (const candidate of candidates) {
    cumulative += candidate.weight;
    if (roll < cumulative) {
      return candidate.id;
    }
  }

  // Fallback to last candidate (floating-point edge case)
  return candidates[candidates.length - 1]!.id;
}

/**
 * Determine the level of a wild encounter Pokemon.
 * Scales with the player's strongest Pokemon level, with some variance.
 */
function determineEncounterLevel(state: PlayerState, seed: number): number {
  const allPokemon = [...state.party, ...state.pcBox];
  const maxLevel = allPokemon.reduce((max, p) => Math.max(max, p.level), 1);

  // Wild Pokemon appear at 60-100% of the player's max level, minimum 2
  const minLevel = Math.max(2, Math.floor(maxLevel * 0.6));
  const range = Math.max(1, maxLevel - minLevel + 1);
  const level = minLevel + Math.floor(seededRandom(seed + 7) * range);

  return Math.min(level, 100);
}

/**
 * Generate a wild encounter based on the activity type.
 * Picks a Pokemon from the matching type pool, weighted by rarity.
 * If time-of-day bias types are provided, there is a 40% chance to
 * use those types instead of the activity-based types.
 * Excludes Pokemon already in the player's party/box (unless common tier).
 * Returns null if no eligible Pokemon found.
 */
export function generateEncounter(
  eventType: XpEventType,
  state: PlayerState,
  timeOfDayTypes?: readonly PokemonType[],
): WildEncounter | null {
  let types = getEncounterTypes(eventType);

  // 40% chance to use time-of-day biased types if available
  if (timeOfDayTypes && timeOfDayTypes.length > 0) {
    const seed = Math.floor(Date.now() / 1000);
    const biasRoll = seededRandom(seed + 42);
    if (biasRoll < 0.4) {
      types = timeOfDayTypes;
    }
  }

  const candidates = buildCandidatePool(types, state);

  if (candidates.length === 0) return null;

  const seed = Math.floor(Date.now() / 1000);
  const pokemonId = weightedSelect(candidates, seed);

  if (pokemonId === null) return null;

  const level = determineEncounterLevel(state, seed);
  const catchCondition = getCatchCondition(pokemonId);

  return { pokemonId, level, catchCondition };
}

// ── Catch Evaluation ──────────────────────────────────────────

/**
 * Check if the active Pokemon can catch the encountered Pokemon.
 * Based on catch rate, required stats, and level.
 */
export function canCatch(
  encounter: WildEncounter,
  activePokemon: OwnedPokemon,
): { success: boolean; reason: string } {
  const pokemon = POKEMON_BY_ID.get(encounter.pokemonId);
  if (!pokemon) {
    return { success: false, reason: "Unknown Pokemon" };
  }

  const { requiredStat, minStatValue, requiredLevel } = encounter.catchCondition;

  // Check level requirement
  if (activePokemon.level < requiredLevel) {
    return {
      success: false,
      reason: `Need level ${requiredLevel} to catch ${pokemon.rarity} Pokemon (currently level ${activePokemon.level})`,
    };
  }

  // Check stat requirement
  if (requiredStat !== null) {
    const currentStat = activePokemon.codingStats[requiredStat];
    if (currentStat < minStatValue) {
      const primaryType = pokemon.types[0];
      return {
        success: false,
        reason: `Need ${requiredStat.toUpperCase()} at ${minStatValue} to catch ${primaryType} types (currently ${currentStat})`,
      };
    }
  }

  // Requirements met — roll against catch rate
  const seed = Math.floor(Date.now() / 1000);
  const roll = seededRandom(seed + encounter.pokemonId) * 255;
  const success = pokemon.catchRate > roll;

  if (success) {
    return { success: true, reason: `Caught ${pokemon.name}!` };
  }

  return { success: false, reason: `${pokemon.name} broke free!` };
}
