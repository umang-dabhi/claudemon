/**
 * Singleton state manager for Claudemon.
 * All state reads/writes flow through this class.
 */

import { access as fsAccess } from "node:fs/promises";
import { constants as fsConst } from "node:fs";
import { getStateDir, getStateFile, getStatusFile } from "../engine/constants.js";
import type {
  PlayerState,
  OwnedPokemon,
  EventCounterKey,
  EventCounters,
  StreakData,
  BuddyConfig,
  PokedexState,
  WildEncounter,
  MoodType,
} from "../engine/types.js";
import { EVENT_COUNTER_KEYS } from "../engine/types.js";
import { atomicWrite, safeRead, ensureDir, backupCorrupted, withLock } from "./io.js";
import { PlayerStateSchema } from "./schemas.js";
import { POKEMON_BY_ID } from "../engine/pokemon-data.js";

/** Compact status payload for the shell status line script */
interface StatusPayload {
  name: string; // Species name (used for sprite filename lookup)
  displayName: string; // "Nickname (Species)" or just "Species" for display
  level: number;
  xpPercent: number;
  speciesId: number;
  evolutionReady: boolean;
  mood: MoodType;
}

/** Build a zeroed-out EventCounters record */
function emptyCounters(): EventCounters {
  const counters = {} as Record<string, number>;
  for (const key of EVENT_COUNTER_KEYS) {
    counters[key] = 0;
  }
  return counters as EventCounters;
}

/** Build default streak data */
function emptyStreak(): StreakData {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    totalDaysActive: 0,
  };
}

/** Build default config */
function defaultConfig(): BuddyConfig {
  return {
    muted: false,
    reactionCooldownMs: 30_000,
    statusLineEnabled: true,
    bellEnabled: true,
    encounterSpeed: "normal",
    xpSharePercent: 25,
  };
}

/** Build empty pokedex */
function emptyPokedex(): PokedexState {
  return {
    entries: {},
    totalSeen: 0,
    totalCaught: 0,
  };
}

