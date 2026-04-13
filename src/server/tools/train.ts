/**
 * buddy_train tool — Train your active Pokemon's coding stats.
 * Has a 30-minute cooldown. Awards +3 to a stat and +5 XP.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CodingStat } from "../../engine/types.js";
import { CODING_STATS } from "../../engine/types.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { STAT_DISPLAY_NAMES } from "../../engine/constants.js";
import { addXp } from "../../engine/xp.js";
import { applyStatBoost, renderStatBar } from "../../engine/stats.js";
import { StateManager } from "../../state/state-manager.js";

/** Cooldown: 30 minutes in milliseconds. */
const TRAIN_COOLDOWN_MS = 1_800_000;

/** Stat boost per training session. */
const TRAIN_STAT_BOOST = 3;

/** XP awarded per training session. */
const TRAIN_XP_AWARD = 5;

/** Pick a random element from a non-empty array. */
function randomPick<T>(arr: readonly T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index] as T;
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

/** Registers the buddy_train tool on the MCP server. */
export function registerTrainTool(server: McpServer): void {
  server.tool(
    "buddy_train",
    "Train your active Pokemon's coding stats. Optionally specify a stat (debugging, stability, velocity, wisdom, stamina). 30-minute cooldown.",
    {
      stat: z
        .string()
        .optional()
        .describe(
          "Stat to train: debugging, stability, velocity, wisdom, or stamina. Random if omitted.",
        ),
    },
    async ({ stat: statInput }) => {
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
      const elapsed = now - state.lastTrainedAt;
      if (elapsed < TRAIN_COOLDOWN_MS) {
        const remaining = TRAIN_COOLDOWN_MS - elapsed;
        return {
          content: [
            {
              type: "text" as const,
              text: `Still resting from training! Try again in ${formatCooldownRemaining(remaining)}.`,
            },
          ],
        };
      }

      // Determine which stat to train
      let targetStat: CodingStat;
      if (statInput !== undefined && statInput !== "") {
        const normalized = statInput.toLowerCase().trim();
        if (!CODING_STATS.includes(normalized as CodingStat)) {
          const validStats = CODING_STATS.map((s) => STAT_DISPLAY_NAMES[s].toLowerCase()).join(
            ", ",
          );
          return {
            content: [
              {
                type: "text" as const,
                text: `Invalid stat "${statInput}". Valid stats: ${validStats}`,
              },
            ],
          };
        }
        targetStat = normalized as CodingStat;
      } else {
        targetStat = randomPick(CODING_STATS);
      }

      const displayName = active.nickname ?? species.name;

      // Record stat before boost for display
      const statBefore = active.codingStats[targetStat];

      // Apply stat boost
      applyStatBoost(active, targetStat, TRAIN_STAT_BOOST);

      const statAfter = active.codingStats[targetStat];

      // Award XP
      const levelUp = addXp(active, TRAIN_XP_AWARD, species);

      // Set mood to energetic
      state.mood = "energetic";
      state.moodSetAt = now;

      // Record train timestamp
      state.lastTrainedAt = now;

      // Save state and update status line
      await stateManager.save();
      await stateManager.writeStatus();

      // Build response
      const statDisplayName = STAT_DISPLAY_NAMES[targetStat];
      const lines: string[] = [];

      lines.push(`*${displayName} trains its ${statDisplayName}! +${TRAIN_STAT_BOOST}*`);
      lines.push("");
      lines.push(
        `${statDisplayName}: ${statBefore} \u2192 ${statAfter}  ${renderStatBar(statAfter)}`,
      );
      lines.push(`+${TRAIN_XP_AWARD} XP`);

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
