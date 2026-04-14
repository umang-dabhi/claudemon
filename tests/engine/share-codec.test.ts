/**
 * Share codec tests for Claudemon.
 * Verifies encode/decode roundtrip, type detection, invalid input handling,
 * and random rival name generation.
 */

import { describe, expect, test } from "bun:test";
import {
  encodePokemonShare,
  encodeTrainerShare,
  decodePokemonShare,
  decodeTrainerShare,
  detectShareCodeType,
  getRandomRivalName,
  type SharePokemonPayload,
  type ShareTrainerPayload,
} from "../../src/engine/share-codec.js";

// ── Test Fixtures ─────────────────────────────────────────

const samplePokemon: SharePokemonPayload = {
  name: "Sparky",
  speciesId: 25,
  level: 14,
  totalXp: 1240,
  stats: { stamina: 17, debugging: 27, stability: 15, velocity: 45, wisdom: 25 },
  happiness: 120,
  shiny: false,
  isStarter: false,
};

const sampleTrainer: ShareTrainerPayload = {
  trainer: "Ash",
  pokemon: [
    {
      name: "Pikachu",
      speciesId: 25,
      level: 14,
      totalXp: 1240,
      stats: { stamina: 17, debugging: 27, stability: 15, velocity: 45, wisdom: 25 },
    },
    {
      name: "Bulbasaur",
      speciesId: 1,
      level: 8,
      totalXp: 400,
      stats: { stamina: 22, debugging: 24, stability: 24, velocity: 22, wisdom: 32 },
    },
  ],
  dex: { seen: 23, caught: 12 },
  achievements: 3,
  badges: ["spark"],
  streak: { current: 5, longest: 12 },
  totalXp: 2100,
  totalSessions: 15,
};

// ── encodePokemonShare / decodePokemonShare ────────────────

describe("Pokemon share codec", () => {
  test("roundtrip encode/decode preserves all fields", () => {
    const code = encodePokemonShare(samplePokemon);
    const decoded = decodePokemonShare(code);

    expect(decoded).not.toBeNull();
    expect(decoded!.name).toBe("Sparky");
    expect(decoded!.speciesId).toBe(25);
    expect(decoded!.level).toBe(14);
    expect(decoded!.totalXp).toBe(1240);
    expect(decoded!.stats.stamina).toBe(17);
    expect(decoded!.stats.debugging).toBe(27);
    expect(decoded!.stats.stability).toBe(15);
    expect(decoded!.stats.velocity).toBe(45);
    expect(decoded!.stats.wisdom).toBe(25);
    expect(decoded!.happiness).toBe(120);
    expect(decoded!.shiny).toBe(false);
    expect(decoded!.isStarter).toBe(false);
  });

  test("code starts with CLDM-P:v1: prefix", () => {
    const code = encodePokemonShare(samplePokemon);
    expect(code.startsWith("CLDM-P:v1:")).toBe(true);
  });

  test("decodes with whitespace around code", () => {
    const code = encodePokemonShare(samplePokemon);
    const decoded = decodePokemonShare(`  ${code}  `);
    expect(decoded).not.toBeNull();
    expect(decoded!.name).toBe("Sparky");
  });

  test("returns null for trainer code prefix", () => {
    const code = encodeTrainerShare(sampleTrainer);
    const decoded = decodePokemonShare(code);
    expect(decoded).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(decodePokemonShare("")).toBeNull();
  });

  test("returns null for garbage input", () => {
    expect(decodePokemonShare("not-a-share-code")).toBeNull();
  });

  test("returns null for corrupted base64", () => {
    expect(decodePokemonShare("CLDM-P:v1:!!!invalid!!!")).toBeNull();
  });

  test("returns null for valid base64 but invalid JSON", () => {
    const bad = "CLDM-P:v1:" + Buffer.from("not json", "utf-8").toString("base64url");
    expect(decodePokemonShare(bad)).toBeNull();
  });

  test("returns null for valid JSON but missing required fields", () => {
    const bad =
      "CLDM-P:v1:" + Buffer.from(JSON.stringify({ foo: "bar" }), "utf-8").toString("base64url");
    expect(decodePokemonShare(bad)).toBeNull();
  });

  test("handles Pokemon with nickname containing special chars", () => {
    const special: SharePokemonPayload = {
      ...samplePokemon,
      name: "Mr. Mime's #1 Fan!",
    };
    const code = encodePokemonShare(special);
    const decoded = decodePokemonShare(code);
    expect(decoded!.name).toBe("Mr. Mime's #1 Fan!");
  });

  test("handles level 100 max-stat Pokemon", () => {
    const maxed: SharePokemonPayload = {
      name: "Mewtwo",
      speciesId: 150,
      level: 100,
      totalXp: 999999,
      stats: { stamina: 200, debugging: 200, stability: 200, velocity: 200, wisdom: 200 },
      happiness: 255,
      shiny: true,
      isStarter: false,
    };
    const code = encodePokemonShare(maxed);
    const decoded = decodePokemonShare(code);
    expect(decoded!.level).toBe(100);
    expect(decoded!.shiny).toBe(true);
    expect(decoded!.happiness).toBe(255);
  });
});

