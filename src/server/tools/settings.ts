/**
 * buddy_settings tool — Configure Claudemon settings.
 * Currently supports: encounter-speed (fast | normal | slow).
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StateManager } from "../../state/state-manager.js";
import type { EncounterSpeed } from "../../engine/constants.js";
import { ENCOUNTER_THRESHOLDS } from "../../engine/constants.js";

const VALID_ENCOUNTER_SPEEDS: readonly EncounterSpeed[] = ["fast", "normal", "slow"];

/** Speed descriptions for user-facing messages. */
const SPEED_DESCRIPTIONS: Readonly<Record<EncounterSpeed, string>> = {
  fast: "Fastest encounters — wild Pokemon appear every ~100 XP",
  normal: "Default pace — wild Pokemon appear every ~250 XP",
  slow: "Less interruptions — wild Pokemon appear every ~500 XP",
};

/** Registers the buddy_settings tool on the MCP server. */
export function registerSettingsTool(server: McpServer): void {
  server.tool(
    "buddy_settings",
    "Configure Claudemon settings (encounter speed, etc.)",
    {
      setting: z.enum(["encounter-speed"]).describe("The setting to configure"),
      value: z.string().describe("The value to set (for encounter-speed: fast, normal, or slow)"),
    },
    async (params: { setting: "encounter-speed"; value: string }) => {
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
                `Encounter speed updated: ${previousSpeed} -> ${validSpeed}`,
                "",
                SPEED_DESCRIPTIONS[validSpeed],
                `XP threshold: ${ENCOUNTER_THRESHOLDS[validSpeed]}`,
              ].join("\n"),
            },
          ],
        };
      }

      // Unreachable with the current enum, but guards against future additions
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown setting: "${params.setting}". Available settings: encounter-speed`,
          },
        ],
        isError: true,
      };
    },
  );
}
