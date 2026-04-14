#!/usr/bin/env bash
# chmod +x hooks/stop.sh
#
# Stop hook for Claudemon — extracts buddy comments from Claude's response.
# Looks for <!-- buddy: ... --> patterns and writes them as reactions to status.json.
# MUST exit 0 always — hooks must never block Claude Code.
# Cross-platform: works on Linux, macOS, and Windows Git Bash.

# Defensive: do NOT use set -e. We never want to crash.
# Wrap everything so any unexpected error is swallowed.
_claudemon_stop() {
  # ── Locate dependencies ────────────────────────────────────
  command -v jq >/dev/null 2>&1 || return 0

  # ── Read stdin ─────────────────────────────────────────────
  local INPUT
  INPUT=$(cat)
  [ -z "$INPUT" ] && return 0

  local STATE_DIR="${HOME:-$USERPROFILE}/.claudemon"
  local STATUS_FILE="$STATE_DIR/status.json"

  [ -f "$STATUS_FILE" ] || return 0

  # ── Extract the response text ──────────────────────────────
  local RESPONSE_TEXT
  RESPONSE_TEXT=$(echo "$INPUT" | jq -r '.tool_response.content // empty' 2>/dev/null)
  [ -z "$RESPONSE_TEXT" ] && RESPONSE_TEXT=$(echo "$INPUT" | jq -r '.tool_response // empty' 2>/dev/null)
  [ -z "$RESPONSE_TEXT" ] && return 0

  # ── Look for <!-- buddy: ... --> pattern ───────────────────
  # Use sed instead of grep -oP for cross-platform compatibility
  local BUDDY_COMMENT
  BUDDY_COMMENT=$(echo "$RESPONSE_TEXT" | sed -n 's/.*<!-- buddy: \(.*\) -->.*/\1/p' 2>/dev/null | head -1)
  [ -z "$BUDDY_COMMENT" ] && return 0

  # Trim trailing whitespace
  BUDDY_COMMENT=$(echo "$BUDDY_COMMENT" | sed 's/[[:space:]]*$//')

  # ── Write reaction to status.json ──────────────────────────
  local CURRENT
  CURRENT=$(cat "$STATUS_FILE" 2>/dev/null)
  [ -z "$CURRENT" ] && return 0

  echo "$CURRENT" | jq --arg reaction "$BUDDY_COMMENT" '. + {reaction: $reaction}' > "${STATUS_FILE}.tmp" 2>/dev/null
  # Use cp+rm as cross-platform alternative to mv (works on Windows Git Bash)
  cp "${STATUS_FILE}.tmp" "$STATUS_FILE" 2>/dev/null && rm -f "${STATUS_FILE}.tmp" 2>/dev/null
}

# Run the function, swallow all errors, always exit 0
_claudemon_stop 2>/dev/null || true
exit 0
