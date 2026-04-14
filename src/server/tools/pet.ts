/**
 * buddy_pet tool — Pet your active Pokemon for a small happiness/XP boost.
 * Returns a type-flavored reaction message.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PokemonType, Pokemon, OwnedPokemon } from "../../engine/types.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { MAX_HAPPINESS } from "../../engine/constants.js";
import { addXp, createXpEvent } from "../../engine/xp.js";
import { applyStatBoost } from "../../engine/stats.js";
import { StateManager } from "../../state/state-manager.js";

/** Pet reactions keyed by primary Pokemon type. */
const PET_REACTIONS: Record<PokemonType, (name: string) => string> = {
  Normal: (n) => `*${n} nuzzles against your hand contentedly*`,
  Fire: (n) => `*${n}'s tail flame flickers happily*`,
  Water: (n) => `*${n} splashes with joy*`,
  Electric: (n) => `*${n}'s cheeks spark warmly*`,
  Grass: (n) => `*${n}'s leaves rustle with delight*`,
  Ice: (n) => `*${n} breathes a cool, contented mist*`,
  Fighting: (n) => `*${n} flexes proudly and grins*`,
  Poison: (n) => `*${n} oozes happily... you wash your hands*`,
  Ground: (n) => `*${n} stomps the ground with glee*`,
  Flying: (n) => `*${n} flutters around you in circles*`,
  Psychic: (n) => `*${n}'s eyes glow softly with gratitude*`,
  Bug: (n) => `*${n}'s antennae twitch happily*`,
  Rock: (n) => `*${n} rumbles warmly, solid as ever*`,
  Ghost: (n) => `*${n} phases through your hand... then comes back for more*`,
  Dragon: (n) => `*${n} lets out a low, pleased growl*`,
  Steel: (n) => `*${n}'s metal surface warms to your touch*`,
  Dark: (n) => `*${n} reluctantly leans into the pets... don't tell anyone*`,
  Fairy: (n) => `*${n} giggles and showers you with sparkles!*`,
};

/** Get a pet reaction based on the Pokemon's primary type. */
function getPetReaction(species: Pokemon, displayName: string): string {
  const primaryType = species.types[0];
  const reactionFn = PET_REACTIONS[primaryType];
  return reactionFn(displayName);
}

/** Registers the buddy_pet tool on the MCP server. */
export function registerPetTool(server: McpServer): void {
  server.tool(
    "buddy_pet",
    "Pet your active Pokemon to increase happiness and earn a small XP bonus.",
    {},
    async () => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state || state.party.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion -- then you can pet them!",
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
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion -- then you can pet them!",
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

      const displayName = active.nickname ?? species.name;

      // Increase happiness (cap at 255)
      const previousHappiness = active.happiness;
      active.happiness = Math.min(MAX_HAPPINESS, active.happiness + 5);

      // Award small XP via pet event
      const xpEvent = createXpEvent("pet");
      const levelUp = addXp(active, xpEvent.xp, species);

      // Apply stat boost if the event has one
      if (xpEvent.statBoost !== null && xpEvent.boostAmount > 0) {
        applyStatBoost(active, xpEvent.statBoost, xpEvent.boostAmount);
      }

      // Save state and update status line
      await stateManager.save();
      await stateManager.writeStatus();

      // Build response
      const reaction = getPetReaction(species, displayName);
      const lines: string[] = [reaction, ""];

      lines.push(`Happiness: ${previousHappiness} -> ${active.happiness}`);
      lines.push(`+${xpEvent.xp} XP`);

      if (levelUp) {
        lines.push("");
        lines.push(`*** ${displayName} grew to Lv.${levelUp.newLevel}! ***`);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
