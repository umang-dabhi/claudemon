/**
 * Starter pool — base-stage common Pokemon eligible for random
 * starter selection. Only first-in-chain, common-rarity Pokemon
 * from all generations.
 */

/** Pokemon IDs eligible for random starter selection */
export const STARTER_POOL: readonly number[] = [
  // ── Gen 1 ──
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

  // ── Gen 2 ──
  161, // Sentret
  163, // Hoothoot
  165, // Ledyba
  167, // Spinarak
  170, // Chinchou
  177, // Natu
  179, // Mareep
  183, // Marill
  187, // Hoppip
  191, // Sunkern
  193, // Yanma
  194, // Wooper
  198, // Murkrow
  200, // Misdreavus
  209, // Snubbull
  216, // Teddiursa
  218, // Slugma
  220, // Swinub
  222, // Corsola
  223, // Remoraid
  228, // Houndour

  // ── Gen 3 ──
  261, // Poochyena
  263, // Zigzagoon
  265, // Wurmple
  270, // Lotad
  273, // Seedot
  276, // Taillow
  278, // Wingull
  280, // Ralts
  283, // Surskit
  285, // Shroomish
  293, // Whismur
  296, // Makuhita
  300, // Skitty
  304, // Aron
  307, // Meditite
  309, // Electrike
  316, // Gulpin
  318, // Carvanha
  325, // Spoink
  333, // Swablu
  339, // Barboach
  341, // Corphish

  // ── Gen 4 ──
  396, // Starly
  399, // Bidoof
  401, // Kricketot
  403, // Shinx
  412, // Burmy
  418, // Buizel
  420, // Cherubi
  422, // Shellos
  427, // Buneary
  431, // Glameow
  434, // Stunky

  // ── Gen 5 ──
  504, // Patrat
  506, // Lillipup
  509, // Purrloin
  519, // Pidove
  527, // Woobat
  529, // Drilbur
  531, // Audino
  535, // Tympole
  540, // Sewaddle
  543, // Venipede
  546, // Cottonee
  548, // Petilil
  557, // Dwebble
  568, // Trubbish
  572, // Minccino
  577, // Solosis
  582, // Vanillite
  590, // Foongus
  595, // Joltik
  607, // Litwick
  613, // Cubchoo
  616, // Shelmet

  // ── Gen 6 ──
  659, // Bunnelby
  661, // Fletchling
  664, // Scatterbug
  667, // Litleo
  669, // Flabebe
  672, // Skiddo
  674, // Pancham
  677, // Espurr
  684, // Swirlix
  686, // Inkay
  688, // Binacle
  694, // Helioptile
  702, // Dedenne
  704, // Goomy

  // ── Gen 7 ──
  731, // Pikipek
  734, // Yungoos
  736, // Grubbin
  739, // Crabrawler
  741, // Oricorio
  742, // Cutiefly
  744, // Rockruff
  751, // Dewpider
  753, // Fomantis
  757, // Salandit
  759, // Stufful
  761, // Bounsweet
  767, // Wimpod

  // ── Gen 8 ──
  819, // Skwovet
  821, // Rookidee
  824, // Blipbug
  827, // Nickit
  829, // Gossifleur
  831, // Wooloo
  833, // Chewtle
  835, // Yamper
  843, // Silicobra
  850, // Sizzlipede
  854, // Sinistea
  859, // Impidimp
  868, // Milcery
  872, // Snom
] as const;
