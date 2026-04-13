/**
 * buddy_starter tool — First-run starter Pokemon selection.
 * Presents 3 daily-deterministic Pokemon from the starter pool.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OwnedPokemon, CodingStats } from "../../engine/types.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { STARTER_POOL } from "../../engine/starter-pool.js";
import { STARTER_LEVEL } from "../../engine/constants.js";
import { initCodingStats } from "../../engine/stats.js";
import { StateManager } from "../../state/state-manager.js";
import { formatTypes } from "./display-helpers.js";

/** Simple string hash for deterministic seeding. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic shuffle using a seed, returns a new array. */
function seededShuffle<T>(array: readonly T[], seed: number): T[] {
  const result = [...array];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    // Simple LCG for deterministic pseudo-random
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Path to stored starter options */
function getStarterOptionsPath(): string {
  return `${process.env["HOME"] ?? "~"}/.claudemon/starter-options.json`;
}

/** Get or generate 3 random starters. Stored for 24 hours so user sees same 3. */
async function getStarters(): Promise<number[]> {
  const optionsPath = getStarterOptionsPath();

  // Try to load previously generated options (valid for 24 hours)
  try {
    const { readFile, stat, access: fsAccess } = await import("node:fs/promises");
    const { constants } = await import("node:fs");
    await fsAccess(optionsPath, constants.F_OK);
    const fileStat = await stat(optionsPath);
    const ageMs = Date.now() - fileStat.mtimeMs;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (ageMs < ONE_DAY) {
      const text = await readFile(optionsPath, "utf-8");
      const saved = JSON.parse(text) as number[];
      if (Array.isArray(saved) && saved.length === 3) {
        return saved;
      }
    }
  } catch {
    // No saved options or expired — generate new ones
  }

  // Generate fresh random 3 with different primary types
  const seed = hashString(`claudemon-${Date.now()}-${Math.random()}`);
  const shuffled = seededShuffle(STARTER_POOL, seed);
  const starters: number[] = [];
  const usedTypes = new Set<string>();

  for (const id of shuffled) {
    if (starters.length >= 3) break;
    const pokemon = POKEMON_BY_ID.get(id);
    if (!pokemon) continue;
    const primaryType = pokemon.types[0];
    if (usedTypes.has(primaryType)) continue;
    usedTypes.add(primaryType);
    starters.push(id);
  }

  // Fallback if not enough unique types (shouldn't happen with 39 starters)
  if (starters.length < 3) {
    for (const id of shuffled) {
      if (starters.length >= 3) break;
      if (!starters.includes(id)) starters.push(id);
    }
  }

  // Save for consistency until they pick
  try {
    const { writeFile, mkdir } = await import("node:fs/promises");
    await mkdir(`${process.env["HOME"] ?? "~"}/.claudemon`, { recursive: true });
    await writeFile(optionsPath, JSON.stringify(starters), "utf-8");
  } catch {
    // Non-critical — they'll just get new options next time
  }

  return starters;
}

/** Clear saved starter options (called after picking) */
async function clearStarterOptions(): Promise<void> {
  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(getStarterOptionsPath());
  } catch {
    // Ignore
  }
}

/** Generate a UUID v4. */
function generateUUID(): string {
  return crypto.randomUUID();
}

/** Registers the buddy_starter tool on the MCP server. */
export function registerStarterTool(server: McpServer): void {
  server.tool(
    "buddy_starter",
    "Pick your starter Pokemon! Call without a choice to see today's 3 options, or with choice (1, 2, or 3) to pick one.",
    { choice: z.number().min(1).max(3).optional() },
    async (params) => {
      const stateManager = StateManager.getInstance();
      const existingState = await stateManager.load();

      // Block if player already has Pokemon
      if (existingState !== null && existingState.party.length > 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You already have a Pokemon partner! Use buddy_show to check on them.",
            },
          ],
        };
      }

      const starterIds = await getStarters();

      // No choice provided — show the 3 options
      if (params.choice === undefined) {
        const lines: string[] = ["Welcome to Claudemon! Choose your coding companion:", ""];

        for (let i = 0; i < 3; i++) {
          const pokemonId = starterIds[i]!;
          const species = POKEMON_BY_ID.get(pokemonId);
          if (!species) continue;

          const stats = initCodingStats(species.baseStats);
          const topStat = (Object.entries(stats) as Array<[keyof CodingStats, number]>).sort(
            (a, b) => b[1] - a[1],
          )[0]!;

          lines.push(
            `  ${i + 1}. **${species.name}** (${formatTypes(species.types)})`,
            `     "${species.description}"`,
            `     Best stat: ${topStat[0].toUpperCase()} (${topStat[1]})`,
            "",
          );
        }

        lines.push("Call buddy_starter with choice: 1, 2, or 3 to pick your partner!");

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // Choice provided — create the starter
      const chosenIndex = params.choice - 1;
      const chosenId = starterIds[chosenIndex]!;
      const species = POKEMON_BY_ID.get(chosenId);

      if (!species) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Something went wrong looking up that Pokemon. Please try again.",
            },
          ],
          isError: true,
        };
      }

      const starter: OwnedPokemon = {
        id: generateUUID(),
        pokemonId: species.id,
        nickname: null,
        level: STARTER_LEVEL,
        currentXp: 0,
        totalXp: 0,
        codingStats: initCodingStats(species.baseStats),
        happiness: 70,
        caughtAt: new Date().toISOString(),
        evolvedAt: null,
        isActive: true,
        personality: species.description,
        shiny: false,
        isStarter: true,
      };

      const trainerId = generateUUID();
      const trainerName = "Trainer";
      await stateManager.initializePlayer(trainerId, trainerName, starter);
      await stateManager.writeStatus();
      await clearStarterOptions();

      const lines: string[] = [];

      lines.push(
        `Congratulations! You chose **${species.name}**!`,
        "",
        `  Species: ${species.name} (#${String(species.id).padStart(3, "0")})`,
        `  Type: ${formatTypes(species.types)}`,
        `  Level: ${STARTER_LEVEL}`,
        `  Exp Group: ${species.expGroup}`,
        "",
        `  "${species.description}"`,
        "",
        `Your coding journey begins now. Write code, fix bugs, and watch ${species.name} grow!`,
        "",
        "Use buddy_show to see your Pokemon, or buddy_pet to bond with them.",
      );

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
