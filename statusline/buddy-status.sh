#!/usr/bin/env bash
# Claude Code status line for Claudemon.
# Two-column layout:
#   LEFT:  model, context remaining, usage, buddy speech
#   RIGHT: colorscript sprite + name + level (hideable via /buddy hide)

STATE_DIR="$HOME/.claudemon"
STATUS_FILE="$STATE_DIR/status.json"
CONFIG_FILE="$STATE_DIR/config.json"

[ -f "$STATUS_FILE" ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

# ── Check hide/show toggle ──────────────────────────────────
SPRITE_HIDDEN="false"
if [ -f "$CONFIG_FILE" ]; then
  SPRITE_HIDDEN=$(jq -r '.spriteHidden // false' "$CONFIG_FILE" 2>/dev/null)
fi

# ── Read Claude Code stdin JSON ─────────────────────────────
STDIN_DATA=""
if [ ! -t 0 ]; then
  STDIN_DATA=$(timeout 1 cat 2>/dev/null || true)
fi

CC_MODEL="" CC_CONTEXT=""
if [ -n "$STDIN_DATA" ]; then
  CC_MODEL=$(echo "$STDIN_DATA" | jq -r '.model.display_name // empty' 2>/dev/null)

  # Context memory: count conversation messages from transcript
  TRANSCRIPT=$(echo "$STDIN_DATA" | jq -r '.transcript_path // empty' 2>/dev/null)
  if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
    # Count message objects in transcript as a rough context indicator
    MSG_COUNT=$(jq '[.[] | select(.type == "message" or .type == "human" or .type == "assistant")] | length' "$TRANSCRIPT" 2>/dev/null || echo 0)
    # Rough estimate: ~50 messages fills a 200K context window
    # (each message averages ~4K tokens including tool calls)
    MAX_MSGS=50
    if [ "$MSG_COUNT" -gt 0 ]; then
      USED_PCT=$(( (MSG_COUNT * 100) / MAX_MSGS ))
      [ "$USED_PCT" -gt 100 ] && USED_PCT=100
      LEFT_PCT=$(( 100 - USED_PCT ))
      CC_CONTEXT="${LEFT_PCT}% context"
    fi
  fi
fi

# ── Read buddy status ───────────────────────────────────────
STATUS=$(cat "$STATUS_FILE" 2>/dev/null) || exit 0
[ -n "$STATUS" ] || exit 0

NAME=$(echo "$STATUS" | jq -r '.name // empty')
[ -n "$NAME" ] || exit 0

LEVEL=$(echo "$STATUS" | jq -r '.level // 0')
SPECIES_ID=$(echo "$STATUS" | jq -r '.speciesId // 0')
EVOLVING=$(echo "$STATUS" | jq -r '.evolutionReady // false')
REACTION=$(echo "$STATUS" | jq -r '.reaction // empty')
ENCOUNTER=$(echo "$STATUS" | jq -r '.encounter // empty')

# ── Colors ──────────────────────────────────────────────────
NC=$'\033[0m'
DIM=$'\033[2m'
CYAN=$'\033[38;2;100;200;220m'
GRAY=$'\033[38;2;120;120;130m'
GREEN=$'\033[38;2;100;200;100m'
B=$'\xe2\xa0\x80'

# ── Terminal width ──────────────────────────────────────────
COLS=0
PID=$$
for _ in 1 2 3 4 5; do
  PID=$(ps -o ppid= -p "$PID" 2>/dev/null | tr -d ' ')
  [ -z "$PID" ] || [ "$PID" = "1" ] && break
  PTY=$(readlink "/proc/${PID}/fd/0" 2>/dev/null)
  if [ -c "$PTY" ] 2>/dev/null; then
    COLS=$(stty size < "$PTY" 2>/dev/null | awk '{print $2}')
    [ "${COLS:-0}" -gt 40 ] 2>/dev/null && break
  fi
done
[ "${COLS:-0}" -lt 40 ] 2>/dev/null && COLS=${COLUMNS:-0}
[ "${COLS:-0}" -lt 40 ] 2>/dev/null && COLS=125
[ "$COLS" -lt 40 ] && exit 0

# ── Build name line ─────────────────────────────────────────
if [ "$EVOLVING" = "true" ]; then
  INFO_LINE="${NAME} Lv.${LEVEL} *EVOLVING*"
else
  INFO_LINE="${NAME} Lv.${LEVEL}"
fi

# ── If sprite hidden, show minimal text-only ────────────────
if [ "$SPRITE_HIDDEN" = "true" ]; then
  # Left info only, no sprite
  LEFT=""
  [ -n "$CC_MODEL" ] && LEFT="${CYAN}${CC_MODEL}${NC}"
  [ -n "$CC_CONTEXT" ] && LEFT="${LEFT:+${LEFT} ${GRAY}·${NC} }${GREEN}${CC_CONTEXT}${NC}"

  SPACER=""
  RIGHT_PAD=$(( COLS - ${#INFO_LINE} - 4 ))
  [ "$RIGHT_PAD" -lt 0 ] && RIGHT_PAD=0
  for (( i=0; i<RIGHT_PAD; i++ )); do SPACER+="$B"; done

  echo "${LEFT}"
  echo "${SPACER}${INFO_LINE}"
  exit 0
fi

# ── Load sprite ─────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SPRITE_DIR="$SCRIPT_DIR/../sprites/colorscripts/small"
NAME_LOWER=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed "s/♀/-f/;s/♂/-m/;s/'//;s/\. /-/;s/ /-/")
SPRITE_FILE="$SPRITE_DIR/${SPECIES_ID}-${NAME_LOWER}.txt"

[ -f "$SPRITE_FILE" ] || exit 0

mapfile -t SPRITE_LINES < "$SPRITE_FILE"

# Strip empty lines
while [ ${#SPRITE_LINES[@]} -gt 0 ] && [ -z "${SPRITE_LINES[0]}" ]; do
  SPRITE_LINES=("${SPRITE_LINES[@]:1}")
done
while [ ${#SPRITE_LINES[@]} -gt 0 ] && [ -z "${SPRITE_LINES[-1]}" ]; do
  unset 'SPRITE_LINES[-1]'
done

# Trim to max 8 sprite lines (top = head)
MAX_SPRITE=8
if [ ${#SPRITE_LINES[@]} -gt "$MAX_SPRITE" ]; then
  SPRITE_LINES=("${SPRITE_LINES[@]:0:$MAX_SPRITE}")
fi

SPRITE_COUNT=${#SPRITE_LINES[@]}
[ "$SPRITE_COUNT" -eq 0 ] && exit 0

# ── Sprite width ────────────────────────────────────────────
ART_W=0
for line in "${SPRITE_LINES[@]}"; do
  stripped=$(echo -e "$line" | sed 's/\x1b\[[0-9;]*m//g')
  w=${#stripped}
  [ "$w" -gt "$ART_W" ] && ART_W=$w
done
[ "$ART_W" -lt 5 ] && ART_W=12

# ── Build left-side lines ───────────────────────────────────
# Line 1: model · context left
LEFT_1=""
[ -n "$CC_MODEL" ] && LEFT_1="${CYAN}${CC_MODEL}${NC}"
[ -n "$CC_CONTEXT" ] && LEFT_1="${LEFT_1:+${LEFT_1} ${GRAY}·${NC} }${GREEN}${CC_CONTEXT}${NC}"

# Line 2: (empty)
LEFT_2=""

# Line 3: buddy speech (rotates every 10s, or shows reaction)
SPEECH=""
if [ -n "$ENCOUNTER" ]; then
  # Wild encounter takes priority — flash to get attention
  SPEECH="! ${ENCOUNTER} Use /buddy catch !"
elif [ -n "$REACTION" ]; then
  SPEECH="$REACTION"
else
  NOW=$(date +%s)
  IDX=$(( (NOW / 30) % 12 ))
  SPEECHES=(
    "*${NAME} looks at your code curiously*"
    ""
    "*${NAME} nods along as you type*"
    ""
    "*${NAME} is watching closely*"
    ""
    "*${NAME} hums softly*"
    ""
    "*${NAME} stretches and yawns*"
    ""
    "*${NAME} bounces excitedly*"
    ""
  )
  SPEECH="${SPEECHES[$IDX]}"
fi
if [ -n "$ENCOUNTER" ]; then
  # Bright yellow for encounter alerts
  SPEECH_COLOR=$'\033[1;38;2;255;220;50m'
else
  # Warm muted for idle speech
  SPEECH_COLOR=$'\033[38;2;180;180;120m'
fi
LEFT_3="${SPEECH_COLOR}${SPEECH}${NC}"

# ── Merge left + right ──────────────────────────────────────
TOTAL_LINES=$SPRITE_COUNT

RIGHT_MARGIN=4
RIGHT_PAD=$(( COLS - ART_W - RIGHT_MARGIN ))
[ "$RIGHT_PAD" -lt 0 ] && RIGHT_PAD=0

# Build left array — line 1: model+context, line 2: buddy speech, rest empty
LEFT_LINES=()
LEFT_LINES+=("$LEFT_1")  # line 1: model · context
LEFT_LINES+=("$LEFT_3")  # line 2: buddy speech

# Pad rest with empty lines
while [ ${#LEFT_LINES[@]} -lt "$TOTAL_LINES" ]; do
  LEFT_LINES+=("")
done
LEFT_COUNT=${#LEFT_LINES[@]}

# ── Build full right-side spacer ─────────────────────────────
FULL_SPACER=""
for (( s=0; s<RIGHT_PAD; s++ )); do FULL_SPACER+="$B"; done

# ── Output name line ABOVE sprite ────────────────────────────
echo "${FULL_SPACER}${INFO_LINE}"

# ── Output sprite lines (right-aligned, left content merged) ──
for (( i=0; i<SPRITE_COUNT; i++ )); do
  left="${LEFT_LINES[$i]}"
  left_visible=$(echo -e "$left" | sed 's/\x1b\[[0-9;]*m//g')
  left_w=${#left_visible}

  right="${SPRITE_LINES[$i]}${NC}"

  if [ -n "$left" ]; then
    gap=$(( RIGHT_PAD - left_w ))
    [ "$gap" -lt 1 ] && gap=1
    GAP_STR=""
    for (( g=0; g<gap; g++ )); do GAP_STR+="$B"; done
    echo "${left}${GAP_STR}${right}"
  else
    echo "${FULL_SPACER}${right}"
  fi
done


exit 0
