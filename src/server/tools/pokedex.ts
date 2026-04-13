/**
 * buddy_pokedex tool — Browse the Pokedex: view all 151, filter by caught/seen,
 * or inspect a specific Pokemon's details.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CodingStat } from "../../engine/types.js";
import { CODING_STATS } from "../../engine/types.js";
import { POKEDEX, POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { STAT_DISPLAY_NAMES, TOTAL_POKEMON } from "../../engine/constants.js";
import { renderStatBar } from "../../engine/stats.js";
import { findEvolutionChain } from "../../engine/evolution.js";
import { StateManager } from "../../state/state-manager.js";
import { formatTypes, pad, CODING_TO_BASE } from "./display-helpers.js";

/** Registers the buddy_pokedex tool on the MCP server. */
export function registerPokedexTool(server: McpServer): void {
  server.tool(
    "buddy_pokedex",
    "Browse the Pokedex: view all 151 Pokemon, filter by caught/seen, or look up a specific Pokemon.",
    {
      filter: z.enum(["all", "caught", "seen"]).optional(),
      pokemon: z.string().optional(),
    },
    async (params) => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You don't have a Pokemon yet! Use buddy_starter to begin your journey.",
            },
          ],
          isError: true,
        };
      }

      // ── Specific Pokemon lookup ────────────────────────────
      if (params.pokemon) {
        return handlePokemonDetail(params.pokemon, state, stateManager);
      }

      const filter = params.filter ?? "all";

      // ── ALL: Grid of 151 with symbols ──────────────────────
      if (filter === "all") {
        const lines: string[] = [];
        lines.push("P O K E D E X");
        lines.push(
          `Caught: ${state.pokedex.totalCaught}/${TOTAL_POKEMON}  |  Seen: ${state.pokedex.totalSeen}/${TOTAL_POKEMON}`,
        );
        lines.push("");

        // Render grid: 10 per row
        const COLS = 10;
        let row: string[] = [];

        for (let i = 1; i <= TOTAL_POKEMON; i++) {
          const entry = state.pokedex.entries[i];
          let symbol: string;

          if (entry?.caught) {
            symbol = "\u25cf"; // ● caught
          } else if (entry?.seen) {
            symbol = "\u25d0"; // ◐ seen
          } else {
            symbol = "\u25cb"; // ○ unknown
          }

          const num = String(i).padStart(3, "0");
          row.push(`${num}${symbol}`);

          if (i % COLS === 0 || i === TOTAL_POKEMON) {
            lines.push(row.join("  "));
            row = [];
          }
        }

        lines.push("");
        lines.push("\u25cf = caught  |  \u25d0 = seen  |  \u25cb = unknown");

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // ── CAUGHT: Show only caught Pokemon ───────────────────
      if (filter === "caught") {
        if (state.pokedex.totalCaught === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "You haven't caught any Pokemon yet! Keep coding and encounter wild Pokemon.",
              },
            ],
          };
        }

        const lines: string[] = [];
        lines.push(`CAUGHT POKEMON (${state.pokedex.totalCaught}/${TOTAL_POKEMON})`);
        lines.push("");

        for (const [idStr, entry] of Object.entries(state.pokedex.entries)) {
          if (!entry.caught) continue;
          const pokemonId = Number(idStr);
          const species = POKEMON_BY_ID.get(pokemonId);
          if (!species) continue;

          // Find the owned instance for level info
          const allOwned = [...state.party, ...state.pcBox];
          const owned = allOwned.find((p) => p.pokemonId === pokemonId);
          const levelStr = owned ? `Lv.${owned.level}` : "";
          const typeStr = formatTypes(species.types);
          const num = String(pokemonId).padStart(3, "0");

          lines.push(`#${num} ${species.name.padEnd(12)} ${typeStr.padEnd(16)} ${levelStr}`);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // ── SEEN: Show only seen (not caught) Pokemon ──────────
      if (filter === "seen") {
        const seenOnly: { id: number; name: string; type: string }[] = [];
        for (const [idStr, entry] of Object.entries(state.pokedex.entries)) {
          if (entry.seen && !entry.caught) {
            const pokemonId = Number(idStr);
            const species = POKEMON_BY_ID.get(pokemonId);
            if (species) {
              seenOnly.push({
                id: pokemonId,
                name: species.name,
                type: formatTypes(species.types),
              });
            }
          }
        }

        if (seenOnly.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No seen-but-uncaught Pokemon. Either you've caught them all or haven't encountered any!",
              },
            ],
          };
        }

        const lines: string[] = [];
        lines.push(`SEEN POKEMON (not yet caught: ${seenOnly.length})`);
        lines.push("");

        for (const entry of seenOnly) {
          const num = String(entry.id).padStart(3, "0");
          lines.push(`#${num} ${entry.name.padEnd(12)} ${entry.type}`);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      return {
        content: [{ type: "text" as const, text: "Unknown filter. Use all, caught, or seen." }],
        isError: true,
      };
    },
  );
}

