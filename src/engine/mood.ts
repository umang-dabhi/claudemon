/**
 * Mood engine for Claudemon.
 * Pure functions that calculate mood based on recent events, time of day,
 * and special triggers (evolution, achievements, catches).
 */

import type { MoodType, EventCounters } from "./types.js";

// ── Mood Decay Durations (milliseconds) ───────────────────

/** How long each mood lasts before decaying back to neutral */
const MOOD_DECAY_MS: Record<MoodType, number> = {
  happy: 600_000, // 10 minutes
  worried: 300_000, // 5 minutes
  sleepy: Infinity, // Resets based on time-of-day, not duration
  energetic: 900_000, // 15 minutes
  proud: 600_000, // 10 minutes
  neutral: Infinity, // Never decays (it IS the default)
};

// ── XP Event Types That Trigger Moods ─────────────────────

const POSITIVE_EVENTS = new Set(["test_pass", "build_success", "commit"]);

const NEGATIVE_EVENTS = new Set(["test_fail", "build_fail", "error"]);

// ── Mood Calculation ──────────────────────────────────────

/**
 * Calculate the current mood based on recent events, time, and special triggers.
 *
 * Priority order:
 * 1. Sleepy (midnight to 5 AM)
 * 2. Proud (just evolved/achieved/caught)
 * 3. Worried (recent negative event)
 * 4. Happy (recent positive event)
 * 5. Energetic (morning + active streak)
 * 6. Keep current mood if it hasn't decayed
 * 7. Neutral (default fallback)
 *
 * @param recentEvent - The last XP event type, or null
 * @param counters - Current event counters (for context)
 * @param currentHour - Hour of day (0-23)
 * @param lastMood - The previous mood
 * @param moodSetAt - Timestamp when last mood was set
 * @param hadEvolution - Whether the Pokemon just evolved
 * @param hadAchievement - Whether the player just unlocked an achievement
 * @param hadCatch - Whether the player just caught a Pokemon
 * @returns The calculated mood
 */
export function calculateMood(
  recentEvent: string | null,
  counters: EventCounters,
  currentHour: number,
  lastMood: MoodType,
  moodSetAt: number,
  hadEvolution: boolean,
  hadAchievement: boolean,
  hadCatch: boolean,
): MoodType {
  // 1. Sleepy: midnight to 5 AM (hours 0-4)
  if (currentHour >= 0 && currentHour < 5) {
    return "sleepy";
  }

  // 2. Proud: just evolved, achieved, or caught a Pokemon
  if (hadEvolution || hadAchievement || hadCatch) {
    return "proud";
  }

  // 3. Worried: recent negative event
  if (recentEvent !== null && NEGATIVE_EVENTS.has(recentEvent)) {
    return "worried";
  }

  // 4. Happy: recent positive event
  if (recentEvent !== null && POSITIVE_EVENTS.has(recentEvent)) {
    return "happy";
  }

  // 5. Energetic: morning coding (5 AM - 10 AM) with an active streak
  if (currentHour >= 5 && currentHour < 10) {
    // Use a simple heuristic: if there have been any sessions, consider it an active streak
    const hasStreak = counters.sessions > 0;
    if (hasStreak) {
      return "energetic";
    }
  }

  // 6. Keep current mood if it hasn't decayed
  if (!hasMoodDecayed(lastMood, moodSetAt, Date.now())) {
    return lastMood;
  }

  // 7. Default fallback
  return "neutral";
}

/**
 * Check whether a mood has expired based on its decay duration.
 *
 * @param mood - The mood to check
 * @param setAt - Timestamp when the mood was set
 * @param now - Current timestamp
 * @returns true if the mood has decayed (expired)
 */
export function hasMoodDecayed(mood: MoodType, setAt: number, now: number): boolean {
  const duration = MOOD_DECAY_MS[mood];
  if (duration === Infinity) {
    // Sleepy decays when it's no longer midnight-5 AM (handled in calculateMood)
    // Neutral never decays
    return false;
  }
  return now - setAt >= duration;
}

// ── Mood Speeches ─────────────────────────────────────────

/** Mood-specific speech lines for the status line. Name placeholder {name} is replaced at call time. */
const MOOD_SPEECHES: Record<MoodType, readonly string[]> = {
  happy: [
    "*{name} is beaming with pride!*",
    "*{name} does a little victory dance*",
    "*{name} radiates positive energy*",
    "*{name} bounces happily*",
    "*{name} gives you a thumbs up*",
  ],
  worried: [
    "*{name} looks concerned...*",
    "*{name} nervously watches the errors*",
    "*{name} hides behind the terminal*",
    "*{name} paces back and forth*",
    "*{name} offers you a virtual hug*",
  ],
  sleepy: [
    "*{name} yawns widely*",
    "*{name} dozes off... zzz*",
    "*{name} rubs its eyes*",
    "*{name} curls up near the keyboard*",
    "*{name} mumbles in its sleep*",
  ],
  energetic: [
    "*{name} is fired up! Let's go!*",
    "*{name} bounces off the walls*",
    "*{name} can't sit still!*",
    "*{name} is ready to code all day!*",
    "*{name} stretches and flexes*",
  ],
  proud: [
    "*{name} puffs up with pride*",
    "*{name} strikes a victory pose*",
    "*{name} shows off to everyone*",
    "*{name} earned bragging rights!*",
    "*{name} stands tall and proud*",
  ],
  neutral: [
    "*{name} looks at your code curiously*",
    "*{name} nods along as you type*",
    "*{name} is watching closely*",
    "*{name} hums softly*",
    "*{name} waits patiently*",
    "*{name} tilts head at the screen*",
    "*{name} chirps encouragingly*",
    "*{name} peers at a variable name*",
  ],
};

/**
 * Get mood-specific speech messages with the Pokemon's name filled in.
 *
 * @param name - The Pokemon's display name
 * @param mood - The current mood
 * @returns Array of speech strings with the name interpolated
 */
export function getMoodSpeeches(name: string, mood: MoodType): string[] {
  const templates = MOOD_SPEECHES[mood];
  return templates.map((t) => t.replace("{name}", name));
}

// ── Mood Display Helpers ──────────────────────────────────

/** Emoji representation for each mood */
const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: "\u{1F60A}", // 😊
  worried: "\u{1F61F}", // 😟
  sleepy: "\u{1F634}", // 😴
  energetic: "\u{26A1}", // ⚡
  proud: "\u{1F451}", // 👑
  neutral: "\u{1F610}", // 😐
};

/** Human-readable mood descriptions */
const MOOD_DESCRIPTIONS: Record<MoodType, string> = {
  happy: "Happy",
  worried: "Worried",
  sleepy: "Sleepy",
  energetic: "Energetic",
  proud: "Proud",
  neutral: "Neutral",
};

/**
 * Get the emoji for a mood.
 *
 * @param mood - The mood type
 * @returns The emoji string
 */
export function getMoodEmoji(mood: MoodType): string {
  return MOOD_EMOJIS[mood];
}

/**
 * Get a human-readable description for a mood.
 *
 * @param mood - The mood type
 * @returns The description string (e.g. "Happy")
 */
export function getMoodDescription(mood: MoodType): string {
  return MOOD_DESCRIPTIONS[mood];
}
