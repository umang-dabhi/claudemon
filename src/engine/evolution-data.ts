/**
 * Evolution chains for all 151 Gen 1 Pokemon.
 * Stone evolutions are mapped to badge-based methods.
 * Trade evolutions become collaboration events.
 */

import type { EvolutionChain } from "./types.js";

export const EVOLUTION_CHAINS: readonly EvolutionChain[] = [
  // ── Chain 1: Bulbasaur → Ivysaur → Venusaur ─────────────
  {
    id: 1,
    links: [
      { from: 1, to: 2, method: { type: "level", level: 16 } },
      { from: 2, to: 3, method: { type: "level", level: 32 } },
    ],
  },

  // ── Chain 2: Charmander → Charmeleon → Charizard ─────────
  {
    id: 2,
    links: [
      { from: 4, to: 5, method: { type: "level", level: 16 } },
      { from: 5, to: 6, method: { type: "level", level: 36 } },
    ],
  },

  // ── Chain 3: Squirtle → Wartortle → Blastoise ────────────
  {
    id: 3,
    links: [
      { from: 7, to: 8, method: { type: "level", level: 16 } },
      { from: 8, to: 9, method: { type: "level", level: 36 } },
    ],
  },

  // ── Chain 4: Caterpie → Metapod → Butterfree ─────────────
  {
    id: 4,
    links: [
      { from: 10, to: 11, method: { type: "level", level: 7 } },
      { from: 11, to: 12, method: { type: "level", level: 10 } },
    ],
  },

  // ── Chain 5: Weedle → Kakuna → Beedrill ──────────────────
  {
    id: 5,
    links: [
      { from: 13, to: 14, method: { type: "level", level: 7 } },
      { from: 14, to: 15, method: { type: "level", level: 10 } },
    ],
  },

  // ── Chain 6: Pidgey → Pidgeotto → Pidgeot ────────────────
  {
    id: 6,
    links: [
      { from: 16, to: 17, method: { type: "level", level: 18 } },
      { from: 17, to: 18, method: { type: "level", level: 36 } },
    ],
  },

  // ── Chain 7: Rattata → Raticate ──────────────────────────
  {
    id: 7,
    links: [{ from: 19, to: 20, method: { type: "level", level: 20 } }],
  },

  // ── Chain 8: Spearow → Fearow ────────────────────────────
  {
    id: 8,
    links: [{ from: 21, to: 22, method: { type: "level", level: 20 } }],
  },

  // ── Chain 9: Ekans → Arbok ───────────────────────────────
  {
    id: 9,
    links: [{ from: 23, to: 24, method: { type: "level", level: 22 } }],
  },

  // ── Chain 10: Pikachu → Raichu (Thunder Stone → spark) ───
  {
    id: 10,
    links: [{ from: 25, to: 26, method: { type: "badge", badge: "spark" } }],
  },

  // ── Chain 11: Sandshrew → Sandslash ──────────────────────
  {
    id: 11,
    links: [{ from: 27, to: 28, method: { type: "level", level: 22 } }],
  },

  // ── Chain 12: Nidoran♀ → Nidorina → Nidoqueen (Moon Stone)
  {
    id: 12,
    links: [
      { from: 29, to: 30, method: { type: "level", level: 16 } },
      { from: 30, to: 31, method: { type: "badge", badge: "lunar" } },
    ],
  },

  // ── Chain 13: Nidoran♂ → Nidorino → Nidoking (Moon Stone)
  {
    id: 13,
    links: [
      { from: 32, to: 33, method: { type: "level", level: 16 } },
      { from: 33, to: 34, method: { type: "badge", badge: "lunar" } },
    ],
  },

  // ── Chain 14: Clefairy → Clefable (Moon Stone → lunar) ───
  {
    id: 14,
    links: [{ from: 35, to: 36, method: { type: "badge", badge: "lunar" } }],
  },

  // ── Chain 15: Vulpix → Ninetales (Fire Stone → blaze) ────
  {
    id: 15,
    links: [{ from: 37, to: 38, method: { type: "badge", badge: "blaze" } }],
  },

  // ── Chain 16: Jigglypuff → Wigglytuff (Moon Stone → lunar)
  {
    id: 16,
    links: [{ from: 39, to: 40, method: { type: "badge", badge: "lunar" } }],
  },

  // ── Chain 17: Zubat → Golbat ─────────────────────────────
  {
    id: 17,
    links: [{ from: 41, to: 42, method: { type: "level", level: 22 } }],
  },

  // ── Chain 18: Oddish → Gloom → Vileplume (Leaf Stone → growth)
  {
    id: 18,
    links: [
      { from: 43, to: 44, method: { type: "level", level: 21 } },
      { from: 44, to: 45, method: { type: "badge", badge: "growth" } },
    ],
  },

  // ── Chain 19: Paras → Parasect ───────────────────────────
  {
    id: 19,
    links: [{ from: 46, to: 47, method: { type: "level", level: 24 } }],
  },

  // ── Chain 20: Venonat → Venomoth ─────────────────────────
  {
    id: 20,
    links: [{ from: 48, to: 49, method: { type: "level", level: 31 } }],
  },

  // ── Chain 21: Diglett → Dugtrio ──────────────────────────
  {
    id: 21,
    links: [{ from: 50, to: 51, method: { type: "level", level: 26 } }],
  },

  // ── Chain 22: Meowth → Persian ───────────────────────────
  {
    id: 22,
    links: [{ from: 52, to: 53, method: { type: "level", level: 28 } }],
  },

  // ── Chain 23: Psyduck → Golduck ──────────────────────────
  {
    id: 23,
    links: [{ from: 54, to: 55, method: { type: "level", level: 33 } }],
  },

  // ── Chain 24: Mankey → Primeape ──────────────────────────
  {
    id: 24,
    links: [{ from: 56, to: 57, method: { type: "level", level: 28 } }],
  },

  // ── Chain 25: Growlithe → Arcanine (Fire Stone → blaze) ──
  {
    id: 25,
    links: [{ from: 58, to: 59, method: { type: "badge", badge: "blaze" } }],
  },

  // ── Chain 26: Poliwag → Poliwhirl → Poliwrath (Water Stone → flow)
  {
    id: 26,
    links: [
      { from: 60, to: 61, method: { type: "level", level: 25 } },
      { from: 61, to: 62, method: { type: "badge", badge: "flow" } },
    ],
  },

  // ── Chain 27: Abra → Kadabra → Alakazam (trade → collaboration)
  {
    id: 27,
    links: [
      { from: 63, to: 64, method: { type: "level", level: 16 } },
      { from: 64, to: 65, method: { type: "collaboration" } },
    ],
  },

  // ── Chain 28: Machop → Machoke → Machamp (trade → collaboration)
  {
    id: 28,
    links: [
      { from: 66, to: 67, method: { type: "level", level: 28 } },
      { from: 67, to: 68, method: { type: "collaboration" } },
    ],
  },

  // ── Chain 29: Bellsprout → Weepinbell → Victreebel (Leaf Stone → growth)
  {
    id: 29,
    links: [
      { from: 69, to: 70, method: { type: "level", level: 21 } },
      { from: 70, to: 71, method: { type: "badge", badge: "growth" } },
    ],
  },

  // ── Chain 30: Tentacool → Tentacruel ─────────────────────
  {
    id: 30,
    links: [{ from: 72, to: 73, method: { type: "level", level: 30 } }],
  },

  // ── Chain 31: Geodude → Graveler → Golem (trade → collaboration)
  {
    id: 31,
    links: [
      { from: 74, to: 75, method: { type: "level", level: 25 } },
      { from: 75, to: 76, method: { type: "collaboration" } },
    ],
  },

  // ── Chain 32: Ponyta → Rapidash ──────────────────────────
  {
    id: 32,
    links: [{ from: 77, to: 78, method: { type: "level", level: 40 } }],
  },

  // ── Chain 33: Slowpoke → Slowbro ─────────────────────────
  {
    id: 33,
    links: [{ from: 79, to: 80, method: { type: "level", level: 37 } }],
  },

  // ── Chain 34: Magnemite → Magneton ───────────────────────
  {
    id: 34,
    links: [{ from: 81, to: 82, method: { type: "level", level: 30 } }],
  },

  // ── Chain 35: Farfetch'd (no evolution) ──────────────────
  {
    id: 35,
    links: [],
  },

  // ── Chain 36: Doduo → Dodrio ─────────────────────────────
  {
    id: 36,
    links: [{ from: 84, to: 85, method: { type: "level", level: 31 } }],
  },

  // ── Chain 37: Seel → Dewgong ─────────────────────────────
  {
    id: 37,
    links: [{ from: 86, to: 87, method: { type: "level", level: 34 } }],
  },

  // ── Chain 38: Grimer → Muk ───────────────────────────────
  {
    id: 38,
    links: [{ from: 88, to: 89, method: { type: "level", level: 38 } }],
  },

  // ── Chain 39: Shellder → Cloyster (Water Stone → flow) ───
  {
    id: 39,
    links: [{ from: 90, to: 91, method: { type: "badge", badge: "flow" } }],
  },

  // ── Chain 40: Gastly → Haunter → Gengar (trade → collaboration)
  {
    id: 40,
    links: [
      { from: 92, to: 93, method: { type: "level", level: 25 } },
      { from: 93, to: 94, method: { type: "collaboration" } },
    ],
  },

  // ── Chain 41: Onix (no evolution in Gen 1) ───────────────
  {
    id: 41,
    links: [],
  },

  // ── Chain 42: Drowzee → Hypno ────────────────────────────
  {
    id: 42,
    links: [{ from: 96, to: 97, method: { type: "level", level: 26 } }],
  },

  // ── Chain 43: Krabby → Kingler ───────────────────────────
  {
    id: 43,
    links: [{ from: 98, to: 99, method: { type: "level", level: 28 } }],
  },

  // ── Chain 44: Voltorb → Electrode ────────────────────────
  {
    id: 44,
    links: [{ from: 100, to: 101, method: { type: "level", level: 30 } }],
  },

  // ── Chain 45: Exeggcute → Exeggutor (Leaf Stone → growth)
  {
    id: 45,
    links: [{ from: 102, to: 103, method: { type: "badge", badge: "growth" } }],
  },

  // ── Chain 46: Cubone → Marowak ───────────────────────────
  {
    id: 46,
    links: [{ from: 104, to: 105, method: { type: "level", level: 28 } }],
  },

  // ── Chain 47: Hitmonlee (no evolution in Gen 1) ──────────
  {
    id: 47,
    links: [],
  },

  // ── Chain 48: Hitmonchan (no evolution in Gen 1) ─────────
  {
    id: 48,
    links: [],
  },

  // ── Chain 49: Lickitung (no evolution in Gen 1) ──────────
  {
    id: 49,
    links: [],
  },

  // ── Chain 50: Koffing → Weezing ──────────────────────────
  {
    id: 50,
    links: [{ from: 109, to: 110, method: { type: "level", level: 35 } }],
  },

  // ── Chain 51: Rhyhorn → Rhydon ───────────────────────────
  {
    id: 51,
    links: [{ from: 111, to: 112, method: { type: "level", level: 42 } }],
  },

  // ── Chain 52: Chansey (no evolution in Gen 1) ────────────
  {
    id: 52,
    links: [],
  },

  // ── Chain 53: Tangela (no evolution in Gen 1) ────────────
  {
    id: 53,
    links: [],
  },

  // ── Chain 54: Kangaskhan (no evolution in Gen 1) ─────────
  {
    id: 54,
    links: [],
  },

  // ── Chain 55: Horsea → Seadra ────────────────────────────
  {
    id: 55,
    links: [{ from: 116, to: 117, method: { type: "level", level: 32 } }],
  },

  // ── Chain 56: Goldeen → Seaking ──────────────────────────
  {
    id: 56,
    links: [{ from: 118, to: 119, method: { type: "level", level: 33 } }],
  },

  // ── Chain 57: Staryu → Starmie (Water Stone → flow) ──────
  {
    id: 57,
    links: [{ from: 120, to: 121, method: { type: "badge", badge: "flow" } }],
  },

  // ── Chain 58: Mr. Mime (no evolution in Gen 1) ───────────
  {
    id: 58,
    links: [],
  },

  // ── Chain 59: Scyther (no evolution in Gen 1) ────────────
  {
    id: 59,
    links: [],
  },

  // ── Chain 60: Jynx (no evolution in Gen 1) ──────────────
  {
    id: 60,
    links: [],
  },

  // ── Chain 61: Electabuzz (no evolution in Gen 1) ─────────
  {
    id: 61,
    links: [],
  },

  // ── Chain 62: Magmar (no evolution in Gen 1) ─────────────
  {
    id: 62,
    links: [],
  },

  // ── Chain 63: Pinsir (no evolution in Gen 1) ─────────────
  {
    id: 63,
    links: [],
  },

  // ── Chain 64: Tauros (no evolution in Gen 1) ─────────────
  {
    id: 64,
    links: [],
  },

  // ── Chain 65: Magikarp → Gyarados ────────────────────────
  {
    id: 65,
    links: [{ from: 129, to: 130, method: { type: "level", level: 20 } }],
  },

  // ── Chain 66: Lapras (no evolution in Gen 1) ─────────────
  {
    id: 66,
    links: [],
  },

  // ── Chain 67: Ditto (no evolution) ───────────────────────
  {
    id: 67,
    links: [],
  },

  // ── Chain 68: Eevee → Vaporeon / Jolteon / Flareon (stat-based)
  {
    id: 68,
    links: [
      { from: 133, to: 134, method: { type: "stat", stat: "stability", minValue: 50 } },
      { from: 133, to: 135, method: { type: "stat", stat: "velocity", minValue: 50 } },
      { from: 133, to: 136, method: { type: "stat", stat: "debugging", minValue: 50 } },
    ],
  },

  // ── Chain 69: Porygon (no evolution in Gen 1) ────────────
  {
    id: 69,
    links: [],
  },

  // ── Chain 70: Omanyte → Omastar ──────────────────────────
  {
    id: 70,
    links: [{ from: 138, to: 139, method: { type: "level", level: 40 } }],
  },

  // ── Chain 71: Kabuto → Kabutops ──────────────────────────
  {
    id: 71,
    links: [{ from: 140, to: 141, method: { type: "level", level: 40 } }],
  },

  // ── Chain 72: Aerodactyl (no evolution in Gen 1) ─────────
  {
    id: 72,
    links: [],
  },

  // ── Chain 73: Snorlax (no evolution in Gen 1) ────────────
  {
    id: 73,
    links: [],
  },

  // ── Chain 74: Articuno (no evolution) ────────────────────
  {
    id: 74,
    links: [],
  },

  // ── Chain 75: Zapdos (no evolution) ──────────────────────
  {
    id: 75,
    links: [],
  },

  // ── Chain 76: Moltres (no evolution) ─────────────────────
  {
    id: 76,
    links: [],
  },

  // ── Chain 77: Dratini → Dragonair → Dragonite ────────────
  {
    id: 77,
    links: [
      { from: 147, to: 148, method: { type: "level", level: 30 } },
      { from: 148, to: 149, method: { type: "level", level: 55 } },
    ],
  },

  // ── Chain 78: Mewtwo (no evolution) ──────────────────────
  {
    id: 78,
    links: [],
  },

  // ── Chain 79: Mew (no evolution) ─────────────────────────
  {
    id: 79,
    links: [],
  },
  // ═══════════════════════════════════════════════════════════
  // Gen 2-8 Evolution Chains (auto-generated from PokeAPI)
  // ═══════════════════════════════════════════════════════════
  {
    id: 80,
    links: [
      { from: 155, to: 156, method: { type: "level", level: 14 } },
      { from: 156, to: 157, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 81,
    links: [
      { from: 158, to: 159, method: { type: "level", level: 18 } },
      { from: 159, to: 160, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 82,
    links: [{ from: 161, to: 162, method: { type: "level", level: 15 } }],
  },
  {
    id: 83,
    links: [{ from: 163, to: 164, method: { type: "level", level: 20 } }],
  },
  {
    id: 84,
    links: [{ from: 165, to: 166, method: { type: "level", level: 18 } }],
  },
  {
    id: 85,
    links: [{ from: 167, to: 168, method: { type: "level", level: 22 } }],
  },
  {
    id: 86,
    links: [{ from: 170, to: 171, method: { type: "level", level: 27 } }],
  },
  {
    id: 87,
    links: [
      { from: 175, to: 176, method: { type: "level", level: 30 } },
      { from: 176, to: 468, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 88,
    links: [{ from: 177, to: 178, method: { type: "level", level: 25 } }],
  },
  {
    id: 89,
    links: [
      { from: 179, to: 180, method: { type: "level", level: 15 } },
      { from: 180, to: 181, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 90,
    links: [
      { from: 298, to: 183, method: { type: "level", level: 30 } },
      { from: 183, to: 184, method: { type: "level", level: 18 } },
    ],
  },
  {
    id: 91,
    links: [{ from: 438, to: 185, method: { type: "level", level: 30 } }],
  },
  {
    id: 92,
    links: [
      { from: 187, to: 188, method: { type: "level", level: 18 } },
      { from: 188, to: 189, method: { type: "level", level: 27 } },
    ],
  },
  {
    id: 93,
    links: [{ from: 190, to: 424, method: { type: "level", level: 30 } }],
  },
  {
    id: 94,
    links: [{ from: 191, to: 192, method: { type: "level", level: 30 } }],
  },
  {
    id: 95,
    links: [{ from: 193, to: 469, method: { type: "level", level: 30 } }],
  },
  {
    id: 97,
    links: [{ from: 198, to: 430, method: { type: "level", level: 30 } }],
  },
  {
    id: 98,
    links: [{ from: 200, to: 429, method: { type: "level", level: 30 } }],
  },
  {
    id: 100,
    links: [{ from: 360, to: 202, method: { type: "level", level: 15 } }],
  },
  {
    id: 102,
    links: [{ from: 204, to: 205, method: { type: "level", level: 31 } }],
  },
  {
    id: 104,
    links: [{ from: 207, to: 472, method: { type: "level", level: 30 } }],
  },
  {
    id: 105,
    links: [{ from: 209, to: 210, method: { type: "level", level: 23 } }],
  },
  {
    id: 106,
    links: [{ from: 211, to: 904, method: { type: "level", level: 30 } }],
  },
  {
    id: 109,
    links: [
      { from: 215, to: 461, method: { type: "level", level: 30 } },
      { from: 215, to: 903, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 110,
    links: [
      { from: 216, to: 217, method: { type: "level", level: 30 } },
      { from: 217, to: 901, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 111,
    links: [{ from: 218, to: 219, method: { type: "level", level: 38 } }],
  },
  {
    id: 112,
    links: [
      { from: 220, to: 221, method: { type: "level", level: 33 } },
      { from: 221, to: 473, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 113,
    links: [{ from: 222, to: 864, method: { type: "level", level: 38 } }],
  },
  {
    id: 114,
    links: [{ from: 223, to: 224, method: { type: "level", level: 25 } }],
  },
  {
    id: 116,
    links: [{ from: 458, to: 226, method: { type: "level", level: 30 } }],
  },
  {
    id: 118,
    links: [{ from: 228, to: 229, method: { type: "level", level: 24 } }],
  },
  {
    id: 119,
    links: [{ from: 231, to: 232, method: { type: "level", level: 25 } }],
  },
  {
    id: 120,
    links: [{ from: 234, to: 899, method: { type: "level", level: 30 } }],
  },
  {
    id: 126,
    links: [
      { from: 246, to: 247, method: { type: "level", level: 30 } },
      { from: 247, to: 248, method: { type: "level", level: 55 } },
    ],
  },
  {
    id: 130,
    links: [
      { from: 252, to: 253, method: { type: "level", level: 16 } },
      { from: 253, to: 254, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 131,
    links: [
      { from: 255, to: 256, method: { type: "level", level: 16 } },
      { from: 256, to: 257, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 132,
    links: [
      { from: 258, to: 259, method: { type: "level", level: 16 } },
      { from: 259, to: 260, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 133,
    links: [{ from: 261, to: 262, method: { type: "level", level: 18 } }],
  },
  {
    id: 134,
    links: [
      { from: 263, to: 264, method: { type: "level", level: 20 } },
      { from: 264, to: 862, method: { type: "level", level: 35 } },
    ],
  },
  {
    id: 135,
    links: [
      { from: 265, to: 266, method: { type: "level", level: 7 } },
      { from: 266, to: 267, method: { type: "level", level: 10 } },
      { from: 265, to: 268, method: { type: "level", level: 7 } },
      { from: 268, to: 269, method: { type: "level", level: 10 } },
    ],
  },
  {
    id: 136,
    links: [
      { from: 270, to: 271, method: { type: "level", level: 14 } },
      { from: 271, to: 272, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 137,
    links: [
      { from: 273, to: 274, method: { type: "level", level: 14 } },
      { from: 274, to: 275, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 138,
    links: [{ from: 276, to: 277, method: { type: "level", level: 22 } }],
  },
  {
    id: 139,
    links: [{ from: 278, to: 279, method: { type: "level", level: 25 } }],
  },
  {
    id: 140,
    links: [
      { from: 280, to: 281, method: { type: "level", level: 20 } },
      { from: 281, to: 282, method: { type: "level", level: 30 } },
      { from: 281, to: 475, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 141,
    links: [{ from: 283, to: 284, method: { type: "level", level: 22 } }],
  },
  {
    id: 142,
    links: [{ from: 285, to: 286, method: { type: "level", level: 23 } }],
  },
  {
    id: 143,
    links: [
      { from: 287, to: 288, method: { type: "level", level: 18 } },
      { from: 288, to: 289, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 144,
    links: [
      { from: 290, to: 291, method: { type: "level", level: 20 } },
      { from: 290, to: 292, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 145,
    links: [
      { from: 293, to: 294, method: { type: "level", level: 20 } },
      { from: 294, to: 295, method: { type: "level", level: 40 } },
    ],
  },
  {
    id: 146,
    links: [{ from: 296, to: 297, method: { type: "level", level: 24 } }],
  },
  {
    id: 147,
    links: [{ from: 299, to: 476, method: { type: "level", level: 30 } }],
  },
  {
    id: 148,
    links: [{ from: 300, to: 301, method: { type: "level", level: 30 } }],
  },
  {
    id: 151,
    links: [
      { from: 304, to: 305, method: { type: "level", level: 32 } },
      { from: 305, to: 306, method: { type: "level", level: 42 } },
    ],
  },
  {
    id: 152,
    links: [{ from: 307, to: 308, method: { type: "level", level: 37 } }],
  },
  {
    id: 153,
    links: [{ from: 309, to: 310, method: { type: "level", level: 26 } }],
  },
  {
    id: 158,
    links: [
      { from: 406, to: 315, method: { type: "level", level: 30 } },
      { from: 315, to: 407, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 159,
    links: [{ from: 316, to: 317, method: { type: "level", level: 26 } }],
  },
  {
    id: 160,
    links: [{ from: 318, to: 319, method: { type: "level", level: 30 } }],
  },
  {
    id: 161,
    links: [{ from: 320, to: 321, method: { type: "level", level: 40 } }],
  },
  {
    id: 162,
    links: [{ from: 322, to: 323, method: { type: "level", level: 33 } }],
  },
  {
    id: 164,
    links: [{ from: 325, to: 326, method: { type: "level", level: 32 } }],
  },
  {
    id: 166,
    links: [
      { from: 328, to: 329, method: { type: "level", level: 35 } },
      { from: 329, to: 330, method: { type: "level", level: 45 } },
    ],
  },
  {
    id: 167,
    links: [{ from: 331, to: 332, method: { type: "level", level: 32 } }],
  },
  {
    id: 168,
    links: [{ from: 333, to: 334, method: { type: "level", level: 35 } }],
  },
  {
    id: 173,
    links: [{ from: 339, to: 340, method: { type: "level", level: 30 } }],
  },
  {
    id: 174,
    links: [{ from: 341, to: 342, method: { type: "level", level: 30 } }],
  },
  {
    id: 175,
    links: [{ from: 343, to: 344, method: { type: "level", level: 36 } }],
  },
  {
    id: 176,
    links: [{ from: 345, to: 346, method: { type: "level", level: 40 } }],
  },
  {
    id: 177,
    links: [{ from: 347, to: 348, method: { type: "level", level: 40 } }],
  },
  {
    id: 178,
    links: [{ from: 349, to: 350, method: { type: "level", level: 30 } }],
  },
  {
    id: 181,
    links: [{ from: 353, to: 354, method: { type: "level", level: 37 } }],
  },
  {
    id: 182,
    links: [
      { from: 355, to: 356, method: { type: "level", level: 37 } },
      { from: 356, to: 477, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 184,
    links: [{ from: 433, to: 358, method: { type: "level", level: 30 } }],
  },
  {
    id: 186,
    links: [
      { from: 361, to: 362, method: { type: "level", level: 42 } },
      { from: 361, to: 478, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 187,
    links: [
      { from: 363, to: 364, method: { type: "level", level: 32 } },
      { from: 364, to: 365, method: { type: "level", level: 44 } },
    ],
  },
  {
    id: 188,
    links: [
      { from: 366, to: 367, method: { type: "level", level: 30 } },
      { from: 366, to: 368, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 191,
    links: [
      { from: 371, to: 372, method: { type: "level", level: 30 } },
      { from: 372, to: 373, method: { type: "level", level: 50 } },
    ],
  },
  {
    id: 192,
    links: [
      { from: 374, to: 375, method: { type: "level", level: 20 } },
      { from: 375, to: 376, method: { type: "level", level: 45 } },
    ],
  },
  {
    id: 203,
    links: [
      { from: 387, to: 388, method: { type: "level", level: 18 } },
      { from: 388, to: 389, method: { type: "level", level: 32 } },
    ],
  },
  {
    id: 204,
    links: [
      { from: 390, to: 391, method: { type: "level", level: 14 } },
      { from: 391, to: 392, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 205,
    links: [
      { from: 393, to: 394, method: { type: "level", level: 16 } },
      { from: 394, to: 395, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 206,
    links: [
      { from: 396, to: 397, method: { type: "level", level: 14 } },
      { from: 397, to: 398, method: { type: "level", level: 34 } },
    ],
  },
  {
    id: 207,
    links: [{ from: 399, to: 400, method: { type: "level", level: 15 } }],
  },
  {
    id: 208,
    links: [{ from: 401, to: 402, method: { type: "level", level: 10 } }],
  },
  {
    id: 209,
    links: [
      { from: 403, to: 404, method: { type: "level", level: 15 } },
      { from: 404, to: 405, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 211,
    links: [{ from: 408, to: 409, method: { type: "level", level: 30 } }],
  },
  {
    id: 212,
    links: [{ from: 410, to: 411, method: { type: "level", level: 30 } }],
  },
  {
    id: 213,
    links: [
      { from: 412, to: 413, method: { type: "level", level: 20 } },
      { from: 412, to: 414, method: { type: "level", level: 20 } },
    ],
  },
  {
    id: 214,
    links: [{ from: 415, to: 416, method: { type: "level", level: 21 } }],
  },
  {
    id: 216,
    links: [{ from: 418, to: 419, method: { type: "level", level: 26 } }],
  },
  {
    id: 217,
    links: [{ from: 420, to: 421, method: { type: "level", level: 25 } }],
  },
  {
    id: 218,
    links: [{ from: 422, to: 423, method: { type: "level", level: 30 } }],
  },
  {
    id: 219,
    links: [{ from: 425, to: 426, method: { type: "level", level: 28 } }],
  },
  {
    id: 220,
    links: [{ from: 427, to: 428, method: { type: "level", level: 30 } }],
  },
  {
    id: 221,
    links: [{ from: 431, to: 432, method: { type: "level", level: 38 } }],
  },
  {
    id: 223,
    links: [{ from: 434, to: 435, method: { type: "level", level: 34 } }],
  },
  {
    id: 224,
    links: [{ from: 436, to: 437, method: { type: "level", level: 33 } }],
  },
  {
    id: 230,
    links: [
      { from: 443, to: 444, method: { type: "level", level: 24 } },
      { from: 444, to: 445, method: { type: "level", level: 48 } },
    ],
  },
  {
    id: 232,
    links: [{ from: 447, to: 448, method: { type: "level", level: 30 } }],
  },
  {
    id: 233,
    links: [{ from: 449, to: 450, method: { type: "level", level: 34 } }],
  },
  {
    id: 234,
    links: [{ from: 451, to: 452, method: { type: "level", level: 40 } }],
  },
  {
    id: 235,
    links: [{ from: 453, to: 454, method: { type: "level", level: 37 } }],
  },
  {
    id: 237,
    links: [{ from: 456, to: 457, method: { type: "level", level: 31 } }],
  },
  {
    id: 239,
    links: [{ from: 459, to: 460, method: { type: "level", level: 40 } }],
  },
  {
    id: 250,
    links: [{ from: 489, to: 490, method: { type: "level", level: 30 } }],
  },
  {
    id: 256,
    links: [
      { from: 495, to: 496, method: { type: "level", level: 17 } },
      { from: 496, to: 497, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 257,
    links: [
      { from: 498, to: 499, method: { type: "level", level: 17 } },
      { from: 499, to: 500, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 258,
    links: [
      { from: 501, to: 502, method: { type: "level", level: 17 } },
      { from: 502, to: 503, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 259,
    links: [{ from: 504, to: 505, method: { type: "level", level: 20 } }],
  },
  {
    id: 260,
    links: [
      { from: 506, to: 507, method: { type: "level", level: 16 } },
      { from: 507, to: 508, method: { type: "level", level: 32 } },
    ],
  },
  {
    id: 261,
    links: [{ from: 509, to: 510, method: { type: "level", level: 20 } }],
  },
  {
    id: 262,
    links: [{ from: 511, to: 512, method: { type: "level", level: 30 } }],
  },
  {
    id: 263,
    links: [{ from: 513, to: 514, method: { type: "level", level: 30 } }],
  },
  {
    id: 264,
    links: [{ from: 515, to: 516, method: { type: "level", level: 30 } }],
  },
  {
    id: 265,
    links: [{ from: 517, to: 518, method: { type: "level", level: 30 } }],
  },
  {
    id: 266,
    links: [
      { from: 519, to: 520, method: { type: "level", level: 21 } },
      { from: 520, to: 521, method: { type: "level", level: 32 } },
    ],
  },
  {
    id: 267,
    links: [{ from: 522, to: 523, method: { type: "level", level: 27 } }],
  },
  {
    id: 268,
    links: [
      { from: 524, to: 525, method: { type: "level", level: 25 } },
      { from: 525, to: 526, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 269,
    links: [{ from: 527, to: 528, method: { type: "level", level: 30 } }],
  },
  {
    id: 270,
    links: [{ from: 529, to: 530, method: { type: "level", level: 31 } }],
  },
  {
    id: 272,
    links: [
      { from: 532, to: 533, method: { type: "level", level: 25 } },
      { from: 533, to: 534, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 273,
    links: [
      { from: 535, to: 536, method: { type: "level", level: 25 } },
      { from: 536, to: 537, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 276,
    links: [
      { from: 540, to: 541, method: { type: "level", level: 20 } },
      { from: 541, to: 542, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 277,
    links: [
      { from: 543, to: 544, method: { type: "level", level: 22 } },
      { from: 544, to: 545, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 278,
    links: [{ from: 546, to: 547, method: { type: "level", level: 30 } }],
  },
  {
    id: 279,
    links: [{ from: 548, to: 549, method: { type: "level", level: 30 } }],
  },
  {
    id: 280,
    links: [{ from: 550, to: 902, method: { type: "level", level: 30 } }],
  },
  {
    id: 281,
    links: [
      { from: 551, to: 552, method: { type: "level", level: 29 } },
      { from: 552, to: 553, method: { type: "level", level: 40 } },
    ],
  },
  {
    id: 282,
    links: [{ from: 554, to: 555, method: { type: "level", level: 35 } }],
  },
  {
    id: 284,
    links: [{ from: 557, to: 558, method: { type: "level", level: 34 } }],
  },
  {
    id: 285,
    links: [{ from: 559, to: 560, method: { type: "level", level: 39 } }],
  },
  {
    id: 287,
    links: [
      { from: 562, to: 563, method: { type: "level", level: 34 } },
      { from: 562, to: 867, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 288,
    links: [{ from: 564, to: 565, method: { type: "level", level: 37 } }],
  },
  {
    id: 289,
    links: [{ from: 566, to: 567, method: { type: "level", level: 37 } }],
  },
  {
    id: 290,
    links: [{ from: 568, to: 569, method: { type: "level", level: 36 } }],
  },
  {
    id: 291,
    links: [{ from: 570, to: 571, method: { type: "level", level: 30 } }],
  },
  {
    id: 292,
    links: [{ from: 572, to: 573, method: { type: "level", level: 30 } }],
  },
  {
    id: 293,
    links: [
      { from: 574, to: 575, method: { type: "level", level: 32 } },
      { from: 575, to: 576, method: { type: "level", level: 41 } },
    ],
  },
  {
    id: 294,
    links: [
      { from: 577, to: 578, method: { type: "level", level: 32 } },
      { from: 578, to: 579, method: { type: "level", level: 41 } },
    ],
  },
  {
    id: 295,
    links: [{ from: 580, to: 581, method: { type: "level", level: 35 } }],
  },
  {
    id: 296,
    links: [
      { from: 582, to: 583, method: { type: "level", level: 35 } },
      { from: 583, to: 584, method: { type: "level", level: 47 } },
    ],
  },
  {
    id: 297,
    links: [{ from: 585, to: 586, method: { type: "level", level: 34 } }],
  },
  {
    id: 299,
    links: [{ from: 588, to: 589, method: { type: "level", level: 30 } }],
  },
  {
    id: 300,
    links: [{ from: 590, to: 591, method: { type: "level", level: 39 } }],
  },
  {
    id: 301,
    links: [{ from: 592, to: 593, method: { type: "level", level: 40 } }],
  },
  {
    id: 303,
    links: [{ from: 595, to: 596, method: { type: "level", level: 36 } }],
  },
  {
    id: 304,
    links: [{ from: 597, to: 598, method: { type: "level", level: 40 } }],
  },
  {
    id: 305,
    links: [
      { from: 599, to: 600, method: { type: "level", level: 38 } },
      { from: 600, to: 601, method: { type: "level", level: 49 } },
    ],
  },
  {
    id: 306,
    links: [
      { from: 602, to: 603, method: { type: "level", level: 39 } },
      { from: 603, to: 604, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 307,
    links: [{ from: 605, to: 606, method: { type: "level", level: 42 } }],
  },
  {
    id: 308,
    links: [
      { from: 607, to: 608, method: { type: "level", level: 41 } },
      { from: 608, to: 609, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 309,
    links: [
      { from: 610, to: 611, method: { type: "level", level: 38 } },
      { from: 611, to: 612, method: { type: "level", level: 48 } },
    ],
  },
  {
    id: 310,
    links: [{ from: 613, to: 614, method: { type: "level", level: 37 } }],
  },
  {
    id: 312,
    links: [{ from: 616, to: 617, method: { type: "level", level: 30 } }],
  },
  {
    id: 314,
    links: [{ from: 619, to: 620, method: { type: "level", level: 50 } }],
  },
  {
    id: 316,
    links: [{ from: 622, to: 623, method: { type: "level", level: 43 } }],
  },
  {
    id: 319,
    links: [{ from: 627, to: 628, method: { type: "level", level: 54 } }],
  },
  {
    id: 320,
    links: [{ from: 629, to: 630, method: { type: "level", level: 54 } }],
  },
  {
    id: 323,
    links: [
      { from: 633, to: 634, method: { type: "level", level: 50 } },
      { from: 634, to: 635, method: { type: "level", level: 64 } },
    ],
  },
  {
    id: 324,
    links: [{ from: 636, to: 637, method: { type: "level", level: 59 } }],
  },
  {
    id: 337,
    links: [
      { from: 650, to: 651, method: { type: "level", level: 16 } },
      { from: 651, to: 652, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 338,
    links: [
      { from: 653, to: 654, method: { type: "level", level: 16 } },
      { from: 654, to: 655, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 339,
    links: [
      { from: 656, to: 657, method: { type: "level", level: 16 } },
      { from: 657, to: 658, method: { type: "level", level: 36 } },
    ],
  },
  {
    id: 340,
    links: [{ from: 659, to: 660, method: { type: "level", level: 20 } }],
  },
  {
    id: 341,
    links: [
      { from: 661, to: 662, method: { type: "level", level: 17 } },
      { from: 662, to: 663, method: { type: "level", level: 35 } },
    ],
  },
  {
    id: 342,
    links: [
      { from: 664, to: 665, method: { type: "level", level: 9 } },
      { from: 665, to: 666, method: { type: "level", level: 12 } },
    ],
  },
  {
    id: 343,
    links: [{ from: 667, to: 668, method: { type: "level", level: 35 } }],
  },
  {
    id: 344,
    links: [
      { from: 669, to: 670, method: { type: "level", level: 19 } },
      { from: 670, to: 671, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 345,
    links: [{ from: 672, to: 673, method: { type: "level", level: 32 } }],
  },
  {
    id: 346,
    links: [{ from: 674, to: 675, method: { type: "level", level: 32 } }],
  },
  {
    id: 348,
    links: [{ from: 677, to: 678, method: { type: "level", level: 25 } }],
  },
  {
    id: 349,
    links: [
      { from: 679, to: 680, method: { type: "level", level: 35 } },
      { from: 680, to: 681, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 350,
    links: [{ from: 682, to: 683, method: { type: "level", level: 30 } }],
  },
  {
    id: 351,
    links: [{ from: 684, to: 685, method: { type: "level", level: 30 } }],
  },
  {
    id: 352,
    links: [{ from: 686, to: 687, method: { type: "level", level: 30 } }],
  },
  {
    id: 353,
    links: [{ from: 688, to: 689, method: { type: "level", level: 39 } }],
  },
  {
    id: 354,
    links: [{ from: 690, to: 691, method: { type: "level", level: 48 } }],
  },
  {
    id: 355,
    links: [{ from: 692, to: 693, method: { type: "level", level: 37 } }],
  },
  {
    id: 356,
    links: [{ from: 694, to: 695, method: { type: "level", level: 30 } }],
  },
  {
    id: 357,
    links: [{ from: 696, to: 697, method: { type: "level", level: 39 } }],
  },
  {
    id: 358,
    links: [{ from: 698, to: 699, method: { type: "level", level: 39 } }],
  },
  {
    id: 362,
    links: [
      { from: 704, to: 705, method: { type: "level", level: 40 } },
      { from: 705, to: 706, method: { type: "level", level: 50 } },
    ],
  },
  {
    id: 364,
    links: [{ from: 708, to: 709, method: { type: "level", level: 30 } }],
  },
  {
    id: 365,
    links: [{ from: 710, to: 711, method: { type: "level", level: 30 } }],
  },
  {
    id: 366,
    links: [{ from: 712, to: 713, method: { type: "level", level: 37 } }],
  },
  {
    id: 367,
    links: [{ from: 714, to: 715, method: { type: "level", level: 48 } }],
  },
  {
    id: 374,
    links: [
      { from: 722, to: 723, method: { type: "level", level: 17 } },
      { from: 723, to: 724, method: { type: "level", level: 34 } },
    ],
  },
  {
    id: 375,
    links: [
      { from: 725, to: 726, method: { type: "level", level: 17 } },
      { from: 726, to: 727, method: { type: "level", level: 34 } },
    ],
  },
  {
    id: 376,
    links: [
      { from: 728, to: 729, method: { type: "level", level: 17 } },
      { from: 729, to: 730, method: { type: "level", level: 34 } },
    ],
  },
  {
    id: 377,
    links: [
      { from: 731, to: 732, method: { type: "level", level: 14 } },
      { from: 732, to: 733, method: { type: "level", level: 28 } },
    ],
  },
  {
    id: 378,
    links: [{ from: 734, to: 735, method: { type: "level", level: 20 } }],
  },
  {
    id: 379,
    links: [
      { from: 736, to: 737, method: { type: "level", level: 20 } },
      { from: 737, to: 738, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 380,
    links: [{ from: 739, to: 740, method: { type: "level", level: 30 } }],
  },
  {
    id: 382,
    links: [{ from: 742, to: 743, method: { type: "level", level: 25 } }],
  },
  {
    id: 383,
    links: [{ from: 744, to: 745, method: { type: "level", level: 25 } }],
  },
  {
    id: 385,
    links: [{ from: 747, to: 748, method: { type: "level", level: 38 } }],
  },
  {
    id: 386,
    links: [{ from: 749, to: 750, method: { type: "level", level: 30 } }],
  },
  {
    id: 387,
    links: [{ from: 751, to: 752, method: { type: "level", level: 22 } }],
  },
  {
    id: 388,
    links: [{ from: 753, to: 754, method: { type: "level", level: 34 } }],
  },
  {
    id: 389,
    links: [{ from: 755, to: 756, method: { type: "level", level: 24 } }],
  },
  {
    id: 390,
    links: [{ from: 757, to: 758, method: { type: "level", level: 33 } }],
  },
  {
    id: 391,
    links: [{ from: 759, to: 760, method: { type: "level", level: 27 } }],
  },
  {
    id: 392,
    links: [
      { from: 761, to: 762, method: { type: "level", level: 18 } },
      { from: 762, to: 763, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 396,
    links: [{ from: 767, to: 768, method: { type: "level", level: 30 } }],
  },
  {
    id: 397,
    links: [{ from: 769, to: 770, method: { type: "level", level: 42 } }],
  },
  {
    id: 399,
    links: [{ from: 772, to: 773, method: { type: "level", level: 30 } }],
  },
  {
    id: 408,
    links: [
      { from: 782, to: 783, method: { type: "level", level: 35 } },
      { from: 783, to: 784, method: { type: "level", level: 45 } },
    ],
  },
  {
    id: 413,
    links: [
      { from: 789, to: 790, method: { type: "level", level: 43 } },
      { from: 790, to: 791, method: { type: "level", level: 53 } },
      { from: 790, to: 792, method: { type: "level", level: 53 } },
    ],
  },
  {
    id: 424,
    links: [{ from: 803, to: 804, method: { type: "level", level: 30 } }],
  },
  {
    id: 430,
    links: [
      { from: 810, to: 811, method: { type: "level", level: 16 } },
      { from: 811, to: 812, method: { type: "level", level: 35 } },
    ],
  },
  {
    id: 431,
    links: [
      { from: 813, to: 814, method: { type: "level", level: 16 } },
      { from: 814, to: 815, method: { type: "level", level: 35 } },
    ],
  },
  {
    id: 432,
    links: [
      { from: 816, to: 817, method: { type: "level", level: 16 } },
      { from: 817, to: 818, method: { type: "level", level: 35 } },
    ],
  },
  {
    id: 433,
    links: [{ from: 819, to: 820, method: { type: "level", level: 24 } }],
  },
  {
    id: 434,
    links: [
      { from: 821, to: 822, method: { type: "level", level: 18 } },
      { from: 822, to: 823, method: { type: "level", level: 38 } },
    ],
  },
  {
    id: 435,
    links: [
      { from: 824, to: 825, method: { type: "level", level: 10 } },
      { from: 825, to: 826, method: { type: "level", level: 30 } },
    ],
  },
  {
    id: 436,
    links: [{ from: 827, to: 828, method: { type: "level", level: 18 } }],
  },
  {
    id: 437,
    links: [{ from: 829, to: 830, method: { type: "level", level: 20 } }],
  },
  {
    id: 438,
    links: [{ from: 831, to: 832, method: { type: "level", level: 24 } }],
  },
  {
    id: 439,
    links: [{ from: 833, to: 834, method: { type: "level", level: 22 } }],
  },
  {
    id: 440,
    links: [{ from: 835, to: 836, method: { type: "level", level: 25 } }],
  },
  {
    id: 441,
    links: [
      { from: 837, to: 838, method: { type: "level", level: 18 } },
      { from: 838, to: 839, method: { type: "level", level: 34 } },
    ],
  },
  {
    id: 443,
    links: [{ from: 843, to: 844, method: { type: "level", level: 36 } }],
  },
  {
    id: 445,
    links: [{ from: 846, to: 847, method: { type: "level", level: 26 } }],
  },
  {
    id: 446,
    links: [{ from: 848, to: 849, method: { type: "level", level: 30 } }],
  },
  {
    id: 447,
    links: [{ from: 850, to: 851, method: { type: "level", level: 28 } }],
  },
  {
    id: 448,
    links: [{ from: 852, to: 853, method: { type: "level", level: 30 } }],
  },
  {
    id: 449,
    links: [{ from: 854, to: 855, method: { type: "level", level: 30 } }],
  },
  {
    id: 450,
    links: [
      { from: 856, to: 857, method: { type: "level", level: 32 } },
      { from: 857, to: 858, method: { type: "level", level: 42 } },
    ],
  },
  {
    id: 451,
    links: [
      { from: 859, to: 860, method: { type: "level", level: 32 } },
      { from: 860, to: 861, method: { type: "level", level: 42 } },
    ],
  },
  {
    id: 452,
    links: [{ from: 868, to: 869, method: { type: "level", level: 30 } }],
  },
  {
    id: 455,
    links: [{ from: 872, to: 873, method: { type: "level", level: 30 } }],
  },
  {
    id: 460,
    links: [{ from: 878, to: 879, method: { type: "level", level: 34 } }],
  },
  {
    id: 466,
    links: [
      { from: 885, to: 886, method: { type: "level", level: 50 } },
      { from: 886, to: 887, method: { type: "level", level: 60 } },
    ],
  },
  {
    id: 470,
    links: [{ from: 891, to: 892, method: { type: "level", level: 30 } }],
  },
] as const satisfies readonly EvolutionChain[];