/** Handle detailed view for a specific Pokemon by name or number. */
function handlePokemonDetail(
  query: string,
  state: import("../../engine/types.js").PlayerState,
  _stateManager: StateManager,
): { content: { type: "text"; text: string }[] } {
  // Find by number or name
  let species: import("../../engine/types.js").Pokemon | undefined;

  const asNumber = parseInt(query, 10);
  if (!isNaN(asNumber) && asNumber >= 1 && asNumber <= TOTAL_POKEMON) {
    species = POKEMON_BY_ID.get(asNumber);
  }

  if (!species) {
    const lowerQuery = query.toLowerCase();
    species = POKEDEX.find((p) => p.name.toLowerCase() === lowerQuery);
  }

  if (!species) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Pokemon "${query}" not found. Try a name (e.g., "Pikachu") or number (1-151).`,
        },
      ],
    };
  }

  const entry = state.pokedex.entries[species.id];
  const caught = entry?.caught ?? false;
  const seen = entry?.seen ?? false;

  const typeStr = formatTypes(species.types);
  const num = String(species.id).padStart(3, "0");

  const W = 42;
  const border = "\u2500".repeat(W);
  const lines: string[] = [];

  lines.push(`\u250c${border}\u2510`);
  lines.push(`\u2502  ${pad(`#${num} ${species.name}`, W - 2)}\u2502`);
  lines.push(`\u2502  ${pad(`Type: ${typeStr}`, W - 2)}\u2502`);
  lines.push(`\u2502  ${pad(`Rarity: ${species.rarity}`, W - 2)}\u2502`);
  lines.push(`\u2502${" ".repeat(W)}\u2502`);

  // Status
  const statusStr = caught ? "\u25cf Caught" : seen ? "\u25d0 Seen" : "\u25cb Unknown";
  lines.push(`\u2502  ${pad(`Status: ${statusStr}`, W - 2)}\u2502`);

  if (entry?.firstSeen) {
    lines.push(`\u2502  ${pad(`First seen: ${entry.firstSeen.slice(0, 10)}`, W - 2)}\u2502`);
  }
  if (entry?.firstCaught) {
    lines.push(`\u2502  ${pad(`First caught: ${entry.firstCaught.slice(0, 10)}`, W - 2)}\u2502`);
  }

  lines.push(`\u2502${" ".repeat(W)}\u2502`);
  lines.push(`\u2502  ${pad(`"${species.description}"`, W - 2)}\u2502`);
  lines.push(`\u2502${" ".repeat(W)}\u2502`);

  // Base stats
  lines.push(`\u2502  ${pad("Base Stats:", W - 2)}\u2502`);
  for (const stat of CODING_STATS) {
    const statKey = stat as CodingStat;
    const baseStatKey = CODING_TO_BASE[statKey];
    const value = Math.floor(species.baseStats[baseStatKey] * 0.5);
    const bar = renderStatBar(value);
    const label = STAT_DISPLAY_NAMES[statKey].padEnd(10);
    lines.push(`\u2502  ${pad(`${label} ${bar}  ${String(value).padStart(3)}`, W - 2)}\u2502`);
  }

  // Evolution chain
  const chain = findEvolutionChain(species.id);
  if (chain && chain.links.length > 0) {
    lines.push(`\u2502${" ".repeat(W)}\u2502`);
    lines.push(`\u2502  ${pad("Evolution Chain:", W - 2)}\u2502`);

    // Collect all unique IDs in chain order
    const chainIds: number[] = [];
    const visited = new Set<number>();
    for (const link of chain.links) {
      if (!visited.has(link.from)) {
        chainIds.push(link.from);
        visited.add(link.from);
      }
      if (!visited.has(link.to)) {
        chainIds.push(link.to);
        visited.add(link.to);
      }
    }

    const chainNames = chainIds.map((id) => {
      const sp = POKEMON_BY_ID.get(id);
      const name = sp ? sp.name : `#${id}`;
      const isCurrent = id === species!.id;
      return isCurrent ? `[${name}]` : name;
    });
    lines.push(`\u2502  ${pad(chainNames.join(" \u2192 "), W - 2)}\u2502`);
  }

  lines.push(`\u2514${border}\u2518`);

  return {
    content: [{ type: "text" as const, text: lines.join("\n") }],
  };
}
