/**
 * Transform the PokeAPI JSON into TypeScript source files.
 * Reads /tmp/pokemon-data.json and writes pokemon-data.ts and evolution-data.ts.
 *
 * Usage: bun run scripts/transform-pokemon-data.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_DIR = join(__dirname, "../src/engine");

const raw = JSON.parse(readFileSync("/tmp/pokemon-data.json", "utf-8"));

interface RawPokemon {
  id: number;
  name: string;
  types: string[];
  baseStats: { hp: number; attack: number; defense: number; speed: number; special: number };
  expGroup: string;
  evolutionChainId: number;
  rarity: string;
  catchRate: number;
  description: string;
}

interface RawEvolution {
  id: number;
  links: { from: number; to: number; method: { type: string; level?: number } }[];
}

// ── Generate pokemon-data.ts ──────────────────────────────

function generatePokemonData(pokemon: RawPokemon[]): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * Complete Pokedex — all 1025 Pokemon with actual base stats,");
  lines.push(" * catch rates, and coding-themed descriptions.");
  lines.push(" * Auto-generated from PokeAPI data.");
  lines.push(" */");
  lines.push("");
  lines.push('import type { Pokemon } from "./types.js";');
  lines.push("");
  lines.push("export const POKEDEX: readonly Pokemon[] = [");

  // Group by generation for readability
  const GEN_RANGES = [
    { name: "Gen 1 — Kanto", start: 1, end: 151 },
    { name: "Gen 2 — Johto", start: 152, end: 251 },
    { name: "Gen 3 — Hoenn", start: 252, end: 386 },
    { name: "Gen 4 — Sinnoh", start: 387, end: 493 },
    { name: "Gen 5 — Unova", start: 494, end: 649 },
    { name: "Gen 6 — Kalos", start: 650, end: 721 },
    { name: "Gen 7 — Alola", start: 722, end: 809 },
    { name: "Gen 8 — Galar", start: 810, end: 905 },
    { name: "Gen 9 — Paldea", start: 906, end: 1025 },
  ];

  for (const gen of GEN_RANGES) {
    lines.push("");
    lines.push(
      `  // ── ${gen.name} (#${String(gen.start).padStart(3, "0")}–#${String(gen.end).padStart(3, "0")}) ──`,
    );

    const genPokemon = pokemon.filter((p) => p.id >= gen.start && p.id <= gen.end);

    for (const p of genPokemon) {
      const typesStr =
        p.types.length === 2 ? `["${p.types[0]}", "${p.types[1]}"]` : `["${p.types[0]}"]`;

      // Escape description quotes
      const desc = p.description.replace(/"/g, '\\"');

      lines.push("  {");
      lines.push(`    id: ${p.id},`);
      lines.push(`    name: "${p.name}",`);
      lines.push(`    types: ${typesStr},`);
      lines.push(
        `    baseStats: { hp: ${p.baseStats.hp}, attack: ${p.baseStats.attack}, defense: ${p.baseStats.defense}, speed: ${p.baseStats.speed}, special: ${p.baseStats.special} },`,
      );
      lines.push(`    expGroup: "${p.expGroup}",`);
      lines.push(`    evolutionChainId: ${p.evolutionChainId},`);
      lines.push(`    rarity: "${p.rarity}",`);
      lines.push(`    catchRate: ${p.catchRate},`);
      lines.push(`    description: "${desc}",`);
      lines.push("  },");
    }
  }

  lines.push("] as const satisfies readonly Pokemon[];");
  lines.push("");
  lines.push("/** Lookup map: Pokemon ID → Pokemon data. Built once at module load. */");
  lines.push("export const POKEMON_BY_ID: ReadonlyMap<number, Pokemon> = new Map(");
  lines.push("  POKEDEX.map((p) => [p.id, p]),");
  lines.push(");");
  lines.push("");

  return lines.join("\n");
}

// ── Generate evolution-data.ts ────────────────────────────

function generateEvolutionData(chains: RawEvolution[]): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * Evolution chain data for all Pokemon.");
  lines.push(" * Auto-generated from PokeAPI data.");
  lines.push(" */");
  lines.push("");
  lines.push('import type { EvolutionChain } from "./types.js";');
  lines.push("");
  lines.push("export const EVOLUTION_CHAINS: readonly EvolutionChain[] = [");

  for (const chain of chains) {
    const linksStr = chain.links
      .map((link) => {
        if (link.method.type === "level" && link.method.level) {
          return `    { from: ${link.from}, to: ${link.to}, method: { type: "level", level: ${link.method.level} } }`;
        }
        return `    { from: ${link.from}, to: ${link.to}, method: { type: "level", level: 30 } }`;
      })
      .join(",\n");

    lines.push("  {");
    lines.push(`    id: ${chain.id},`);
    lines.push("    links: [");
    lines.push(linksStr + ",");
    lines.push("    ],");
    lines.push("  },");
  }

  lines.push("] as const satisfies readonly EvolutionChain[];");
  lines.push("");
  lines.push("/** Get evolution links from a given Pokemon ID. */");
  lines.push("export function getEvolutionLinks(pokemonId: number) {");
  lines.push("  const results = [];");
  lines.push("  for (const chain of EVOLUTION_CHAINS) {");
  lines.push("    for (const link of chain.links) {");
  lines.push("      if (link.from === pokemonId) {");
  lines.push("        results.push(link);");
  lines.push("      }");
  lines.push("    }");
  lines.push("  }");
  lines.push("  return results;");
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

// ── Write files ───────────────────────────────────────────

const pokemonTs = generatePokemonData(raw.pokemon as RawPokemon[]);
const evolutionTs = generateEvolutionData(raw.evolutionChains as RawEvolution[]);

writeFileSync(join(SRC_DIR, "pokemon-data.ts"), pokemonTs);
writeFileSync(join(SRC_DIR, "evolution-data.ts"), evolutionTs);

console.log(`Written: ${(raw.pokemon as RawPokemon[]).length} Pokemon to pokemon-data.ts`);
console.log(
  `Written: ${(raw.evolutionChains as RawEvolution[]).length} evolution chains to evolution-data.ts`,
);
