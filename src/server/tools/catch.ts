/**
 * buddy_catch tool — Attempt to catch a wild Pokemon from a pending encounter.
 * Preview mode checks requirements only; confirm mode rolls against catch rate.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OwnedPokemon, CodingStat, WildEncounter } from "../../engine/types.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { BELL, MAX_PARTY_SIZE, STAT_DISPLAY_NAMES } from "../../engine/constants.js";
import { initCodingStats } from "../../engine/stats.js";
import { canCatch } from "../../engine/encounters.js";
import { checkNewAchievements, unlockAchievement } from "../../gamification/achievements.js";
import { StateManager } from "../../state/state-manager.js";
import { formatTypes, pad } from "./display-helpers.js";

/** Check only the stat/level requirements without the catch-rate roll. */
function meetsRequirements(
  encounter: WildEncounter,
  activePokemon: OwnedPokemon,
): { met: boolean; reason: string } {
  const species = POKEMON_BY_ID.get(encounter.pokemonId);
  if (!species) return { met: false, reason: "Unknown Pokemon" };

  const { requiredStat, minStatValue, requiredLevel } = encounter.catchCondition;

  if (activePokemon.level < requiredLevel) {
    return {
      met: false,
      reason: `Need level ${requiredLevel} to catch ${species.rarity} Pokemon (currently level ${activePokemon.level})`,
    };
  }

  if (requiredStat !== null) {
    const currentStat = activePokemon.codingStats[requiredStat as CodingStat];
    if (currentStat < minStatValue) {
      return {
        met: false,
        reason: `Need ${requiredStat.toUpperCase()} at ${minStatValue} to catch this Pokemon (currently ${currentStat})`,
      };
    }
  }

  return { met: true, reason: "" };
}

