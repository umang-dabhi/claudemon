/**
 * Share code encoder/decoder for Claudemon.
 * Generates compact base64-encoded strings for sharing Pokemon and trainer stats.
 *
 * Formats:
 *   CLDM-P:v1:<base64>  — Single Pokemon share code
 *   CLDM-T:v1:<base64>  — Trainer/party share code
 */

import type { CodingStats, BadgeType } from "./types.js";

// ── Payload Types ─────────────────────────────────────────

export interface SharePokemonPayload {
  name: string; // display name (nickname or species)
  speciesId: number;
  level: number;
  totalXp: number;
  stats: CodingStats;
  happiness: number;
  shiny: boolean;
  isStarter: boolean;
}

export interface SharePartyMember {
  name: string;
  speciesId: number;
  level: number;
  totalXp: number;
  stats: CodingStats;
}

export interface ShareTrainerPayload {
  trainer: string;
  pokemon: SharePartyMember[];
  dex: { seen: number; caught: number };
  achievements: number;
  badges: BadgeType[];
  streak: { current: number; longest: number };
  totalXp: number;
  totalSessions: number;
}

// ── Prefixes ──────────────────────────────────────────────

const POKEMON_PREFIX = "CLDM-P:v1:";
const TRAINER_PREFIX = "CLDM-T:v1:";

// ── Random Rival Names ────────────────────────────────────

const RIVAL_NAMES = [
  "Ash",
  "Misty",
  "Brock",
  "Gary",
  "Red",
  "Blue",
  "Green",
  "Lance",
  "Cynthia",
  "Dawn",
  "May",
  "Serena",
  "Professor Oak",
  "Lt. Surge",
  "Sabrina",
  "Erika",
  "Koga",
  "Giovanni",
  "Lorelei",
  "Agatha",
  "Bruno",
] as const;

/** Pick a random rival name from the Pokemon series. */
export function getRandomRivalName(): string {
  return RIVAL_NAMES[Math.floor(Math.random() * RIVAL_NAMES.length)]!;
}

// ── Encode ────────────────────────────────────────────────

/** Encode a single Pokemon into a share code string. */
export function encodePokemonShare(payload: SharePokemonPayload): string {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json, "utf-8").toString("base64url");
  return `${POKEMON_PREFIX}${base64}`;
}

/** Encode a trainer/party into a share code string. */
export function encodeTrainerShare(payload: ShareTrainerPayload): string {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json, "utf-8").toString("base64url");
  return `${TRAINER_PREFIX}${base64}`;
}

// ── Decode ────────────────────────────────────────────────

export type ShareCodeType = "pokemon" | "trainer";

export interface DecodeResult<T> {
  type: ShareCodeType;
  payload: T;
}

/** Detect what kind of share code this is, or null if invalid. */
export function detectShareCodeType(code: string): ShareCodeType | null {
  const trimmed = code.trim();
  if (trimmed.startsWith(POKEMON_PREFIX)) return "pokemon";
  if (trimmed.startsWith(TRAINER_PREFIX)) return "trainer";
  return null;
}

/** Decode a Pokemon share code. Returns null on invalid input. */
export function decodePokemonShare(code: string): SharePokemonPayload | null {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith(POKEMON_PREFIX)) return null;
    const base64 = trimmed.slice(POKEMON_PREFIX.length);
    const json = Buffer.from(base64, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SharePokemonPayload;

    // Basic validation
    if (
      typeof payload.name !== "string" ||
      typeof payload.speciesId !== "number" ||
      typeof payload.level !== "number" ||
      !payload.stats
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/** Decode a trainer/party share code. Returns null on invalid input. */
export function decodeTrainerShare(code: string): ShareTrainerPayload | null {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith(TRAINER_PREFIX)) return null;
    const base64 = trimmed.slice(TRAINER_PREFIX.length);
    const json = Buffer.from(base64, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as ShareTrainerPayload;

    // Basic validation
    if (typeof payload.trainer !== "string" || !Array.isArray(payload.pokemon) || !payload.dex) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
