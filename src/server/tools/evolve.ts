/**
 * buddy_evolve tool — Evolve the active Pokemon when eligible.
 * Shows a preview with stat comparison, or applies the evolution on confirm.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EvolutionMethod, CodingStat } from "../../engine/types.js";
import { CODING_STATS } from "../../engine/types.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { STAT_DISPLAY_NAMES, BELL, BADGES } from "../../engine/constants.js";
import { renderStatBar } from "../../engine/stats.js";
import {
  checkEvolution,
  applyEvolution,
  getEvolutionLinks,
  getNewlyEarnedBadges,
} from "../../engine/evolution.js";
import { StateManager } from "../../state/state-manager.js";
import { formatTypes, pad, CODING_TO_BASE } from "./display-helpers.js";

/** Describe an evolution method in human-readable text. */
function describeMethod(method: EvolutionMethod): string {
  switch (method.type) {
    case "level":
      return `Reach Lv.${method.level}`;
    case "badge": {
      const badgeDef = BADGES.find((b) => b.type === method.badge);
      const badgeName = badgeDef ? badgeDef.name : method.badge;
      return `Earn the ${badgeName}`;
    }
    case "collaboration":
      return "Merge 10 PRs (collaboration evolution)";
    case "stat":
      return `Reach Lv.25 with ${STAT_DISPLAY_NAMES[method.stat]} >= ${method.minValue}`;
  }
}

/** Registers the buddy_evolve tool on the MCP server. */
export function registerEvolveTool(server: McpServer): void {
  server.tool(
    "buddy_evolve",
    "Evolve your active Pokemon if it meets the evolution requirements.",
    { confirm: z.boolean().optional() },
    async (params) => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state || state.party.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You don't have a Pokemon yet! Use buddy_starter to pick your first partner.",
            },
          ],
          isError: true,
        };
      }

      const active = stateManager.getActivePokemon();
      if (!active) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No active Pokemon found in your party.",
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

      // Check for newly earned badges before evolution check
      const newBadges = getNewlyEarnedBadges(state);
      const badgeLines: string[] = [];
      if (newBadges.length > 0) {
        for (const badge of newBadges) {
          state.badges.push(badge);
          const badgeDef = BADGES.find((b) => b.type === badge);
          const badgeName = badgeDef ? badgeDef.name : badge;
          badgeLines.push(`*** New badge earned: ${badgeName}! ***`);
        }
        await stateManager.save();
      }

      // Check evolution eligibility
      const eligibleLink = checkEvolution(active, state);

      if (!eligibleLink) {
        // Not eligible — explain what's needed
        const links = getEvolutionLinks(active.pokemonId);
        const displayName = active.nickname ?? species.name;
        const lines: string[] = [];

        if (badgeLines.length > 0) {
          lines.push(...badgeLines, "");
        }

        if (links.length === 0) {
          lines.push(`${displayName} does not evolve.`);
        } else {
          lines.push(`${displayName} is not ready to evolve yet.`);
          lines.push("");
          lines.push("Evolution requirements:");
          for (const link of links) {
            const target = POKEMON_BY_ID.get(link.to);
            const targetName = target ? target.name : `#${link.to}`;
            lines.push(`  -> ${targetName}: ${describeMethod(link.method)}`);
          }
          lines.push("");
          lines.push(`Current level: ${active.level}`);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      const targetSpecies = POKEMON_BY_ID.get(eligibleLink.to);
      if (!targetSpecies) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Could not find target species data for Pokemon ID ${eligibleLink.to}.`,
            },
          ],
          isError: true,
        };
      }

      const displayName = active.nickname ?? species.name;

      // Preview mode: show what the evolution will look like
      if (!params.confirm) {
        const W = 42;
        const border = "\u2500".repeat(W);
        const lines: string[] = [];

        if (badgeLines.length > 0) {
          lines.push(...badgeLines, "");
        }

        lines.push(`\u250c${border}\u2510`);
        lines.push(`\u2502  ${pad(`What? ${displayName} is evolving!`, W - 2)}\u2502`);
        lines.push(`\u2502${" ".repeat(W)}\u2502`);
        lines.push(`\u2502  ${pad(`${species.name}  \u2192  ${targetSpecies.name}`, W - 2)}\u2502`);
        lines.push(
          `\u2502  ${pad(`${formatTypes(species.types)}     ${formatTypes(targetSpecies.types)}`, W - 2)}\u2502`,
        );
        lines.push(`\u2502  ${pad(`Lv.${active.level}`, W - 2)}\u2502`);
        lines.push(`\u2502${" ".repeat(W)}\u2502`);
        lines.push(`\u2502  ${pad("New base stats:", W - 2)}\u2502`);

        // Show stat comparison (new base vs current)
        for (const stat of CODING_STATS) {
          const currentValue = active.codingStats[stat as CodingStat];
          const label = STAT_DISPLAY_NAMES[stat as CodingStat].padEnd(10);
          // Calculate what new stat would be after evolution (preview)
          const oldBaseContrib = Math.floor(
            species.baseStats[CODING_TO_BASE[stat as CodingStat]] * 0.5,
          );
          const activityBonus = Math.max(0, currentValue - oldBaseContrib);
          const newBaseContrib = Math.floor(
            targetSpecies.baseStats[CODING_TO_BASE[stat as CodingStat]] * 0.5,
          );
          const newValue = newBaseContrib + activityBonus;
          const bar = renderStatBar(newValue);
          const delta = newValue !== currentValue ? ` (was ${currentValue})` : "";
          lines.push(
            `\u2502  ${pad(`${label} ${bar}  ${String(newValue).padStart(3)}${delta}`, W - 2)}\u2502`,
          );
        }

        lines.push(`\u2502${" ".repeat(W)}\u2502`);
        lines.push(`\u2502  ${pad("Use /buddy evolve confirm to proceed", W - 2)}\u2502`);
        lines.push(`\u2502  ${pad("(or don't -- like pressing B!)", W - 2)}\u2502`);
        lines.push(`\u2514${border}\u2518`);

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // Confirm mode: apply evolution
      const { newName, newTypes } = applyEvolution(active, eligibleLink.to);

      // Save state
      await stateManager.save();
      await stateManager.writeStatus();

      // Build celebration message
      const lines: string[] = [];

      if (badgeLines.length > 0) {
        lines.push(...badgeLines, "");
      }

      lines.push(`Congratulations! ${displayName} evolved into ${newName}!`);
      lines.push(`Type: ${formatTypes(newTypes as readonly [string, string?])}`);
      lines.push("");

      // Show new stats
      lines.push("Updated stats:");
      for (const stat of CODING_STATS) {
        const value = active.codingStats[stat as CodingStat];
        const label = STAT_DISPLAY_NAMES[stat as CodingStat].padEnd(10);
        const bar = renderStatBar(value);
        lines.push(`  ${label} ${bar}  ${String(value).padStart(3)}`);
      }

      // Terminal bell
      if (state.config.bellEnabled) {
        process.stderr.write(BELL);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
