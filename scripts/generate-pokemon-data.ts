/**
 * Generate pokemon-data.ts and evolution-data.ts from PokeAPI.
 * One-time script to expand from 151 to 1025 Pokemon.
 *
 * Usage: bun run scripts/generate-pokemon-data.ts
 *
 * Fetches from PokeAPI:
 *   - Pokemon species data (name, types, base stats, exp group, catch rate)
 *   - Evolution chain data
 *
 * Outputs to stdout a JSON that can be transformed into TypeScript.
 */

const TOTAL = 1025;
const API_BASE = "https://pokeapi.co/api/v2";

// ── Type Mapping ──────────────────────────────────────────
// PokeAPI uses lowercase types, we need Title Case
const TYPE_MAP: Record<string, string> = {
  normal: "Normal",
  fire: "Fire",
  water: "Water",
  electric: "Electric",
  grass: "Grass",
  ice: "Ice",
  fighting: "Fighting",
  poison: "Poison",
  ground: "Ground",
  flying: "Flying",
  psychic: "Psychic",
  bug: "Bug",
  rock: "Rock",
  ghost: "Ghost",
  dragon: "Dragon",
  steel: "Steel",
  dark: "Dark",
  fairy: "Fairy",
};

// ── Exp Group Mapping ─────────────────────────────────────
const EXP_GROUP_MAP: Record<string, string> = {
  fast: "fast",
  "medium-fast": "medium_fast",
  medium: "medium_fast",
  "medium-slow": "medium_slow",
  slow: "slow",
  "slow-then-very-fast": "fast",
  "fast-then-very-slow": "slow",
  erratic: "fast",
  fluctuating: "medium_slow",
};

// ── Rarity from catch rate ────────────────────────────────
function getRarity(catchRate: number, isLegendary: boolean, isMythical: boolean): string {
  if (isMythical) return "mythical";
  if (isLegendary) return "legendary";
  if (catchRate >= 150) return "common";
  if (catchRate >= 60) return "uncommon";
  return "rare";
}

// ── Gen 1 uses "special" stat; Gen 2+ split into sp_atk and sp_def ──
// We use max(sp_atk, sp_def) as the "special" stat for consistency
function getSpecialStat(stats: { name: string; base_stat: number }[]): number {
  const spAtk = stats.find((s: { name: string }) => s.name === "special-attack")?.base_stat ?? 0;
  const spDef = stats.find((s: { name: string }) => s.name === "special-defense")?.base_stat ?? 0;
  return Math.max(spAtk, spDef);
}

