/**
 * Pre-built encounter pools — computed once at module load.
 * Maps each PokemonType to base-stage Pokemon IDs grouped by rarity.
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

// ── Build pools at module load ────────────────────────────────

interface RarityPool {
  readonly common: readonly number[];
  readonly uncommon: readonly number[];
  readonly rare: readonly number[];
}

function buildTypePools(): ReadonlyMap<PokemonType, RarityPool> {
  const pools = new Map<PokemonType, { common: number[]; uncommon: number[]; rare: number[] }>();

  for (const pokemon of POKEDEX) {
    // Only base-stage Pokemon appear in wild encounters
    if (!isBaseStage(pokemon.id)) continue;

    // Legendary and mythical never appear in wild encounters
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

  // Freeze all inner arrays for immutability
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
