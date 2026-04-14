/**
 * buddy_help tool — Categorized help for all /buddy commands.
 * Returns formatted help text organized by category.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Registers the buddy_help tool on the MCP server. */
export function registerHelpTool(server: McpServer): void {
  server.tool(
    "buddy_help",
    "Show all available /buddy commands organized by category.",
    {},
    async () => {
      const W = 52;
      const border = "\u2500".repeat(W);
      const lines: string[] = [];

      lines.push(`\u250c${border}\u2510`);
      lines.push(`\u2502  ${"CLAUDEMON COMMANDS".padEnd(W - 2)}\u2502`);
      lines.push(`\u251c${border}\u2524`);

      // ── Pokemon ──
      lines.push(`\u2502  ${"\u2605 POKEMON".padEnd(W - 2)}\u2502`);
      lines.push(
        `\u2502    ${"/buddy show         — Show your active Pokemon".padEnd(W - 4)}\u2502`,
      );
      lines.push(`\u2502    ${"/buddy compact      — Quick one-line status".padEnd(W - 4)}\u2502`);
      lines.push(
        `\u2502    ${"/buddy stats        — Detailed stat breakdown".padEnd(W - 4)}\u2502`,
      );
      lines.push(`\u2502    ${"/buddy rename <name> — Give a nickname".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy rename       — Reset to species name".padEnd(W - 4)}\u2502`);
      lines.push(
        `\u2502    ${"/buddy evolve       — Check/trigger evolution".padEnd(W - 4)}\u2502`,
      );
      lines.push(
        `\u2502    ${"/buddy starter      — Pick your first Pokemon".padEnd(W - 4)}\u2502`,
      );
      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      // ── Interactions ──
      lines.push(`\u2502  ${"♥ INTERACTIONS".padEnd(W - 2)}\u2502`);
      lines.push(`\u2502    ${"/buddy pet          — Pet your buddy (+XP)".padEnd(W - 4)}\u2502`);
      lines.push(
        `\u2502    ${"/buddy feed         — Feed (+happiness, 1h cd)".padEnd(W - 4)}\u2502`,
      );
      lines.push(
        `\u2502    ${"/buddy train        — Train a random stat (+XP)".padEnd(W - 4)}\u2502`,
      );
      lines.push(`\u2502    ${"/buddy train <stat> — Train specific stat".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy play         — Pokemon trivia quiz".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      // ── Collection ──
      lines.push(`\u2502  ${"@ COLLECTION".padEnd(W - 2)}\u2502`);
      lines.push(`\u2502    ${"/buddy catch        — Catch a wild Pokemon".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy party        — View your party".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy switch N     — Switch active Pokemon".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy deposit N    — Send to PC Box".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy withdraw N   — Take from PC Box".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy box          — Browse PC Box".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy pokedex      — View your Pokedex".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      // ── Progress ──
      lines.push(`\u2502  ${"# PROGRESS".padEnd(W - 2)}\u2502`);
      lines.push(`\u2502    ${"/buddy achievements — View unlocked badges".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy legendary    — Legendary quest chains".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      // ── Social ──
      lines.push(`\u2502  ${"~ SOCIAL".padEnd(W - 2)}\u2502`);
      lines.push(
        `\u2502    ${"/buddy share        — Share active Pokemon code".padEnd(W - 4)}\u2502`,
      );
      lines.push(`\u2502    ${"/buddy share party  — Share trainer profile".padEnd(W - 4)}\u2502`);
      lines.push(
        `\u2502    ${"/buddy compare <code> — Compare with a friend".padEnd(W - 4)}\u2502`,
      );
      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      // ── Settings ──
      lines.push(`\u2502  ${"* SETTINGS".padEnd(W - 2)}\u2502`);
      lines.push(
        `\u2502    ${"/buddy settings encounter-speed <fast|normal|slow>".padEnd(W - 4)}\u2502`,
      );
      lines.push(`\u2502    ${"/buddy settings xp-share <0-100>".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy hide         — Hide sprite".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"/buddy unhide       — Show sprite".padEnd(W - 4)}\u2502`);

      lines.push(`\u251c${border}\u2524`);
      lines.push(`\u2502  ${"PREREQUISITES".padEnd(W - 2)}\u2502`);
      lines.push(`\u2502    ${"Node.js 18+ (or Bun for faster startup)".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"jq — required for status line display".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"  Linux:   sudo apt install jq".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"  macOS:   brew install jq".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"  Windows: winget install jqlang.jq".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      lines.push(`\u251c${border}\u2524`);
      lines.push(`\u2502  ${"TROUBLESHOOTING".padEnd(W - 2)}\u2502`);
      lines.push(`\u2502    ${"Run: claudemon doctor".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"No sprite? Check jq is installed".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502    ${"Stuck? Try: claudemon update".padEnd(W - 4)}\u2502`);
      lines.push(`\u2502${" ".repeat(W)}\u2502`);

      lines.push(`\u251c${border}\u2524`);
      lines.push(
        `\u2502  ${"Stats: stamina, debugging, stability, velocity, wisdom".padEnd(W - 2)}\u2502`,
      );
      lines.push(`\u2502  ${"905 Pokemon (Gen 1-8) | XP earned as you code!".padEnd(W - 2)}\u2502`);
      lines.push(`\u2514${border}\u2518`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
