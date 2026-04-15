#!/usr/bin/env bash
# chmod +x hooks/post-tool-use.sh
#
# PostToolUse hook for Claudemon — the XP pipeline.
# Reads JSON from stdin, pattern-matches coding events, delegates XP math to bun.
# MUST exit 0 always — hooks must never block Claude Code.

# Defensive: do NOT use set -e. We never want to crash.
# Wrap everything so any unexpected error is swallowed.
_claudemon_post_tool_use() {
  # ── Locate dependencies ────────────────────────────────────
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

  # ── Augment PATH for IDE extensions (VS Code, Cursor) ──────
  # IDE extensions don't source ~/.bashrc, so nvm/bun may not be in PATH.
  if [ -d "${HOME:-$USERPROFILE}/.bun/bin" ]; then
    export PATH="${HOME:-$USERPROFILE}/.bun/bin:$PATH"
  fi
  if [ -d "${HOME:-$USERPROFILE}/.nvm/versions/node" ]; then
    _NVM_NODE_DIR=$(ls -d "${HOME:-$USERPROFILE}"/.nvm/versions/node/*/bin 2>/dev/null | tail -1)
    if [ -n "$_NVM_NODE_DIR" ]; then
      export PATH="$_NVM_NODE_DIR:$PATH"
    fi
  fi
  # Also check for fnm, volta, and other node version managers
  [ -d "${HOME:-$USERPROFILE}/.local/share/fnm/aliases/default/bin" ] && export PATH="${HOME:-$USERPROFILE}/.local/share/fnm/aliases/default/bin:$PATH"
  [ -d "${HOME:-$USERPROFILE}/.volta/bin" ] && export PATH="${HOME:-$USERPROFILE}/.volta/bin:$PATH"

  # Find runtime and script paths
  # Prefer bundled ESM (faster — no TS transpilation), fall back to bun+TS source
  RUNTIME=""
  AWARD_SCRIPT=""
  COUNTER_SCRIPT=""

  if [ -f "$PROJECT_DIR/dist/award-xp.mjs" ] && command -v node >/dev/null 2>&1; then
    # Bundled ESM — use node (fastest)
    RUNTIME="node"
    AWARD_SCRIPT="$PROJECT_DIR/dist/award-xp.mjs"
    COUNTER_SCRIPT="$PROJECT_DIR/dist/increment-counter.mjs"
  elif [ -x "${HOME:-$USERPROFILE}/.bun/bin/bun" ]; then
    # Absolute path — works even without PATH
    RUNTIME="${HOME}/.bun/bin/bun"
    if [ -f "$PROJECT_DIR/dist/award-xp.mjs" ]; then
      AWARD_SCRIPT="$PROJECT_DIR/dist/award-xp.mjs"
      COUNTER_SCRIPT="$PROJECT_DIR/dist/increment-counter.mjs"
    else
      AWARD_SCRIPT="$PROJECT_DIR/src/hooks/award-xp.ts"
      COUNTER_SCRIPT="$PROJECT_DIR/src/hooks/increment-counter.ts"
    fi
  elif command -v bun >/dev/null 2>&1; then
    RUNTIME="bun"
    AWARD_SCRIPT="$PROJECT_DIR/src/hooks/award-xp.ts"
    COUNTER_SCRIPT="$PROJECT_DIR/src/hooks/increment-counter.ts"
  elif command -v node >/dev/null 2>&1; then
    RUNTIME="node"
    # Legacy tsc output
    AWARD_SCRIPT="$PROJECT_DIR/dist/src/hooks/award-xp.js"
    COUNTER_SCRIPT="$PROJECT_DIR/dist/src/hooks/increment-counter.js"
  else
    return 0
  fi

  # Bail silently if jq is not available
  if ! command -v jq >/dev/null 2>&1; then
    return 0
  fi

  # ── Read stdin ─────────────────────────────────────────────
  INPUT=$(cat)
  if [ -z "$INPUT" ]; then
    return 0
  fi

  TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
  if [ -z "$TOOL_NAME" ]; then
    return 0
  fi

  TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty')
  TOOL_RESPONSE=$(echo "$INPUT" | jq -r '.tool_response // empty')

  # ── Pattern match coding events ────────────────────────────
  EVENT=""
  COUNTER=""

  if [ "$TOOL_NAME" = "Bash" ]; then
    STDOUT=$(echo "$TOOL_RESPONSE" | jq -r '.stdout // empty')
    EXIT_CODE=$(echo "$TOOL_RESPONSE" | jq -r '.exit_code // 0')
    COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // empty')

    # Git commit
    if echo "$COMMAND" | grep -qi "git commit"; then
      if [ "$EXIT_CODE" = "0" ]; then
        EVENT="commit"
        COUNTER="commits"
      fi

    # Test pass
    elif echo "$STDOUT" | grep -qiE "(passed|✓|PASS|tests? (passed|succeeded)|0 failed)"; then
      if [ "$EXIT_CODE" = "0" ]; then
        EVENT="test_pass"
        COUNTER="tests_passed"
      fi

    # Test fail
    elif echo "$STDOUT" | grep -qiE "(failed|✗|FAIL|error)"; then
      COUNTER="tests_failed"
      # No XP for failures, but track the counter

    # Build success / failure
    elif echo "$COMMAND" | grep -qiE "(build|compile|make|tsc)"; then
      if [ "$EXIT_CODE" = "0" ]; then
        EVENT="build_success"
        COUNTER="builds_succeeded"
      else
        COUNTER="builds_failed"
      fi

    # Lint fix
    elif echo "$COMMAND" | grep -qiE "(lint|eslint|prettier)"; then
      if [ "$EXIT_CODE" = "0" ]; then
        EVENT="lint_fix"
        COUNTER="lint_fixes"
      fi

    # Generic error encountered
    elif [ "$EXIT_CODE" != "0" ]; then
      COUNTER="errors_encountered"
    fi

  elif [ "$TOOL_NAME" = "Write" ]; then
    FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty')
    if echo "$FILE_PATH" | grep -qiE '\.(test|spec)\.(ts|tsx|js|jsx|py)$'; then
      EVENT="test_written"
      COUNTER="tests_written"
    else
      EVENT="file_create"
      COUNTER="files_created"
    fi

  elif [ "$TOOL_NAME" = "Edit" ]; then
    FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty')
    if echo "$FILE_PATH" | grep -qiE '\.(test|spec)\.(ts|tsx|js|jsx|py)$'; then
      EVENT="test_written"
      COUNTER="tests_written"
    else
      EVENT="file_edit"
      COUNTER="files_edited"
    fi

  elif [ "$TOOL_NAME" = "Grep" ] || [ "$TOOL_NAME" = "Read" ] || [ "$TOOL_NAME" = "Glob" ]; then
    EVENT="search"
    COUNTER="searches"
  fi

  # ── Delegate to scripts ─────────────────────────────────────
  # Run in background to never block. Use timeout if available (Linux/macOS), otherwise just background.

  if [ -n "$EVENT" ]; then
    if command -v timeout >/dev/null 2>&1; then
      timeout 3 "$RUNTIME" "$AWARD_SCRIPT" "$EVENT" "$COUNTER" 2>/dev/null &
    else
      "$RUNTIME" "$AWARD_SCRIPT" "$EVENT" "$COUNTER" 2>/dev/null &
    fi
  elif [ -n "$COUNTER" ]; then
    if command -v timeout >/dev/null 2>&1; then
      timeout 3 "$RUNTIME" "$COUNTER_SCRIPT" "$EVENT" "$COUNTER" 2>/dev/null &
    else
      "$RUNTIME" "$COUNTER_SCRIPT" "$EVENT" "$COUNTER" 2>/dev/null &
    fi
  fi
}

# Run the function, swallow all errors, always exit 0
_claudemon_post_tool_use 2>/dev/null || true
exit 0