/** Get today's date as YYYY-MM-DD in local timezone */
function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class StateManager {
  private static instance: StateManager | null = null;
  private state: PlayerState | null = null;
  /** Timestamp of the last successful load from disk */
  private lastLoadTime: number = 0;
  /** How long (in ms) cached state is considered fresh before re-reading disk */
  private static readonly CACHE_TTL_MS = 1000;

  /** Debounce timer for writeStatus — limits disk writes to at most once per second */
  private statusWriteTimer: ReturnType<typeof setTimeout> | null = null;
  /** Payload queued for the next debounced status write */
  private pendingStatusPayload: StatusPayload | null = null;
  /** Maximum frequency for status file writes (ms) */
  private static readonly STATUS_DEBOUNCE_MS = 1000;

  private constructor() {}

  /** Get the singleton StateManager instance */
  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /** Load state from disk. Returns cached state if loaded within the last second. */
  async load(): Promise<PlayerState | null> {
    // Return cached state if fresh enough (avoids redundant disk reads from MCP tool calls)
    if (
      this.state &&
      this.lastLoadTime > 0 &&
      Date.now() - this.lastLoadTime < StateManager.CACHE_TTL_MS
    ) {
      return this.state;
    }

    await ensureDir(getStateDir());

    const stateFile = getStateFile();
    let fileExists = true;
    try {
      await fsAccess(stateFile, fsConst.F_OK);
    } catch {
      fileExists = false;
    }
    if (!fileExists) {
      return null;
    }

    const raw = await safeRead<unknown>(stateFile);
    if (raw === null) {
      // File exists but safeRead returned null — empty or invalid JSON
      const backupPath = await backupCorrupted(stateFile);
      process.stderr.write(
        `[claudemon] State file was corrupted and has been backed up to ${backupPath}\n` +
          `[claudemon] You'll need to pick a new starter with buddy_starter.\n`,
      );
      return null;
    }

    try {
      // Zod output is structurally compatible but not nominally identical to PlayerState
      const parsed = PlayerStateSchema.parse(raw) as PlayerState;
      this.state = parsed;
      this.lastLoadTime = Date.now();
      return this.state;
    } catch (err: unknown) {
      // Schema validation failed — data on disk doesn't match expected shape
      const backupPath = await backupCorrupted(stateFile);
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `[claudemon] State validation failed: ${message}\n` +
          `[claudemon] Corrupted data backed up to ${backupPath}\n` +
          `[claudemon] You'll need to pick a new starter with buddy_starter.\n`,
      );
      return null;
    }
  }

  /** Save current state to disk atomically, protected by file lock */
  async save(): Promise<void> {
    if (!this.state) {
      throw new Error("Cannot save: state not loaded. Call load() or initializePlayer() first.");
    }
    const stateDir = getStateDir();
    await ensureDir(stateDir);
    const lockPath = `${stateDir}/state.lock`;
    await withLock(lockPath, async () => {
      const json = JSON.stringify(this.state, null, 2);
      await atomicWrite(getStateFile(), json);
    });
    // After saving, in-memory state matches disk — refresh cache timestamp
    this.lastLoadTime = Date.now();
  }

  /** Get current state (throws if not loaded) */
  getState(): PlayerState {
    if (!this.state) {
      throw new Error("State not loaded. Call load() first.");
    }
    return this.state;
  }

  /** Check if this is first run (no state file exists) */
  async isFirstRun(): Promise<boolean> {
    try {
      await fsAccess(getStateFile(), fsConst.F_OK);
      return false;
    } catch {
      return true;
    }
  }

  /** Initialize new player state after starter selection */
  async initializePlayer(
    trainerId: string,
    trainerName: string,
    starter: OwnedPokemon,
  ): Promise<PlayerState> {
    const now = new Date().toISOString();

    const state: PlayerState = {
      trainerId,
      trainerName,
      party: [starter],
      pcBox: [],
      pokedex: emptyPokedex(),
      badges: [],
      achievements: [],
      counters: emptyCounters(),
      streak: emptyStreak(),
      config: defaultConfig(),
      startedAt: now,
      totalXpEarned: 0,
      totalSessions: 0,
      pendingEncounter: null,
      xpSinceLastEncounter: 0,
      recentToolTypes: [],
      lastEncounterTime: 0,
      mood: "neutral",
      moodSetAt: 0,
      lastFedAt: 0,
      lastTrainedAt: 0,
      lastPlayedAt: 0,
      pendingQuiz: null,
      shareStats: { wins: 0, losses: 0, ties: 0 },
    };

    this.state = state;
    await this.save();
    return this.state;
  }

  /** Get the active Pokemon from the party (isActive === true) */
  getActivePokemon(): OwnedPokemon | null {
    if (!this.state) {
      return null;
    }
    return this.state.party.find((p) => p.isActive) ?? null;
  }

  /** Increment an event counter by amount (default 1) and save (lock-protected) */
  async incrementCounter(key: EventCounterKey, amount: number = 1): Promise<void> {
    const state = this.getState();
    state.counters[key] += amount;
    await this.save();
  }

  /**
   * Update daily streak with weekend grace period.
   * Allows up to 2 days off without breaking the streak (covers weekends).
   * Streak counts "coding days" not "consecutive calendar days".
   */
  async updateStreak(): Promise<void> {
    const state = this.getState();
    const today = todayDateString();
    const { streak } = state;

    if (streak.lastActiveDate === today) {
      return;
    }

    if (streak.lastActiveDate === null) {
      streak.currentStreak = 1;
      streak.totalDaysActive = 1;
    } else {
      const last = new Date(streak.lastActiveDate);
      const now = new Date(today);
      const diffMs = now.getTime() - last.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Grace period: up to 2 days off (covers weekends)
      // 1 day gap = next day (consecutive) ✓
      // 2 day gap = skipped 1 day (e.g., Friday → Sunday) ✓
      // 3 day gap = skipped 2 days (e.g., Friday → Monday) ✓
      // 4+ day gap = streak broken
      if (diffDays <= 3) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
      streak.totalDaysActive += 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastActiveDate = today;
    await this.save();
  }

  /**
   * Write compact status JSON for the shell status line script.
   * Debounced: at most one disk write per STATUS_DEBOUNCE_MS.
   * The payload is computed immediately so it always reflects the latest state,
   * but the actual I/O is deferred and coalesced.
   */
  async writeStatus(evolutionReady: boolean = false): Promise<void> {
    const active = this.getActivePokemon();
    if (!active) {
      return;
    }

    const state = this.getState();

    // XP percent is currentXp as a rough percentage toward next level
    // Exact formula depends on exp group; use a simple ratio for the status line
    const xpPercent =
      active.level >= 100
        ? 100
        : Math.min(100, Math.floor((active.currentXp / Math.max(1, active.currentXp + 50)) * 100));

    // Look up species name for sprite lookup and display
    const species = POKEMON_BY_ID.get(active.pokemonId);
    const speciesName = species?.name ?? `Pokemon #${active.pokemonId}`;
    const displayName = active.nickname ? `${active.nickname} (${speciesName})` : speciesName;

    const payload: StatusPayload = {
      name: speciesName,
      displayName,
      level: active.level,
      xpPercent,
      speciesId: active.pokemonId,
      evolutionReady,
      mood: state.mood ?? "neutral",
    };

    // Always update the pending payload to the latest values
    this.pendingStatusPayload = payload;

    // If a write is already scheduled, it will pick up the updated payload
    if (this.statusWriteTimer) return;

    this.statusWriteTimer = setTimeout(() => {
      void (async () => {
        this.statusWriteTimer = null;
        if (this.pendingStatusPayload) {
          const stateDir = getStateDir();
          await ensureDir(stateDir);
          await atomicWrite(getStatusFile(), JSON.stringify(this.pendingStatusPayload));
          this.pendingStatusPayload = null;
        }
      })();
    }, StateManager.STATUS_DEBOUNCE_MS);
  }

  /** Flush any pending debounced status write immediately.
   *  Call before process exit to ensure the last status update is persisted. */
  async flushStatus(): Promise<void> {
    if (this.statusWriteTimer) {
      clearTimeout(this.statusWriteTimer);
      this.statusWriteTimer = null;
    }
    if (this.pendingStatusPayload) {
      const stateDir = getStateDir();
      await ensureDir(stateDir);
      await atomicWrite(getStatusFile(), JSON.stringify(this.pendingStatusPayload));
      this.pendingStatusPayload = null;
    }
  }

  /** Set a pending wild encounter on state. */
  setPendingEncounter(encounter: WildEncounter): void {
    const state = this.getState();
    state.pendingEncounter = encounter;
  }

  /** Clear the pending wild encounter from state. */
  clearPendingEncounter(): void {
    const state = this.getState();
    state.pendingEncounter = null;
  }

  /** Write encounter notification to status JSON so status line can show it. */
  async writeEncounterStatus(pokemonName: string): Promise<void> {
    const active = this.getActivePokemon();
    if (!active) return;

    const xpPercent =
      active.level >= 100
        ? 100
        : Math.min(100, Math.floor((active.currentXp / Math.max(1, active.currentXp + 50)) * 100));

    const species = POKEMON_BY_ID.get(active.pokemonId);
    const speciesName = species?.name ?? `Pokemon #${active.pokemonId}`;
    const displayLabel = active.nickname ? `${active.nickname} (${speciesName})` : speciesName;

    const payload = {
      name: speciesName,
      displayName: displayLabel,
      level: active.level,
      xpPercent,
      speciesId: active.pokemonId,
      evolutionReady: false,
      encounter: `Wild ${pokemonName} appeared!`,
    };

    await ensureDir(getStateDir());
    await atomicWrite(getStatusFile(), JSON.stringify(payload));
  }

  /** Reset singleton for testing purposes */
  static resetInstance(): void {
    StateManager.instance = null;
  }

  /** Invalidate the in-memory cache, forcing the next load() to read from disk */
  invalidateCache(): void {
    this.lastLoadTime = 0;
  }
}
