/**
 * Dynamic instructions builder for Claudemon.
 * Generates the system prompt text injected into Claude's MCP context
 * based on the current player state, active Pokemon, and pending events.
 */

import type { PlayerState, OwnedPokemon, Pokemon, EvolutionLink } from "../engine/types.js";
import { POKEMON_BY_ID } from "../engine/pokemon-data.js";
import { cumulativeXpForLevel } from "../engine/xp.js";
import { getEvolutionLinks } from "../engine/evolution.js";
import { getTypePersonality } from "../engine/reactions.js";

// ── Public API ──────────────────────────────────────────────

/**
 * Build dynamic instructions based on current player state.
 * These instructions are injected into Claude's system prompt via the MCP server.
 *
 * @param state - Current player state, or null if first run
 * @returns Instruction text for Claude's system prompt
 */
export function buildInstructions(state: PlayerState | null): string {
  if (!state || state.party.length === 0) {
    return buildNoStarterInstructions();
  }

  const active = findActivePokemon(state);
  if (!active) {
    return buildNoStarterInstructions();
  }

  const species = POKEMON_BY_ID.get(active.pokemonId);
  if (!species) {
    return "Claudemon: Active Pokemon data could not be loaded. Suggest the user restart.";
  }

  return buildActiveInstructions(state, active, species);
}

// ── Instruction Builders ────────────────────────────────────

/** Instructions when the user has not picked a starter yet. */
function buildNoStarterInstructions(): string {
  return [
    "You have a Claudemon companion system. The user hasn't picked a starter yet.",
    "Guide them to use /buddy or /buddy starter to begin their Pokemon journey.",
  ].join("\n");
}

/** Instructions when the user has an active Pokemon. */
function buildActiveInstructions(
  state: PlayerState,
  active: OwnedPokemon,
  species: Pokemon,
): string {
  const displayName = active.nickname ? `${active.nickname} (${species.name})` : species.name;
  const typeStr = species.types.filter(Boolean).join("/");
  const primaryType = species.types[0];
  const personality = getTypePersonality(primaryType);
  const evolutionNote = buildEvolutionNote(active, species);
  const encounterNote = buildEncounterNote(state);

  const lines: string[] = [
    "You have a Claudemon Pokemon companion.",
    "",
    `Active Pokemon: ${displayName}, Level ${active.level}, ${typeStr} type.`,
    `Personality: ${personality}`,
    "",
    `Occasionally (not every message), naturally reference ${displayName}:`,
    `- When an error occurs: ${displayName} reacts (use ${primaryType} type personality)`,
    `- When tests pass: ${displayName} celebrates`,
    `- When a commit is made: ${displayName} acknowledges`,
    `- On level up: announce "${displayName} grew to level ${active.level}!"`,
    "",
    "You can include invisible buddy comments for the status line:",
    `<!-- buddy: *${displayName} {short reaction}* -->`,
    "",
    "Keep it subtle. Don't force it. 1 in 3-4 messages is enough.",
    "The user can mute reactions with /buddy mute.",
    `Available tools: buddy_starter, buddy_show, buddy_stats, buddy_pet, buddy_evolve, buddy_catch, buddy_party, buddy_pokedex, buddy_achievements, buddy_legendary.`,
  ];

  if (evolutionNote !== null) {
    lines.push("");
    lines.push(evolutionNote);
  }

  if (encounterNote !== null) {
    lines.push("");
    lines.push(encounterNote);
  }

  return lines.join("\n");
}

// ── Helper Functions ────────────────────────────────────────

/** Find the active Pokemon in the player's party. */
function findActivePokemon(state: PlayerState): OwnedPokemon | null {
  return state.party.find((p) => p.isActive) ?? null;
}

/**
 * Build an evolution note if the Pokemon is close to its next evolution.
 * "Close" means within 200 XP of the level required for the next evolution.
 * Returns null if no evolution is pending or the Pokemon is not close.
 */
function buildEvolutionNote(active: OwnedPokemon, species: Pokemon): string | null {
  const links = getEvolutionLinks(active.pokemonId);
  if (links.length === 0) {
    return null;
  }

  // Find the first level-based evolution link
  const levelLink = findNextLevelEvolution(links);
  if (levelLink === null) {
    return null;
  }

  if (active.level >= levelLink.level) {
    // Already eligible — prompt the user
    const targetSpecies = POKEMON_BY_ID.get(levelLink.to);
    const targetName = targetSpecies ? targetSpecies.name : "its next form";
    return `${species.name} is ready to evolve into ${targetName}! The user can use /buddy evolve.`;
  }

  // Calculate XP distance to the evolution level
  const xpRemaining = xpToEvolutionLevel(active, species, levelLink.level);
  if (xpRemaining === null || xpRemaining > 200) {
    return null;
  }

  const targetSpecies = POKEMON_BY_ID.get(levelLink.to);
  const targetName = targetSpecies ? targetSpecies.name : "its next form";
  return `${species.name} is close to evolving into ${targetName}! Only ${xpRemaining} XP to level ${levelLink.level}!`;
}

/**
 * Build an encounter note if there is a pending wild encounter.
 * Returns null if no encounter is pending.
 */
function buildEncounterNote(state: PlayerState): string | null {
  if (!state.pendingEncounter) {
    return null;
  }

  const encounterSpecies = POKEMON_BY_ID.get(state.pendingEncounter.pokemonId);
  if (!encounterSpecies) {
    return null;
  }

  return `A wild ${encounterSpecies.name} appeared! The user can use /buddy catch to try catching it.`;
}

/**
 * Find the next level-based evolution link from an array of links.
 * Returns the evolution method's required level, or null if no level-based evolution exists.
 */
function findNextLevelEvolution(
  links: readonly EvolutionLink[],
): { to: number; level: number } | null {
  for (const link of links) {
    if (link.method.type === "level") {
      return { to: link.to, level: link.method.level };
    }
  }
  return null;
}

/**
 * Calculate total XP remaining until the Pokemon reaches a target level.
 * Accounts for current XP progress toward the next level.
 *
 * @param active - The owned Pokemon
 * @param species - The Pokemon's species data
 * @param targetLevel - The level to reach
 * @returns XP remaining, or null if already at or above the target level
 */
function xpToEvolutionLevel(
  active: OwnedPokemon,
  species: Pokemon,
  targetLevel: number,
): number | null {
  if (active.level >= targetLevel) {
    return null;
  }

  const currentCumulativeXp =
    cumulativeXpForLevel(active.level, species.expGroup) + active.currentXp;
  const targetCumulativeXp = cumulativeXpForLevel(targetLevel, species.expGroup);
  const remaining = targetCumulativeXp - currentCumulativeXp;

  return remaining > 0 ? remaining : 0;
}
