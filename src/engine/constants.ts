/**
 * Shared constants for Claudemon.
 * All magic numbers and configuration values live here.
 */

import type { XpEventType, CodingStat, TrainerTitle, Badge } from "./types.js";

// ── Game Limits ────────────────────────────────────────────

export const MAX_PARTY_SIZE = 6;
export const MAX_LEVEL = 100;
export const STARTER_LEVEL = 5;
export const MAX_HAPPINESS = 255;
export const TOTAL_POKEMON = 151;

// ── XP Awards per Event ────────────────────────────────────

export const XP_AWARDS: Record<
  XpEventType,
  { xp: number; stat: CodingStat | null; boost: number }
> = {
  commit: { xp: 15, stat: "velocity", boost: 1 },
  test_pass: { xp: 12, stat: "stability", boost: 1 },
  test_written: { xp: 10, stat: "stability", boost: 1 },
  build_success: { xp: 10, stat: "stability", boost: 1 },
  bug_fix: { xp: 8, stat: "debugging", boost: 1 },
  lint_fix: { xp: 6, stat: "debugging", boost: 1 },
  file_create: { xp: 5, stat: "velocity", boost: 0 },
  file_edit: { xp: 3, stat: "velocity", boost: 0 },
  search: { xp: 1, stat: "wisdom", boost: 0 },
  large_refactor: { xp: 20, stat: "wisdom", boost: 2 },
  session_start: { xp: 5, stat: "stamina", boost: 1 },
  daily_streak: { xp: 15, stat: "stamina", boost: 1 },
  pet: { xp: 2, stat: null, boost: 0 },
};

// ── Stat Display Names ─────────────────────────────────────

export const STAT_DISPLAY_NAMES: Record<CodingStat, string> = {
  stamina: "STAMINA",
  debugging: "DEBUGGING",
  stability: "STABILITY",
  velocity: "VELOCITY",
  wisdom: "WISDOM",
};

// ── Encounter Rate ─────────────────────────────────────────

/** XP earned between wild encounters */
export const XP_PER_ENCOUNTER = 500;

// ── Reaction Cooldown ──────────────────────────────────────

export const DEFAULT_REACTION_COOLDOWN_MS = 30_000;

// ── Trainer Titles (by highest Pokemon level) ──────────────

export const TRAINER_TITLES: readonly TrainerTitle[] = [
  { minLevel: 1, title: "Bug Catcher" },
  { minLevel: 6, title: "Youngster" },
  { minLevel: 11, title: "Hiker" },
  { minLevel: 21, title: "Ace Trainer" },
  { minLevel: 31, title: "Cooltrainer" },
  { minLevel: 41, title: "Veteran" },
  { minLevel: 51, title: "Elite Four" },
  { minLevel: 61, title: "Champion" },
  { minLevel: 76, title: "Pokemon Master" },
  { minLevel: 91, title: "Professor" },
];

// ── Badge Definitions ──────────────────────────────────────

export const BADGES: readonly Badge[] = [
  {
    type: "blaze",
    name: "Blaze Badge",
    description: "Fix 50 bugs — unlocks Fire Stone evolutions",
    condition: { type: "counter", counter: "bugs_fixed", threshold: 50 },
  },
  {
    type: "flow",
    name: "Flow Badge",
    description: "Pass 100 tests — unlocks Water Stone evolutions",
    condition: { type: "counter", counter: "tests_passed", threshold: 100 },
  },
  {
    type: "spark",
    name: "Spark Badge",
    description: "Make 200 commits — unlocks Thunder Stone evolutions",
    condition: { type: "counter", counter: "commits", threshold: 200 },
  },
  {
    type: "lunar",
    name: "Lunar Badge",
    description: "Maintain a 30-day coding streak — unlocks Moon Stone evolutions",
    condition: { type: "streak", minDays: 30 },
  },
  {
    type: "growth",
    name: "Growth Badge",
    description: "Edit 500 files — unlocks Leaf Stone evolutions",
    condition: { type: "counter", counter: "files_edited", threshold: 500 },
  },
];

// ── State File Paths ───────────────────────────────────────

/** Resolved at call time so tests can override HOME */
export function getStateDir(): string {
  return `${process.env["HOME"] ?? "~"}/.claudemon`;
}
export function getStateFile(): string {
  return `${getStateDir()}/state.json`;
}
export function getStatusFile(): string {
  return `${getStateDir()}/status.json`;
}

// ── Terminal Bell ──────────────────────────────────────────

export const BELL = "\x07";
