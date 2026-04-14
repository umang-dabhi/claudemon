/**
 * buddy_share tool — Generate share codes and compare with others.
 *
 * Actions:
 *   pokemon  — Share code for a single Pokemon (default: active, or specify slot)
 *   party    — Share code for entire party/trainer profile
 *   compare  — Compare your stats against a received share code
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CodingStat, OwnedPokemon } from "../../engine/types.js";
import { CODING_STATS } from "../../engine/types.js";
import { POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { STAT_DISPLAY_NAMES } from "../../engine/constants.js";
import { StateManager } from "../../state/state-manager.js";
import { pad } from "./display-helpers.js";
import {
  encodePokemonShare,
  encodeTrainerShare,
  detectShareCodeType,
  decodePokemonShare,
  decodeTrainerShare,
  getRandomRivalName,
  type SharePokemonPayload,
  type ShareTrainerPayload,
  type SharePartyMember,
} from "../../engine/share-codec.js";

/** Get display name for an owned Pokemon. */
function displayName(pokemon: OwnedPokemon): string {
  const species = POKEMON_BY_ID.get(pokemon.pokemonId);
  return pokemon.nickname ?? species?.name ?? "???";
}

/** Format a number with comma separators. */
function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Arrow indicator: → for left winner, ← for right winner, blank for tie. */
function arrow(a: number, b: number): string {
  if (a > b) return " \u2190";
  if (b > a) return "     \u2192";
  return "  ==";
}

export type CompareOutcome = "win" | "loss" | "tie";

/** Build a Pokemon comparison card. Returns the card text and the outcome. */
function buildPokemonCompare(
  yours: SharePokemonPayload,
  theirs: SharePokemonPayload,
): { card: string; outcome: CompareOutcome } {
  const W = 46;
  const border = "\u2500".repeat(W);
  const lines: string[] = [];

  lines.push(`\u250c${border}\u2510`);
  lines.push(`\u2502  ${pad("POKEMON COMPARE", W - 2)}\u2502`);
  lines.push(`\u251c${border}\u2524`);

  // Header row
  const hdr = `${"".padEnd(12)}${"YOURS".padEnd(14)}THEIRS`;
  lines.push(`\u2502  ${pad(hdr, W - 2)}\u2502`);
  lines.push(`\u2502${" ".repeat(W)}\u2502`);

  // Pokemon names
  const nameRow = `${"Pokemon:".padEnd(12)}${yours.name.padEnd(14)}${theirs.name}`;
  lines.push(`\u2502  ${pad(nameRow, W - 2)}\u2502`);

  // Level
  const lvlRow = `${"Level:".padEnd(12)}${String(yours.level).padEnd(14)}${theirs.level}${arrow(yours.level, theirs.level)}`;
  lines.push(`\u2502  ${pad(lvlRow, W - 2)}\u2502`);

  // Stats comparison
  let youWins = 0;
  let theyWin = 0;

  for (const stat of CODING_STATS) {
    const s = stat as CodingStat;
    const yVal = yours.stats[s] ?? 0;
    const tVal = theirs.stats[s] ?? 0;
    const label = (STAT_DISPLAY_NAMES[s] + ":").padEnd(12);
    const row = `${label}${String(yVal).padEnd(14)}${tVal}${arrow(yVal, tVal)}`;
    lines.push(`\u2502  ${pad(row, W - 2)}\u2502`);

    if (yVal > tVal) youWins++;
    else if (tVal > yVal) theyWin++;
  }

  // Total XP
  const xpRow = `${"Total XP:".padEnd(12)}${fmt(yours.totalXp).padEnd(14)}${fmt(theirs.totalXp)}${arrow(yours.totalXp, theirs.totalXp)}`;
  lines.push(`\u2502  ${pad(xpRow, W - 2)}\u2502`);

  lines.push(`\u251c${border}\u2524`);

  // Winner summary
  let verdict: string;
  let outcome: CompareOutcome;
  if (youWins > theyWin) {
    verdict = `${yours.name} wins! (${youWins}-${theyWin} stats)`;
    outcome = "win";
  } else if (theyWin > youWins) {
    verdict = `${theirs.name} wins! (${theyWin}-${youWins} stats)`;
    outcome = "loss";
  } else {
    verdict = `It's a tie! (${youWins}-${theyWin} stats)`;
    outcome = "tie";
  }
  lines.push(`\u2502  ${pad(verdict, W - 2)}\u2502`);
  lines.push(`\u2514${border}\u2518`);

  return { card: lines.join("\n"), outcome };
}

