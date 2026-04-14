#!/usr/bin/env bun
/**
 * Download pokemon-colorscripts from GitHub.
 *
 * Fetches pre-rendered ANSI art .txt files for all 905 Pokemon (Gen 1-8)
 * from the pokemon-colorscripts repository.
 *
 * Usage:
 *   bun run scripts/download-colorscripts.ts           # incremental (skip existing)
 *   bun run scripts/download-colorscripts.ts --force    # re-download all
 *   bun run scripts/download-colorscripts.ts 1 25 150   # specific IDs only
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { POKEDEX } from "../src/engine/pokemon-data.js";

// ── Configuration ─────────────────────────────────────────────

const PROJECT_ROOT = join(import.meta.dir, "..");
const COLORSCRIPT_DIR = join(PROJECT_ROOT, "sprites", "colorscripts");

const BASE_URL =
  "https://raw.githubusercontent.com/tageraf1n/pokemon-colorscripts/main/colorscripts";

const TOTAL_POKEMON = POKEDEX.length;

const SIZES = ["small"] as const;
type Size = (typeof SIZES)[number];

// ── Name Normalization ───────────────────────────────────────

/**
 * Special name overrides for the colorscripts repo.
 * The repo uses specific naming conventions that differ from PokeAPI names.
 */
const NAME_OVERRIDES: ReadonlyMap<number, string> = new Map([
  [29, "nidoran-f"],
  [32, "nidoran-m"],
  [83, "farfetchd"],
  [122, "mr.-mime"],
  [386, "deoxys-normal"],
  [413, "wormadam-plant"],
  [487, "giratina-altered"],
  [492, "shaymin-land"],
  [641, "tornadus-incarnate"],
  [642, "thundurus-incarnate"],
  [645, "landorus-incarnate"],
  [647, "keldeo-ordinary"],
  [648, "meloetta-aria"],
  [681, "aegislash-shield"],
  [710, "pumpkaboo-average"],
  [711, "gourgeist-average"],
  [718, "zygarde-50"],
  [741, "oricorio-baile"],
  [745, "lycanroc-midday"],
  [746, "wishiwashi-solo"],
  [774, "minior-red-meteor"],
  [778, "mimikyu-disguised"],
  [849, "toxtricity-amped"],
  [866, "mr.-rime"],
  [875, "eiscue-ice"],
  [876, "indeedee-male"],
  [877, "morpeko-full-belly"],
  [892, "urshifu-single-strike"],
  [902, "basculegion-male"],
  [905, "enamorus-incarnate"],
  [916, "oinkologne-male"],
  [925, "maushold-family-of-four"],
  [931, "squawkabilly-green-plumage"],
  [964, "palafin-zero"],
  [978, "tatsugiri-curly"],
  [1007, "koraidon"],
  [1008, "miraidon"],
  [1017, "ogerpon-teal-mask"],
]);

/**
 * Normalize a Pokemon name to match the colorscripts repo filename convention.
 * Handles special characters, spaces, and form-specific naming.
 */
function normalizeSpriteName(name: string): string {
  return name
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/'/g, "")
    .replace(/\. /g, "-")
    .replace(/: /g, "-")
    .replace(/ /g, "-");
}

// ── Name Lookup ──────────────────────────────────────────────

/** Build name lookup from POKEDEX */
const POKEMON_NAMES: ReadonlyMap<number, string> = new Map(
  POKEDEX.map((p) => [p.id, normalizeSpriteName(p.name)]),
);

// ── Download Logic ────────────────────────────────────────────

/** Get the remote filename for a Pokemon in the colorscripts repo. */
function getRemoteName(id: number): string {
  return NAME_OVERRIDES.get(id) ?? POKEMON_NAMES.get(id) ?? `pokemon-${id}`;
}

/** Get the local filename for a Pokemon. */
function getLocalName(id: number): string {
  const name = POKEMON_NAMES.get(id) ?? `pokemon-${id}`;
  return `${id}-${name}.txt`;
}

/** Download a single colorscript file. */
async function downloadColorscript(
  id: number,
  size: Size,
  force: boolean,
): Promise<"downloaded" | "skipped" | "failed"> {
  const localName = getLocalName(id);
  const outputPath = join(COLORSCRIPT_DIR, size, localName);

  if (!force && existsSync(outputPath)) {
    return "skipped";
  }

  const remoteName = getRemoteName(id);
  const url = `${BASE_URL}/${size}/regular/${remoteName}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      // Try without form suffix (some Pokemon don't have form-specific files)
      if (resp.status === 404 && remoteName.includes("-")) {
        const baseName = remoteName.split("-")[0];
        const fallbackUrl = `${BASE_URL}/${size}/regular/${baseName}`;
        const fallbackResp = await fetch(fallbackUrl);
        if (fallbackResp.ok) {
          const text = await fallbackResp.text();
          writeFileSync(outputPath, text, "utf-8");
          return "downloaded";
        }
      }
      return "failed";
    }

    const text = await resp.text();
    writeFileSync(outputPath, text, "utf-8");
    return "downloaded";
  } catch {
    return "failed";
  }
}

// ── CLI & Main ────────────────────────────────────────────────

function parseArgs(): { force: boolean; ids: number[] } {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const ids = args
    .filter((a) => a !== "--force")
    .map((a) => parseInt(a, 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= TOTAL_POKEMON);

  return { force, ids };
}

async function main(): Promise<void> {
  console.log("\n  Claudemon Colorscript Downloader\n");

  const { force, ids: requestedIds } = parseArgs();
  const targetIds =
    requestedIds.length > 0 ? requestedIds : Array.from({ length: TOTAL_POKEMON }, (_, i) => i + 1);

  console.log(
    `  Downloading ${targetIds.length} sprite(s)${force ? " (force)" : " (incremental)"}`,
  );

  // Ensure output directories exist
  for (const size of SIZES) {
    mkdirSync(join(COLORSCRIPT_DIR, size), { recursive: true });
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  // Download in batches of 10 for parallelism
  for (let batch = 0; batch < targetIds.length; batch += 10) {
    const batchIds = targetIds.slice(batch, batch + 10);
    const promises = [];

    for (const id of batchIds) {
      for (const size of SIZES) {
        promises.push(
          downloadColorscript(id, size, force).then((result) => {
            switch (result) {
              case "downloaded":
                downloaded++;
                break;
              case "skipped":
                skipped++;
                break;
              case "failed":
                failed++;
                break;
            }
          }),
        );
      }
    }

    await Promise.all(promises);

    if ((batch + 10) % 100 === 0 || batch + 10 >= targetIds.length) {
      const progress = Math.min(batch + 10, targetIds.length);
      console.log(
        `  [${progress}/${targetIds.length}] downloaded: ${downloaded}, skipped: ${skipped}, failed: ${failed}`,
      );
    }
  }

  console.log(`\n  Done! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
