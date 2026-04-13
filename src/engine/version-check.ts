/**
 * Version check module for Claudemon.
 * Checks npm registry for newer versions, caching results for 24 hours.
 * Designed to be non-blocking — never delays server startup.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getStateDir } from "./constants.js";

// ── Types ─────────────────────────────────────────────────────

interface VersionCache {
  lastCheck: number; // timestamp ms
  latestVersion: string; // e.g., "1.5.0"
  currentVersion: string; // version at time of check
}

export interface UpdateInfo {
  hasUpdate: boolean;
  latest: string;
  current: string;
}

// ── Constants ─────────────────────────────────────────────────

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 5000;
const NPM_REGISTRY_URL = "https://registry.npmjs.org/@umang-boss/claudemon/latest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Module-level cache ────────────────────────────────────────

let cachedUpdateInfo: UpdateInfo | null = null;

/** Retrieve the last update check result (populated by checkForUpdate). */
export function getLastUpdateCheck(): UpdateInfo | null {
  return cachedUpdateInfo;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Get current package version from the nearest package.json.
 * Searches upward from the module directory.
 */
export function getCurrentVersion(): string {
  const candidates = [
    join(__dirname, "..", "..", "package.json"),
    join(__dirname, "..", "package.json"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const pkg = JSON.parse(readFileSync(p, "utf-8")) as {
          version?: string;
        };
        return pkg.version ?? "unknown";
      } catch {
        continue;
      }
    }
  }
  return "unknown";
}

/**
 * Check npm registry for the latest version. Non-blocking, cached.
 *
 * - Returns cached result if checked within the last 24 hours.
 * - Fetches from npm registry with a 5-second timeout.
 * - Fails silently on network errors (returns null).
 * - Stores result in module-level cache for instructions builder.
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const current = getCurrentVersion();
  if (current === "unknown") return null;

  const cacheFile = getCacheFilePath();

  // Check disk cache first
  try {
    if (existsSync(cacheFile)) {
      const raw = await readFile(cacheFile, "utf-8");
      const cached = JSON.parse(raw) as VersionCache;
      if (Date.now() - cached.lastCheck < CHECK_INTERVAL_MS) {
        const result: UpdateInfo = {
          hasUpdate: isNewerVersion(cached.latestVersion, current),
          latest: cached.latestVersion,
          current,
        };
        cachedUpdateInfo = result;
        return result;
      }
    }
  } catch {
    /* cache miss — proceed to registry */
  }

  // Fetch from npm registry
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = (await res.json()) as { version?: string };
    const latest = data.version ?? current;

    // Persist cache to disk
    const cache: VersionCache = {
      lastCheck: Date.now(),
      latestVersion: latest,
      currentVersion: current,
    };
    try {
      const dir = dirname(cacheFile);
      await mkdir(dir, { recursive: true });
      await writeFile(cacheFile, JSON.stringify(cache), "utf-8");
    } catch {
      /* non-critical — cache write failure is fine */
    }

    const result: UpdateInfo = {
      hasUpdate: isNewerVersion(latest, current),
      latest,
      current,
    };
    cachedUpdateInfo = result;
    return result;
  } catch {
    // Network error, abort, or timeout — silently skip
    return null;
  }
}

// ── Internal Helpers ──────────────────────────────────────────

/** Path to the on-disk version cache file. Resolved at call time for testability. */
function getCacheFilePath(): string {
  return join(getStateDir(), "version-check.json");
}

/**
 * Simple semver comparison: is version `a` strictly newer than version `b`?
 * Compares major.minor.patch numerically.
 */
function isNewerVersion(a: string, b: string): boolean {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return true;
    if (va < vb) return false;
  }
  return false;
}
