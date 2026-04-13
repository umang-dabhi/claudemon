/**
 * buddy_stats tool — Detailed stat breakdown for the active Pokemon.
 * Shows coding stats, base values, activity bonuses, and XP details.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CodingStat } from "../../engine/types.js";
import { CODING_STATS } from "../../engine/types.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { STAT_DISPLAY_NAMES } from "../../engine/constants.js";
import { renderStatBar, calculateDisplayStat } from "../../engine/stats.js";
import { xpProgressPercent, xpToNextLevel, cumulativeXpForLevel } from "../../engine/xp.js";
import { StateManager } from "../../state/state-manager.js";
import { renderXpBar, CODING_TO_BASE } from "./display-helpers.js";

/** Registers the buddy_stats tool on the MCP server. */
export function registerStatsTool(server: McpServer): void {
  server.tool(
    "buddy_stats",
    "Show a detailed stat breakdown for your active Pokemon, including base values, activity bonuses, and XP info.",
    {},
    async () => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state || state.party.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion and start your coding adventure!",
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
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion and start your coding adventure!",
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

      const lines: string[] = [];

      lines.push(`== ${species.name} Lv.${active.level} -- Stat Breakdown ==`);
      lines.push("");

      // Column header
      lines.push("  STAT        BAR           VALUE   BASE  BONUS");
      lines.push("  " + "\u2500".repeat(48));

      for (const stat of CODING_STATS) {
        const codingStat = stat as CodingStat;
        const baseKey = CODING_TO_BASE[codingStat];
        const baseValue = species.baseStats[baseKey];

        // The initial coding stat was floor(baseStat * 0.5).
        // Current activity bonus = current codingStats value - initial value.
        const initialValue = Math.floor(baseValue * 0.5);
        const activityBonus = active.codingStats[codingStat] - initialValue;

        const displayValue = calculateDisplayStat(baseValue, active.level, activityBonus);
        const bar = renderStatBar(displayValue);
        const label = STAT_DISPLAY_NAMES[codingStat].padEnd(10);

        lines.push(
          `  ${label} ${bar}  ${String(displayValue).padStart(4)}` +
            `   ${String(baseValue).padStart(3)}` +
            `   ${activityBonus >= 0 ? "+" : ""}${activityBonus}`,
        );
      }

      lines.push("");
      lines.push("  " + "\u2500".repeat(48));
      lines.push("");

      // XP details
      const percent = xpProgressPercent(active, species);
      const needed = xpToNextLevel(active.level, species.expGroup);
      const cumulativeNow = cumulativeXpForLevel(active.level, species.expGroup);
      const xpBar = renderXpBar(percent);

      lines.push("  XP Details:");
      lines.push(`    Exp Group:      ${species.expGroup}`);
      lines.push(`    Level:          ${active.level}`);
      lines.push(`    Current XP:     ${active.currentXp} / ${needed > 0 ? needed : "MAX"}`);
      lines.push(`    Total XP:       ${active.totalXp}`);
      lines.push(`    Cumulative:     ${cumulativeNow} (to reach Lv.${active.level})`);
      lines.push(`    Progress:       [${xpBar}] ${percent}%`);

      if (needed > 0) {
        lines.push(`    To next level:  ${needed - active.currentXp} XP remaining`);
      } else {
        lines.push("    MAX LEVEL REACHED");
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
