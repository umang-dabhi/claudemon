/**
 * Core type definitions for Claudemon.
 * Single source of truth for all shared interfaces and types.
 */

// ── Mood Types ────────────────────────────────────────────

export const MOOD_TYPES = ["happy", "worried", "sleepy", "energetic", "proud", "neutral"] as const;
export type MoodType = (typeof MOOD_TYPES)[number];

// ── Pokemon Types ──────────────────────────────────────────

export const POKEMON_TYPES = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

export const EXP_GROUPS = ["fast", "medium_fast", "medium_slow", "slow"] as const;

export type ExpGroup = (typeof EXP_GROUPS)[number];

export const RARITY_TIERS = ["common", "uncommon", "rare", "legendary", "mythical"] as const;

export type RarityTier = (typeof RARITY_TIERS)[number];

// ── Base Stats (Gen 1 layout) ──────────────────────────────

export interface BaseStats {
  readonly hp: number;
  readonly attack: number;
  readonly defense: number;
  readonly speed: number;
  readonly special: number;
}

// ── Pokemon Species (static, immutable Pokedex entry) ──────

export interface Pokemon {
  readonly id: number;
  readonly name: string;
  readonly types: readonly [PokemonType, PokemonType?];
  readonly baseStats: BaseStats;
  readonly expGroup: ExpGroup;
  readonly evolutionChainId: number;
  readonly rarity: RarityTier;
  readonly catchRate: number; // 1-255, higher = easier to catch
  readonly description: string; // Short flavor text
}

// ── Evolution ──────────────────────────────────────────────

export type EvolutionMethod =
  | { readonly type: "level"; readonly level: number }
  | { readonly type: "badge"; readonly badge: BadgeType }
  | { readonly type: "collaboration" }
  | { readonly type: "stat"; readonly stat: CodingStat; readonly minValue: number };

export interface EvolutionLink {
  readonly from: number; // Pokemon ID
  readonly to: number; // Pokemon ID
  readonly method: EvolutionMethod;
}

export interface EvolutionChain {
  readonly id: number;
  readonly links: readonly EvolutionLink[];
}

// ── Coding Stats (mapped from Gen 1 stats) ─────────────────

export const CODING_STATS = ["stamina", "debugging", "stability", "velocity", "wisdom"] as const;

export type CodingStat = (typeof CODING_STATS)[number];

export interface CodingStats {
  stamina: number; // HP → session endurance, streaks
  debugging: number; // Attack → bug-finding, error fixing
  stability: number; // Defense → test coverage, build reliability
  velocity: number; // Speed → throughput, commits, edits
  wisdom: number; // Special → deep problem-solving, refactors
}

/** Maps Gen 1 base stats to coding stats for initial values */
export const BASE_STAT_TO_CODING: Record<keyof BaseStats, CodingStat> = {
  hp: "stamina",
  attack: "debugging",
  defense: "stability",
  speed: "velocity",
  special: "wisdom",
} as const;

// ── Badges (replace evolution stones) ──────────────────────

export const BADGE_TYPES = [
  "blaze", // Fire Stone → 50 bugs fixed
  "flow", // Water Stone → 100 tests passed
  "spark", // Thunder Stone → 200 commits
  "lunar", // Moon Stone → 30-day streak
  "growth", // Leaf Stone → 500 files edited
] as const;

export type BadgeType = (typeof BADGE_TYPES)[number];

export interface Badge {
  readonly type: BadgeType;
  readonly name: string;
  readonly description: string;
  readonly condition: BadgeCondition;
}

export type BadgeCondition =
  | { readonly type: "counter"; readonly counter: EventCounterKey; readonly threshold: number }
  | { readonly type: "streak"; readonly minDays: number };

// ── Owned Pokemon (user's individual Pokemon instance) ──────

export interface OwnedPokemon {
  readonly id: string; // Unique instance ID (UUID)
  pokemonId: number;
  nickname: string | null;
  level: number;
  currentXp: number;
  totalXp: number;
  codingStats: CodingStats;
  happiness: number; // 0-255
  caughtAt: string; // ISO date
  evolvedAt: string | null;
  isActive: boolean;
  personality: string | null;
  shiny: boolean; // Future: always false in v1
  isStarter: boolean;
}

// ── Player State (single source of truth) ──────────────────

