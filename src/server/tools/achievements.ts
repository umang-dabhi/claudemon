/**
 * buddy_achievements tool — Display all achievements grouped by category,
 * showing unlock status and progress.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Achievement, PlayerState, AchievementCondition } from "../../engine/types.js";
import { ACHIEVEMENTS, isConditionMet } from "../../gamification/achievements.js";
import { StateManager } from "../../state/state-manager.js";
import { pad } from "./display-helpers.js";

/** Category display labels in preferred order. */
const CATEGORY_ORDER: readonly { key: Achievement["category"]; label: string }[] = [
  { key: "trainer", label: "TRAINER" },
  { key: "coding", label: "CODING" },
  { key: "pokemon", label: "POKEMON" },
  { key: "secret", label: "SECRET" },
];

/** Describe progress toward an achievement condition. */
function describeProgress(condition: AchievementCondition, state: PlayerState): string {
  switch (condition.type) {
    case "counter": {
      const current = state.counters[condition.counter] ?? 0;
      return `${current}/${condition.threshold}`;
    }
    case "level": {
      const highest = state.party.length > 0 ? Math.max(...state.party.map((p) => p.level)) : 0;
      return `Lv.${highest}/${condition.minLevel}`;
    }
    case "pokedex":
      return `${state.pokedex.totalCaught}/${condition.minCaught} caught`;
    case "streak":
      return `${state.streak.currentStreak}/${condition.minDays} days`;
    case "badge":
      return state.badges.includes(condition.badge) ? "Earned" : "Not earned";
    case "evolution": {
      const hasEvolved = [...state.party, ...state.pcBox].some((p) => p.evolvedAt !== null);
      return hasEvolved ? "Done" : "Not yet";
    }
    case "party_size":
      return `${state.party.length}/${condition.minSize}`;
  }
}

/** Registers the buddy_achievements tool on the MCP server. */
export function registerAchievementsTool(server: McpServer): void {
  server.tool(
    "buddy_achievements",
    "View all achievements grouped by category with unlock status and progress.",
    {},
    async () => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion and start earning achievements!",
            },
          ],
        };
      }

      const unlockedIds = new Set(state.achievements.map((a) => a.achievementId));
      const unlockedMap = new Map(state.achievements.map((a) => [a.achievementId, a]));

      const totalUnlocked = state.achievements.length;
      const totalAchievements = ACHIEVEMENTS.length;

      const W = 50;
      const border = "\u2500".repeat(W);
      const lines: string[] = [];

      lines.push(`\u250c${border}\u2510`);
      lines.push(
        `\u2502  ${pad(`ACHIEVEMENTS  (${totalUnlocked}/${totalAchievements})`, W - 2)}\u2502`,
      );
      lines.push(`\u2514${border}\u2518`);
      lines.push("");

      for (const category of CATEGORY_ORDER) {
        const categoryAchievements = ACHIEVEMENTS.filter((a) => a.category === category.key);
        if (categoryAchievements.length === 0) continue;

        lines.push(`--- ${category.label} ---`);
        lines.push("");

        for (const achievement of categoryAchievements) {
          const unlocked = unlockedIds.has(achievement.id);
          const record = unlockedMap.get(achievement.id);

          if (unlocked && record) {
            const date = record.unlockedAt.slice(0, 10);
            lines.push(`  \u2713  ${achievement.name}`);
            lines.push(`     ${achievement.description}`);
            lines.push(`     Unlocked: ${date}`);
          } else {
            const progress = describeProgress(achievement.condition, state);
            const met = isConditionMet(achievement.condition, state);
            const marker = met ? "\u2713" : "\u25cb";
            lines.push(`  ${marker}  ${achievement.name}`);
            lines.push(`     ${achievement.description}`);
            lines.push(`     Progress: ${progress}`);
          }
          lines.push("");
        }
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
