#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-http://127.0.0.1:5000/api/tictactoe}"

need() { command -v "$1" >/dev/null || { echo "❌ missing: $1"; exit 1; }; }
need curl; need jq

new_game() {
  local size="$1" k="$2" mode="${3:-pvp}" start="${4:-X}"
  curl -sS -X POST "$BASE/new" \
    -H 'Content-Type: application/json' \
    -d "{\"size\":$size,\"kToWin\":$k,\"mode\":\"$mode\",\"startMark\":\"$start\"}"
}

play() {
  local id="$1" r="$2" c="$3"
  curl -sS -X POST "$BASE/play" \
    -H 'Content-Type: application/json' \
    -d "{\"gameId\":\"$id\",\"row\":$r,\"col\":$c}"
}

state() {
  local id="$1"
  curl -sS "$BASE/state?gameId=$id"
}

assert_winseq() {
  local resp="$1" expected="$2" who="$3"
  # 1) ověř top-level status/winner/sequence + totéž uvnitř game
  echo "$resp" | jq -e --argjson E "$expected" --arg W "$who" '
    .status=="win" and .winner==$W and
    (.winningSequence==$E) and (.game.winningSequence==$E)
  ' >/dev/null || {
    echo "❌ mismatch:"
    echo "Top-level: "; echo "$resp" | jq '.status,.winner,.winningSequence'
    echo "Game:      "; echo "$resp" | jq '.game.winningSequence'
    echo "Expected:  "; echo "$expected" | jq .
    exit 1
  }
}

assert_state_consistent() {
  local id="$1" expected="$2" who="$3"
  local s; s="$(state "$id")"
  echo "$s" | jq -e --argjson E "$expected" --arg W "$who" '
    .status=="win" and .winner==$W and
    (.winningSequence==$E) and (.game.winningSequence==$E)
  ' >/dev/null || {
    echo "❌ /state mismatch:"
    echo "$s" | jq '.status,.winner,.winningSequence,.game.winningSequence'
    exit 1
  }
}

echo "▶ test 1: diagonal ↘ (X)"
ID=$(new_game 5 5 pvp X | jq -r '.game.id')
# X vítězná diagonála; O hraje bezpečně do první řady
play "$ID" 0 0 >/dev/null; play "$ID" 0 1 >/dev/null
play "$ID" 1 1 >/dev/null; play "$ID" 0 2 >/dev/null
play "$ID" 2 2 >/dev/null; play "$ID" 0 3 >/dev/null
play "$ID" 3 3 >/dev/null; play "$ID" 0 4 >/dev/null
RESP=$(play "$ID" 4 4)
EXP='[{"row":0,"col":0},{"row":1,"col":1},{"row":2,"col":2},{"row":3,"col":3},{"row":4,"col":4}]'
assert_winseq "$RESP" "$EXP" "X"
assert_state_consistent "$ID" "$EXP" "X"
echo "✅ diag ↘ ok"

echo "▶ test 2: diagonal ↙ (X)"
ID=$(new_game 5 5 pvp X | jq -r '.game.id')
play "$ID" 0 4 >/dev/null; play "$ID" 0 0 >/dev/null
play "$ID" 1 3 >/dev/null; play "$ID" 0 1 >/dev/null
play "$ID" 2 2 >/dev/null; play "$ID" 0 2 >/dev/null
play "$ID" 3 1 >/dev/null; play "$ID" 0 3 >/dev/null
RESP=$(play "$ID" 4 0)
EXP='[{"row":0,"col":4},{"row":1,"col":3},{"row":2,"col":2},{"row":3,"col":1},{"row":4,"col":0}]'
assert_winseq "$RESP" "$EXP" "X"
assert_state_consistent "$ID" "$EXP" "X"
echo "✅ diag ↙ ok"

echo "▶ test 3: horizontal → (X, řádek 2)"
ID=$(new_game 5 5 pvp X | jq -r '.game.id')
play "$ID" 2 0 >/dev/null; play "$ID" 0 0 >/dev/null
play "$ID" 2 1 >/dev/null; play "$ID" 0 1 >/dev/null
play "$ID" 2 2 >/dev/null; play "$ID" 0 2 >/dev/null
play "$ID" 2 3 >/dev/null; play "$ID" 0 3 >/dev/null
RESP=$(play "$ID" 2 4)
EXP='[{"row":2,"col":0},{"row":2,"col":1},{"row":2,"col":2},{"row":2,"col":3},{"row":2,"col":4}]'
assert_winseq "$RESP" "$EXP" "X"
assert_state_consistent "$ID" "$EXP" "X"
echo "✅ horizontal → ok"

echo "▶ test 4: vertical ↓ (O, sloupec 2)"
ID=$(new_game 5 5 pvp O | jq -r '.game.id')  # O začíná
play "$ID" 0 2 >/dev/null; play "$ID" 0 0 >/dev/null
play "$ID" 1 2 >/dev/null; play "$ID" 0 1 >/dev/null
play "$ID" 2 2 >/dev/null; play "$ID" 1 0 >/dev/null
play "$ID" 3 2 >/dev/null; play "$ID" 1 1 >/dev/null
RESP=$(play "$ID" 4 2)
EXP='[{"row":0,"col":2},{"row":1,"col":2},{"row":2,"col":2},{"row":3,"col":2},{"row":4,"col":2}]'
assert_winseq "$RESP" "$EXP" "O"
assert_state_consistent "$ID" "$EXP" "O"
echo "✅ vertical ↓ ok"

echo "🎉 ALL PASS"
