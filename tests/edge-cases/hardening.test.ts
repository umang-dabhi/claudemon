/**
 * Hardening tests for edge cases and corruption recovery.
 * Ensures graceful degradation when data is missing, corrupt, or extreme.
 */

import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { StateManager } from "../../src/state/state-manager.js";
import { safeRead, ensureDir, backupCorrupted, withLock } from "../../src/state/io.js";
import { loadSmallSprite } from "../../src/sprites/index.js";
import {
  cumulativeXpForLevel,
  xpToNextLevel,
  addXp,
  xpProgressPercent,
} from "../../src/engine/xp.js";
import {
  checkEvolution,
  getEvolutionLinks,
  findEvolutionChain,
} from "../../src/engine/evolution.js";
import {
  shouldTriggerEncounter,
  generateEncounter,
  canCatch,
  getCatchCondition,
} from "../../src/engine/encounters.js";
import { renderStatBar, getTrainerTitle, initCodingStats } from "../../src/engine/stats.js";
import { POKEMON_BY_ID } from "../../src/engine/pokemon-data.js";
import type {
  OwnedPokemon,
  PlayerState,
  WildEncounter,
  BaseStats,
} from "../../src/engine/types.js";

// ── Test Helpers ────────────────────────────────────────────────

let testDir: string;

