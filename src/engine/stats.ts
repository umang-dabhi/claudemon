/**
 * Coding stat system for Claudemon.
 * Maps Gen 1 base stats to coding-themed stats with display utilities.
 */

import type { BaseStats, CodingStats, CodingStat, OwnedPokemon } from "./types.js";
import { BASE_STAT_TO_CODING } from "./types.js";
import { TRAINER_TITLES } from "./constants.js";

/** Filled portion of stat bar (ASCII-safe for MCP text output) */
const BLOCK_FILLED = "#";

/** Empty portion of stat bar (ASCII-safe for MCP text output) */
const BLOCK_EMPTY = "-";

/**
 * Create initial coding stats from a pokemon's base stats.
 * Scaled to ~50% of base value since starters begin at level 5.
 * @param baseStats - The species' base stat block
 * @returns Initial coding stats for a newly caught pokemon
 */
export function initCodingStats(baseStats: BaseStats): CodingStats {
  const stats: CodingStats = {
    stamina: 0,
    debugging: 0,
    stability: 0,
    velocity: 0,
    wisdom: 0,
  };

  for (const [baseStat, codingStat] of Object.entries(BASE_STAT_TO_CODING) as Array<
    [keyof BaseStats, CodingStat]
  >) {
    stats[codingStat] = Math.floor(baseStats[baseStat] * 0.5);
  }

  return stats;
}

/**
 * Calculate the effective display value of a coding stat.
 * Formula: floor(baseStat * (0.5 + level/200)) + activityBonus
 * @param baseStat - The species' base stat value
 * @param level - The pokemon's current level
 * @param activityBonus - Accumulated bonus from coding activity
 * @returns The effective stat value for display
 */
export function calculateDisplayStat(
  baseStat: number,
  level: number,
  activityBonus: number,
): number {
  return Math.floor(baseStat * (0.5 + level / 200)) + activityBonus;
}

/**
 * Increment a coding stat's activity bonus on an owned pokemon. Mutates in place.
 * @param pokemon - The owned pokemon instance to boost
 * @param stat - Which coding stat to boost
 * @param amount - How much to add to the stat
 */
export function applyStatBoost(pokemon: OwnedPokemon, stat: CodingStat, amount: number): void {
  pokemon.codingStats[stat] += amount;
}

/**
 * Render an ASCII progress bar for a stat value.
 * Uses '#' and '-' for MCP text output compatibility.
 * @param value - Stat value (0-100 range)
 * @param maxWidth - Character width of the bar (default 10)
 * @returns ASCII bar string like "######----"
 */
export function renderStatBar(value: number, maxWidth: number = 10): string {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = Math.round((clamped / 100) * maxWidth);
  const empty = maxWidth - filled;
  return BLOCK_FILLED.repeat(filled) + BLOCK_EMPTY.repeat(empty);
}

/**
 * Get the trainer title based on highest pokemon level.
 * @param highestLevel - The highest level among the trainer's pokemon
 * @returns The trainer's title string
 */
export function getTrainerTitle(highestLevel: number): string {
  // Titles are sorted ascending by minLevel; find the last one that qualifies
  let title = "Bug Catcher"; // Fallback for level 0

  for (const entry of TRAINER_TITLES) {
    if (highestLevel >= entry.minLevel) {
      title = entry.title;
    } else {
      break;
    }
  }

  return title;
}
