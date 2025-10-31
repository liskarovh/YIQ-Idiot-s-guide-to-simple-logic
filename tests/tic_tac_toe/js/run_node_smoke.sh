#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://127.0.0.1:5000}"

echo "[INFO] Running Node smoke against ${BASE}"
node "$(dirname "$0")/ttt-sdk-node-smoke.mjs" "${BASE}"
