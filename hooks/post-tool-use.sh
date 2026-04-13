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
  BUN_PATH="${HOME}/.bun/bin/bun"

  # Bail silently if bun is not installed
  if [ ! -x "$BUN_PATH" ]; then
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

  # ── Delegate to bun scripts ────────────────────────────────
  # Use timeout to ensure bun never blocks beyond 3s (leaves 2s buffer for Claude Code's 5s limit)

  if [ -n "$EVENT" ]; then
    # XP award + counter increment
    timeout 3 "$BUN_PATH" run "$SCRIPT_DIR/../src/hooks/award-xp.ts" "$EVENT" "$COUNTER" 2>/dev/null &
  elif [ -n "$COUNTER" ]; then
    # Counter-only increment (no XP)
    timeout 3 "$BUN_PATH" run "$SCRIPT_DIR/../src/hooks/increment-counter.ts" "$COUNTER" 2>/dev/null &
  fi
}

# Run the function, swallow all errors, always exit 0
_claudemon_post_tool_use 2>/dev/null || true
exit 0