/** Registers the buddy_catch tool on the MCP server. */
export function registerCatchTool(server: McpServer): void {
  server.tool(
    "buddy_catch",
    "Attempt to catch a wild Pokemon from a pending encounter.",
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

      const encounter = state.pendingEncounter;
      if (!encounter) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No wild Pokemon nearby! Keep coding and one will appear.",
            },
          ],
        };
      }

      const species = POKEMON_BY_ID.get(encounter.pokemonId);
      if (!species) {
        stateManager.clearPendingEncounter();
        await stateManager.save();
        return {
          content: [
            {
              type: "text" as const,
              text: "The wild Pokemon vanished into the tall grass...",
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
              text: "No active Pokemon found in your party.",
            },
          ],
          isError: true,
        };
      }

      const typeStr = formatTypes(species.types);
      const { catchCondition } = encounter;

      // Build condition description
      const conditionParts: string[] = [];
      if (catchCondition.requiredLevel > 1) {
        conditionParts.push(`Level ${catchCondition.requiredLevel}+`);
      }
      if (catchCondition.requiredStat !== null) {
        const statName = STAT_DISPLAY_NAMES[catchCondition.requiredStat as CodingStat];
        conditionParts.push(`${statName} >= ${catchCondition.minStatValue}`);
      }
      const conditionStr = conditionParts.length > 0 ? conditionParts.join(", ") : "None";

      // Check stat/level requirements (does NOT roll catch rate)
      const reqCheck = meetsRequirements(encounter, active);

      // Requirements not met — Pokemon flees
      if (!reqCheck.met) {
        const W = 42;
        const border = "\u2500".repeat(W);
        const lines: string[] = [];

        lines.push(`\u250c${border}\u2510`);
        lines.push(`\u2502  ${pad(`Wild ${species.name} appeared!`, W - 2)}\u2502`);
        lines.push(`\u2502  ${pad(`Type: ${typeStr}   Lv.${encounter.level}`, W - 2)}\u2502`);
        lines.push(`\u2502  ${pad(`Catch req: ${conditionStr}`, W - 2)}\u2502`);
        lines.push(`\u2502${" ".repeat(W)}\u2502`);
        lines.push(`\u2502  ${pad(reqCheck.reason, W - 2)}\u2502`);
        lines.push(`\u2502  ${pad("It fled! Keep leveling up.", W - 2)}\u2502`);
        lines.push(`\u2514${border}\u2518`);

        // Clear encounter on flee
        stateManager.clearPendingEncounter();
        await stateManager.save();

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // Requirements met — show preview (no confirm) or attempt catch (confirm=true)
      if (!params.confirm) {
        const W = 42;
        const border = "\u2500".repeat(W);
        const lines: string[] = [];

        lines.push(`\u250c${border}\u2510`);
        lines.push(`\u2502  ${pad(`Wild ${species.name} appeared!`, W - 2)}\u2502`);
        lines.push(`\u2502  ${pad(`Type: ${typeStr}   Lv.${encounter.level}`, W - 2)}\u2502`);
        lines.push(`\u2502  ${pad(`Catch req: ${conditionStr}`, W - 2)}\u2502`);
        lines.push(`\u2502${" ".repeat(W)}\u2502`);
        lines.push(`\u2502  ${pad(`Rarity: ${species.rarity}`, W - 2)}\u2502`);
        lines.push(`\u2502  ${pad(`"${species.description}"`, W - 2)}\u2502`);
        lines.push(`\u2502${" ".repeat(W)}\u2502`);
        lines.push(`\u2502  ${pad("Use /buddy catch confirm to throw a Pokeball!", W - 2)}\u2502`);
        lines.push(`\u2514${border}\u2518`);

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // Confirm — roll against catch rate via canCatch()
      const catchResult = canCatch(encounter, active);

      if (!catchResult.success) {
        // Catch rate roll failed — broke free
        const W = 42;
        const border = "\u2500".repeat(W);
        const lines: string[] = [];

        lines.push(`\u250c${border}\u2510`);
        lines.push(`\u2502  ${pad(`You threw a Pokeball at ${species.name}!`, W - 2)}\u2502`);
        lines.push(`\u2502${" ".repeat(W)}\u2502`);
        lines.push(`\u2502  ${pad(catchResult.reason, W - 2)}\u2502`);
        lines.push(`\u2502  ${pad("Better luck next time...", W - 2)}\u2502`);
        lines.push(`\u2514${border}\u2518`);

        // Clear encounter on failed catch
        stateManager.clearPendingEncounter();
        await stateManager.save();

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // Catch succeeded — create OwnedPokemon
      const now = new Date().toISOString();
      const newPokemon: OwnedPokemon = {
        id: crypto.randomUUID(),
        pokemonId: encounter.pokemonId,
        nickname: null,
        level: encounter.level,
        currentXp: 0,
        totalXp: 0,
        codingStats: initCodingStats(species.baseStats),
        happiness: 70,
        caughtAt: now,
        evolvedAt: null,
        isActive: false,
        personality: null,
        shiny: false,
        isStarter: false,
      };

      // Add to party or PC box
      let placedIn: "party" | "pcBox";
      if (state.party.length < MAX_PARTY_SIZE) {
        state.party.push(newPokemon);
        placedIn = "party";
      } else {
        state.pcBox.push(newPokemon);
        placedIn = "pcBox";
      }

      // Update pokedex
      const existingEntry = state.pokedex.entries[encounter.pokemonId];
      if (existingEntry) {
        if (!existingEntry.caught) {
          existingEntry.caught = true;
          existingEntry.firstCaught = now;
          state.pokedex.totalCaught += 1;
        }
      } else {
        state.pokedex.entries[encounter.pokemonId] = {
          seen: true,
          caught: true,
          firstSeen: now,
          firstCaught: now,
        };
        state.pokedex.totalSeen += 1;
        state.pokedex.totalCaught += 1;
      }

      // Clear pending encounter
      stateManager.clearPendingEncounter();

      // Check for new achievements
      const newAchievements = checkNewAchievements(state);
      for (const achievement of newAchievements) {
        state.achievements.push(unlockAchievement(achievement.id));
      }

      // Save state
      await stateManager.save();
      await stateManager.writeStatus();

      // Build celebration message
      const W = 42;
      const border = "\u2500".repeat(W);
      const lines: string[] = [];

      lines.push(`\u250c${border}\u2510`);
      lines.push(`\u2502  ${pad(`Gotcha! ${species.name} was caught!`, W - 2)}\u2502`);
      lines.push(`\u2502  ${pad(`Type: ${typeStr}   Lv.${encounter.level}`, W - 2)}\u2502`);
      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      if (placedIn === "party") {
        lines.push(`\u2502  ${pad(`${species.name} joined your party!`, W - 2)}\u2502`);
      } else {
        lines.push(`\u2502  ${pad(`Party full! Sent to PC Box.`, W - 2)}\u2502`);
      }

      lines.push(`\u2502  ${pad(`Pokedex: ${state.pokedex.totalCaught}/151 caught`, W - 2)}\u2502`);
      lines.push(`\u2514${border}\u2518`);

      // Show new achievements
      if (newAchievements.length > 0) {
        lines.push("");
        for (const achievement of newAchievements) {
          lines.push(`*** Achievement unlocked: ${achievement.name}! ***`);
          lines.push(`    ${achievement.description}`);
        }
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
