/**
 * Wild encounter system.
 * 100% random encounters with Pokedex-aware smart weighting.
 * No activity-type or time-of-day bias — any Pokemon can appear anytime.
 * Unseen types, gens, and species are boosted to fill the Pokedex faster.
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
import { POKEMON_TYPES } from "./types.js";
import { ENCOUNTER_THRESHOLDS } from "./constants.js";
import type { EncounterSpeed } from "./constants.js";
import { POKEMON_BY_ID } from "./pokemon-data.js";
import { ALL_WILD_POOL, getGeneration, GEN_RANGES } from "./encounter-pool.js";

// ── Encounter Context ─────────────────────────────────────────

export interface EncounterContext {
  xpSinceLastEncounter: number;
  encounterSpeed: EncounterSpeed;
  currentStreak: number;
  recentToolTypes: string[];
  currentHour: number;
}

// ── Encounter Trigger ─────────────────────────────────────────

/**
 * Check if a wild encounter should trigger based on XP earned,
 * encounter speed setting, and streak bonus.
 * Streak bonus: 7+ day streak halves the threshold.
 */
export function shouldTriggerEncounter(ctx: EncounterContext): boolean {
  const threshold = ENCOUNTER_THRESHOLDS[ctx.encounterSpeed];
  const streakMultiplier = ctx.currentStreak >= 7 ? 0.5 : 1;
  const effectiveThreshold = Math.floor(threshold * streakMultiplier);

  return ctx.xpSinceLastEncounter >= effectiveThreshold;
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

// ── Rarity Weights ────────────────────────────────────────────

const RARITY_WEIGHTS: Readonly<Record<"common" | "uncommon" | "rare", number>> = {
  common: 70,
  uncommon: 25,
  rare: 5,
};

// ── Catch Condition Mapping ───────────────────────────────────

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

const RARITY_STAT_THRESHOLD: Readonly<Record<RarityTier, number>> = {
  common: 0,
  uncommon: 20,
  rare: 40,
  legendary: 60,
  mythical: 80,
};

const RARITY_LEVEL_THRESHOLD: Readonly<Record<RarityTier, number>> = {
  common: 1,
  uncommon: 10,
  rare: 25,
  legendary: 50,
  mythical: 75,
};

// ── Catch Condition ───────────────────────────────────────────

export function getCatchCondition(pokemonId: number): CatchCondition {
  const pokemon = POKEMON_BY_ID.get(pokemonId);
  if (!pokemon) {
    return { requiredStat: null, minStatValue: 0, requiredLevel: 1 };
  }

  const rarity = pokemon.rarity;
  const requiredLevel = RARITY_LEVEL_THRESHOLD[rarity];
  const minStatValue = RARITY_STAT_THRESHOLD[rarity];

  if (rarity === "common") {
    return { requiredStat: null, minStatValue: 0, requiredLevel };
  }

  const primaryType = pokemon.types[0];
  const requiredStat = TYPE_TO_STAT[primaryType];

  return { requiredStat, minStatValue, requiredLevel };
}

// ── Pokedex Analysis ──────────────────────────────────────────

/** Count how many caught Pokemon the player has of each type. */
function getTypeCounts(state: PlayerState): Map<PokemonType, number> {
  const counts = new Map<PokemonType, number>();
  for (const t of POKEMON_TYPES) counts.set(t, 0);

  for (const [idStr, entry] of Object.entries(state.pokedex.entries)) {
    if (!entry.caught) continue;
    const pokemon = POKEMON_BY_ID.get(Number(idStr));
    if (!pokemon) continue;
    for (const t of pokemon.types) {
      if (t !== undefined) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return counts;
}

/** Count how many caught Pokemon the player has from each generation. */
function getGenCounts(state: PlayerState): Map<number, number> {
  const counts = new Map<number, number>();
  for (const { gen } of GEN_RANGES) counts.set(gen, 0);

  for (const [idStr, entry] of Object.entries(state.pokedex.entries)) {
    if (!entry.caught) continue;
    const gen = getGeneration(Number(idStr));
    counts.set(gen, (counts.get(gen) ?? 0) + 1);
  }
  return counts;
}

// ── Smart Candidate Pool ──────────────────────────────────────

/**
 * Build a weighted candidate pool from ALL wild-eligible Pokemon.
 * Weighting considers:
 * - Rarity (common 70, uncommon 25, rare 5)
 * - Unseen species boost (2x if not seen, 4x in early game)
 * - Type diversity (3x if player has 0 caught of this type)
 * - Gen diversity (2x if player has < 3 caught from this gen)
 * - 10% "same again" chance (pure random, no diversity boosts)
 */
function buildSmartPool(state: PlayerState): { id: number; weight: number }[] {
  const candidates: { id: number; weight: number }[] = [];

  const starterPokemon = [...state.party, ...state.pcBox].find((p) => p.isStarter);
  const starterPokemonId = starterPokemon?.pokemonId ?? -1;

  const caughtIds = new Set<number>();
  const seenIds = new Set<number>();
  for (const [idStr, entry] of Object.entries(state.pokedex.entries)) {
    const id = Number(idStr);
    if (entry.caught) caughtIds.add(id);
    if (entry.seen) seenIds.add(id);
  }

  const totalCaught = state.pokedex.totalCaught ?? 0;
  const isEarlyGame = totalCaught < 50;

  // 10% chance: pure random (no diversity boosting)
  const seed = Math.floor(Date.now() / 1000);
  const sameAgainRoll = seededRandom(seed + 99);
  const applyDiversity = sameAgainRoll >= 0.1;

  // Pre-compute diversity data only when needed
  let typeCounts: Map<PokemonType, number> | null = null;
  let genCounts: Map<number, number> | null = null;
  if (applyDiversity) {
    typeCounts = getTypeCounts(state);
    genCounts = getGenCounts(state);
  }

  for (const rarity of ["common", "uncommon", "rare"] as const) {
    const ids = ALL_WILD_POOL[rarity];
    const baseWeight = RARITY_WEIGHTS[rarity];

    for (const id of ids) {
      // Exclude starter
      if (id === starterPokemonId) continue;

      // Uncommon+: skip if already caught (one-time only)
      if (rarity !== "common" && caughtIds.has(id)) continue;

      let weight = baseWeight;

      if (applyDiversity) {
        const pokemon = POKEMON_BY_ID.get(id);
        if (pokemon) {
          // Unseen species boost
          if (!seenIds.has(id)) {
            weight *= isEarlyGame ? 4 : 2;
          }

          // Type diversity: boost types player hasn't caught much
          const primaryType = pokemon.types[0];
          const typeCount = typeCounts!.get(primaryType) ?? 0;
          if (typeCount === 0) {
            weight *= 3; // Never caught this type
          } else if (typeCount < 3) {
            weight *= 1.5; // Few of this type
          }

          // Gen diversity: boost underrepresented generations
          const gen = getGeneration(id);
          const genCount = genCounts!.get(gen) ?? 0;
          if (genCount === 0) {
            weight *= 2; // Never caught from this gen
          } else if (genCount < 3) {
            weight *= 1.3; // Few from this gen
          }
        }
      }

      candidates.push({ id, weight: Math.round(weight) });
    }
  }

  return candidates;
}

// ── PRNG ──────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

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

  return candidates[candidates.length - 1]!.id;
}

// ── Level Determination ───────────────────────────────────────

function determineEncounterLevel(state: PlayerState, seed: number): number {
  const allPokemon = [...state.party, ...state.pcBox];
  const maxLevel = allPokemon.reduce((max, p) => Math.max(max, p.level), 1);

  const minLevel = Math.max(2, Math.floor(maxLevel * 0.6));
  const range = Math.max(1, maxLevel - minLevel + 1);
  const level = minLevel + Math.floor(seededRandom(seed + 7) * range);

  return Math.min(level, 100);
}

// ── Encounter Generation ──────────────────────────────────────

/**
 * Generate a wild encounter — 100% random with Pokedex-aware weighting.
 * No activity-type or time-of-day bias. Any Pokemon can appear anytime.
 * Unseen types, gens, and species are boosted to fill the Pokedex faster.
 *
 * The eventType parameter is kept for API compatibility but is not used
 * for type selection.
 */
export function generateEncounter(
  _eventType: XpEventType,
  state: PlayerState,
  _timeOfDayTypes?: readonly PokemonType[],
): WildEncounter | null {
  const candidates = buildSmartPool(state);

  if (candidates.length === 0) return null;

  const seed = Math.floor(Date.now() / 1000);
  const pokemonId = weightedSelect(candidates, seed);

  if (pokemonId === null) return null;

  const level = determineEncounterLevel(state, seed);
  const catchCondition = getCatchCondition(pokemonId);

  return { pokemonId, level, catchCondition };
}

// ── Catch Evaluation ──────────────────────────────────────────

export function canCatch(
  encounter: WildEncounter,
  activePokemon: OwnedPokemon,
): { success: boolean; reason: string } {
  const pokemon = POKEMON_BY_ID.get(encounter.pokemonId);
  if (!pokemon) {
    return { success: false, reason: "Unknown Pokemon" };
  }

  const { requiredStat, minStatValue, requiredLevel } = encounter.catchCondition;

  if (activePokemon.level < requiredLevel) {
    return {
      success: false,
      reason: `Need level ${requiredLevel} to catch ${pokemon.rarity} Pokemon (currently level ${activePokemon.level})`,
    };
  }

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

  const seed = Math.floor(Date.now() / 1000);
  const roll = seededRandom(seed + encounter.pokemonId) * 255;
  const success = pokemon.catchRate > roll;

  if (success) {
    return { success: true, reason: `Caught ${pokemon.name}!` };
  }

  return { success: false, reason: `${pokemon.name} broke free!` };
}
