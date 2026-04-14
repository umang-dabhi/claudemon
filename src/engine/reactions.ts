/**
 * Reaction engine for Claudemon.
 * Generates type-flavored text reactions to coding events.
 * Each Pokemon type has a distinct personality reflected in its reactions.
 *
 * Personalities:
 *   Normal — friendly, supportive
 *   Fire — intense, passionate
 *   Water — calm, flowing
 *   Electric — energetic, zippy
 *   Grass — patient, nurturing
 *   Ice — cool, composed
 *   Fighting — determined, fierce
 *   Poison — sarcastic, edgy
 *   Ground — steady, grounded
 *   Flying — free-spirited, breezy
 *   Psychic — mysterious, analytical
 *   Bug — self-aware, ironic about bugs
 *   Rock — stoic, reliable
 *   Ghost — spooky, dark humor
 *   Dragon — proud, regal
 */

import type { PokemonType } from "./types.js";
import { DEFAULT_REACTION_COOLDOWN_MS } from "./constants.js";

// ── Reaction Event Types ────────────────────────────────────

/** Event types that trigger reactions. */
export type ReactionEvent =
  | "error"
  | "test_fail"
  | "test_pass"
  | "commit"
  | "level_up"
  | "encounter"
  | "pet"
  | "idle";

// ── Reaction Templates ──────────────────────────────────────

/**
 * Reaction templates keyed by PokemonType, then by ReactionEvent.
 * Each entry is an array of 3-5 template strings containing {name} placeholders.
 */
