/**
 * buddy_play tool — Play a Pokemon trivia quiz with your active Pokemon.
 * Has a 15-minute cooldown (applied after quiz completion, not between question and answer).
 * Awards +20 XP for correct answers, +5 XP for wrong answers.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PendingQuiz, PokemonType } from "../../engine/types.js";
import { POKEMON_TYPES } from "../../engine/types.js";
import { POKEDEX, POKEMON_BY_ID } from "../../engine/pokemon-data.js";
import { EVOLUTION_CHAINS } from "../../engine/evolution-data.js";
import { addXp } from "../../engine/xp.js";
import { StateManager } from "../../state/state-manager.js";

/** Cooldown: 15 minutes in milliseconds (applied after completing a quiz). */
const PLAY_COOLDOWN_MS = 900_000;

/** XP awarded for correct answer. */
const CORRECT_XP = 20;

/** XP awarded for wrong answer (participation). */
const WRONG_XP = 5;

// ── Gen 1 Type Effectiveness Chart ────────────────────────

/** Maps each type to the types that are super effective against it. */
const TYPE_WEAKNESSES: Record<PokemonType, readonly PokemonType[]> = {
  Normal: ["Fighting"],
  Fire: ["Water", "Ground", "Rock"],
  Water: ["Electric", "Grass"],
  Electric: ["Ground"],
  Grass: ["Fire", "Ice", "Poison", "Flying", "Bug"],
  Ice: ["Fire", "Fighting", "Rock"],
  Fighting: ["Flying", "Psychic"],
  Poison: ["Ground", "Psychic"],
  Ground: ["Water", "Grass", "Ice"],
  Flying: ["Electric", "Ice", "Rock"],
  Psychic: ["Bug", "Ghost"],
  Bug: ["Fire", "Flying", "Rock"],
  Rock: ["Water", "Grass", "Fighting", "Ground"],
  Ghost: ["Ghost"],
  Dragon: ["Ice", "Dragon"],
};

// ── Utility Functions ─────────────────────────────────────

/** Pick a random element from a non-empty array. */
function randomPick<T>(arr: readonly T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index] as T;
}

/** Shuffle an array in place (Fisher-Yates) and return it. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = temp;
  }
  return arr;
}

/** Format remaining cooldown as "Xm Ys". */
function formatCooldownRemaining(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0 && seconds > 0) {
    return `${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

// ── Quiz Generators ───────────────────────────────────────

/** Generate a type matchup quiz question. */
function generateTypeMatchup(): PendingQuiz {
  // Pick a type that has weaknesses
  const typesWithWeaknesses = POKEMON_TYPES.filter((t) => TYPE_WEAKNESSES[t].length > 0);
  const targetType = randomPick(typesWithWeaknesses);
  const weaknesses = TYPE_WEAKNESSES[targetType];
  const correctType = randomPick(weaknesses);

  // Generate 3 wrong answers (types NOT in the weakness list)
  const wrongTypes = POKEMON_TYPES.filter((t) => !weaknesses.includes(t) && t !== targetType);
  const wrongAnswers = shuffle([...wrongTypes]).slice(0, 3);

  // Combine and shuffle, tracking correct position
  const options = shuffle([correctType, ...wrongAnswers]);
  const correctAnswer = options.indexOf(correctType) + 1; // 1-indexed

  return {
    type: "type_matchup",
    question: `What type is super effective against ${targetType}?`,
    options,
    correctAnswer,
  };
}

/** Generate a stat comparison quiz question. */
function generateStatCompare(): PendingQuiz {
  const statPairs: readonly { name: string; key: keyof (typeof POKEDEX)[number]["baseStats"] }[] = [
    { name: "HP", key: "hp" },
    { name: "Attack", key: "attack" },
    { name: "Defense", key: "defense" },
    { name: "Speed", key: "speed" },
    { name: "Special", key: "special" },
  ];

  const pair = randomPick(statPairs);
  const statName = pair.name;
  const statKey = pair.key;

  // Pick 2 different Pokemon
  let pokemon1 = randomPick(POKEDEX);
  let pokemon2 = randomPick(POKEDEX);
  // Ensure they are different and have different stat values for a clear answer
  let attempts = 0;
  while (
    (pokemon2.id === pokemon1.id || pokemon1.baseStats[statKey] === pokemon2.baseStats[statKey]) &&
    attempts < 50
  ) {
    pokemon2 = randomPick(POKEDEX);
    attempts++;
  }

  const stat1 = pokemon1.baseStats[statKey];
  const stat2 = pokemon2.baseStats[statKey];

  // If still tied after attempts, just pick a winner
  const correctName = stat1 >= stat2 ? pokemon1.name : pokemon2.name;

  const options: string[] = [pokemon1.name, pokemon2.name];
  const correctAnswer = options.indexOf(correctName) + 1; // 1 or 2

  return {
    type: "stat_compare",
    question: `Who has higher ${statName}: ${pokemon1.name} or ${pokemon2.name}?`,
    options,
    correctAnswer,
  };
}

/** Generate an evolution quiz question. */
function generateEvolutionQuiz(): PendingQuiz {
  // Get chains that have at least one evolution link
  const chainsWithEvolutions = EVOLUTION_CHAINS.filter((c) => c.links.length > 0);
  const chain = randomPick(chainsWithEvolutions);
  const link = randomPick(chain.links);

  const fromPokemon = POKEMON_BY_ID.get(link.from);
  const toPokemon = POKEMON_BY_ID.get(link.to);

  if (!fromPokemon || !toPokemon) {
    // Fallback to a known evolution if data lookup fails
    return generateTypeMatchup();
  }

  // Generate 3 wrong answers (random Pokemon that are NOT the correct evolution)
  const wrongPokemon = shuffle(
    POKEDEX.filter((p) => p.id !== toPokemon.id && p.id !== fromPokemon.id),
  ).slice(0, 3);

  const options = shuffle([toPokemon.name, ...wrongPokemon.map((p) => p.name)]);
  const correctAnswer = options.indexOf(toPokemon.name) + 1;

  return {
    type: "evolution",
    question: `What does ${fromPokemon.name} evolve into?`,
    options,
    correctAnswer,
  };
}

/** Generate a Pokedex type trivia question. */
function generatePokedexTrivia(): PendingQuiz {
  const pokemon = randomPick(POKEDEX);
  const correctType = pokemon.types[0];

  // Generate 3 wrong type answers
  const wrongTypes = shuffle(
    [...POKEMON_TYPES].filter((t) => t !== correctType && !pokemon.types.includes(t)),
  ).slice(0, 3);

  const options = shuffle([correctType, ...wrongTypes]);
  const correctAnswer = options.indexOf(correctType) + 1;

  return {
    type: "pokedex_trivia",
    question: `What is ${pokemon.name}'s primary type?`,
    options,
    correctAnswer,
  };
}

