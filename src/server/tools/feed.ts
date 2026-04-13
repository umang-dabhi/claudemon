/**
 * buddy_feed tool — Feed your active Pokemon to boost happiness.
 * Has a 1-hour cooldown. Returns type-flavored food reactions.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PokemonType, Pokemon } from "../../engine/types.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { MAX_HAPPINESS } from "../../engine/constants.js";
import { StateManager } from "../../state/state-manager.js";

/** Cooldown: 1 hour in milliseconds. */
const FEED_COOLDOWN_MS = 3_600_000;

/** Happiness increase per feed. */
const FEED_HAPPINESS_BOOST = 10;

/** Food reactions keyed by primary Pokemon type. */
const FEED_REACTIONS: Record<PokemonType, (name: string) => string> = {
  Normal: (n) => `*${n} enjoys a PokePuff!* \u{1F9C1}`,
  Fire: (n) => `*${n} gobbles down a Spicy Berry!* \u{1F336}\u{FE0F}`,
  Water: (n) => `*${n} slurps an Oran Berry!* \u{1F4A7}`,
  Electric: (n) => `*${n} munches a Cheri Berry!* \u{26A1}`,
  Grass: (n) => `*${n} nibbles a fresh Leaf Salad!* \u{1F33F}`,
  Ice: (n) => `*${n} crunches a Frozen Berry!* \u{2744}\u{FE0F}`,
  Fighting: (n) => `*${n} devours a Protein Shake!* \u{1F4AA}`,
  Poison: (n) => `*${n} sips a Pecha Smoothie!* \u{1F49C}`,
  Ground: (n) => `*${n} chews a Rawst Root!* \u{1F33E}`,
  Flying: (n) => `*${n} pecks at Skyberry Seeds!* \u{1F426}`,
  Psychic: (n) => `*${n} absorbs a Mind Melon!* \u{1F52E}`,
  Bug: (n) => `*${n} nibbles on Sweet Honey!* \u{1F36F}`,
  Rock: (n) => `*${n} crunches a Mineral Cookie!* \u{1FAA8}`,
  Ghost: (n) => `*${n} absorbs a Shadow Treat!* \u{1F47B}`,
  Dragon: (n) => `*${n} feasts on a Dragon Scale Fruit!* \u{1F409}`,
};

/** Get a feed reaction based on the Pokemon's primary type. */
function getFeedReaction(species: Pokemon, displayName: string): string {
  const primaryType = species.types[0];
  return FEED_REACTIONS[primaryType](displayName);
}

/** Format remaining cooldown as "Xm Ys". */
function formatCooldownRemaining(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0 && seconds > 0) {
    return `${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/** Registers the buddy_feed tool on the MCP server. */
export function registerFeedTool(server: McpServer): void {
  server.tool(
    "buddy_feed",
    "Feed your active Pokemon to boost happiness. 1-hour cooldown.",
    {},
    async () => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state || state.party.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You don't have a Pokemon yet! Use buddy_starter to pick your first companion.",
            },
          ],
        };
      }

      const active = stateManager.getActivePokemon();
      if (!active) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No active Pokemon found. Use buddy_party to set one active.",
            },
          ],
        };
      }

      const species = POKEMON_BY_ID.get(active.pokemonId);
      if (!species) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Could not find species data for Pokemon ID ${active.pokemonId}.`,
            },
          ],
          isError: true,
        };
      }

      // Check cooldown
      const now = Date.now();
      const elapsed = now - state.lastFedAt;
      if (elapsed < FEED_COOLDOWN_MS) {
        const remaining = FEED_COOLDOWN_MS - elapsed;
        return {
          content: [
            {
              type: "text" as const,
              text: `Already fed! Try again in ${formatCooldownRemaining(remaining)}.`,
            },
          ],
        };
      }

      const displayName = active.nickname ?? species.name;

      // Increase happiness (cap at MAX_HAPPINESS)
      const previousHappiness = active.happiness;
      active.happiness = Math.min(MAX_HAPPINESS, active.happiness + FEED_HAPPINESS_BOOST);

      // Set mood to happy
      state.mood = "happy";
      state.moodSetAt = now;

      // Record feed timestamp
      state.lastFedAt = now;

      // Save state and update status line
      await stateManager.save();
      await stateManager.writeStatus();

      // Build response
      const reaction = getFeedReaction(species, displayName);
      const lines: string[] = [reaction, ""];
      lines.push(`Happiness: ${previousHappiness} \u2192 ${active.happiness}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
