/**
 * Shared display helper functions used across multiple tool files.
 * Centralizes formatting logic to eliminate duplication.
 */

import type { CodingStat, BaseStats } from "../../engine/types.js";
import { BASE_STAT_TO_CODING } from "../../engine/types.js";

/** Format a Pokemon type array for display (e.g., "Fire/Flying"). */
export function formatTypes(types: readonly [string, string?]): string {
  return types.filter(Boolean).join("/");
}

/** Right-pad a string to a fixed width, truncating if needed. */
export function pad(str: string, width: number): string {
  if (str.length >= width) {
    return str.slice(0, width);
  }
  return str + " ".repeat(width - str.length);
}

/** Render a compact XP progress bar using Unicode block characters. */
export function renderXpBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "\u2588".repeat(filled) + "\u2591".repeat(empty);
}

/**
 * Inverted BASE_STAT_TO_CODING map: coding stat -> base stat key.
 * Used for stat comparison during evolution preview and Pokedex display.
 */
export const CODING_TO_BASE: Record<CodingStat, keyof BaseStats> = Object.fromEntries(
  Object.entries(BASE_STAT_TO_CODING).map(([base, coding]) => [coding, base]),
) as Record<CodingStat, keyof BaseStats>;