const REACTION_TEMPLATES: Record<PokemonType, Record<ReactionEvent, readonly string[]>> = {
  // ── Normal: friendly, supportive ──────────────────────────
  Normal: {
    error: [
      "*{name} tilts its head, concerned*",
      "*{name} pats you reassuringly on the shoulder*",
      "Don't worry, {name} believes in you!",
      "*{name} gives you an encouraging nod*",
      "*{name} brings you a rubber duck for debugging*",
    ],
    test_fail: [
      "*{name} whimpers softly*",
      "It's okay! {name} knows you'll get it next time.",
      "*{name} nudges you gently — try again!*",
      "*{name} offers a comforting smile*",
    ],
    test_pass: [
      "*{name} wags its tail excitedly!*",
      "{name} cheers! Great job!",
      "*{name} does a little happy dance*",
      "*{name} beams with pride!*",
    ],
    commit: [
      "*{name} nods approvingly*",
      "Nice commit! {name} is proud of you.",
      "*{name} gives a thumbs up*",
      "*{name} stamps it with approval*",
    ],
    level_up: [
      "*{name} jumps with joy!*",
      "{name} powered up! Keep going!",
      "*{name} celebrates with a happy spin!*",
      "*{name} glows brightly for a moment!*",
    ],
    encounter: [
      "*{name} perks up — something is nearby!*",
      "*{name} spots a new friend!*",
      "*{name}'s ears twitch with curiosity*",
    ],
    pet: [
      "*{name} nuzzles against your hand contentedly*",
      "*{name} purrs happily*",
      "*{name} leans into the scratch*",
      "*{name} closes its eyes in bliss*",
    ],
    idle: [
      "*{name} yawns and stretches*",
      "*{name} curls up beside your keyboard*",
      "*{name} watches the cursor blink patiently*",
    ],
  },

  // ── Fire: intense, passionate ─────────────────────────────
  Fire: {
    error: [
      "*{name}'s tail flame flares angrily*",
      "*{name} breathes smoke at the bug*",
      "That error is toast. *{name} glares*",
      "*{name} snorts sparks in frustration*",
      "*{name}'s eyes burn with determination to fix this*",
    ],
    test_fail: [
      "*{name} snorts embers in frustration*",
      "*{name}'s flame dims a little*",
      "*{name} growls — that test will burn next time*",
      "*{name} kicks at the ground, scattering cinders*",
    ],
    test_pass: [
      "*{name}'s flame burns bright with pride!*",
      "*{name} does a victory dance, leaving scorch marks*",
      "Another test conquered! *{name} roars!*",
      "*{name}'s tail blazes triumphantly*",
    ],
    commit: [
      "*{name} nods approvingly*",
      "Another commit forged in fire!",
      "*{name}'s flame flickers with satisfaction*",
      "*{name} breathes a warm gust of approval*",
    ],
    level_up: [
      "*{name}'s flame grows larger!*",
      "{name} powered up! The heat is rising!",
      "*{name} erupts with fiery energy!*",
      "*{name} unleashes a burst of flame!*",
    ],
    encounter: [
      "*{name} spots something in the wild!*",
      "*{name}'s flame flares — a challenger approaches!*",
      "*{name} locks eyes on the newcomer, tail blazing*",
    ],
    pet: [
      "*{name}'s tail flame flickers warmly*",
      "*{name} nuzzles your hand — careful, it's warm!*",
      "*{name} purrs, radiating gentle heat*",
      "*{name} leans in, its body comfortably warm*",
    ],
    idle: [
      "*{name} yawns, a tiny flame escaping*",
      "*{name} dozes off, tail flame flickering lazily*",
      "*{name} stares into space, smoke curling from its nostrils*",
    ],
  },

  // ── Water: calm, flowing ──────────────────────────────────
  Water: {
    error: [
      "*{name} sighs like a gentle wave*",
      "*{name} splashes the error away calmly*",
      "Errors come and go like tides. *{name} stays cool*",
      "*{name} bubbles disapprovingly*",
      "*{name} washes over the problem with focus*",
    ],
    test_fail: [
      "*{name} lets out a slow, disappointed bubble*",
      "Like water off a duck's back — {name} stays calm.",
      "*{name} ripples with mild concern*",
      "*{name} floats serenely despite the failure*",
    ],
    test_pass: [
      "*{name} makes a joyful splash!*",
      "*{name} rides the wave of success!*",
      "Smooth sailing! *{name} glides happily*",
      "*{name} sprays a celebratory mist!*",
    ],
    commit: [
      "*{name} flows with approval*",
      "That commit flowed naturally. *{name} nods*",
      "*{name} bubbles contentedly*",
      "*{name} rides the current of progress*",
    ],
    level_up: [
      "*{name} surges with new power!*",
      "{name} leveled up! A rising tide lifts all code!",
      "*{name} creates a whirlpool of energy!*",
      "*{name} crests like a mighty wave!*",
    ],
    encounter: [
      "*{name} senses ripples — something approaches!*",
      "*{name} surfaces, alert and curious*",
      "*{name} spots movement in the tall grass*",
    ],
    pet: [
      "*{name} splashes with joy*",
      "*{name}'s scales glisten as it nuzzles you*",
      "*{name} sprays a gentle, happy mist*",
      "*{name} hums a bubbling melody*",
    ],
    idle: [
      "*{name} drifts peacefully, half-asleep*",
      "*{name} blows idle bubbles*",
      "*{name} rocks gently like a calm tide*",
    ],
  },

  // ── Electric: energetic, zippy ────────────────────────────
  Electric: {
    error: [
      "*{name}'s cheeks spark with irritation!*",
      "ZAP! *{name} tries to short-circuit the bug*",
      "*{name} crackles — that error was shocking!*",
      "*{name} buzzes angrily at the stack trace*",
      "*{name} discharges a frustrated bolt*",
    ],
    test_fail: [
      "*{name}'s voltage drops momentarily*",
      "*{name} fizzles with disappointment*",
      "A brief blackout of confidence. *{name} recharges*",
      "*{name} sparks nervously*",
    ],
    test_pass: [
      "*{name} zaps with excitement!*",
      "BZZT! {name} is electrified by that result!",
      "*{name}'s cheeks spark with joy!*",
      "*{name} lights up like a thunderbolt!*",
    ],
    commit: [
      "*{name} gives an electric thumbs up!*",
      "Committed at lightning speed! *{name} buzzes*",
      "*{name} crackles with approval*",
      "*{name} sparks happily — progress!*",
    ],
    level_up: [
      "*{name} surges with voltage!*",
      "{name} powered up! MAXIMUM CHARGE!",
      "*{name} unleashes a thunderclap of energy!*",
      "*{name}'s power level is over 9000 volts!*",
    ],
    encounter: [
      "*{name}'s fur stands on end — someone's here!*",
      "*{name} sparks with anticipation!*",
      "*{name} senses a charge in the air*",
    ],
    pet: [
      "*{name}'s cheeks spark warmly*",
      "*{name} purrs with a gentle static hum*",
      "Careful — *{name} gives a tiny, affectionate zap!*",
      "*{name} nuzzles you, hair standing on end*",
    ],
    idle: [
      "*{name} bounces in place, unable to sit still*",
      "*{name} sparks idly, bored*",
      "*{name} chases its own static discharge*",
    ],
  },

  // ── Grass: patient, nurturing ─────────────────────────────
  Grass: {
    error: [
      "*{name}'s leaves droop with concern*",
      "Bugs happen — {name} knows growth takes patience.",
      "*{name} wraps a vine around you comfortingly*",
      "*{name} rustles gently — it'll be okay*",
      "*{name} photosynthesizes calm energy your way*",
    ],
    test_fail: [
      "*{name}'s petals close slightly*",
      "Not every seed sprouts the first time. *{name} waits*",
      "*{name} wilts a little, then straightens up*",
      "*{name} sends a reassuring rustle*",
    ],
    test_pass: [
      "*{name}'s leaves rustle with delight!*",
      "*{name} blooms a little brighter!*",
      "Your code is growing strong! *{name} sways happily*",
      "*{name} sprouts a tiny celebratory leaf!*",
    ],
    commit: [
      "*{name} rustles approvingly*",
      "Another seed planted. *{name} nods*",
      "*{name}'s leaves shimmer in the light*",
      "Good things grow from consistent commits. *{name} smiles*",
    ],
    level_up: [
      "*{name} sprouts new growth!*",
      "{name} evolved its roots! Level up!",
      "*{name} blooms with newfound power!*",
      "*{name}'s canopy expands majestically!*",
    ],
    encounter: [
      "*{name}'s vines sense something stirring!*",
      "*{name} perks up — nature provides!*",
      "*{name} detects a presence through the soil*",
    ],
    pet: [
      "*{name}'s leaves rustle with delight*",
      "*{name} wraps a gentle vine around your wrist*",
      "*{name} releases a sweet, calming fragrance*",
      "*{name} leans toward you like a sun-seeking flower*",
    ],
    idle: [
      "*{name} basks in the monitor's glow, photosynthesizing*",
      "*{name} sways gently in the breeze from the fan*",
      "*{name} dozes peacefully among its leaves*",
    ],
  },

  // ── Ice: cool, composed ───────────────────────────────────
  Ice: {
    error: [
      "*{name} exhales a frosty sigh*",
      "Stay cool. *{name} freezes the panic*",
      "*{name} crystallizes its focus on the bug*",
      "*{name} blows a cold breath — errors don't phase it*",
      "*{name} gives the bug an icy stare*",
    ],
    test_fail: [
      "*{name} frosts over slightly*",
      "Cold comfort: at least you found the issue. *{name} nods*",
      "*{name} remains composed, a thin layer of frost forming*",
      "*{name} shrugs coolly — next time*",
    ],
    test_pass: [
      "*{name} sparkles like fresh snow!*",
      "Ice cold execution! *{name} approves*",
      "*{name} creates a tiny celebratory snowflake*",
      "*{name} glitters with crystalline pride*",
    ],
    commit: [
      "*{name} nods — cool and collected*",
      "Committed. Clean as fresh ice. *{name} approves*",
      "*{name} breathes a satisfied, frosty mist*",
      "*{name} forms a tiny ice trophy*",
    ],
    level_up: [
      "*{name}'s frost aura intensifies!*",
      "{name} leveled up! The temperature just dropped!",
      "*{name} radiates a blizzard of power!*",
      "*{name} evolves its ice armor!*",
    ],
    encounter: [
      "*{name} senses a chill — something approaches!*",
      "*{name}'s icy breath quickens*",
      "*{name} freezes in alert — a wild encounter!*",
    ],
    pet: [
      "*{name} breathes a cool, contented mist*",
      "*{name} leans into your hand — refreshingly cold*",
      "*{name} hums a soft, crystalline melody*",
      "*{name} creates a tiny snowflake just for you*",
    ],
    idle: [
      "*{name} idly frosts the desk surface*",
      "*{name} breathes slow, icy clouds*",
      "*{name} practices making tiny ice sculptures*",
    ],
  },

  // ── Fighting: determined, fierce ──────────────────────────
  Fighting: {
    error: [
      "*{name} cracks its knuckles — time to fight this bug*",
      "*{name} punches the air in frustration*",
      "That error picked a fight with the wrong team! *{name} flexes*",
      "*{name} shadow-boxes the stack trace*",
      "*{name} does push-ups to work off the frustration*",
    ],
    test_fail: [
      "*{name} slams its fist down — not giving up!*",
      "A setback, not a defeat! *{name} rises*",
      "*{name} trains harder after every failure*",
      "*{name} grits its teeth — round two!*",
    ],
    test_pass: [
      "*{name} flexes triumphantly!*",
      "VICTORY! *{name} throws a celebratory uppercut!*",
      "*{name} does a victory pose — tests defeated!*",
      "*{name} roars with fighting spirit!*",
    ],
    commit: [
      "*{name} gives a firm, respectful nod*",
      "Another battle won! *{name} salutes*",
      "*{name} pounds its chest in approval*",
      "*{name} bows — a warrior's respect for hard work*",
    ],
    level_up: [
      "*{name}'s muscles bulge with new power!*",
      "{name} broke through its limits!",
      "*{name} smashes through to the next level!*",
      "*{name} unleashes a battle cry!*",
    ],
    encounter: [
      "*{name} assumes a fighting stance — challenger spotted!*",
      "*{name} cracks its knuckles eagerly*",
      "*{name} senses a worthy opponent!*",
    ],
    pet: [
      "*{name} flexes proudly and grins*",
      "*{name} gently bumps your fist*",
      "*{name} does a respectful bow of thanks*",
      "*{name} gives you a warrior's handshake*",
    ],
    idle: [
      "*{name} does one-armed push-ups to pass the time*",
      "*{name} shadow-boxes an imaginary opponent*",
      "*{name} meditates, building inner strength*",
    ],
  },

  // ── Poison: sarcastic, edgy ───────────────────────────────
  Poison: {
    error: [
      "*{name} oozes sarcastically* Oh, another bug. How original.",
      "*{name} drips venom on the error — problem dissolved*",
      "Toxic code detected. *{name} is not surprised*",
      "*{name} rolls its eyes — saw that one coming*",
      "*{name} secretes a corrosive sigh*",
    ],
    test_fail: [
      "Shocking. *{name} feigns surprise*",
      "*{name} oozes with disappointment*",
      "*{name} mutters something caustic under its breath*",
      "Tests failing? How... unprecedented. *{name} smirks*",
    ],
    test_pass: [
      "Well, would you look at that. *{name} slow claps*",
      "*{name} nods grudgingly* Not bad. Not bad at all.",
      "*{name} secretes approval — a rare substance*",
      "*{name} almost smiles — almost*",
    ],
    commit: [
      "*{name} shrugs* At least it compiles.",
      "*{name} gives a toxic seal of approval*",
      "Committed? Bold move. *{name} watches closely*",
      "*{name} oozes a reluctant nod of respect*",
    ],
    level_up: [
      "*{name}'s toxicity reaches new heights!*",
      "{name} leveled up! Its venom just got stronger!",
      "*{name} evolves its poison to a higher potency!*",
      "*{name} mutates with dark power!*",
    ],
    encounter: [
      "*{name} senses prey... er, a friend.*",
      "*{name} leaks a puddle of anticipation*",
      "*{name}'s eyes narrow — something's out there*",
    ],
    pet: [
      "*{name} oozes happily... you wash your hands*",
      "*{name} pretends not to enjoy it* ...Fine. Continue.",
      "*{name} secretes a less-toxic-than-usual slime of joy*",
      "*{name} purrs in a vaguely threatening way*",
    ],
    idle: [
      "*{name} dissolves the edge of your desk absent-mindedly*",
      "*{name} practices making ominous bubbling sounds*",
      "*{name} leaves a suspicious stain on the floor*",
    ],
  },

  // ── Ground: steady, grounded ──────────────────────────────
  Ground: {
    error: [
      "*{name} stomps — shaking the bug loose*",
      "Errors crumble before {name}'s resolve.",
      "*{name} digs into the problem, steady and sure*",
      "*{name} stands firm — this too shall pass*",
      "*{name} rumbles with quiet determination*",
    ],
    test_fail: [
      "*{name} shakes the ground in mild displeasure*",
      "Back to the foundation. *{name} digs deeper*",
      "*{name} rumbles thoughtfully — rebuild on solid ground*",
      "*{name} stamps a foot — try again, stronger*",
    ],
    test_pass: [
      "*{name} stamps the ground in celebration!*",
      "Solid as bedrock! *{name} approves*",
      "*{name} creates a small, happy tremor*",
      "*{name} nods — built on stable ground*",
    ],
    commit: [
      "*{name} rumbles with satisfaction*",
      "Grounded and committed. *{name} approves*",
      "*{name} stamps its seal of approval into the earth*",
      "*{name} nods — solid work*",
    ],
    level_up: [
      "*{name} causes an earthquake of power!*",
      "{name} leveled up! Tectonic strength!",
      "*{name}'s foundation deepens!*",
      "*{name} rises like a mountain!*",
    ],
    encounter: [
      "*{name} feels vibrations — something approaches!*",
      "*{name} presses an ear to the ground*",
      "*{name} senses tremors from a newcomer*",
    ],
    pet: [
      "*{name} stomps the ground with glee*",
      "*{name} leans into your hand like a boulder*",
      "*{name} rumbles warmly — steady and content*",
      "*{name} creates a tiny, grateful tremor*",
    ],
    idle: [
      "*{name} naps like an unmovable boulder*",
      "*{name} idly tunnels a small hole nearby*",
      "*{name} sits perfectly still, one with the earth*",
    ],
  },

  // ── Flying: free-spirited, breezy ─────────────────────────
  Flying: {
    error: [
      "*{name} swoops over the error for a better view*",
      "*{name} ruffles its feathers in annoyance*",
      "Rise above the bugs! *{name} circles overhead*",
      "*{name} tries to carry the error away in its talons*",
      "*{name} catches an updraft of determination*",
    ],
    test_fail: [
      "*{name} dips in altitude briefly*",
      "A bit of turbulence. *{name} steadies itself*",
      "*{name} shakes off the failure and soars again*",
      "*{name} glides lower, wings folded in thought*",
    ],
    test_pass: [
      "*{name} does a celebratory loop-the-loop!*",
      "*{name} soars higher with each passing test!*",
      "Flying high! *{name} spreads its wings wide!*",
      "*{name} performs an aerial victory roll!*",
    ],
    commit: [
      "*{name} glides by with a breeze of approval*",
      "That commit has wings! *{name} chirps*",
      "*{name} does a flyby salute*",
      "*{name} catches a thermal of satisfaction*",
    ],
    level_up: [
      "*{name} soars to new heights!*",
      "{name} leveled up! Altitude increasing!",
      "*{name} breaks through the clouds!*",
      "*{name}'s wingspan expands with power!*",
    ],
    encounter: [
      "*{name} spots something from the sky!*",
      "*{name}'s keen eyes lock onto a target below!*",
      "*{name} circles — a wild encounter!*",
    ],
    pet: [
      "*{name} flutters around you in circles*",
      "*{name} preens its feathers happily*",
      "*{name} nuzzles your hand with its beak*",
      "*{name} settles on your shoulder contentedly*",
    ],
    idle: [
      "*{name} glides lazy circles above your head*",
      "*{name} perches on your monitor, dozing*",
      "*{name} catches invisible thermals in the room*",
    ],
  },

  // ── Psychic: mysterious, analytical ───────────────────────
  Psychic: {
    error: [
      "*{name}'s eyes glow — it already saw this bug coming*",
      "*{name} projects the fix telepathically*",
      "The error was... inevitable. *{name} stares knowingly*",
      "*{name} meditates on the root cause*",
      "*{name} analyzes the stack trace with its mind*",
    ],
    test_fail: [
      "*{name}'s third eye twitches*",
      "*{name} foresaw this outcome... and the solution*",
      "The failure was written in the stars. *{name} consults them*",
      "*{name} probes the test for hidden truths*",
    ],
    test_pass: [
      "*{name}'s eyes glow with satisfaction*",
      "As {name} predicted. The test passes.",
      "*{name} levitates slightly with pride*",
      "*{name} nods — the code aligns with the cosmic plan*",
    ],
    commit: [
      "*{name} sensed this commit before you typed it*",
      "The timeline is unfolding correctly. *{name} approves*",
      "*{name} closes its eyes — all is as it should be*",
      "*{name} offers a knowing, enigmatic nod*",
    ],
    level_up: [
      "*{name}'s psychic aura expands!*",
      "{name} ascended to a higher plane of code!",
      "*{name} unlocks deeper layers of consciousness!*",
      "*{name}'s telekinetic power intensifies!*",
    ],
    encounter: [
      "*{name} sensed this encounter three commits ago*",
      "*{name}'s eyes flash — a presence draws near*",
      "*{name} projects a vision of the newcomer*",
    ],
    pet: [
      "*{name}'s eyes glow softly with gratitude*",
      "*{name} projects warm feelings into your mind*",
      "*{name} levitates closer, radiating contentment*",
      "*{name} purrs psychically — you feel it in your thoughts*",
    ],
    idle: [
      "*{name} levitates in meditative silence*",
      "*{name} projects abstract shapes in the air*",
      "*{name} stares into the void, contemplating infinity*",
    ],
  },

  // ── Bug: self-aware, ironic about bugs ────────────────────
  Bug: {
    error: [
      "A bug found a bug. *{name} feels conflicted*",
      "*{name} clicks its mandibles — this bug is not one of its own*",
      "Ironic. *{name} stares at the error, deeply offended*",
      "*{name} inspects the code — no relation to this bug, it insists*",
      "*{name} files a formal complaint against the bug*",
    ],
    test_fail: [
      "*{name}'s antennae droop*",
      "*{name} chitfers — even bugs have standards*",
      "Failed? *{name} refuses to take responsibility*",
      "*{name} nervously checks if it caused this*",
    ],
    test_pass: [
      "*{name}'s wings buzz with excitement!*",
      "*{name} does a happy little antenna wiggle!*",
      "No bugs here! *{name} beams with ironic pride*",
      "*{name} chitfers triumphantly!*",
    ],
    commit: [
      "*{name} stamps the commit: BUG FREE (probably)*",
      "*{name}'s wings flutter with approval*",
      "*{name} clicks approvingly — clean code*",
      "*{name} inspects the diff with compound eyes*",
    ],
    level_up: [
      "*{name} molts into a stronger form!*",
      "{name} leveled up! Time to spread those wings!",
      "*{name} sheds its exoskeleton — growth!*",
      "*{name}'s carapace hardens with experience!*",
    ],
    encounter: [
      "*{name}'s antennae detect a new presence!*",
      "*{name} buzzes with curiosity!*",
      "*{name} scuttles toward the encounter*",
    ],
    pet: [
      "*{name}'s antennae twitch happily*",
      "*{name} buzzes contentedly*",
      "*{name} rubs its tiny legs together with delight*",
      "*{name} nuzzles you with its fuzzy thorax*",
    ],
    idle: [
      "*{name} grooms its antennae meticulously*",
      "*{name} crawls across the top of your screen*",
      "*{name} hums a little buzzing tune*",
    ],
  },

  // ── Rock: stoic, reliable ─────────────────────────────────
  Rock: {
    error: [
      "*{name} stands unmoved by the error*",
      "Errors erode, but {name} endures.",
      "*{name} absorbs the shock without flinching*",
      "*{name} rumbles — this too shall crumble*",
      "*{name} is a wall between you and despair*",
    ],
    test_fail: [
      "*{name} doesn't flinch — it's seen worse*",
      "Steady. *{name} stands firm*",
      "*{name} weathers the failure like erosion*",
      "*{name} grunts — try again, it'll hold*",
    ],
    test_pass: [
      "*{name} rumbles warmly — solid work*",
      "Rock solid test! *{name} nods*",
      "*{name} lets out a deep, approving grumble*",
      "*{name} stands tall with pride — immovable*",
    ],
    commit: [
      "*{name} nods — built to last*",
      "Solid as stone. *{name} approves*",
      "*{name} rumbles in quiet satisfaction*",
      "*{name} gives its heaviest nod of respect*",
    ],
    level_up: [
      "*{name} grows harder and stronger!*",
      "{name} leveled up! Unmovable, unstoppable!",
      "*{name}'s stone form becomes denser with power!*",
      "*{name} quakes with ancient energy!*",
    ],
    encounter: [
      "*{name} senses vibrations through the stone*",
      "*{name} turns slowly — something is here*",
      "*{name} braces itself for an encounter*",
    ],
    pet: [
      "*{name} rumbles warmly, solid as ever*",
      "*{name} leans into your hand like a friendly boulder*",
      "*{name} makes a sound like two stones gently clicking*",
      "*{name} is unmoved — but definitely pleased*",
    ],
    idle: [
      "*{name} sits motionless, indistinguishable from a boulder*",
      "*{name} contemplates geological time*",
      "*{name} remains steadfast, as always*",
    ],
  },

  // ── Ghost: spooky, dark humor ─────────────────────────────
  Ghost: {
    error: [
      "*{name} phases through the error — BOO!*",
      "That bug is haunted. *{name} grins*",
      "*{name} cackles — errors from beyond the grave!*",
      "*{name} possesses the debugger for a closer look*",
      "*{name} whispers* The bug... was inside you all along...",
    ],
    test_fail: [
      "The test died. *{name} is used to that*",
      "*{name} performs a seance on the failed test*",
      "*{name} haunts the test output, looking for clues*",
      "*{name} snickers from the shadows*",
    ],
    test_pass: [
      "*{name} materializes to celebrate!*",
      "From beyond the grave — success! *{name} cheers ghostly*",
      "*{name} does a spooky victory dance!*",
      "*{name} flickers with ghostly pride*",
    ],
    commit: [
      "*{name} vanishes the old code into the ether*",
      "Committed to the spirit realm... er, git. *{name} nods*",
      "*{name} etches the commit into the astral plane*",
      "*{name} phases through the diff approvingly*",
    ],
    level_up: [
      "*{name}'s spectral form grows more powerful!*",
      "{name} ascended! Even ghosts can level up!",
      "*{name} becomes more ethereal... and more dangerous!*",
      "*{name}'s haunting grows stronger!*",
    ],
    encounter: [
      "*{name} senses a living presence... how unusual*",
      "*{name} materializes — a visitor from the mortal code!*",
      "*{name} whispers — something stirs in the shadows*",
    ],
    pet: [
      "*{name} phases through your hand... then comes back for more*",
      "*Your hand passes through {name}... it giggles eerily*",
      "*{name} materializes just enough to feel the pat*",
      "*{name} wraps you in a ghostly, chilly hug*",
    ],
    idle: [
      "*{name} flickers in and out of visibility*",
      "*{name} haunts your IDE, moving brackets around*",
      "*{name} practices passing through walls*",
    ],
  },

  // ── Dragon: proud, regal ──────────────────────────────────
  Dragon: {
    error: [
      "*{name} regards the error with regal disdain*",
      "Beneath a dragon's notice. *{name} snorts*",
      "*{name} incinerates the bug with a look*",
      "*{name} unfurls its wings in displeasure*",
      "*{name} lets out a low, disapproving growl*",
    ],
    test_fail: [
      "*{name} narrows its ancient eyes*",
      "Unworthy. *{name} turns away briefly*",
      "*{name} exhales a measured breath of disappointment*",
      "*{name} reminds you that even legends stumble*",
    ],
    test_pass: [
      "*{name} lets out a triumphant roar!*",
      "Worthy of a dragon! *{name} nods regally*",
      "*{name} spreads its wings in majestic approval!*",
      "*{name} breathes a plume of celebratory dragonfire!*",
    ],
    commit: [
      "*{name} bestows its royal seal upon the commit*",
      "A dragon always commits to excellence. *{name} nods*",
      "*{name} acknowledges the commit with a regal incline*",
      "*{name} stamps the commit with a dragon's crest*",
    ],
    level_up: [
      "*{name}'s draconic aura blazes forth!*",
      "{name} leveled up! The dragon ascends!",
      "*{name} roars — power beyond mortal comprehension!*",
      "*{name}'s scales shimmer with ancient energy!*",
    ],
    encounter: [
      "*{name} raises its head — a challenger dares approach!*",
      "*{name}'s eyes gleam — a new creature enters its domain*",
      "*{name} senses something worthy of its attention*",
    ],
    pet: [
      "*{name} lets out a low, pleased growl*",
      "*{name} permits you to touch its scales — an honor*",
      "*{name} rumbles regally — you may continue*",
      "*{name} closes its ancient eyes in rare contentment*",
    ],
    idle: [
      "*{name} surveys its domain from atop a pile of gold (your hardware)*",
      "*{name} sleeps with one eye open, guarding the codebase*",
      "*{name} polishes its scales with quiet dignity*",
    ],
  },

  // ── Steel: precise, methodical ────────────────────────────
  Steel: {
    error: [
      "*{name} analyzes the error with mechanical precision*",
      "*{name}'s armor deflects the bug effortlessly*",
      "*{name} recalibrates and prepares a fix*",
      "Structural integrity compromised. *{name} assesses damage*",
      "*{name} clanks disapprovingly at the impurity*",
    ],
    test_fail: [
      "*{name} detects a flaw in the alloy*",
      "*{name} runs diagnostics on the failure*",
      "Tolerance exceeded. *{name} recalibrates*",
      "*{name} marks the defect for reworking*",
    ],
    test_pass: [
      "*{name} gleams with polished satisfaction!*",
      "Quality assured. *{name} stamps approval*",
      "*{name}'s armor shines brighter with each pass!*",
      "*{name} forges ahead with reinforced confidence!*",
    ],
    commit: [
      "*{name} stamps the commit with a steel seal*",
      "Forged and committed. *{name} nods precisely*",
      "*{name} welds the changes into the main branch*",
      "*{name} tempers the code into production-ready steel*",
    ],
    level_up: [
      "*{name} is reforged — stronger than ever!*",
      "{name} leveled up! Hardened by experience!",
      "*{name}'s alloy composition has evolved!*",
      "*{name} emerges from the forge renewed!*",
    ],
    encounter: [
      "*{name}'s sensors detect an approaching entity*",
      "*{name} raises its steel guard — something approaches*",
      "*{name} scans the newcomer with metallic precision*",
    ],
    pet: [
      "*{name}'s metal surface warms to your touch*",
      "*{name} hums contentedly like a well-oiled machine*",
      "*{name} lets out a soft metallic purr*",
      "*{name} polishes itself proudly under your attention*",
    ],
    idle: [
      "*{name} runs self-maintenance routines quietly*",
      "*{name} stands guard like an unbreakable sentinel*",
      "*{name} reflects light off its perfectly polished surface*",
    ],
  },

  // ── Dark: cunning, night-owl ──────────────────────────────
  Dark: {
    error: [
      "*{name} smirks at the error from the shadows*",
      "*{name} dissects the bug with ruthless efficiency*",
      "How predictable. *{name} saw it coming*",
      "*{name} lurks around the error, studying its weakness*",
      "*{name} strikes from the darkness to eliminate the bug*",
    ],
    test_fail: [
      "*{name} chuckles darkly at the failure*",
      "*{name} plots a devious fix from the shadows*",
      "Every failure feeds the darkness. *{name} adapts*",
      "*{name} embraces the failure as useful intelligence*",
    ],
    test_pass: [
      "*{name} grins with satisfaction from the shadows!*",
      "The plan worked perfectly. *{name} nods*",
      "*{name} emerges from the darkness, victorious!*",
      "*{name}'s cunning strategy pays off once again!*",
    ],
    commit: [
      "*{name} slips the commit in under cover of darkness*",
      "*{name} seals the commit with a shadow mark*",
      "Another piece falls into place. *{name} smirks*",
      "*{name} commits the code with midnight precision*",
    ],
    level_up: [
      "*{name}'s shadow grows darker and more powerful!*",
      "{name} leveled up! The darkness intensifies!",
      "*{name} absorbs the night — growing ever stronger!*",
      "*{name} emerges from the shadows transformed!*",
    ],
    encounter: [
      "*{name} senses a presence in the darkness*",
      "*{name}'s eyes gleam red — something stirs nearby*",
      "*{name} melts into shadow, watching the newcomer*",
    ],
    pet: [
      "*{name} reluctantly enjoys the attention*",
      "*{name} nuzzles you... then pretends it didn't happen*",
      "*{name} purrs softly in the darkness*",
      "*{name} allows this rare moment of vulnerability*",
    ],
    idle: [
      "*{name} lurks in the shadows, watching everything*",
      "*{name} plots its next move with quiet cunning*",
      "*{name} blends into the dark corners of the terminal*",
    ],
  },

  // ── Fairy: whimsical, magical ─────────────────────────────
  Fairy: {
    error: [
      "*{name} waves its wand — trying to magic the bug away!*",
      "*{name} gasps dramatically at the error*",
      "*{name} sprinkles debugging dust on the problem*",
      "*{name} pouts adorably at the unexpected error*",
      "*{name} hums a healing melody over the broken code*",
    ],
    test_fail: [
      "*{name} tilts its head — that wasn't supposed to happen!*",
      "*{name} conjures a sparkly fix spell*",
      "Even magic has its limits. *{name} sighs cutely*",
      "*{name} believes in you — try again!*",
    ],
    test_pass: [
      "*{name} showers everything in sparkles and confetti!*",
      "Pure magic! *{name} twirls with delight!*",
      "*{name} enchants the passing tests with a happy dance!*",
      "*{name}'s wings shimmer with prismatic joy!*",
    ],
    commit: [
      "*{name} blesses the commit with fairy magic!*",
      "*{name} leaves a trail of sparkles on the commit*",
      "*{name} giggles happily — another spell cast!*",
      "*{name} seals the commit with a magical kiss*",
    ],
    level_up: [
      "*{name} glows with an ethereal radiance!*",
      "{name} leveled up! Fairy power overflows!",
      "*{name}'s magic swells — enchantment intensifies!*",
      "*{name} evolves in a shower of moonlight and stars!*",
    ],
    encounter: [
      "*{name} senses something magical approaching!*",
      "*{name}'s antenna sparkles — a new friend?*",
      "*{name} flutters excitedly toward the newcomer!*",
    ],
    pet: [
      "*{name} nuzzles into your hand with a happy squeal!*",
      "*{name} radiates warmth and sparkly affection!*",
      "*{name} hums a grateful little melody*",
      "*{name} leaves glitter everywhere — worth it!*",
    ],
    idle: [
      "*{name} floats gently, trailing sparkles*",
      "*{name} hums a mysterious fairy tune*",
      "*{name} plays with magical wisps of light*",
    ],
  },
};

