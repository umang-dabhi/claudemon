/**
 * buddy_legendary tool — Display progress on all 5 legendary quest chains.
 * Each quest has multi-step conditions tied to sustained coding activity.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { getQuestProgress } from "../../gamification/legendary-quests.js";
import { StateManager } from "../../state/state-manager.js";
import { pad } from "./display-helpers.js";

/** Registers the buddy_legendary tool on the MCP server. */
export function registerLegendaryTool(server: McpServer): void {
  server.tool(
    "buddy_legendary",
    "View progress on all legendary Pokemon quest chains.",
    {},
    async () => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion and begin your legendary quests!",
            },
          ],
        };
      }

      const progress = getQuestProgress(state);

      const W = 48;
      const border = "\u2500".repeat(W);
      const lines: string[] = [];

      lines.push("L E G E N D A R Y   Q U E S T S");
      lines.push("");

      for (const entry of progress) {
        const { quest, stepsCompleted, totalSteps } = entry;
        const species = POKEMON_BY_ID.get(quest.pokemonId);
        const pokemonName = species?.name ?? `#${quest.pokemonId}`;

        lines.push(
          `\u250c\u2500 LEGENDARY QUEST: ${pokemonName} ${"\u2500".repeat(Math.max(0, W - 24 - pokemonName.length))}\u2510`,
        );
        lines.push(`\u2502  ${pad(quest.name, W - 2)}\u2502`);
        lines.push(`\u2502${" ".repeat(W)}\u2502`);

        for (let i = 0; i < quest.steps.length; i++) {
          const step = quest.steps[i]!;
          const completed = i < stepsCompleted;
          const marker = completed ? "\u2713" : "\u25cb";
          const stepText = `Step ${i + 1}: ${marker} ${step.description}`;
          lines.push(`\u2502  ${pad(stepText, W - 2)}\u2502`);
        }

        lines.push(`\u2502${" ".repeat(W)}\u2502`);

        const allDone = stepsCompleted === totalSteps;
        const progressStr = allDone
          ? `COMPLETE! ${pokemonName} awaits you!`
          : `Progress: ${stepsCompleted}/${totalSteps}`;
        lines.push(`\u2502  ${pad(progressStr, W - 2)}\u2502`);
        lines.push(`\u2514${border}\u2518`);
        lines.push("");
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