// ── Coding-themed descriptions by type ────────────────────
const TYPE_DESCRIPTIONS: Record<string, string[]> = {
  Normal: [
    "Writes clean, readable code that just works.",
    "A reliable teammate in any codebase.",
    "Keeps things simple and maintainable.",
    "The everyday workhorse of any development team.",
    "Solid fundamentals, no unnecessary complexity.",
  ],
  Fire: [
    "Burns through bugs with blazing speed.",
    "Compiles so fast the CPU starts sweating.",
    "Hotfixes deployed before you finish your coffee.",
    "Its CI pipeline is always on fire — in a good way.",
    "Rewrites legacy code with explosive energy.",
  ],
  Water: [
    "Flows through complex data pipelines with ease.",
    "Streams data like a well-configured message queue.",
    "Cools down heated production incidents.",
    "Its code flows naturally from function to function.",
    "Handles backpressure like a pro.",
  ],
  Electric: [
    "Lightning-fast response times in production.",
    "Sparks innovation with every commit.",
    "Powers through async operations effortlessly.",
    "Charges up the team with electrifying demos.",
    "Its event loop never blocks.",
  ],
  Grass: [
    "Grows features organically from a solid foundation.",
    "Its codebase flourishes with careful nurturing.",
    "Plants the seeds for sustainable architecture.",
    "Branches out into new features with natural ease.",
    "Photosynthesizes coffee into clean code.",
  ],
  Ice: [
    "Freezes bugs in their tracks before production.",
    "Keeps cool under tight deployment deadlines.",
    "Its test suite is ice-cold — nothing gets through.",
    "Crystallizes complex requirements into clear specs.",
    "Preserves backward compatibility like a glacier.",
  ],
  Fighting: [
    "Fights through technical debt with determination.",
    "Never backs down from a complex refactor.",
    "Punches through blockers in code review.",
    "Trains hard on algorithmic challenges daily.",
    "Its PR reviews pack a punch.",
  ],
  Poison: [
    "Finds toxic code patterns and eliminates them.",
    "Injects helpful logging into legacy systems.",
    "Its code reviews are sharp but constructive.",
    "Detoxifies spaghetti code into clean modules.",
    "Knows every anti-pattern by heart.",
  ],
  Ground: [
    "Builds rock-solid foundations for any project.",
    "Grounded in best practices and design patterns.",
    "Digs deep into root cause analysis.",
    "Lays the groundwork for scalable systems.",
    "Stable as the earth beneath your server rack.",
  ],
  Flying: [
    "Deploys to the cloud with soaring confidence.",
    "Zooms through code reviews at altitude.",
    "Its abstractions reach impressive heights.",
    "Migrates databases without breaking a wing.",
    "Floats above complexity with elegant solutions.",
  ],
  Psychic: [
    "Predicts bugs before they even appear in code.",
    "Reads stack traces like reading minds.",
    "Mentally models complex distributed systems.",
    "Its architecture decisions are eerily prescient.",
    "Debugs production issues through pure intuition.",
  ],
  Bug: [
    "Finds bugs nobody else can spot.",
    "Crawls through every edge case methodically.",
    "Its test coverage is thorough and persistent.",
    "Metamorphoses codebases through careful refactoring.",
    "Surprisingly powerful despite its small size.",
  ],
  Rock: [
    "Builds unbreakable infrastructure that lasts.",
    "Solid as a load-bearing wall in the architecture.",
    "Withstands the heaviest traffic spikes.",
    "Its code is hardened against every attack vector.",
    "Dependable like bedrock under your deployment.",
  ],
  Ghost: [
    "Haunts legacy codebases seeking forgotten bugs.",
    "Phases through firewalls during security audits.",
    "Its code is invisible until you need it most.",
    "Debugs phantom issues in production at 3 AM.",
    "Appears silently in git blame for critical fixes.",
  ],
  Dragon: [
    "Commands massive distributed systems with authority.",
    "Its codebases are legendary in scale and power.",
    "Breathes fire into stale, unmaintained projects.",
    "A rare sight, but unstoppable when deployed.",
    "Hoards knowledge of ancient APIs and protocols.",
  ],
  Steel: [
    "Forges bulletproof APIs that never break.",
    "Its type system is as rigid as steel.",
    "Hardens every endpoint against injection attacks.",
    "Builds infrastructure that withstands any load.",
    "Tempered by years of production hardening.",
  ],
  Dark: [
    "Thrives in late-night debugging sessions.",
    "Masters the dark arts of regex and bitwise ops.",
    "Finds vulnerabilities hidden in the shadows.",
    "Its code works in ways few can understand.",
    "Operates best when everyone else has logged off.",
  ],
  Fairy: [
    "Makes complex code look magically simple.",
    "Enchants users with delightful UX polish.",
    "Sprinkles syntactic sugar that actually helps.",
    "Transforms ugly hacks into elegant solutions.",
    "Its code reviews leave everyone feeling enchanted.",
  ],
};

function getDescription(types: string[]): string {
  const primaryType = types[0] ?? "Normal";
  const descriptions = TYPE_DESCRIPTIONS[primaryType] ?? TYPE_DESCRIPTIONS["Normal"]!;
  return descriptions[Math.floor(Math.random() * descriptions.length)]!;
}

