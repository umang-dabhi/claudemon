/**
 * increment-counter.ts — Counter-only increment for non-XP events.
 * Usage: bun run increment-counter.ts <counter_key>
 *
 * Used for events that should be tracked but don't award XP,
 * such as test failures, build failures, and generic errors.
 */

import type { EventCounterKey } from "../engine/types.js";
import { StateManager } from "../state/state-manager.js";

const counterKey = process.argv[2] as EventCounterKey | undefined;

if (!counterKey) {
  process.exit(0);
}

const stateManager = StateManager.getInstance();
const state = await stateManager.load();

// No state file = first run, nothing to do yet
if (!state) {
  process.exit(0);
}

// Increment the counter and save (incrementCounter saves internally)
await stateManager.incrementCounter(counterKey);
