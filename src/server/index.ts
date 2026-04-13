/**
 * Claudemon MCP Server entry point.
 * Sets up the MCP server, loads state, registers tools, and connects via stdio.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { PlayerState } from "../engine/types.js";
import { StateManager } from "../state/state-manager.js";
import { registerStarterTool } from "./tools/starter.js";
import { registerShowTool } from "./tools/show.js";
import { registerStatsTool } from "./tools/stats.js";
import { registerPetTool } from "./tools/pet.js";
import { registerEvolveTool } from "./tools/evolve.js";
import { registerCatchTool } from "./tools/catch.js";
import { registerPartyTool } from "./tools/party.js";
import { registerPokedexTool } from "./tools/pokedex.js";
import { registerAchievementsTool } from "./tools/achievements.js";
import { registerLegendaryTool } from "./tools/legendary.js";
import { registerHideTool, registerUnhideTool } from "./tools/visibility.js";
import { registerRenameTool } from "./tools/rename.js";
import { buildInstructions } from "./instructions.js";

/** Safely register a tool, logging to stderr on failure instead of crashing. */
function safeRegister(
  name: string,
  register: (server: McpServer) => void,
  server: McpServer,
): void {
  try {
    register(server);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[claudemon] Failed to register tool "${name}": ${message}\n`);
  }
}

/** Main entry: load state, create server, register tools, connect. */
async function main(): Promise<void> {
  // Load state — if this fails, server still starts (first-run flow)
  let state: PlayerState | null = null;
  try {
    const stateManager = StateManager.getInstance();
    state = await stateManager.load();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[claudemon] State load error (non-fatal): ${message}\n`);
  }

  const instructions = buildInstructions(state);

  const server = new McpServer({ name: "claudemon", version: "0.1.0" }, { instructions });

  // Register all tools — each wrapped so one failure doesn't block the rest
  safeRegister("buddy_starter", registerStarterTool, server);
  safeRegister("buddy_show", registerShowTool, server);
  safeRegister("buddy_stats", registerStatsTool, server);
  safeRegister("buddy_pet", registerPetTool, server);
  safeRegister("buddy_evolve", registerEvolveTool, server);
  safeRegister("buddy_catch", registerCatchTool, server);
  safeRegister("buddy_party", registerPartyTool, server);
  safeRegister("buddy_pokedex", registerPokedexTool, server);
  safeRegister("buddy_achievements", registerAchievementsTool, server);
  safeRegister("buddy_legendary", registerLegendaryTool, server);
  safeRegister("buddy_hide", registerHideTool, server);
  safeRegister("buddy_unhide", registerUnhideTool, server);
  safeRegister("buddy_rename", registerRenameTool, server);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[claudemon] Server failed to start: ${message}\n`);
  process.exit(1);
});