export interface PlayerState {
  readonly trainerId: string;
  trainerName: string;
  party: OwnedPokemon[]; // Max 6
  pcBox: OwnedPokemon[]; // Overflow storage
  pokedex: PokedexState;
  badges: BadgeType[];
  achievements: UnlockedAchievement[];
  counters: EventCounters;
  streak: StreakData;
  config: BuddyConfig;
  startedAt: string; // ISO date
  totalXpEarned: number;
  totalSessions: number;
  pendingEncounter: WildEncounter | null;
  xpSinceLastEncounter: number;
  recentToolTypes: string[]; // Track tool diversity for bonus encounters
  lastEncounterTime: number; // Timestamp of last encounter (for cooldown)
  mood: MoodType; // Current mood of the active Pokemon
  moodSetAt: number; // Timestamp when mood was last set
  lastFedAt: number; // Timestamp of last feed action
  lastTrainedAt: number; // Timestamp of last train action
  lastPlayedAt: number; // Timestamp of last play (quiz completed) action
  pendingQuiz: PendingQuiz | null; // Active quiz awaiting answer
  shareStats: ShareStats; // Win/loss/tie record from compare
}

// ── Share Stats ───────────────────────────────────────────

export interface ShareStats {
  wins: number;
  losses: number;
  ties: number;
}

// ── Pokedex ────────────────────────────────────────────────

export interface PokedexEntry {
  seen: boolean;
  caught: boolean;
  firstSeen: string | null; // ISO date
  firstCaught: string | null;
}

export interface PokedexState {
  entries: Record<number, PokedexEntry>; // Keyed by Pokedex number 1-151
  totalSeen: number;
  totalCaught: number;
}

// ── Achievements ───────────────────────────────────────────

export interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: "trainer" | "coding" | "pokemon" | "secret";
  readonly condition: AchievementCondition;
}

export type AchievementCondition =
  | { readonly type: "counter"; readonly counter: EventCounterKey; readonly threshold: number }
  | { readonly type: "level"; readonly minLevel: number }
  | { readonly type: "pokedex"; readonly minCaught: number }
  | { readonly type: "streak"; readonly minDays: number }
  | { readonly type: "badge"; readonly badge: BadgeType }
  | { readonly type: "evolution" }
  | { readonly type: "party_size"; readonly minSize: number };

export interface UnlockedAchievement {
  readonly achievementId: string;
  readonly unlockedAt: string; // ISO date
}

// ── Event Counters ─────────────────────────────────────────

export const EVENT_COUNTER_KEYS = [
  "commits",
  "tests_passed",
  "tests_failed",
  "tests_written",
  "builds_succeeded",
  "builds_failed",
  "bugs_fixed",
  "lint_fixes",
  "files_created",
  "files_edited",
  "searches",
  "large_refactors",
  "errors_encountered",
  "sessions",
  "prs_merged",
] as const;

export type EventCounterKey = (typeof EVENT_COUNTER_KEYS)[number];

export type EventCounters = Record<EventCounterKey, number>;

// ── Streaks ────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // ISO date "2026-04-13"
  totalDaysActive: number;
}

// ── Config ─────────────────────────────────────────────────

export interface BuddyConfig {
  muted: boolean;
  reactionCooldownMs: number; // Default 30000
  statusLineEnabled: boolean;
  bellEnabled: boolean; // Terminal bell on level-up/encounters
  encounterSpeed: "fast" | "normal" | "slow"; // Configurable encounter frequency
  xpSharePercent: number; // 0-100, default 25. Percentage of XP shared to inactive party
}

// ── XP Events (what triggers XP awards) ────────────────────

export const XP_EVENT_TYPES = [
  "commit",
  "test_pass",
  "test_written",
  "build_success",
  "bug_fix",
  "lint_fix",
  "file_create",
  "file_edit",
  "search",
  "large_refactor",
  "session_start",
  "daily_streak",
  "pet",
] as const;

export type XpEventType = (typeof XP_EVENT_TYPES)[number];

export interface XpEvent {
  readonly type: XpEventType;
  readonly xp: number;
  readonly statBoost: CodingStat | null;
  readonly boostAmount: number;
}

// ── Pending Quiz (for /buddy play) ────────────────────────

export interface PendingQuiz {
  readonly type: "type_matchup" | "stat_compare" | "evolution" | "pokedex_trivia";
  readonly question: string;
  readonly options: readonly string[];
  readonly correctAnswer: number; // 1-4
}

// ── Encounters ─────────────────────────────────────────────

export interface WildEncounter {
  readonly pokemonId: number;
  readonly level: number;
  readonly catchCondition: CatchCondition;
}

export interface CatchCondition {
  readonly requiredStat: CodingStat | null;
  readonly minStatValue: number;
  readonly requiredLevel: number;
}

// ── Level Up Result ────────────────────────────────────────

export interface LevelUpResult {
  readonly previousLevel: number;
  readonly newLevel: number;
  readonly pendingEvolution: EvolutionLink | null;
}

// ── Trainer Titles ─────────────────────────────────────────

export interface TrainerTitle {
  readonly minLevel: number;
  readonly title: string;
}

// ── Legendary Quest ────────────────────────────────────────

export interface LegendaryQuest {
  readonly pokemonId: number;
  readonly name: string;
  readonly steps: readonly QuestStep[];
}

export interface QuestStep {
  readonly description: string;
  readonly condition: AchievementCondition;
}
