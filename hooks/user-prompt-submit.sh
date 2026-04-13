#!/usr/bin/env bash
# chmod +x hooks/user-prompt-submit.sh
#
# UserPromptSubmit hook for Claudemon — reacts when Pokemon name is mentioned.
# Reads JSON from stdin, checks if the user mentioned their active Pokemon's name,
# and writes a fun reaction to status.json.
# MUST exit 0 always — hooks must never block Claude Code.

# Defensive: do NOT use set -e. We never want to crash.
# Wrap everything so any unexpected error is swallowed.
_claudemon_name_react() {
  # ── Locate dependencies ────────────────────────────────────
  command -v jq >/dev/null 2>&1 || return 0

  # ── Read stdin ─────────────────────────────────────────────
  local INPUT
  INPUT=$(cat)
  [ -z "$INPUT" ] && return 0

  local STATE_DIR="$HOME/.claudemon"
  local STATE_FILE="$STATE_DIR/state.json"
  local STATUS_FILE="$STATE_DIR/status.json"

  [ -f "$STATE_FILE" ] || return 0
  [ -f "$STATUS_FILE" ] || return 0

  # ── Get user's prompt text ─────────────────────────────────
  local USER_TEXT
  USER_TEXT=$(echo "$INPUT" | timeout 2 jq -r '.user_prompt // empty' 2>/dev/null)
  [ -z "$USER_TEXT" ] && return 0

  # ── Get active Pokemon's nickname or species name ──────────
  local POKEMON_NAME
  POKEMON_NAME=$(timeout 2 jq -r '.party[] | select(.isActive == true) | .nickname // empty' "$STATE_FILE" 2>/dev/null)

  if [ -z "$POKEMON_NAME" ]; then
    # No nickname — fall back to the name from status.json
    POKEMON_NAME=$(timeout 2 jq -r '.name // empty' "$STATUS_FILE" 2>/dev/null)
  fi

  [ -z "$POKEMON_NAME" ] && return 0

  # ── Case-insensitive check if name appears in user text ────
  local NAME_LOWER
  NAME_LOWER=$(echo "$POKEMON_NAME" | tr '[:upper:]' '[:lower:]')
  local TEXT_LOWER
  TEXT_LOWER=$(echo "$USER_TEXT" | tr '[:upper:]' '[:lower:]')

  echo "$TEXT_LOWER" | grep -qi "$NAME_LOWER" || return 0

  # ── Name mentioned! Pick a reaction ────────────────────────
  local REACTIONS=(
    "perks up!"
    "looks at you!"
    "wiggles happily!"
    "tilts head curiously!"
    "chirps with excitement!"
  )
  local IDX=$(( $(date +%s) % ${#REACTIONS[@]} ))
  local REACTION="*${POKEMON_NAME} ${REACTIONS[$IDX]}*"

  # ── Update status.json with reaction ───────────────────────
  local CURRENT
  CURRENT=$(cat "$STATUS_FILE" 2>/dev/null)
  [ -z "$CURRENT" ] && return 0

  echo "$CURRENT" | timeout 2 jq --arg reaction "$REACTION" '. + {reaction: $reaction}' > "${STATUS_FILE}.tmp" 2>/dev/null
  mv "${STATUS_FILE}.tmp" "$STATUS_FILE" 2>/dev/null
}

# Run the function, swallow all errors, always exit 0
_claudemon_name_react 2>/dev/null || true
exit 0
