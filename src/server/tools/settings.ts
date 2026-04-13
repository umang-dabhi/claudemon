/**
 * buddy_settings tool — Configure Claudemon settings.
 * Supports: encounter-speed, xp-share.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StateManager } from "../../state/state-manager.js";
import type { EncounterSpeed } from "../../engine/constants.js";
import { ENCOUNTER_THRESHOLDS } from "../../engine/constants.js";

const VALID_ENCOUNTER_SPEEDS: readonly EncounterSpeed[] = ["fast", "normal", "slow"];

const SPEED_DESCRIPTIONS: Readonly<Record<EncounterSpeed, string>> = {
  fast: "Fastest encounters — wild Pokemon appear every ~100 XP",
  normal: "Default pace — wild Pokemon appear every ~250 XP",
  slow: "Less interruptions — wild Pokemon appear every ~500 XP",
};

/** Registers the buddy_settings tool on the MCP server. */
export function registerSettingsTool(server: McpServer): void {
  server.tool(
    "buddy_settings",
    "Configure Claudemon settings (encounter-speed, xp-share)",
    {
      setting: z.enum(["encounter-speed", "xp-share"]).describe("The setting to configure"),
      value: z.string().describe("The value to set"),
    },
    async (params: { setting: "encounter-speed" | "xp-share"; value: string }) => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No save data found. Use buddy_starter to pick your first Pokemon before changing settings.",
            },
          ],
        };
      }

      // ── Encounter Speed ──────────────────────────────────
      if (params.setting === "encounter-speed") {
        const speed = params.value.toLowerCase();

        if (!VALID_ENCOUNTER_SPEEDS.includes(speed as EncounterSpeed)) {
          return {
            content: [
              {
                type: "text" as const,
                text: [
                  `Invalid encounter speed: "${params.value}"`,
                  "",
                  "Valid options:",
                  ...VALID_ENCOUNTER_SPEEDS.map(
                    (s) =>
                      `  ${s} — ${SPEED_DESCRIPTIONS[s]} (${ENCOUNTER_THRESHOLDS[s]} XP threshold)`,
                  ),
                ].join("\n"),
              },
            ],
            isError: true,
          };
        }

        const validSpeed = speed as EncounterSpeed;
        const previousSpeed = state.config.encounterSpeed ?? "normal";
        state.config.encounterSpeed = validSpeed;
        await stateManager.save();

        return {
          content: [
            {
              type: "text" as const,
              text: [
                `Encounter speed: ${previousSpeed} → ${validSpeed}`,
                "",
                SPEED_DESCRIPTIONS[validSpeed],
                `XP threshold: ${ENCOUNTER_THRESHOLDS[validSpeed]}`,
              ].join("\n"),
            },
          ],
        };
      }

      // ── XP Share ─────────────────────────────────────────
      if (params.setting === "xp-share") {
        const percent = parseInt(params.value, 10);

        if (isNaN(percent) || percent < 0 || percent > 100) {
          return {
            content: [
              {
                type: "text" as const,
                text: [
                  `Invalid XP share value: "${params.value}"`,
                  "",
                  "Enter a number 0-100 (percentage of XP shared to inactive party):",
                  "  0   — No XP sharing (only active Pokemon earns)",
                  "  25  — Default (inactive get 25% of earned XP)",
                  "  50  — Half XP shared to inactive party",
                  "  100 — Full XP to everyone",
                ].join("\n"),
              },
            ],
            isError: true,
          };
        }

        const previous = state.config.xpSharePercent ?? 25;
        state.config.xpSharePercent = percent;
        await stateManager.save();

        const desc =
          percent === 0
            ? "Disabled — only active Pokemon earns XP"
            : `Inactive party members receive ${percent}% of earned XP`;

        return {
          content: [
            {
              type: "text" as const,
              text: [`XP share: ${previous}% → ${percent}%`, "", desc].join("\n"),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown setting: "${params.setting}". Available: encounter-speed, xp-share`,
          },
        ],
        isError: true,
      };
    },
  );
}
