/**
 * XP and leveling engine for Claudemon.
 * Implements Gen 1 experience growth rate formulas.
 */

import type {
  ExpGroup,
  OwnedPokemon,
  Pokemon,
  LevelUpResult,
  XpEventType,
  XpEvent,
} from "./types.js";
import { MAX_LEVEL, XP_AWARDS } from "./constants.js";

/**
 * Total cumulative XP required to reach a given level.
 * @param level - Target level (1-100)
 * @param group - Experience growth rate group
 * @returns Cumulative XP needed to reach that level
 */
export function cumulativeXpForLevel(level: number, group: ExpGroup): number {
  const n = level;
  const n3 = n * n * n;

  switch (group) {
    case "fast":
      return Math.floor(0.8 * n3);
    case "medium_fast":
      return n3;
    case "medium_slow": {
      const raw = 1.2 * n3 - 15 * n * n + 100 * n - 140;
      return Math.max(0, Math.floor(raw));
    }
    case "slow":
      return Math.floor(1.25 * n3);
  }
}

/**
 * XP delta needed to advance from currentLevel to currentLevel + 1.
 * @param currentLevel - The pokemon's current level (1-99)
 * @param group - Experience growth rate group
 * @returns XP needed for the next level, or 0 if already at MAX_LEVEL
 */
export function xpToNextLevel(currentLevel: number, group: ExpGroup): number {
  if (currentLevel >= MAX_LEVEL) {
    return 0;
  }
  return cumulativeXpForLevel(currentLevel + 1, group) - cumulativeXpForLevel(currentLevel, group);
}

/**
 * Apply XP to an owned pokemon, handling level-ups (including multi-level).
 * Mutates the pokemon's currentXp, totalXp, and level fields.
 * @param pokemon - The owned pokemon instance to award XP to
 * @param amount - XP amount to add
 * @param pokemonData - The species data for this pokemon
 * @returns Level-up result if the pokemon leveled up, or null
 */
export function addXp(
  pokemon: OwnedPokemon,
  amount: number,
  pokemonData: Pokemon,
): LevelUpResult | null {
  if (amount <= 0 || pokemon.level >= MAX_LEVEL) {
    return null;
  }

  const previousLevel = pokemon.level;
  const group = pokemonData.expGroup;

  pokemon.totalXp += amount;
  pokemon.currentXp += amount;

  // Check for level-ups (possibly multiple from large XP gains)
  while (pokemon.level < MAX_LEVEL) {
    const xpNeeded = xpToNextLevel(pokemon.level, group);
    if (xpNeeded <= 0 || pokemon.currentXp < xpNeeded) {
      break;
    }
    pokemon.currentXp -= xpNeeded;
    pokemon.level += 1;
  }

  // Clamp at max level: any overflow XP is discarded
  if (pokemon.level >= MAX_LEVEL) {
    pokemon.currentXp = 0;
  }

  if (pokemon.level === previousLevel) {
    return null;
  }

  // TODO(phase-2): check evolution triggers and populate pendingEvolution
  return {
    previousLevel,
    newLevel: pokemon.level,
    pendingEvolution: null,
  };
}

/**
 * Calculate progress percentage toward the next level.
 * @param pokemon - The owned pokemon instance
 * @param pokemonData - The species data for this pokemon
 * @returns Percentage (0-100) of progress to next level
 */
export function xpProgressPercent(pokemon: OwnedPokemon, pokemonData: Pokemon): number {
  if (pokemon.level >= MAX_LEVEL) {
    return 100;
  }

  const needed = xpToNextLevel(pokemon.level, pokemonData.expGroup);
  if (needed <= 0) {
    return 100;
  }

  return Math.min(100, Math.floor((pokemon.currentXp / needed) * 100));
}

/**
 * Create an XP event descriptor from an event type, using constants.
 * @param type - The XP event type
 * @returns A fully populated XpEvent
 */
export function createXpEvent(type: XpEventType): XpEvent {
  const award = XP_AWARDS[type];
  return {
    type,
    xp: award.xp,
    statBoost: award.stat,
    boostAmount: award.boost,
  };
}
