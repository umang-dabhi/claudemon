/**
 * Milestone discovery definitions for Claudemon.
 * Specific Pokemon appear when coding counters reach defined thresholds.
 * Check these after every counter increment.
 */

import type { EventCounterKey } from "../engine/types.js";

// ── Milestone Types ──────────────────────────────────────────

export interface MilestoneDiscovery {
  readonly pokemonId: number;
  readonly counter: EventCounterKey;
  readonly threshold: number;
  readonly message: string;
}

// ── Milestone Definitions ────────────────────────────────────

export const MILESTONES: readonly MilestoneDiscovery[] = [
  {
    pokemonId: 16, // Pidgey
    counter: "commits",
    threshold: 1,
    message: "Every journey starts with a first step!",
  },
  {
    pokemonId: 66, // Machop
    counter: "tests_passed",
    threshold: 10,
    message: "Your code is getting stronger!",
  },
  {
    pokemonId: 74, // Geodude
    counter: "builds_succeeded",
    threshold: 1,
    message: "Solid foundations!",
  },
  {
    pokemonId: 63, // Abra
    counter: "commits",
    threshold: 50,
    message: "You're getting quick!",
  },
  {
    pokemonId: 89, // Muk
    counter: "bugs_fixed",
    threshold: 100,
    message: "You've seen some ugly code...",
  },
  {
    pokemonId: 129, // Magikarp
    counter: "commits",
    threshold: 200,
    message: "Humble beginnings... just wait",
  },
  {
    pokemonId: 137, // Porygon
    counter: "tests_written",
    threshold: 100,
    message: "A digital creation for a digital creator!",
  },
  {
    pokemonId: 143, // Snorlax
    counter: "files_edited",
    threshold: 500,
    message: "All that hard work... time for a nap?",
  },
];

// ── Milestone Checker ────────────────────────────────────────

/**
 * Return milestones whose thresholds are met but whose Pokemon
 * have not yet been caught (not in the provided pokedex set).
 */
export function checkNewMilestones(
  counters: Record<string, number>,
  caughtPokemonIds: Set<number>,
): MilestoneDiscovery[] {
  return MILESTONES.filter(
    (milestone) =>
      !caughtPokemonIds.has(milestone.pokemonId) &&
      (counters[milestone.counter] ?? 0) >= milestone.threshold,
  );
}