/** Build a trainer/party comparison card. Returns the card text and the outcome. */
function buildTrainerCompare(
  yours: ShareTrainerPayload,
  theirs: ShareTrainerPayload,
): { card: string; outcome: CompareOutcome } {
  const W = 50;
  const border = "\u2500".repeat(W);
  const lines: string[] = [];

  lines.push(`\u250c${border}\u2510`);
  lines.push(`\u2502  ${pad("TRAINER COMPARE", W - 2)}\u2502`);
  lines.push(`\u251c${border}\u2524`);

  // Header
  const hdr = `${"".padEnd(14)}${"YOU".padEnd(16)}RIVAL`;
  lines.push(`\u2502  ${pad(hdr, W - 2)}\u2502`);
  lines.push(`\u2502${" ".repeat(W)}\u2502`);

  // Party side by side
  lines.push(`\u2502  ${pad("Party:", W - 2)}\u2502`);
  const maxLen = Math.max(yours.pokemon.length, theirs.pokemon.length);
  for (let i = 0; i < maxLen; i++) {
    const yMon = yours.pokemon[i];
    const tMon = theirs.pokemon[i];
    const yStr = yMon ? `${yMon.name} Lv${yMon.level}` : "---";
    const tStr = tMon ? `${tMon.name} Lv${tMon.level}` : "---";
    const row = `  ${String(i + 1)}. ${yStr.padEnd(16)} vs  ${tStr}`;
    lines.push(`\u2502  ${pad(row, W - 2)}\u2502`);
  }

  lines.push(`\u2502${" ".repeat(W)}\u2502`);

  // Aggregate stats
  const yAvg =
    yours.pokemon.length > 0
      ? yours.pokemon.reduce((s, p) => s + p.level, 0) / yours.pokemon.length
      : 0;
  const tAvg =
    theirs.pokemon.length > 0
      ? theirs.pokemon.reduce((s, p) => s + p.level, 0) / theirs.pokemon.length
      : 0;

  const statRows: [string, string, string, number, number][] = [
    ["Avg Level:", yAvg.toFixed(1), tAvg.toFixed(1), yAvg, tAvg],
    [
      "Pokedex:",
      `${yours.dex.caught}/${yours.dex.seen}`,
      `${theirs.dex.caught}/${theirs.dex.seen}`,
      yours.dex.caught,
      theirs.dex.caught,
    ],
    [
      "Achievements:",
      String(yours.achievements),
      String(theirs.achievements),
      yours.achievements,
      theirs.achievements,
    ],
    [
      "Badges:",
      String(yours.badges.length),
      String(theirs.badges.length),
      yours.badges.length,
      theirs.badges.length,
    ],
    [
      "Streak:",
      String(yours.streak.current),
      String(theirs.streak.current),
      yours.streak.current,
      theirs.streak.current,
    ],
    ["Total XP:", fmt(yours.totalXp), fmt(theirs.totalXp), yours.totalXp, theirs.totalXp],
  ];

  let youWins = 0;
  let theyWin = 0;

  for (const [label, yStr, tStr, yVal, tVal] of statRows) {
    const row = `${label.padEnd(14)}${yStr.padEnd(16)}${tStr}${arrow(yVal, tVal)}`;
    lines.push(`\u2502  ${pad(row, W - 2)}\u2502`);
    if (yVal > tVal) youWins++;
    else if (tVal > yVal) theyWin++;
  }

  lines.push(`\u251c${border}\u2524`);

  let verdict: string;
  let outcome: CompareOutcome;
  if (youWins > theyWin) {
    verdict = `You win! Keep coding! (${youWins}-${theyWin})`;
    outcome = "win";
  } else if (theyWin > youWins) {
    verdict = `${theirs.trainer} wins! Keep coding to catch up! (${theyWin}-${youWins})`;
    outcome = "loss";
  } else {
    verdict = `It's a tie! Great rivalry! (${youWins}-${theyWin})`;
    outcome = "tie";
  }
  lines.push(`\u2502  ${pad(verdict, W - 2)}\u2502`);
  lines.push(`\u2514${border}\u2518`);

  return { card: lines.join("\n"), outcome };
}

