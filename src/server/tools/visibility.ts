/**
 * buddy_hide / buddy_show_sprite — Toggle sprite visibility in status line.
 * Writes to ~/.claudemon/config.json which the status line script reads.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStateDir } from "../../engine/constants.js";
import { ensureDir, atomicWrite, safeRead } from "../../state/io.js";
import { join } from "node:path";

interface BuddyDisplayConfig {
  spriteHidden: boolean;
  [key: string]: unknown;
}

async function getConfigPath(): Promise<string> {
  return join(getStateDir(), "config.json");
}

async function readConfig(): Promise<BuddyDisplayConfig> {
  const path = await getConfigPath();
  const data = await safeRead<BuddyDisplayConfig>(path);
  return data ?? { spriteHidden: false };
}

async function writeConfig(config: BuddyDisplayConfig): Promise<void> {
  const path = await getConfigPath();
  await ensureDir(getStateDir());
  await atomicWrite(path, JSON.stringify(config, null, 2));
}

/** Register buddy_hide tool — hides sprite from status line */
export function registerHideTool(server: McpServer): void {
  server.tool("buddy_hide", "Hide the Pokemon sprite from the status line.", {}, async () => {
    const config = await readConfig();
    config.spriteHidden = true;
    await writeConfig(config);
    return {
      content: [
        {
          type: "text" as const,
          text: "Sprite hidden from status line. Use /buddy unhide to show it again.",
        },
      ],
    };
  });
}

/** Register buddy_unhide tool — shows sprite in status line */
export function registerUnhideTool(server: McpServer): void {
  server.tool("buddy_unhide", "Show the Pokemon sprite in the status line.", {}, async () => {
    const config = await readConfig();
    config.spriteHidden = false;
    await writeConfig(config);
    return {
      content: [
        {
          type: "text" as const,
          text: "Sprite restored to status line!",
        },
      ],
    };
  });
}
