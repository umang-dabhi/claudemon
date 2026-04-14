/**
 * Atomic file I/O helpers for state persistence.
 * All disk writes go through atomicWrite to prevent corruption.
 * Uses only Node.js APIs (no Bun-specific APIs) for compatibility.
 */

import {
  readFile,
  writeFile,
  rename,
  mkdir,
  copyFile,
  unlink,
  stat,
  access,
} from "node:fs/promises";
import { constants } from "node:fs";

/** Write data atomically via temp file + rename */
export async function atomicWrite(path: string, data: string): Promise<void> {
  const tmpPath = `${path}.${Date.now()}.tmp`;
  await writeFile(tmpPath, data, "utf-8");
  await rename(tmpPath, path);
}

/** Read and parse JSON, returning null if file doesn't exist or contains invalid JSON */
export async function safeRead<T>(path: string): Promise<T | null> {
  try {
    await access(path, constants.F_OK);
  } catch {
    return null;
  }
  try {
    const text = await readFile(path, "utf-8");
    if (!text.trim()) {
      return null;
    }
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Ensure directory exists, creating parents as needed */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/**
 * Backup a corrupted file by copying it to `<path>.corrupt.<timestamp>`.
 */
export async function backupCorrupted(path: string): Promise<string> {
  const backupPath = `${path}.corrupt.${Date.now()}`;
  try {
    await copyFile(path, backupPath);
  } catch {
    // If copy fails, nothing to back up
  }
  return backupPath;
}

const LOCK_MAX_AGE_MS = 5000;
const LOCK_RETRY_DELAY_MS = 100;

/**
 * Execute a function while holding a simple file lock.
 */
export async function withLock<T>(lockPath: string, fn: () => Promise<T>): Promise<T> {
  try {
    const lockStat = await stat(lockPath);
    const lockAge = Date.now() - lockStat.mtimeMs;
    if (lockAge < LOCK_MAX_AGE_MS) {
      await new Promise((r) => setTimeout(r, LOCK_RETRY_DELAY_MS));
    }
  } catch {
    // No lock file
  }

  await writeFile(lockPath, String(Date.now()), "utf-8");
  try {
    return await fn();
  } finally {
    try {
      await unlink(lockPath);
    } catch {
      // Ignore
    }
  }
}