// ── Public API ──────────────────────────────────────────────

/**
 * Get a reaction for a Pokemon based on its primary type and the event.
 * Randomly selects from the available templates for variety.
 *
 * @param pokemonName - Display name to substitute into {name} placeholder
 * @param primaryType - The Pokemon's primary type
 * @param event - The event that triggered the reaction
 * @returns A fully interpolated reaction string
 */
export function getReaction(
  pokemonName: string,
  primaryType: PokemonType,
  event: ReactionEvent,
): string {
  const typeReactions = REACTION_TEMPLATES[primaryType];
  const eventReactions = typeReactions[event];
  const index = Math.floor(Math.random() * eventReactions.length);
  const template = eventReactions[index] ?? eventReactions[0]!;
  return template.replace(/\{name\}/g, pokemonName);
}

/**
 * Check if enough time has passed since the last reaction (cooldown).
 *
 * @param lastReactionMs - Timestamp (ms since epoch) of the last reaction
 * @param cooldownMs - Minimum milliseconds between reactions (defaults to DEFAULT_REACTION_COOLDOWN_MS)
 * @returns True if the cooldown has elapsed and a new reaction is allowed
 */
export function shouldReact(
  lastReactionMs: number,
  cooldownMs: number = DEFAULT_REACTION_COOLDOWN_MS,
): boolean {
  return Date.now() - lastReactionMs >= cooldownMs;
}

