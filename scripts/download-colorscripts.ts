#!/usr/bin/env bun
/**
 * Download pokemon-colorscripts from GitHub.
 *
 * Fetches pre-rendered ANSI art .txt files for Gen 1 Pokemon
 * from the pokemon-colorscripts repository.
 *
 * Usage:
 *   bun run scripts/download-colorscripts.ts           # incremental (skip existing)
 *   bun run scripts/download-colorscripts.ts --force    # re-download all
 *   bun run scripts/download-colorscripts.ts 1 25 150   # specific IDs only
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ── Configuration ─────────────────────────────────────────────

const PROJECT_ROOT = join(import.meta.dir, "..");
const COLORSCRIPT_DIR = join(PROJECT_ROOT, "sprites", "colorscripts");

const BASE_URL =
  "https://raw.githubusercontent.com/tageraf1n/pokemon-colorscripts/main/colorscripts";

const TOTAL_GEN1 = 151;

const SIZES = ["small", "large"] as const;
type Size = (typeof SIZES)[number];

// ── Name Mapping ──────────────────────────────────────────────

/**
 * Pokemon names as they appear in the colorscripts repository.
 * Most match the standard lowercase name, but a few have special forms.
 */
const NAME_OVERRIDES: ReadonlyMap<number, string> = new Map([
  [29, "nidoran-f"],
  [32, "nidoran-m"],
  [83, "farfetchd"],
  [122, "mr.-mime"],
]);

/**
 * Gen 1 Pokemon names indexed by ID (1-151).
 * Used for both the download URL and the local filename.
 */
const POKEMON_NAMES: ReadonlyMap<number, string> = new Map([
  [1, "bulbasaur"],
  [2, "ivysaur"],
  [3, "venusaur"],
  [4, "charmander"],
  [5, "charmeleon"],
  [6, "charizard"],
  [7, "squirtle"],
  [8, "wartortle"],
  [9, "blastoise"],
  [10, "caterpie"],
  [11, "metapod"],
  [12, "butterfree"],
  [13, "weedle"],
  [14, "kakuna"],
  [15, "beedrill"],
  [16, "pidgey"],
  [17, "pidgeotto"],
  [18, "pidgeot"],
  [19, "rattata"],
  [20, "raticate"],
  [21, "spearow"],
  [22, "fearow"],
  [23, "ekans"],
  [24, "arbok"],
  [25, "pikachu"],
  [26, "raichu"],
  [27, "sandshrew"],
  [28, "sandslash"],
  [29, "nidoran-f"],
  [30, "nidorina"],
  [31, "nidoqueen"],
  [32, "nidoran-m"],
  [33, "nidorino"],
  [34, "nidoking"],
  [35, "clefairy"],
  [36, "clefable"],
  [37, "vulpix"],
  [38, "ninetales"],
  [39, "jigglypuff"],
  [40, "wigglytuff"],
  [41, "zubat"],
  [42, "golbat"],
  [43, "oddish"],
  [44, "gloom"],
  [45, "vileplume"],
  [46, "paras"],
  [47, "parasect"],
  [48, "venonat"],
  [49, "venomoth"],
  [50, "diglett"],
  [51, "dugtrio"],
  [52, "meowth"],
  [53, "persian"],
  [54, "psyduck"],
  [55, "golduck"],
  [56, "mankey"],
  [57, "primeape"],
  [58, "growlithe"],
  [59, "arcanine"],
  [60, "poliwag"],
  [61, "poliwhirl"],
  [62, "poliwrath"],
  [63, "abra"],
  [64, "kadabra"],
  [65, "alakazam"],
  [66, "machop"],
  [67, "machoke"],
  [68, "machamp"],
  [69, "bellsprout"],
  [70, "weepinbell"],
  [71, "victreebel"],
  [72, "tentacool"],
  [73, "tentacruel"],
  [74, "geodude"],
  [75, "graveler"],
  [76, "golem"],
  [77, "ponyta"],
  [78, "rapidash"],
  [79, "slowpoke"],
  [80, "slowbro"],
  [81, "magnemite"],
  [82, "magneton"],
  [83, "farfetchd"],
  [84, "doduo"],
  [85, "dodrio"],
  [86, "seel"],
  [87, "dewgong"],
  [88, "grimer"],
  [89, "muk"],
  [90, "shellder"],
  [91, "cloyster"],
  [92, "gastly"],
  [93, "haunter"],
  [94, "gengar"],
  [95, "onix"],
  [96, "drowzee"],
  [97, "hypno"],
  [98, "krabby"],
  [99, "kingler"],
  [100, "voltorb"],
  [101, "electrode"],
  [102, "exeggcute"],
  [103, "exeggutor"],
  [104, "cubone"],
  [105, "marowak"],
  [106, "hitmonlee"],
  [107, "hitmonchan"],
  [108, "lickitung"],
  [109, "koffing"],
  [110, "weezing"],
  [111, "rhyhorn"],
  [112, "rhydon"],
  [113, "chansey"],
  [114, "tangela"],
  [115, "kangaskhan"],
  [116, "horsea"],
  [117, "seadra"],
  [118, "goldeen"],
  [119, "seaking"],
  [120, "staryu"],
  [121, "starmie"],
  [122, "mr-mime"],
  [123, "scyther"],
  [124, "jynx"],
  [125, "electabuzz"],
  [126, "magmar"],
  [127, "pinsir"],
  [128, "tauros"],
  [129, "magikarp"],
  [130, "gyarados"],
  [131, "lapras"],
  [132, "ditto"],
  [133, "eevee"],
  [134, "vaporeon"],
  [135, "jolteon"],
  [136, "flareon"],
  [137, "porygon"],
  [138, "omanyte"],
  [139, "omastar"],
  [140, "kabuto"],
  [141, "kabutops"],
  [142, "aerodactyl"],
  [143, "snorlax"],
  [144, "articuno"],
  [145, "zapdos"],
  [146, "moltres"],
  [147, "dratini"],
  [148, "dragonair"],
  [149, "dragonite"],
  [150, "mewtwo"],
  [151, "mew"],
]);

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
      console.error(`  [FAIL] #${id} ${remoteName} (${size}): HTTP ${resp.status}`);
      return "failed";
    }

    const text = await resp.text();
    writeFileSync(outputPath, text, "utf-8");
    return "downloaded";
  } catch (err) {
    console.error(`  [FAIL] #${id} ${remoteName} (${size}): ${String(err)}`);
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
    .filter((n) => !isNaN(n) && n >= 1 && n <= TOTAL_GEN1);

  return { force, ids };
}

async function main(): Promise<void> {
  console.log("\n  Claudemon Colorscript Downloader\n");

  const { force, ids: requestedIds } = parseArgs();
  const targetIds =
    requestedIds.length > 0 ? requestedIds : Array.from({ length: TOTAL_GEN1 }, (_, i) => i + 1);

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

  for (const id of targetIds) {
    for (const size of SIZES) {
      const result = await downloadColorscript(id, size, force);
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
    }

    if (downloaded > 0 && downloaded % 20 === 0) {
      const name = POKEMON_NAMES.get(id) ?? `pokemon-${id}`;
      console.log(`  [${downloaded}] latest: #${id} ${name}`);
    }
  }

  console.log(`\n  Done! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