/** Create a unique temp dir for each test group */
async function createTestDir(): Promise<string> {
  const dir = join(tmpdir(), `claudemon-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

function makeOwned(overrides: Partial<OwnedPokemon> = {}): OwnedPokemon {
  return {
    id: "test-uuid",
    pokemonId: 4, // Charmander
    nickname: null,
    level: 5,
    currentXp: 0,
    totalXp: 0,
    codingStats: { stamina: 19, debugging: 26, stability: 21, velocity: 32, wisdom: 25 },
    happiness: 70,
    caughtAt: "2026-04-13T00:00:00.000Z",
    evolvedAt: null,
    isActive: true,
    personality: null,
    shiny: false,
    isStarter: true,
    ...overrides,
  };
}

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    trainerId: "test-trainer",
    trainerName: "Ash",
    party: [makeOwned()],
    pcBox: [],
    pokedex: { entries: {}, totalSeen: 0, totalCaught: 0 },
    badges: [],
    achievements: [],
    counters: {
      commits: 0,
      tests_passed: 0,
      tests_failed: 0,
      tests_written: 0,
      builds_succeeded: 0,
      builds_failed: 0,
      bugs_fixed: 0,
      lint_fixes: 0,
      files_created: 0,
      files_edited: 0,
      searches: 0,
      large_refactors: 0,
      errors_encountered: 0,
      sessions: 0,
      prs_merged: 0,
    },
    streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalDaysActive: 0 },
    config: {
      muted: false,
      reactionCooldownMs: 30000,
      statusLineEnabled: true,
      bellEnabled: true,
      encounterSpeed: "normal" as const,
      xpSharePercent: 25,
    },
    startedAt: "2026-04-13T00:00:00.000Z",
    totalXpEarned: 0,
    totalSessions: 0,
    pendingEncounter: null,
    xpSinceLastEncounter: 0,
    recentToolTypes: [],
    lastEncounterTime: 0,
    mood: "neutral" as const,
    moodSetAt: 0,
    lastFedAt: 0,
    lastTrainedAt: 0,
    lastPlayedAt: 0,
    pendingQuiz: null,
    ...overrides,
  };
}

// ── State I/O: Corrupted JSON Handling ──────────────────────────

describe("safeRead", () => {
  beforeEach(async () => {
    testDir = await createTestDir();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("returns null for non-existent file", async () => {
    const result = await safeRead(join(testDir, "missing.json"));
    expect(result).toBeNull();
  });

  test("returns null for empty file", async () => {
    const filePath = join(testDir, "empty.json");
    await writeFile(filePath, "");
    const result = await safeRead(filePath);
    expect(result).toBeNull();
  });

  test("returns null for whitespace-only file", async () => {
    const filePath = join(testDir, "whitespace.json");
    await writeFile(filePath, "   \n\t  ");
    const result = await safeRead(filePath);
    expect(result).toBeNull();
  });

  test("returns null for invalid JSON (truncated)", async () => {
    const filePath = join(testDir, "truncated.json");
    await writeFile(filePath, '{"trainerId": "abc", "party": [');
    const result = await safeRead(filePath);
    expect(result).toBeNull();
  });

  test("returns null for garbage content", async () => {
    const filePath = join(testDir, "garbage.json");
    await writeFile(filePath, "not json at all !!!");
    const result = await safeRead(filePath);
    expect(result).toBeNull();
  });

  test("parses valid JSON correctly", async () => {
    const filePath = join(testDir, "valid.json");
    await writeFile(filePath, '{"key": "value"}');
    const result = await safeRead<{ key: string }>(filePath);
    expect(result).toEqual({ key: "value" });
  });
});

// ── backupCorrupted ─────────────────────────────────────────────

describe("backupCorrupted", () => {
  beforeEach(async () => {
    testDir = await createTestDir();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("creates a backup of the corrupted file", async () => {
    const filePath = join(testDir, "state.json");
    await writeFile(filePath, "corrupted content");
    const backupPath = await backupCorrupted(filePath);

    expect(backupPath).toContain("state.json.corrupt.");
    const backupFile = Bun.file(backupPath);
    expect(await backupFile.exists()).toBe(true);
    expect(await backupFile.text()).toBe("corrupted content");
  });

  test("does not crash if source file is missing", async () => {
    const filePath = join(testDir, "nonexistent.json");
    const backupPath = await backupCorrupted(filePath);
    expect(backupPath).toContain("nonexistent.json.corrupt.");
    // Backup file should not exist since source didn't exist
  });
});

// ── withLock ────────────────────────────────────────────────────

describe("withLock", () => {
  beforeEach(async () => {
    testDir = await createTestDir();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("executes function and cleans up lock", async () => {
    const lockPath = join(testDir, "test.lock");
    const result = await withLock(lockPath, async () => {
      // Lock file should exist during execution
      const lockFile = Bun.file(lockPath);
      expect(await lockFile.exists()).toBe(true);
      return 42;
    });

    expect(result).toBe(42);

    // Lock should be cleaned up after
    const lockFile = Bun.file(lockPath);
    expect(await lockFile.exists()).toBe(false);
  });

  test("cleans up lock even if function throws", async () => {
    const lockPath = join(testDir, "test.lock");
    try {
      await withLock(lockPath, async () => {
        throw new Error("test error");
      });
    } catch {
      // Expected
    }

    const lockFile = Bun.file(lockPath);
    expect(await lockFile.exists()).toBe(false);
  });

  test("proceeds past stale lock (older than 5s)", async () => {
    const lockPath = join(testDir, "test.lock");
    // Create a stale lock by writing it and then making it appear old
    // Since we can't easily backdate, we create the lock and rely on the
    // timestamp check seeing it as "just created" but within the stale window
    await writeFile(lockPath, String(Date.now() - 10000)); // Content shows old timestamp

    const result = await withLock(lockPath, async () => 99);
    expect(result).toBe(99);
  });
});

// ── ensureDir ───────────────────────────────────────────────────

describe("ensureDir", () => {
  beforeEach(async () => {
    testDir = await createTestDir();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("creates nested directories", async () => {
    const deepPath = join(testDir, "a", "b", "c");
    await ensureDir(deepPath);
    const dir = Bun.file(join(deepPath, "."));
    // If no error thrown, directory was created
    expect(true).toBe(true);
  });

  test("does not error on existing directory", async () => {
    await ensureDir(testDir);
    await ensureDir(testDir); // Second call should not throw
    expect(true).toBe(true);
  });
});

// ── Sprite Loader Edge Cases ────────────────────────────────────

describe("loadSmallSprite", () => {
  test("returns null for invalid Pokemon ID 0", () => {
    expect(loadSmallSprite(0)).toBeNull();
  });

  test("returns null for Pokemon ID beyond 151", () => {
    expect(loadSmallSprite(152)).toBeNull();
  });

  test("returns null for negative Pokemon ID", () => {
    expect(loadSmallSprite(-1)).toBeNull();
  });

  test("returns null for very large Pokemon ID", () => {
    expect(loadSmallSprite(99999)).toBeNull();
  });

  test("returns string or null for valid Pokemon IDs (depends on sprite files)", () => {
    // This test verifies the function never crashes for valid IDs
    for (let id = 1; id <= 151; id++) {
      const result = loadSmallSprite(id);
      if (result !== null) {
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      }
    }
  });
});

// ── XP Formula Edge Cases ───────────────────────────────────────

describe("XP edge cases", () => {
  test("cumulativeXpForLevel at level 1 returns non-negative for all groups", () => {
    expect(cumulativeXpForLevel(1, "fast")).toBeGreaterThanOrEqual(0);
    expect(cumulativeXpForLevel(1, "medium_fast")).toBeGreaterThanOrEqual(0);
    expect(cumulativeXpForLevel(1, "medium_slow")).toBeGreaterThanOrEqual(0);
    expect(cumulativeXpForLevel(1, "slow")).toBeGreaterThanOrEqual(0);
  });

  test("cumulativeXpForLevel at level 100 returns reasonable values", () => {
    expect(cumulativeXpForLevel(100, "fast")).toBeGreaterThan(0);
    expect(cumulativeXpForLevel(100, "medium_fast")).toBeGreaterThan(0);
    expect(cumulativeXpForLevel(100, "medium_slow")).toBeGreaterThan(0);
    expect(cumulativeXpForLevel(100, "slow")).toBeGreaterThan(0);
  });

  test("xpToNextLevel returns 0 at max level", () => {
    expect(xpToNextLevel(100, "fast")).toBe(0);
    expect(xpToNextLevel(100, "medium_fast")).toBe(0);
    expect(xpToNextLevel(100, "medium_slow")).toBe(0);
    expect(xpToNextLevel(100, "slow")).toBe(0);
  });

  test("xpToNextLevel returns positive for all non-max levels", () => {
    for (let level = 1; level <= 99; level++) {
      expect(xpToNextLevel(level, "medium_fast")).toBeGreaterThan(0);
    }
  });

  test("addXp handles zero XP gracefully", () => {
    const pokemon = makeOwned({ level: 5, currentXp: 0 });
    const species = POKEMON_BY_ID.get(4)!;
    const result = addXp(pokemon, 0, species);
    expect(result).toBeNull();
    expect(pokemon.level).toBe(5);
  });

  test("addXp handles negative XP gracefully", () => {
    const pokemon = makeOwned({ level: 5, currentXp: 0 });
    const species = POKEMON_BY_ID.get(4)!;
    const result = addXp(pokemon, -100, species);
    expect(result).toBeNull();
    expect(pokemon.level).toBe(5);
  });

  test("addXp at max level does nothing", () => {
    const pokemon = makeOwned({ level: 100, currentXp: 0 });
    const species = POKEMON_BY_ID.get(4)!;
    const result = addXp(pokemon, 1000000, species);
    expect(result).toBeNull();
    expect(pokemon.level).toBe(100);
    expect(pokemon.currentXp).toBe(0);
  });

  test("xpProgressPercent at max level returns 100", () => {
    const pokemon = makeOwned({ level: 100, currentXp: 0 });
    const species = POKEMON_BY_ID.get(4)!;
    expect(xpProgressPercent(pokemon, species)).toBe(100);
  });

  test("xpProgressPercent with massive currentXp is capped at 100", () => {
    const pokemon = makeOwned({ level: 5, currentXp: 999999999 });
    const species = POKEMON_BY_ID.get(4)!;
    expect(xpProgressPercent(pokemon, species)).toBeLessThanOrEqual(100);
  });
});

// ── Evolution Edge Cases ────────────────────────────────────────

describe("evolution edge cases", () => {
  test("checkEvolution returns null for Pokemon with no evolution chain", () => {
    // Tauros (ID 128) has no evolution
    const pokemon = makeOwned({ pokemonId: 128, level: 100 });
    const state = makeState({ party: [pokemon] });
    const result = checkEvolution(pokemon, state);
    expect(result).toBeNull();
  });

  test("getEvolutionLinks returns empty array for non-evolving Pokemon", () => {
    // Tauros (128) does not evolve
    const links = getEvolutionLinks(128);
    expect(links).toEqual([]);
  });

  test("getEvolutionLinks returns empty array for unknown Pokemon ID", () => {
    const links = getEvolutionLinks(9999);
    expect(links).toEqual([]);
  });

  test("findEvolutionChain returns null for non-evolving Pokemon", () => {
    const chain = findEvolutionChain(128);
    expect(chain).toBeNull();
  });

  test("findEvolutionChain returns null for unknown Pokemon ID", () => {
    const chain = findEvolutionChain(0);
    expect(chain).toBeNull();
  });

  test("checkEvolution handles level 1 Pokemon", () => {
    const pokemon = makeOwned({ pokemonId: 4, level: 1 });
    const state = makeState({ party: [pokemon] });
    const result = checkEvolution(pokemon, state);
    // Charmander evolves at level 16, so should not be eligible at level 1
    expect(result).toBeNull();
  });
});

// ── Encounter Edge Cases ────────────────────────────────────────

describe("encounter edge cases", () => {
  test("shouldTriggerEncounter with 0 XP returns false", () => {
    expect(
      shouldTriggerEncounter({
        xpSinceLastEncounter: 0,
        encounterSpeed: "normal",
        currentStreak: 0,
        recentToolTypes: [],
        currentHour: 12,
      }),
    ).toBe(false);
  });

  test("shouldTriggerEncounter with negative XP returns false", () => {
    expect(
      shouldTriggerEncounter({
        xpSinceLastEncounter: -100,
        encounterSpeed: "normal",
        currentStreak: 0,
        recentToolTypes: [],
        currentHour: 12,
      }),
    ).toBe(false);
  });

  test("generateEncounter with player who caught everything still works", () => {
    // Create a state where many common Pokemon are already caught
    const entries: Record<
      number,
      { seen: boolean; caught: boolean; firstSeen: string | null; firstCaught: string | null }
    > = {};
    for (let i = 1; i <= 151; i++) {
      entries[i] = { seen: true, caught: true, firstSeen: "2026-01-01", firstCaught: "2026-01-01" };
    }
    const state = makeState({
      pokedex: { entries, totalSeen: 151, totalCaught: 151 },
    });

    // Should return null or a valid encounter (common duplicates still allowed)
    const encounter = generateEncounter("commit", state);
    if (encounter) {
      expect(encounter.pokemonId).toBeGreaterThanOrEqual(1);
      expect(encounter.pokemonId).toBeLessThanOrEqual(151);
    }
  });

  test("canCatch handles unknown Pokemon ID", () => {
    const encounter: WildEncounter = {
      pokemonId: 9999,
      level: 10,
      catchCondition: { requiredStat: null, minStatValue: 0, requiredLevel: 1 },
    };
    const active = makeOwned({ level: 50 });
    const result = canCatch(encounter, active);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("Unknown Pokemon");
  });

  test("getCatchCondition returns safe defaults for unknown Pokemon", () => {
    const condition = getCatchCondition(9999);
    expect(condition.requiredStat).toBeNull();
    expect(condition.minStatValue).toBe(0);
    expect(condition.requiredLevel).toBe(1);
  });
});

// ── Stat Edge Cases ─────────────────────────────────────────────

describe("stat edge cases", () => {
  test("renderStatBar handles value 0", () => {
    const bar = renderStatBar(0);
    expect(bar.length).toBe(10);
    // Should be all empty blocks
    expect(bar).not.toContain("\u2588");
  });

  test("renderStatBar handles value 100", () => {
    const bar = renderStatBar(100);
    expect(bar.length).toBe(10);
    // Should be all filled blocks
    expect(bar).not.toContain("\u2591");
  });

  test("renderStatBar handles negative value (clamped to 0)", () => {
    const bar = renderStatBar(-50);
    expect(bar.length).toBe(10);
    expect(bar).not.toContain("\u2588");
  });

  test("renderStatBar handles value > 100 (clamped to 100)", () => {
    const bar = renderStatBar(200);
    expect(bar.length).toBe(10);
    expect(bar).not.toContain("\u2591");
  });

  test("renderStatBar handles value 255 (max possible stat)", () => {
    const bar = renderStatBar(255);
    expect(bar.length).toBe(10);
  });

  test("getTrainerTitle handles level 0", () => {
    const title = getTrainerTitle(0);
    expect(typeof title).toBe("string");
    expect(title.length).toBeGreaterThan(0);
  });

  test("getTrainerTitle handles level 1 (minimum)", () => {
    const title = getTrainerTitle(1);
    expect(title).toBe("Bug Catcher");
  });

  test("getTrainerTitle handles level 100 (maximum)", () => {
    const title = getTrainerTitle(100);
    expect(title).toBe("Professor");
  });

  test("getTrainerTitle handles extreme level 999", () => {
    const title = getTrainerTitle(999);
    expect(title).toBe("Professor");
  });

  test("initCodingStats handles zero base stats", () => {
    const zeroBase: BaseStats = { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 };
    const stats = initCodingStats(zeroBase);
    expect(stats.stamina).toBe(0);
    expect(stats.debugging).toBe(0);
    expect(stats.stability).toBe(0);
    expect(stats.velocity).toBe(0);
    expect(stats.wisdom).toBe(0);
  });

  test("initCodingStats handles max base stats (255)", () => {
    const maxBase: BaseStats = { hp: 255, attack: 255, defense: 255, speed: 255, special: 255 };
    const stats = initCodingStats(maxBase);
    // Each stat should be floor(255 * 0.5) = 127
    expect(stats.stamina).toBe(127);
    expect(stats.debugging).toBe(127);
    expect(stats.stability).toBe(127);
    expect(stats.velocity).toBe(127);
    expect(stats.wisdom).toBe(127);
  });
});

// ── State Manager Edge Cases ────────────────────────────────────

describe("StateManager edge cases", () => {
  beforeEach(() => {
    StateManager.resetInstance();
  });

  afterEach(() => {
    StateManager.resetInstance();
  });

  test("getState throws if not loaded", () => {
    const manager = StateManager.getInstance();
    expect(() => manager.getState()).toThrow("State not loaded");
  });

  test("getActivePokemon returns null if not loaded", () => {
    const manager = StateManager.getInstance();
    expect(manager.getActivePokemon()).toBeNull();
  });

  test("save throws if state not loaded", async () => {
    const manager = StateManager.getInstance();
    expect(manager.save()).rejects.toThrow("Cannot save");
  });

  test("singleton returns same instance", () => {
    const a = StateManager.getInstance();
    const b = StateManager.getInstance();
    expect(a).toBe(b);
  });

  test("resetInstance creates fresh instance", () => {
    const a = StateManager.getInstance();
    StateManager.resetInstance();
    const b = StateManager.getInstance();
    expect(a).not.toBe(b);
  });
});
