/**
 * buddy_rename tool — Give your active Pokemon a nickname.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { StateManager } from "../../state/state-manager.js";

/** Register the buddy_rename tool. */
export function registerRenameTool(server: McpServer): void {
  server.tool(
    "buddy_rename",
    "Give your active Pokemon a nickname (max 20 chars). Use empty string to reset to species name.",
    { name: z.string().max(20) },
    async (params) => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state || state.party.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion -- then you can give them a nickname!",
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
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion -- then you can give them a nickname!",
            },
          ],
        };
      }

      const species = POKEMON_BY_ID.get(active.pokemonId);
      const speciesName = species?.name ?? "Pokemon";
      const newName = params.name.trim();

      if (newName === "") {
        active.nickname = null;
        await stateManager.save();
        await stateManager.writeStatus();
        return {
          content: [
            {
              type: "text" as const,
              text: `Nickname removed. Your buddy is back to ${speciesName}.`,
            },
          ],
        };
      }

      const oldName = active.nickname ?? speciesName;
      active.nickname = newName;
      await stateManager.save();
      await stateManager.writeStatus();

      return {
        content: [{ type: "text" as const, text: `${oldName} is now known as **${newName}**!` }],
      };
    },
  );
}