/** Registers the buddy_share tool on the MCP server. */
export function registerShareTool(server: McpServer): void {
  server.tool(
    "buddy_share",
    "Generate share codes to compare Pokemon or trainer stats with friends. No server needed!",
    {
      action: z
        .enum(["pokemon", "party", "compare"])
        .describe(
          "'pokemon' = share one Pokemon, 'party' = share trainer profile, 'compare' = compare against a code",
        ),
      slot: z
        .number()
        .int()
        .optional()
        .describe("Party slot (1-6) for pokemon share. Defaults to active Pokemon."),
      code: z
        .string()
        .optional()
        .describe("Share code to compare against (required for compare action)."),
      name: z
        .string()
        .optional()
        .describe("Display name for your share code. Random Pokemon character name if omitted."),
    },
    async (params) => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state || state.party.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Welcome to Claudemon! Use buddy_starter to pick your first companion before sharing!",
            },
          ],
        };
      }

      const action = params.action;

      // ── SHARE POKEMON ──────────────────────────────────────
      if (action === "pokemon") {
        let target: OwnedPokemon;

        if (params.slot !== undefined) {
          if (params.slot < 1 || params.slot > state.party.length) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Invalid slot. Choose between 1 and ${state.party.length}.`,
                },
              ],
              isError: true,
            };
          }
          target = state.party[params.slot - 1]!;
        } else {
          const active = stateManager.getActivePokemon();
          if (!active) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "No active Pokemon found. Use buddy_party to switch to one.",
                },
              ],
              isError: true,
            };
          }
          target = active;
        }

        const payload: SharePokemonPayload = {
          name: params.name ?? displayName(target),
          speciesId: target.pokemonId,
          level: target.level,
          totalXp: target.totalXp,
          stats: { ...target.codingStats },
          happiness: target.happiness,
          shiny: target.shiny,
          isStarter: target.isStarter,
        };

        const shareCode = encodePokemonShare(payload);
        const species = POKEMON_BY_ID.get(target.pokemonId);
        const speciesName = species?.name ?? "???";

        const lines: string[] = [];
        lines.push(`Share code for ${displayName(target)} (${speciesName} Lv.${target.level}):`);
        lines.push("");
        lines.push(`\`${shareCode}\``);
        lines.push("");
        lines.push("Send this code to a friend! They can compare with:");
        lines.push("  buddy_share compare <code>");

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // ── SHARE PARTY ────────────────────────────────────────
      if (action === "party") {
        const trainerDisplayName = params.name ?? getRandomRivalName();

        const partyMembers: SharePartyMember[] = state.party.map((p) => ({
          name: displayName(p),
          speciesId: p.pokemonId,
          level: p.level,
          totalXp: p.totalXp,
          stats: { ...p.codingStats },
        }));

        const payload: ShareTrainerPayload = {
          trainer: trainerDisplayName,
          pokemon: partyMembers,
          dex: {
            seen: state.pokedex.totalSeen,
            caught: state.pokedex.totalCaught,
          },
          achievements: state.achievements.length,
          badges: [...state.badges],
          streak: {
            current: state.streak.currentStreak,
            longest: state.streak.longestStreak,
          },
          totalXp: state.totalXpEarned,
          totalSessions: state.totalSessions,
        };

        const shareCode = encodeTrainerShare(payload);

        const lines: string[] = [];
        lines.push(`Trainer share code for "${trainerDisplayName}":`);
        lines.push("");
        lines.push(`\`${shareCode}\``);
        lines.push("");
        lines.push(
          `Party: ${state.party.length} Pokemon | Pokedex: ${state.pokedex.totalCaught} caught`,
        );
        lines.push("");
        lines.push("Send this code to a friend! They can compare with:");
        lines.push("  buddy_share compare <code>");

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // ── COMPARE ────────────────────────────────────────────
      if (action === "compare") {
        if (!params.code) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Please provide a share code to compare against.\nUsage: buddy_share compare <code>",
              },
            ],
            isError: true,
          };
        }

        const codeType = detectShareCodeType(params.code);

        if (!codeType) {
          return {
            content: [
              {
                type: "text" as const,
                text: 'Invalid share code. Codes start with "CLDM-P:v1:" (Pokemon) or "CLDM-T:v1:" (Trainer).',
              },
            ],
            isError: true,
          };
        }

        // ── Compare Pokemon ──────────────────────────────
        if (codeType === "pokemon") {
          const theirPokemon = decodePokemonShare(params.code);
          if (!theirPokemon) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Could not decode Pokemon share code. It may be corrupted.",
                },
              ],
              isError: true,
            };
          }

          // Get your Pokemon to compare against
          let myPokemon: OwnedPokemon;
          if (params.slot !== undefined) {
            if (params.slot < 1 || params.slot > state.party.length) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Invalid slot. Choose between 1 and ${state.party.length}.`,
                  },
                ],
                isError: true,
              };
            }
            myPokemon = state.party[params.slot - 1]!;
          } else {
            const active = stateManager.getActivePokemon();
            if (!active) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: "No active Pokemon found. Use buddy_party to switch to one.",
                  },
                ],
                isError: true,
              };
            }
            myPokemon = active;
          }

          const myPayload: SharePokemonPayload = {
            name: displayName(myPokemon),
            speciesId: myPokemon.pokemonId,
            level: myPokemon.level,
            totalXp: myPokemon.totalXp,
            stats: { ...myPokemon.codingStats },
            happiness: myPokemon.happiness,
            shiny: myPokemon.shiny,
            isStarter: myPokemon.isStarter,
          };

          const { card, outcome } = buildPokemonCompare(myPayload, theirPokemon);

          // Bump share stats
          state.shareStats ??= { wins: 0, losses: 0, ties: 0 };
          if (outcome === "win") state.shareStats.wins++;
          else if (outcome === "loss") state.shareStats.losses++;
          else state.shareStats.ties++;
          await stateManager.save();

          const { wins, losses, ties } = state.shareStats;
          const record = `\nYour record: ${wins}W - ${losses}L - ${ties}T`;

          return {
            content: [{ type: "text" as const, text: card + record }],
          };
        }

        // ── Compare Trainer ──────────────────────────────
        if (codeType === "trainer") {
          const theirTrainer = decodeTrainerShare(params.code);
          if (!theirTrainer) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Could not decode Trainer share code. It may be corrupted.",
                },
              ],
              isError: true,
            };
          }

          const myParty: SharePartyMember[] = state.party.map((p) => ({
            name: displayName(p),
            speciesId: p.pokemonId,
            level: p.level,
            totalXp: p.totalXp,
            stats: { ...p.codingStats },
          }));

          const myTrainer: ShareTrainerPayload = {
            trainer: state.trainerName,
            pokemon: myParty,
            dex: {
              seen: state.pokedex.totalSeen,
              caught: state.pokedex.totalCaught,
            },
            achievements: state.achievements.length,
            badges: [...state.badges],
            streak: {
              current: state.streak.currentStreak,
              longest: state.streak.longestStreak,
            },
            totalXp: state.totalXpEarned,
            totalSessions: state.totalSessions,
          };

          const { card, outcome } = buildTrainerCompare(myTrainer, theirTrainer);

          // Bump share stats
          state.shareStats ??= { wins: 0, losses: 0, ties: 0 };
          if (outcome === "win") state.shareStats.wins++;
          else if (outcome === "loss") state.shareStats.losses++;
          else state.shareStats.ties++;
          await stateManager.save();

          const { wins, losses, ties } = state.shareStats;
          const record = `\nYour record: ${wins}W - ${losses}L - ${ties}T`;

          return {
            content: [{ type: "text" as const, text: card + record }],
          };
        }
      }

      return {
        content: [{ type: "text" as const, text: "Unknown share action." }],
        isError: true,
      };
    },
  );
}