// ── Fetch with retry ──────────────────────────────────────
async function fetchJSON(url: string, retries = 3): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────
interface PokemonEntry {
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

interface EvolutionEntry {
  id: number;
  links: { from: number; to: number; method: { type: string; level?: number } }[];
}

async function main() {
  console.error("Fetching Pokemon data from PokeAPI...");

  const pokemon: PokemonEntry[] = [];
  const evolutionChains: Map<number, EvolutionEntry> = new Map();
  const speciesChainMap: Map<number, number> = new Map(); // pokemonId -> chainId

  // Fetch in batches of 50
  for (let batch = 0; batch < TOTAL; batch += 50) {
    const end = Math.min(batch + 50, TOTAL);
    console.error(`  Fetching Pokemon ${batch + 1}-${end}...`);

    const promises = [];
    for (let id = batch + 1; id <= end; id++) {
      promises.push(
        (async () => {
          // Fetch pokemon data (types, stats)
          const pData = (await fetchJSON(`${API_BASE}/pokemon/${id}`)) as {
            id: number;
            name: string;
            types: { type: { name: string } }[];
            stats: { stat: { name: string }; base_stat: number }[];
          } | null;
          if (!pData) {
            console.error(`    Skipping #${id} (not found)`);
            return;
          }

          // Fetch species data (catch rate, growth rate, evolution chain, legendary/mythical)
          const sData = (await fetchJSON(`${API_BASE}/pokemon-species/${id}`)) as {
            capture_rate: number;
            growth_rate: { name: string };
            evolution_chain: { url: string };
            is_legendary: boolean;
            is_mythical: boolean;
          } | null;
          if (!sData) {
            console.error(`    Skipping species #${id}`);
            return;
          }

          // Extract evolution chain ID from URL
          const chainUrl = sData.evolution_chain?.url ?? "";
          const chainIdMatch = chainUrl.match(/\/evolution-chain\/(\d+)/);
          const chainId = chainIdMatch ? parseInt(chainIdMatch[1]!, 10) : 0;

          speciesChainMap.set(id, chainId);

          // Map types
          const types = pData.types
            .sort(
              (
                a: { type: { name: string }; slot?: number },
                b: { type: { name: string }; slot?: number },
              ) => ((a as { slot?: number }).slot ?? 0) - ((b as { slot?: number }).slot ?? 0),
            )
            .map((t: { type: { name: string } }) => TYPE_MAP[t.type.name] ?? "Normal")
            .filter((t): t is string => !!t);

          // Map stats
          const statMap: Record<string, number> = {};
          for (const s of pData.stats) {
            statMap[(s as { stat: { name: string } }).stat.name] = (
              s as { base_stat: number }
            ).base_stat;
          }

          // Capitalize name
          const name = pData.name
            .split("-")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("-");
          // Special name fixes
          const fixedName = name
            .replace(/^Ho-Oh$/i, "Ho-Oh")
            .replace(/^Mr-Mime$/i, "Mr. Mime")
            .replace(/^Mr-Rime$/i, "Mr. Rime")
            .replace(/^Mime-Jr$/i, "Mime Jr.")
            .replace(/^Type-Null$/i, "Type: Null")
            .replace(/^Nidoran-F$/i, "Nidoran\u2640")
            .replace(/^Nidoran-M$/i, "Nidoran\u2642")
            .replace(/^Farfetchd$/i, "Farfetch'd")
            .replace(/^Sirfetchd$/i, "Sirfetch'd");

          const entry: PokemonEntry = {
            id,
            name: fixedName,
            types: types.slice(0, 2),
            baseStats: {
              hp: statMap["hp"] ?? 50,
              attack: statMap["attack"] ?? 50,
              defense: statMap["defense"] ?? 50,
              speed: statMap["speed"] ?? 50,
              special: getSpecialStat(
                pData.stats.map((s: { stat: { name: string }; base_stat: number }) => ({
                  name: s.stat.name,
                  base_stat: s.base_stat,
                })),
              ),
            },
            expGroup: EXP_GROUP_MAP[sData.growth_rate?.name ?? "medium-fast"] ?? "medium_fast",
            evolutionChainId: chainId,
            rarity: getRarity(sData.capture_rate, sData.is_legendary, sData.is_mythical),
            catchRate: Math.min(255, Math.max(1, sData.capture_rate)),
            description: getDescription(types),
          };

          pokemon.push(entry);
        })(),
      );
    }

    await Promise.all(promises);
  }

  // Sort by ID
  pokemon.sort((a, b) => a.id - b.id);
  console.error(`  Got ${pokemon.length} Pokemon.`);

  // Fetch evolution chains
  const chainIds = new Set(speciesChainMap.values());
  console.error(`  Fetching ${chainIds.size} evolution chains...`);

  const chainArray = Array.from(chainIds).filter((id) => id > 0);
  for (let batch = 0; batch < chainArray.length; batch += 50) {
    const end = Math.min(batch + 50, chainArray.length);
    console.error(`  Fetching chains ${batch + 1}-${end}...`);

    const promises = chainArray.slice(batch, end).map(async (chainId) => {
      const data = (await fetchJSON(`${API_BASE}/evolution-chain/${chainId}`)) as {
        id: number;
        chain: EvolutionNode;
      } | null;
      if (!data) return;

      const links: { from: number; to: number; method: { type: string; level?: number } }[] = [];

      interface EvolutionNode {
        species: { name: string; url: string };
        evolves_to: EvolutionNode[];
        evolution_details: { min_level: number | null; trigger: { name: string } }[];
      }

      function getIdFromUrl(url: string): number {
        const match = url.match(/\/pokemon-species\/(\d+)/);
        return match ? parseInt(match[1]!, 10) : 0;
      }

      function walkChain(node: EvolutionNode) {
        const fromId = getIdFromUrl(node.species.url);
        for (const evo of node.evolves_to) {
          const toId = getIdFromUrl(evo.species.url);
          if (fromId && toId && fromId <= TOTAL && toId <= TOTAL) {
            const detail = evo.evolution_details[0];
            const minLevel = detail?.min_level;
            if (minLevel) {
              links.push({ from: fromId, to: toId, method: { type: "level", level: minLevel } });
            } else {
              // Non-level evolutions default to level 30
              links.push({ from: fromId, to: toId, method: { type: "level", level: 30 } });
            }
          }
          walkChain(evo);
        }
      }

      walkChain(data.chain);

      if (links.length > 0) {
        evolutionChains.set(chainId, { id: chainId, links });
      }
    });

    await Promise.all(promises);
  }

  console.error(`  Got ${evolutionChains.size} evolution chains.`);

  // Write output as JSON
  const output = {
    pokemon,
    evolutionChains: Array.from(evolutionChains.values()).sort((a, b) => a.id - b.id),
  };

  console.log(JSON.stringify(output, null, 2));
  console.error(
    "Done! Pipe to a file: bun run scripts/generate-pokemon-data.ts > /tmp/pokemon-data.json",
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
