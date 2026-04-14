/**
 * buddy_show tool — Display the active Pokemon with stats and XP.
 * Supports "full" and "compact" display modes.
 * Shows the pokemon-colorscript ANSI sprite art.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CodingStat } from "../../engine/types.js";
import { CODING_STATS } from "../../engine/types.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { STAT_DISPLAY_NAMES } from "../../engine/constants.js";
import { renderStatBar, getTrainerTitle } from "../../engine/stats.js";
import { xpProgressPercent, xpToNextLevel } from "../../engine/xp.js";
import { StateManager } from "../../state/state-manager.js";
import { getMoodEmoji, getMoodDescription } from "../../engine/mood.js";
import { formatTypes, renderXpBar, pad } from "./display-helpers.js";

/** Registers the buddy_show tool on the MCP server. */
export function registerShowTool(server: McpServer): void {
  server.tool(
    "buddy_show",
    "Display your active Pokemon's status, stats, and XP progress.",
    { detail: z.enum(["full", "compact"]).optional() },
    async (params) => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state || state.party.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Welcome to Claudemon! You don't have a Pokemon yet. Use /buddy starter to pick your first companion!",
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
              text: "No active Pokemon found in your party. Something went wrong with your save data.",
            },
          ],
          isError: true,
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

      const detail = params.detail ?? "full";
      const percent = xpProgressPercent(active, species);

      // Compact mode: single line
      if (detail === "compact") {
        const displayName = active.nickname ? `${active.nickname} (${species.name})` : species.name;
        const xpBar = renderXpBar(percent, 15);
        const text = `${displayName}  Lv.${active.level}  [${xpBar}] ${percent}% XP`;
        return {
          content: [{ type: "text" as const, text }],
        };
      }

      // Full mode: detailed card with sprite image
      const displayName = active.nickname ? `${active.nickname} (${species.name})` : species.name;

      const needed = xpToNextLevel(active.level, species.expGroup);
      const title = getTrainerTitle(active.level);
      const typeStr = formatTypes(species.types);
      const personality = active.personality ?? species.description;

      const W = 42;
      const border = "\u2500".repeat(W);
      const lines: string[] = [];

      lines.push(`\u250c${border}\u2510`);
      lines.push(`\u2502  ${pad(`${displayName}   Lv.${active.level}`, W - 2)}\u2502`);
      lines.push(`\u2502  ${pad(typeStr, W - 2)}\u2502`);
      lines.push(`\u2502${" ".repeat(W)}\u2502`);
      lines.push(`\u2502  ${pad(`"${personality}"`, W - 2)}\u2502`);
      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      // Coding stats
      for (const stat of CODING_STATS) {
        const value = active.codingStats[stat as CodingStat];
        const bar = renderStatBar(value);
        const label = STAT_DISPLAY_NAMES[stat as CodingStat].padEnd(10);
        lines.push(`\u2502  ${pad(`${label} ${bar}  ${String(value).padStart(3)}`, W - 2)}\u2502`);
      }

      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      // XP bar
      const xpBar = renderXpBar(percent);
      lines.push(`\u2502  ${pad(`XP: [${xpBar}] ${percent}%`, W - 2)}\u2502`);

      if (needed > 0) {
        lines.push(`\u2502  ${pad(`Next level: ${needed} XP needed`, W - 2)}\u2502`);
      } else {
        lines.push(`\u2502  ${pad("MAX LEVEL", W - 2)}\u2502`);
      }

      lines.push(`\u2502${" ".repeat(W)}\u2502`);
      lines.push(`\u2502  ${pad(`Trainer: ${state.trainerName} \u2014 ${title}`, W - 2)}\u2502`);

      const streakDisplay =
        state.streak.currentStreak > 0
          ? `Streak: ${state.streak.currentStreak} days`
          : "Streak: 0 days";
      lines.push(`\u2502  ${pad(streakDisplay, W - 2)}\u2502`);

      const currentMood = state.mood ?? "neutral";
      const moodEmoji = getMoodEmoji(currentMood);
      const moodDesc = getMoodDescription(currentMood);
      lines.push(`\u2502  ${pad(`Mood: ${moodEmoji} ${moodDesc}`, W - 2)}\u2502`);

      lines.push(`\u2514${border}\u2518`);

      // Prepend colorscript sprite if available
      // ANSI colorscripts don't render in MCP text output — skip sprites here
      // Users can view sprites in terminal: cat sprites/colorscripts/small/{id}-{name}.txt
      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
