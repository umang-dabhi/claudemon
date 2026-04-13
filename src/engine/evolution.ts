/**
 * Evolution engine for Claudemon.
 * Handles evolution eligibility checks, stat-based branching (Eevee),
 * badge earning, and the transformation of owned Pokemon.
 */

import type {
  EvolutionChain,
  EvolutionLink,
  EvolutionMethod,
  OwnedPokemon,
  PlayerState,
  BadgeType,
  BadgeCondition,
  CodingStat,
  CodingStats,
  BaseStats,
} from "./types.js";
import { BASE_STAT_TO_CODING } from "./types.js";
import { EVOLUTION_CHAINS } from "./evolution-data.js";
import { POKEMON_BY_ID } from "./pokemon-data.js";
import { BADGES } from "./constants.js";

// ── Eevee Branching Constants ─────────────────────────────────

/** Minimum level required for Eevee stat-based evolution. */
const EEVEE_MIN_LEVEL = 25;

/** Pokemon ID for Eevee. */
const EEVEE_ID = 133;

/** Maps a dominant coding stat to the corresponding Eeveelution ID. */
const EEVEE_STAT_MAP: Readonly<Record<string, number>> = {
  debugging: 136, // Flareon
  stability: 134, // Vaporeon
  velocity: 135, // Jolteon
} as const;

/** The three stats used for Eevee branching. */
const EEVEE_BRANCH_STATS: readonly CodingStat[] = ["debugging", "stability", "velocity"];

// ── Precomputed Lookup Index ──────────────────────────────────

/**
 * Maps every Pokemon ID that appears in an evolution chain
 * to the chain that contains it. Built once at module load.
 */
const chainByPokemonId: ReadonlyMap<number, EvolutionChain> = buildChainIndex();