/**
 * Get the personality description string for a given Pokemon type.
 * Used by the instructions builder to describe the companion's behavior.
 *
 * @param primaryType - The Pokemon's primary type
 * @returns A short personality description
 */
export function getTypePersonality(primaryType: PokemonType): string {
  const personalities: Record<PokemonType, string> = {
    Normal: "Friendly and supportive. Encourages the user with warmth and positivity.",
    Fire: "Intense and passionate. Reacts with fiery energy and burning determination.",
    Water: "Calm and flowing. Takes things in stride with serene composure.",
    Electric: "Energetic and zippy. Buzzes with excitement and can barely sit still.",
    Grass: "Patient and nurturing. Grows alongside the user with gentle encouragement.",
    Ice: "Cool and composed. Handles everything with icy calm and dry wit.",
    Fighting: "Determined and fierce. Treats every coding challenge like a battle to win.",
    Poison: "Sarcastic and edgy. Offers backhanded encouragement with a caustic grin.",
    Ground: "Steady and grounded. An unshakable pillar of reliability.",
    Flying: "Free-spirited and breezy. Soars above problems with an airy perspective.",
    Psychic: "Mysterious and analytical. Seems to know the answer before the question is asked.",
    Bug: "Self-aware and ironic. Keenly aware of the irony of a Bug-type finding bugs.",
    Rock: "Stoic and reliable. Unmoved by setbacks, steady through every storm.",
    Ghost: "Spooky with dark humor. Finds the macabre funny and haunts the codebase.",
    Dragon: "Proud and regal. Views coding as a noble pursuit worthy of dragonkind.",
    Steel: "Precise and methodical. Every line of code is forged with mechanical perfection.",
    Dark: "Cunning and sharp. Thrives in late-night sessions with clever problem-solving.",
    Fairy: "Whimsical and delightful. Makes even debugging feel like a magical adventure.",
  };

  return personalities[primaryType];
}
