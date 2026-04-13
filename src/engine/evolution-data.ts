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
] as const satisfies readonly EvolutionChain[];
