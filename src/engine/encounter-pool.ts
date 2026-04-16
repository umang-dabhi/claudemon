/**
 * Pre-built encounter pools — computed once at module load.
 * Provides all base-stage wild-eligible Pokemon grouped by rarity,
 * with helper lookups by type and generation for smart weighting.
 */

import type { PokemonType, RarityTier } from "./types.js";
import { POKEDEX } from "./pokemon-data.js";
import { EVOLUTION_CHAINS } from "./evolution-data.js";

// ── Identify evolved Pokemon (targets of any evolution link) ──

const EVOLVED_IDS: ReadonlySet<number> = new Set(
  EVOLUTION_CHAINS.flatMap((chain) => chain.links.map((link) => link.to)),
);

/** Returns true if the Pokemon is the base stage of its evolution chain. */
function isBaseStage(pokemonId: number): boolean {
  return !EVOLVED_IDS.has(pokemonId);
}

// ── Rarity tiers eligible for wild encounters ─────────────────

const WILD_RARITIES: ReadonlySet<RarityTier> = new Set(["common", "uncommon", "rare"]);

// ── Generation ranges ─────────────────────────────────────────

export const GEN_RANGES: readonly { gen: number; start: number; end: number }[] = [
  { gen: 1, start: 1, end: 151 },
  { gen: 2, start: 152, end: 251 },
  { gen: 3, start: 252, end: 386 },
  { gen: 4, start: 387, end: 493 },
  { gen: 5, start: 494, end: 649 },
  { gen: 6, start: 650, end: 721 },
  { gen: 7, start: 722, end: 809 },
  { gen: 8, start: 810, end: 905 },
];

/** Get the generation number for a Pokemon ID. */
export function getGeneration(pokemonId: number): number {
  for (const { gen, start, end } of GEN_RANGES) {
    if (pokemonId >= start && pokemonId <= end) return gen;
  }
  return 1; // fallback
}

// ── Build pools at module load ────────────────────────────────

export interface RarityPool {
  readonly common: readonly number[];
  readonly uncommon: readonly number[];
  readonly rare: readonly number[];
}

/** All wild-eligible base-stage Pokemon, grouped by rarity. */
function buildAllPool(): RarityPool {
  const common: number[] = [];
  const uncommon: number[] = [];
  const rare: number[] = [];

  for (const pokemon of POKEDEX) {
    if (!isBaseStage(pokemon.id)) continue;
    if (!WILD_RARITIES.has(pokemon.rarity)) continue;

    const rarity = pokemon.rarity as "common" | "uncommon" | "rare";
    if (rarity === "common") common.push(pokemon.id);
    else if (rarity === "uncommon") uncommon.push(pokemon.id);
    else rare.push(pokemon.id);
  }

  return {
    common: Object.freeze(common),
    uncommon: Object.freeze(uncommon),
    rare: Object.freeze(rare),
  };
}

/** Type-indexed pools for legacy compatibility and type lookups. */
function buildTypePools(): ReadonlyMap<PokemonType, RarityPool> {
  const pools = new Map<PokemonType, { common: number[]; uncommon: number[]; rare: number[] }>();

  for (const pokemon of POKEDEX) {
    if (!isBaseStage(pokemon.id)) continue;
    if (!WILD_RARITIES.has(pokemon.rarity)) continue;

    for (const pokemonType of pokemon.types) {
      if (pokemonType === undefined) continue;

      let pool = pools.get(pokemonType);
      if (!pool) {
        pool = { common: [], uncommon: [], rare: [] };
        pools.set(pokemonType, pool);
      }

      const rarity = pokemon.rarity as "common" | "uncommon" | "rare";
      pool[rarity].push(pokemon.id);
    }
  }

  const frozen = new Map<PokemonType, RarityPool>();
  for (const [type, pool] of pools) {
    frozen.set(type, {
      common: Object.freeze(pool.common),
      uncommon: Object.freeze(pool.uncommon),
      rare: Object.freeze(pool.rare),
    });
  }

  return frozen;
}

/** Map of PokemonType to Pokemon IDs of that type, grouped by rarity. */
export const TYPE_POOLS: ReadonlyMap<PokemonType, RarityPool> = buildTypePools();

/** All wild-eligible base-stage Pokemon, grouped by rarity (type-agnostic). */
export const ALL_WILD_POOL: RarityPool = buildAllPool();