/** Generate a random quiz question. */
function generateQuiz(): PendingQuiz {
  const generators = [
    generateTypeMatchup,
    generateStatCompare,
    generateEvolutionQuiz,
    generatePokedexTrivia,
  ];
  return randomPick(generators)();
}

/** Format a quiz for display. */
function formatQuiz(quiz: PendingQuiz): string {
  const lines: string[] = [];
  lines.push(`**${quiz.question}**`);
  lines.push("");
  for (let i = 0; i < quiz.options.length; i++) {
    lines.push(`  ${i + 1}. ${quiz.options[i]}`);
  }
  lines.push("");
  lines.push("Use `/buddy play answer 1`, `2`, `3`, or `4` to answer.");
  return lines.join("\n");
}

/** Registers the buddy_play tool on the MCP server. */
export function registerPlayTool(server: McpServer): void {
  server.tool(
    "buddy_play",
    "Play a Pokemon trivia quiz with your active Pokemon. Use without arguments to get a question, or with answer=N (1-4) to answer.",
    {
      answer: z.number().int().min(1).max(4).optional().describe("Your answer: 1, 2, 3, or 4."),
    },
    async ({ answer }) => {
      const stateManager = StateManager.getInstance();
      const state = await stateManager.load();

      if (!state || state.party.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "You don't have a Pokemon yet! Use buddy_starter to pick your first companion.",
            },
          ],
        };
      }

      const active = stateManager.getActivePokemon();
      if (!active) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No active Pokemon found. Use buddy_party to set one active.",
            },
          ],
        };
      }

      const species = POKEMON_BY_ID.get(active.pokemonId);
      if (!species) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Could not find species data for Pokemon ID ${active.pokemonId}.`,
            },
          ],
          isError: true,
        };
      }

      const displayName = active.nickname ?? species.name;

      // ── Answer an existing quiz ────────────────────────────
      if (answer !== undefined) {
        if (!state.pendingQuiz) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No quiz in progress! Use `/buddy play` to start a new one.",
              },
            ],
          };
        }

        const quiz = state.pendingQuiz;
        const isCorrect = answer === quiz.correctAnswer;
        const xpAmount = isCorrect ? CORRECT_XP : WRONG_XP;

        // Award XP
        const levelUp = addXp(active, xpAmount, species);

        // Set mood based on result
        if (isCorrect) {
          state.mood = "happy";
        }
        state.moodSetAt = Date.now();

        // Clear quiz and set cooldown
        state.pendingQuiz = null;
        state.lastPlayedAt = Date.now();

        // Save state
        await stateManager.save();
        await stateManager.writeStatus();

        // Build response
        const lines: string[] = [];
        if (isCorrect) {
          lines.push(`*${displayName} cheers! Correct!* \u{1F389}`);
        } else {
          const correctOption = quiz.options[quiz.correctAnswer - 1];
          lines.push(`*${displayName} shrugs. Better luck next time!*`);
          lines.push(`The correct answer was: **${quiz.correctAnswer}. ${correctOption}**`);
        }
        lines.push("");
        lines.push(`+${xpAmount} XP`);

        if (levelUp) {
          lines.push("");
          lines.push(`*** ${displayName} grew to Lv.${levelUp.newLevel}! ***`);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // ── Start a new quiz ───────────────────────────────────

      // If there's already a pending quiz, show it again
      if (state.pendingQuiz) {
        const lines: string[] = [];
        lines.push(`*${displayName} is still waiting for your answer!*`);
        lines.push("");
        lines.push(formatQuiz(state.pendingQuiz));

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // Check cooldown (only applies when starting a new quiz after completing one)
      const now = Date.now();
      const elapsed = now - state.lastPlayedAt;
      if (state.lastPlayedAt > 0 && elapsed < PLAY_COOLDOWN_MS) {
        const remaining = PLAY_COOLDOWN_MS - elapsed;
        return {
          content: [
            {
              type: "text" as const,
              text: `${displayName} needs a break from quizzing! Try again in ${formatCooldownRemaining(remaining)}.`,
            },
          ],
        };
      }

      // Generate and store a new quiz
      const quiz = generateQuiz();
      state.pendingQuiz = quiz;

      // Save state (stores the pending quiz)
      await stateManager.save();

      // Build response
      const lines: string[] = [];
      lines.push(`*${displayName} perks up for quiz time!* \u{1F4DA}`);
      lines.push("");
      lines.push(formatQuiz(quiz));

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
