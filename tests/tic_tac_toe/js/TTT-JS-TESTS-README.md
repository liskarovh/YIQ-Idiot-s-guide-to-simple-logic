# Tic-Tac-Toe JS SDK — Tests (Standalone)

This package contains **standalone tests** you can run without React. It verifies the integration between the JS client (thin layer) and your Flask backend.

## Files

- `ttt-sdk-node-smoke.mjs` — minimal Node ESM smoke test (NEW → PLAY → BEST-MOVE → STATUS).
- `ttt-sdk-browser-smoke.html` — minimal browser smoke test; open in Chrome and watch the console.
- `run_node_smoke.sh` — helper script to run the Node test with optional host/port args.

## What these tests cover

1. **/api/tictactoe/new**  
   - Creates a new game with `size=3`, `kToWin=3`.
   - Asserts HTTP 200 and that a valid `game.id` is returned.

2. **/api/tictactoe/play**  
   - Plays one legal move `(0,0)` as X.
   - Asserts HTTP 200, cell `(0,0)` becomes `"X"`, and `player` toggles to `O`.

3. **/api/tictactoe/best-move** (stateful)  
   - Requests AI hint for the current game.
   - Asserts HTTP 200 and JSON schema containing: `move`, `score`, `stats.elapsedMs`, `version`, `analysis`, `explain`, `meta.difficulty`.

4. **/api/tictactoe/status/{gameId}`**  
   - Fetches current state and asserts `id` matches and that `moves == len(history)` (covered indirectly by previous steps).

These tests do **not** verify React rendering. They validate your backend contract and the JS client’s request/response handling.

---

## Prerequisites

- **Backend** running locally:
  ```bash
  cd src/Backend
  python3 -m flask --app app run -p 5000
  # => listening on http://127.0.0.1:5000
  ```
- **Node.js** (>= 18 recommended).

---

## Running the Node smoke test

Quick way:
```bash
bash run_node_smoke.sh
```

Or manually:
```bash
node ttt-sdk-node-smoke.mjs           # defaults to http://127.0.0.1:5000
# or specify host/port
node ttt-sdk-node-smoke.mjs http://localhost:5000
```

**Pass criteria:** process exits with code 0 and prints `✅ Node smoke test OK`.  
**Fail criteria:** non‑zero exit code and a printed error with the failing step.

### Interpreting failures

- **NEW fails (400/500):** Check backend logs; typical causes are bad payload keys or validation of `size/kToWin`.
- **PLAY fails (400):** Move illegal (occupied/out-of-range). If it’s 500, inspect `/api/tictactoe/play` handler or `apply_move` in `service.py`.
- **BEST-MOVE 404:** The game ID wasn’t persisted (session/store issue). Check `service.save_game` and the in-memory store layer used in Flask.
- **BEST-MOVE 409:** The position is terminal; your smoke test should be starting from an empty board—verify state after PLAY.
- **STATUS 404:** Same as above, persistence of `gameId`.

---

## Running the Browser smoke test

1. Open `ttt-sdk-browser-smoke.html` directly in Chrome/Edge/Firefox.
2. Open DevTools Console. You should see the same flow as the Node test and a green “Smoke OK” text in the page.

If CORS is enabled by your Flask app (as configured), it works from `file://`. If not, serve the file from a static server (e.g. `npx serve .`) and retry.

---

## Customising Host/Port & Difficulty

- Node: pass base URL as CLI arg, e.g. `node ttt-sdk-node-smoke.mjs http://127.0.0.1:5001`.
- Browser: edit the `<script>` section’s `BASE` constant.
- Difficulty: change `"easy"` to `"medium"` or `"hard"`.

---

## Next test ideas (optional)

- **Conflict paths:** After a win, ensure `/play` returns `409 GameOver` with `error.meta.status`.
- **Stateless best-move guard:** Provide a terminal board to `/best-move` and assert `409` + `error.meta.status`.
- **Validate-move:** Call `/validate-move` for occupied and free cells and assert `{ ok / valid }` shape.

These can be added later as small extensions to the smoke tests.