function buildChainIndex(): Map<number, EvolutionChain> {
  const index = new Map<number, EvolutionChain>();
  for (const chain of EVOLUTION_CHAINS) {
    for (const link of chain.links) {
      index.set(link.from, chain);
      index.set(link.to, chain);
    }
  }
  return index;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Find the evolution chain that contains a given Pokemon.
 * Returns null if the Pokemon has no evolution chain or the chain has no links.
 */
export function findEvolutionChain(pokemonId: number): EvolutionChain | null {
  return chainByPokemonId.get(pokemonId) ?? null;
}

/**
 * Get all possible evolution links FROM a given Pokemon.
 * A Pokemon might have multiple paths (e.g., Eevee has 3).
 * Returns an empty array if there are no outgoing links.
 */
export function getEvolutionLinks(pokemonId: number): readonly EvolutionLink[] {
  const chain = findEvolutionChain(pokemonId);
  if (!chain) {
    return [];
  }
  return chain.links.filter((link) => link.from === pokemonId);
}

/**
 * Check if a Pokemon is eligible to evolve right now.
 * Evaluates the evolution method against current state.
 * Returns the first eligible EvolutionLink, or null.
 *
 * For Eevee (stat-based): returns the link matching the dominant stat.
 * If stats are tied, returns null (user must boost one stat to break the tie).
 */
export function checkEvolution(pokemon: OwnedPokemon, state: PlayerState): EvolutionLink | null {
  const links = getEvolutionLinks(pokemon.pokemonId);
  if (links.length === 0) {
    return null;
  }

  // Special handling for Eevee: stat-based branching with tie-breaking
  if (pokemon.pokemonId === EEVEE_ID) {
    return checkEeveeEvolution(pokemon, state);
  }

  // Standard path: return the first satisfied link
  for (const link of links) {
    if (isMethodSatisfied(link.method, pokemon, state)) {
      return link;
    }
  }

  return null;
}

/**
 * Check a specific evolution method against current state.
 */
function isMethodSatisfied(
  method: EvolutionMethod,
  pokemon: OwnedPokemon,
  state: PlayerState,
): boolean {
  switch (method.type) {
    case "level":
      return pokemon.level >= method.level;

    case "badge":
      return state.badges.includes(method.badge);

    case "collaboration":
      return state.counters.prs_merged >= 10;

    case "stat":
      return (
        pokemon.level >= EEVEE_MIN_LEVEL && pokemon.codingStats[method.stat] >= method.minValue
      );
  }
}

/**
 * Apply an evolution: transform the Pokemon to its new species.
 * - Updates pokemonId to the target species
 * - Recalculates coding stats with new base stats (preserves activity bonuses)
 * - Sets evolvedAt timestamp
 * - Returns the new species name and types for display
 *
 * Does not change: nickname, happiness, totalXp, currentXp, level, shiny, isStarter, id.
 */
export function applyEvolution(
  pokemon: OwnedPokemon,
  targetId: number,
): { newName: string; newTypes: readonly [string, string?] } {
  const oldSpecies = POKEMON_BY_ID.get(pokemon.pokemonId);
  const newSpecies = POKEMON_BY_ID.get(targetId);

  if (!oldSpecies) {
    throw new Error(`Unknown source Pokemon ID: ${pokemon.pokemonId}`);
  }
  if (!newSpecies) {
    throw new Error(`Unknown target Pokemon ID: ${targetId}`);
  }

  // Preserve activity bonuses: subtract old base contribution, add new base contribution
  const updatedStats = recalculateStats(
    pokemon.codingStats,
    oldSpecies.baseStats,
    newSpecies.baseStats,
  );

  pokemon.pokemonId = targetId;
  pokemon.codingStats = updatedStats;
  pokemon.evolvedAt = new Date().toISOString();

  return {
    newName: newSpecies.name,
    newTypes: newSpecies.types,
  };
}

/**
 * Get the dominant coding stat for Eevee branching.
 * Only considers debugging, stability, and velocity.
 * Returns null if there is a tie between the top stats.
 */
export function getDominantStat(stats: CodingStats): CodingStat | null {
  let maxValue = -Infinity;
  let dominant: CodingStat | null = null;
  let tied = false;

  for (const stat of EEVEE_BRANCH_STATS) {
    const value = stats[stat];
    if (value > maxValue) {
      maxValue = value;
      dominant = stat;
      tied = false;
    } else if (value === maxValue) {
      tied = true;
    }
  }

  return tied ? null : dominant;
}

/** Check if a specific badge has been earned based on player state. */
export function isBadgeEarned(badge: BadgeType, state: PlayerState): boolean {
  const badgeDef = BADGES.find((b) => b.type === badge);
  if (!badgeDef) return false;
  return isBadgeConditionMet(badgeDef.condition, state);
}

/**
 * Get all badges the player has earned but not yet collected.
 * Compares earned conditions against state.badges array.
 */
export function getNewlyEarnedBadges(state: PlayerState): BadgeType[] {
  const newBadges: BadgeType[] = [];

  for (const badgeDef of BADGES) {
    // Skip badges the player already has
    if (state.badges.includes(badgeDef.type)) {
      continue;
    }
    if (isBadgeConditionMet(badgeDef.condition, state)) {
      newBadges.push(badgeDef.type);
    }
  }

  return newBadges;
}

// ── Internal Helpers ──────────────────────────────────────────

/**
 * Eevee-specific evolution check.
 * Requires level >= 25 and a clear dominant stat (no ties).
 */
function checkEeveeEvolution(pokemon: OwnedPokemon, state: PlayerState): EvolutionLink | null {
  if (pokemon.level < EEVEE_MIN_LEVEL) {
    return null;
  }

  const dominant = getDominantStat(pokemon.codingStats);
  if (dominant === null) {
    return null;
  }

  const targetId = EEVEE_STAT_MAP[dominant];
  if (targetId === undefined) {
    return null;
  }

  // Find the matching link and verify the stat threshold is met
  const links = getEvolutionLinks(pokemon.pokemonId);
  const matchingLink = links.find((link) => link.to === targetId);
  if (!matchingLink) {
    return null;
  }

  if (isMethodSatisfied(matchingLink.method, pokemon, state)) {
    return matchingLink;
  }

  return null;
}

/**
 * Evaluate a badge condition against player state.
 */
function isBadgeConditionMet(condition: BadgeCondition, state: PlayerState): boolean {
  switch (condition.type) {
    case "counter":
      return state.counters[condition.counter] >= condition.threshold;
    case "streak":
      return state.streak.currentStreak >= condition.minDays;
  }
}

/**
 * Recalculate coding stats when evolving to a new species.
 * Extracts activity bonuses from current stats by removing the old base
 * contribution, then applies the new base contribution.
 *
 * Formula per stat:
 *   activityBonus = currentStat - floor(oldBaseStat * 0.5)
 *   newStat = floor(newBaseStat * 0.5) + activityBonus
 *
 * Activity bonuses are floored at 0 to prevent negative values.
 */
function recalculateStats(
  currentStats: CodingStats,
  oldBase: BaseStats,
  newBase: BaseStats,
): CodingStats {
  const result: CodingStats = {
    stamina: 0,
    debugging: 0,
    stability: 0,
    velocity: 0,
    wisdom: 0,
  };

  for (const [baseStat, codingStat] of Object.entries(BASE_STAT_TO_CODING) as Array<
    [keyof BaseStats, CodingStat]
  >) {
    const oldBaseContribution = Math.floor(oldBase[baseStat] * 0.5);
    const activityBonus = Math.max(0, currentStats[codingStat] - oldBaseContribution);
    const newBaseContribution = Math.floor(newBase[baseStat] * 0.5);
    result[codingStat] = newBaseContribution + activityBonus;
  }

  return result;
}
