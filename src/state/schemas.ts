/**
 * Zod validation schemas for state files.
 * Catches disk corruption early at load boundaries.
 */

import { z } from "zod";

import { BADGE_TYPES, CODING_STATS, EVENT_COUNTER_KEYS, MOOD_TYPES } from "../engine/types.js";

// ---- Shared Primitives ----

const BadgeTypeSchema = z.enum(BADGE_TYPES);

// ---- Coding Stats ----

export const CodingStatsSchema = z.object({
  stamina: z.number(),
  debugging: z.number(),
  stability: z.number(),
  velocity: z.number(),
  wisdom: z.number(),
});

// ---- Owned Pokemon ----

export const OwnedPokemonSchema = z.object({
  id: z.string(),
  pokemonId: z.number().int().min(1).max(151),
  nickname: z.string().nullable(),
  level: z.number().int().min(1).max(100),
  currentXp: z.number().int().min(0),
  totalXp: z.number().int().min(0),
  codingStats: CodingStatsSchema,
  happiness: z.number().int().min(0).max(255),
  caughtAt: z.string(),
  evolvedAt: z.string().nullable(),
  isActive: z.boolean(),
  personality: z.string().nullable(),
  shiny: z.boolean().default(false),
  isStarter: z.boolean().default(false),
});

// ---- Event Counters ----

// Cast needed: Object.fromEntries loses key specificity, but keys are guaranteed by EVENT_COUNTER_KEYS
export const EventCountersSchema = z.object(
  Object.fromEntries(
    EVENT_COUNTER_KEYS.map((key) => [key, z.number().int().min(0).default(0)]),
  ) as Record<(typeof EVENT_COUNTER_KEYS)[number], z.ZodDefault<z.ZodNumber>>,
);

// ---- Streak Data ----

export const StreakDataSchema = z.object({
  currentStreak: z.number().int().min(0).default(0),
  longestStreak: z.number().int().min(0).default(0),
  lastActiveDate: z.string().nullable().default(null),
  totalDaysActive: z.number().int().min(0).default(0),
});

// ---- Buddy Config ----

export const BuddyConfigSchema = z.object({
  muted: z.boolean().default(false),
  reactionCooldownMs: z.number().int().min(0).default(30_000),
  statusLineEnabled: z.boolean().default(true),
  bellEnabled: z.boolean().default(true),
  encounterSpeed: z.enum(["fast", "normal", "slow"]).default("normal"),
  xpSharePercent: z.number().min(0).max(100).default(25),
});

// ---- Pokedex ----

export const PokedexEntrySchema = z.object({
  seen: z.boolean(),
  caught: z.boolean(),
  firstSeen: z.string().nullable(),
  firstCaught: z.string().nullable(),
});

export const PokedexStateSchema = z.object({
  entries: z.record(z.coerce.number(), PokedexEntrySchema).default({}),
  totalSeen: z.number().int().min(0).default(0),
  totalCaught: z.number().int().min(0).default(0),
});

// ---- Achievements ----

export const UnlockedAchievementSchema = z.object({
  achievementId: z.string(),
  unlockedAt: z.string(),
});

// ---- Share Stats ----

export const ShareStatsSchema = z.object({
  wins: z.number().int().min(0).default(0),
  losses: z.number().int().min(0).default(0),
  ties: z.number().int().min(0).default(0),
});

// ---- Pending Quiz ----

export const PendingQuizSchema = z.object({
  type: z.enum(["type_matchup", "stat_compare", "evolution", "pokedex_trivia"]),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number().int().min(1).max(4),
});

// ---- Catch Condition ----

export const CatchConditionSchema = z.object({
  requiredStat: z.enum(CODING_STATS).nullable(),
  minStatValue: z.number(),
  requiredLevel: z.number(),
});

// ---- Wild Encounter ----

export const WildEncounterSchema = z.object({
  pokemonId: z.number().int().min(1).max(151),
  level: z.number().int().min(1).max(100),
  catchCondition: CatchConditionSchema,
});

// ---- Player State (top-level) ----

export const PlayerStateSchema = z.object({
  trainerId: z.string(),
  trainerName: z.string(),
  party: z.array(OwnedPokemonSchema).max(6),
  pcBox: z.array(OwnedPokemonSchema).default([]),
  pokedex: PokedexStateSchema,
  badges: z.array(BadgeTypeSchema).default([]),
  achievements: z.array(UnlockedAchievementSchema).default([]),
  counters: EventCountersSchema,
  streak: StreakDataSchema,
  config: BuddyConfigSchema,
  startedAt: z.string(),
  totalXpEarned: z.number().int().min(0).default(0),
  totalSessions: z.number().int().min(0).default(0),
  pendingEncounter: WildEncounterSchema.nullable().default(null),
  xpSinceLastEncounter: z.number().int().min(0).default(0),
  recentToolTypes: z.array(z.string()).default([]),
  lastEncounterTime: z.number().int().min(0).default(0),
  mood: z.enum(MOOD_TYPES).default("neutral"),
  moodSetAt: z.number().default(0),
  lastFedAt: z.number().default(0),
  lastTrainedAt: z.number().default(0),
  lastPlayedAt: z.number().default(0),
  pendingQuiz: PendingQuizSchema.nullable().default(null),
  shareStats: ShareStatsSchema.default({ wins: 0, losses: 0, ties: 0 }),
});
