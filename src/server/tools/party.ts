/**
 * buddy_party tool — Manage your party of up to 6 Pokemon.
 * Supports listing, switching active, depositing to PC, and withdrawing from PC.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { MAX_PARTY_SIZE } from "../../engine/constants.js";
import { StateManager } from "../../state/state-manager.js";
import { formatTypes, pad } from "./display-helpers.js";

/** Registers the buddy_party tool on the MCP server. */
export function registerPartyTool(server: McpServer): void {
  server.tool(
    "buddy_party",
    "Manage your Pokemon party: list members, switch active, deposit to PC, or withdraw from PC.",
    {
      action: z.enum(["list", "switch", "deposit", "withdraw"]).optional(),
      slot: z.number().int().optional(),
    },
    async (params) => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state || state.party.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion and build your party!",
            },
          ],
        };
      }

      const action = params.action ?? "list";

      // ── LIST ────────────────────────────────────────────────
      if (action === "list") {
        const W = 42;
        const border = "\u2500".repeat(W);
        const lines: string[] = [];

        lines.push(`\u250c${border}\u2510`);
        lines.push(`\u2502  ${pad("YOUR PARTY", W - 2)}\u2502`);
        lines.push(`\u2502${" ".repeat(W)}\u2502`);

        for (let i = 0; i < state.party.length; i++) {
          const pokemon = state.party[i]!;
          const species = POKEMON_BY_ID.get(pokemon.pokemonId);
          if (!species) continue;

          const displayName = pokemon.nickname ?? species.name;
          const typeStr = formatTypes(species.types);
          const marker = pokemon.isActive ? " \u2605" : "";
          const entry = `${i + 1}. ${displayName}  Lv.${pokemon.level}  ${typeStr}${marker}`;
          lines.push(`\u2502  ${pad(entry, W - 2)}\u2502`);
        }

        lines.push(`\u2502${" ".repeat(W)}\u2502`);
        lines.push(`\u2502  ${pad(`Party: ${state.party.length}/${MAX_PARTY_SIZE}`, W - 2)}\u2502`);

        if (state.pcBox.length > 0) {
          lines.push(`\u2502  ${pad(`PC Box: ${state.pcBox.length} Pokemon`, W - 2)}\u2502`);
        }

        lines.push(`\u2514${border}\u2518`);

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // ── SWITCH ──────────────────────────────────────────────
      if (action === "switch") {
        const slot = params.slot;
        if (slot === undefined || slot < 1 || slot > state.party.length) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Invalid slot. Choose a number between 1 and ${state.party.length}.`,
              },
            ],
            isError: true,
          };
        }

        const target = state.party[slot - 1]!;
        if (target.isActive) {
          const species = POKEMON_BY_ID.get(target.pokemonId);
          const displayName = target.nickname ?? species?.name ?? "???";
          return {
            content: [
              {
                type: "text" as const,
                text: `${displayName} is already your active Pokemon!`,
              },
            ],
          };
        }

        // Deactivate all, activate target
        for (const pokemon of state.party) {
          pokemon.isActive = false;
        }
        target.isActive = true;

        await stateManager.save();
        await stateManager.writeStatus();

        const species = POKEMON_BY_ID.get(target.pokemonId);
        const displayName = target.nickname ?? species?.name ?? "???";
        const typeStr = species ? formatTypes(species.types) : "";

        const lines: string[] = [];
        lines.push(`Go, ${displayName}!`);
        lines.push(`Lv.${target.level} ${typeStr}`);

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // ── DEPOSIT ─────────────────────────────────────────────
      if (action === "deposit") {
        const slot = params.slot;
        if (slot === undefined || slot < 1 || slot > state.party.length) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Invalid slot. Choose a number between 1 and ${state.party.length}.`,
              },
            ],
            isError: true,
          };
        }

        if (state.party.length <= 1) {
          return {
            content: [
              {
                type: "text" as const,
                text: "You can't deposit your last Pokemon! You need at least one in your party.",
              },
            ],
            isError: true,
          };
        }

        const deposited = state.party.splice(slot - 1, 1)[0]!;
        const wasActive = deposited.isActive;
        deposited.isActive = false;
        state.pcBox.push(deposited);

        // If the deposited Pokemon was active, set the first party member as active
        if (wasActive && state.party.length > 0) {
          state.party[0]!.isActive = true;
        }

        await stateManager.save();
        await stateManager.writeStatus();

        const species = POKEMON_BY_ID.get(deposited.pokemonId);
        const displayName = deposited.nickname ?? species?.name ?? "???";

        const lines: string[] = [];
        lines.push(`${displayName} was deposited in the PC Box.`);
        lines.push(
          `Party: ${state.party.length}/${MAX_PARTY_SIZE}  |  PC Box: ${state.pcBox.length}`,
        );

        if (wasActive) {
          const newActive = state.party[0]!;
          const newSpecies = POKEMON_BY_ID.get(newActive.pokemonId);
          const newName = newActive.nickname ?? newSpecies?.name ?? "???";
          lines.push(`${newName} is now your active Pokemon.`);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // ── WITHDRAW ────────────────────────────────────────────
      if (action === "withdraw") {
        const slot = params.slot;
        if (slot === undefined || slot < 1 || slot > state.pcBox.length) {
          if (state.pcBox.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Your PC Box is empty! Catch more Pokemon to fill it.",
                },
              ],
            };
          }
          return {
            content: [
              {
                type: "text" as const,
                text: `Invalid slot. Choose a number between 1 and ${state.pcBox.length}.`,
              },
            ],
            isError: true,
          };
        }

        if (state.party.length >= MAX_PARTY_SIZE) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Your party is full (${MAX_PARTY_SIZE}/${MAX_PARTY_SIZE}). Deposit a Pokemon first.`,
              },
            ],
            isError: true,
          };
        }

        const withdrawn = state.pcBox.splice(slot - 1, 1)[0]!;
        state.party.push(withdrawn);

        await stateManager.save();

        const species = POKEMON_BY_ID.get(withdrawn.pokemonId);
        const displayName = withdrawn.nickname ?? species?.name ?? "???";

        const lines: string[] = [];
        lines.push(`${displayName} was withdrawn from the PC Box!`);
        lines.push(
          `Party: ${state.party.length}/${MAX_PARTY_SIZE}  |  PC Box: ${state.pcBox.length}`,
        );

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // Should not reach here, but TypeScript exhaustiveness
      return {
        content: [{ type: "text" as const, text: "Unknown party action." }],
        isError: true,
      };
    },
  );
}
