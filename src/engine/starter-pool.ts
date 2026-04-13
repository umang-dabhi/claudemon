/**
 * Starter pool — base-stage common Pokemon eligible for random
 * starter selection. Only first-in-chain, common-rarity Pokemon.
 */

/** Pokemon IDs eligible for random starter selection */
export const STARTER_POOL: readonly number[] = [
  10, // Caterpie
  13, // Weedle
  16, // Pidgey
  19, // Rattata
  21, // Spearow
  23, // Ekans
  27, // Sandshrew
  29, // Nidoran♀
  32, // Nidoran♂
  39, // Jigglypuff
  41, // Zubat
  43, // Oddish
  46, // Paras
  48, // Venonat
  50, // Diglett
  52, // Meowth
  54, // Psyduck
  56, // Mankey
  60, // Poliwag
  66, // Machop
  69, // Bellsprout
  72, // Tentacool
  74, // Geodude
  77, // Ponyta
  79, // Slowpoke
  81, // Magnemite
  84, // Doduo
  86, // Seel
  88, // Grimer
  90, // Shellder
  92, // Gastly
  96, // Drowzee
  98, // Krabby
  100, // Voltorb
  104, // Cubone
  109, // Koffing
  116, // Horsea
  118, // Goldeen
  129, // Magikarp
] as const;