// ── encodeTrainerShare / decodeTrainerShare ─────────────────

describe("Trainer share codec", () => {
  test("roundtrip encode/decode preserves all fields", () => {
    const code = encodeTrainerShare(sampleTrainer);
    const decoded = decodeTrainerShare(code);

    expect(decoded).not.toBeNull();
    expect(decoded!.trainer).toBe("Ash");
    expect(decoded!.pokemon).toHaveLength(2);
    expect(decoded!.pokemon[0]!.name).toBe("Pikachu");
    expect(decoded!.pokemon[1]!.name).toBe("Bulbasaur");
    expect(decoded!.dex.seen).toBe(23);
    expect(decoded!.dex.caught).toBe(12);
    expect(decoded!.achievements).toBe(3);
    expect(decoded!.badges).toEqual(["spark"]);
    expect(decoded!.streak.current).toBe(5);
    expect(decoded!.streak.longest).toBe(12);
    expect(decoded!.totalXp).toBe(2100);
    expect(decoded!.totalSessions).toBe(15);
  });

  test("code starts with CLDM-T:v1: prefix", () => {
    const code = encodeTrainerShare(sampleTrainer);
    expect(code.startsWith("CLDM-T:v1:")).toBe(true);
  });

  test("decodes with whitespace around code", () => {
    const code = encodeTrainerShare(sampleTrainer);
    const decoded = decodeTrainerShare(`  ${code}  `);
    expect(decoded).not.toBeNull();
    expect(decoded!.trainer).toBe("Ash");
  });

  test("returns null for pokemon code prefix", () => {
    const code = encodePokemonShare(samplePokemon);
    const decoded = decodeTrainerShare(code);
    expect(decoded).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(decodeTrainerShare("")).toBeNull();
  });

  test("returns null for garbage input", () => {
    expect(decodeTrainerShare("garbage")).toBeNull();
  });

  test("returns null for corrupted base64", () => {
    expect(decodeTrainerShare("CLDM-T:v1:!!!invalid!!!")).toBeNull();
  });

  test("returns null for valid JSON but missing required fields", () => {
    const bad =
      "CLDM-T:v1:" + Buffer.from(JSON.stringify({ trainer: "X" }), "utf-8").toString("base64url");
    expect(decodeTrainerShare(bad)).toBeNull();
  });

  test("handles empty party", () => {
    const empty: ShareTrainerPayload = {
      ...sampleTrainer,
      pokemon: [],
    };
    const code = encodeTrainerShare(empty);
    const decoded = decodeTrainerShare(code);
    expect(decoded!.pokemon).toHaveLength(0);
  });

  test("handles full 6-member party", () => {
    const member = sampleTrainer.pokemon[0]!;
    const full: ShareTrainerPayload = {
      ...sampleTrainer,
      pokemon: Array(6).fill(member),
    };
    const code = encodeTrainerShare(full);
    const decoded = decodeTrainerShare(code);
    expect(decoded!.pokemon).toHaveLength(6);
  });

  test("handles all 5 badges", () => {
    const allBadges: ShareTrainerPayload = {
      ...sampleTrainer,
      badges: ["blaze", "flow", "spark", "lunar", "growth"],
    };
    const code = encodeTrainerShare(allBadges);
    const decoded = decodeTrainerShare(code);
    expect(decoded!.badges).toHaveLength(5);
  });
});

// ── detectShareCodeType ────────────────────────────────────

describe("detectShareCodeType", () => {
  test("detects pokemon code", () => {
    const code = encodePokemonShare(samplePokemon);
    expect(detectShareCodeType(code)).toBe("pokemon");
  });

  test("detects trainer code", () => {
    const code = encodeTrainerShare(sampleTrainer);
    expect(detectShareCodeType(code)).toBe("trainer");
  });

  test("returns null for unknown prefix", () => {
    expect(detectShareCodeType("UNKNOWN:v1:abc")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(detectShareCodeType("")).toBeNull();
  });

  test("handles whitespace in code", () => {
    const code = encodePokemonShare(samplePokemon);
    expect(detectShareCodeType(`  ${code}  `)).toBe("pokemon");
  });
});

// ── getRandomRivalName ─────────────────────────────────────

describe("getRandomRivalName", () => {
  test("returns a non-empty string", () => {
    const name = getRandomRivalName();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(0);
  });

  test("returns known Pokemon character names", () => {
    const knownNames = new Set([
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
    ]);

    // Run many times to check all return known names
    for (let i = 0; i < 50; i++) {
      const name = getRandomRivalName();
      expect(knownNames.has(name)).toBe(true);
    }
  });
});
