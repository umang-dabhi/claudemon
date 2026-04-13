/**
 * Sprite loader for pokemon-colorscripts.
 * Reads pre-rendered ANSI art from small .txt files.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { POKEMON_BY_ID } from "../engine/pokemon-data.js";

const COLORSCRIPT_DIR = join(import.meta.dir, "../../sprites/colorscripts/small");

const cache = new Map<number, string>();

/** Normalize Pokemon name to match colorscript filename convention */
function normalizeSpriteName(name: string): string {
  return name
    .toLowerCase()
    .replace("♀", "-f")
    .replace("♂", "-m")
    .replace("'", "")
    .replace(". ", "-")
    .replace(" ", "-");
}

/** Load a small colorscript sprite (~11 lines). Used everywhere. */
export function loadSmallSprite(pokemonId: number): string | null {
  const cached = cache.get(pokemonId);
  if (cached !== undefined) return cached;

  const pokemon = POKEMON_BY_ID.get(pokemonId);
  if (!pokemon) return null;

  const fileName = `${pokemonId}-${normalizeSpriteName(pokemon.name)}.txt`;
  const filePath = join(COLORSCRIPT_DIR, fileName);

  if (!existsSync(filePath)) return null;

  try {
    const content = readFileSync(filePath, "utf-8");
    cache.set(pokemonId, content);
    return content;
  } catch {
    return null;
  }
}
