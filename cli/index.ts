#!/usr/bin/env bun
/**
 * Claudemon CLI entry point.
 * Routes to install, uninstall, update, doctor, or --version.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export {};
const command = process.argv[2];

switch (command) {
  case "--version":
  case "-v":
  case "version": {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkgPaths = [
      resolve(__dirname, "..", "package.json"),
      resolve(__dirname, "..", "..", "package.json"),
    ];
    for (const p of pkgPaths) {
      try {
        const pkg = JSON.parse(readFileSync(p, "utf-8")) as { version: string };
        console.log(`claudemon v${pkg.version}`);
        break;
      } catch {
        continue;
      }
    }
    break;
  }
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
Claudemon — Pokemon coding companion for Claude Code

Usage:
  claudemon install     Set up Claudemon (MCP server, hooks, skill, status line)
  claudemon uninstall   Remove Claudemon from Claude Code
  claudemon update      Re-register everything (preserves save data)
  claudemon doctor      Run diagnostics
  claudemon --version   Show version

After install, start a new Claude Code session and type /buddy
`);
    break;
}
