#!/usr/bin/env bun
/**
 * Claudemon CLI entry point.
 * Routes to install, uninstall, update, or doctor based on first argument.
 *
 * Usage:
 *   npx claudemon install
 *   npx claudemon uninstall
 *   npx claudemon update
 *   npx claudemon doctor
 */

export {};
const command = process.argv[2];

switch (command) {
  case "install":
    await import("./install.js");
    break;
  case "uninstall":
    await import("./uninstall.js");
    break;
  case "update":
    await import("./update.js");
    break;
  case "doctor":
    await import("./doctor.js");
    break;
  default:
    console.log(`
Claudemon — Pokemon Gen 1 coding companion for Claude Code

Usage:
  claudemon install     Set up Claudemon (MCP server, hooks, skill, status line)
  claudemon uninstall   Remove Claudemon from Claude Code
  claudemon update      Re-register everything (preserves save data)
  claudemon doctor      Run diagnostics

After install, start a new Claude Code session and type /buddy
`);
    break;
}
