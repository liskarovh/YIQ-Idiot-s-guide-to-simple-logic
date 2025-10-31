# Tic‑Tac‑Toe JS SDK (non‑UI)

This folder contains a **thin, non‑UI JavaScript layer** used by the React app.
It handles latency‑sensitive client logic (optimistic updates, input validation,
and simple state/session orchestration) while **all rendering stays in React**.

```
Frontend/
└─ src/
   └─ javascript/
      └─ tic_tac_toe/
         api.js          # HTTP wrapper for backend
         sdk.js          # orchestration (state, optimistic play, resume, restart)
         validator.js    # fast local validations
         storage.js      # localStorage session helpers
         telemetry.js    # optional hooks (latency, errors, state changes)
         retry.js        # retry/backoff placeholder (currently pass‑through)
         index.js        # barrel exports
```

## What the SDK does (and why)

- **Local validation**: bounds & occupancy checks to prevent instant bad clicks.
- **Optimistic updates**: immediate local board update; server response later
  confirms / corrects the state. This makes the UI feel snappy under latency.
- **Session persistence**: last game id + params in `localStorage` so the user
  can refresh the page and continue.
- **Stateful best‑move**: calls backend with `gameId`, then refreshes to keep
  `hints_used` and meta fields in sync.
- **No rendering**: React imports this SDK and renders the state separately.

## Import in React

```js
// App.jsx (example)
import { createTicTacToeSdk } from './javascript/tic_tac_toe';

const sdk = createTicTacToeSdk({
  telemetry: {
    onLatency: (ms) => console.debug('[latency]', ms),
    onError: (e) => console.warn('[error]', e),
    onStateChange: (_prev, next) => console.debug('[state]', next),
  }
});

// On mount: try resume or start new
await (sdk.actions.resumeLastGame() ?? sdk.actions.newGame({ size: 3, kToWin: 3 }));

// On click: validate & play
// if (validator.canPlayLocally(sdk.getState().game, r, c)) await sdk.actions.play(r, c);
```

> **Routing / proxy**: In dev, ensure your frontend origin can reach the backend under
`/api/tictactoe/*` (e.g., Vite/CRA proxy or same origin). The SDK builds URLs relative
to `window.location.origin`.

---

## Smoke tests

You can run a quick end‑to‑end check against a running backend.

### 1) Browser smoke (HTML)

Open **`ttt-sdk-smoke.html`** in any modern browser (or place it under `public/` and open via local dev server).  
This will:
- start a new 3×3 game
- place X at (0,0) optimistically
- ask for a best move
- log results to the console

### 2) Node smoke (ESM)

Run:

```bash
node ttt-sdk-node-smoke.mjs
```

> Requires Node 18+ (built‑in `fetch`). Make sure your backend is running on
`http://127.0.0.1:5000` or change `BASE_ORIGIN` at the top of the script.

---

## Minimal API contract the SDK expects

- `POST /api/tictactoe/new` → `{ game: {...} }`
- `POST /api/tictactoe/play` → `{ game: {...} }` or error `{ error: {...} }`
- `GET  /api/tictactoe/status/:id` → `{ game: {...} }` or 404
- `POST /api/tictactoe/best-move` (stateful with `{ gameId }`) →
  ```json
  {
    "move": [r, c],
    "score": 0.0,
    "stats": { "elapsedMs": 0, "rollouts": 400 },
    "analysis": { "player": "X", "size": 3, "kToWin": 3, "difficulty": "easy", "explain": "..." },
    "explain": "...",
    "meta": { "difficulty": "easy", "elapsedMs": 0 },
    "version": "py-omega-1.2.0"
  }
  ```
- `POST /api/tictactoe/restart` → `{ game: {...} }`

All errors are JSON: `{ "error": { "code": string, "message": string, "meta"?: object } }`

---

## How to extend later

- **retry/backoff**: implement jittered exponential backoff in `retry.js` and wrap all
  `api*` calls via `withRetry`.
- **command queue**: queue local actions when offline and auto‑flush on reconnect.
- **metrics**: report `lastLatencyMs` and errors to your telemetry pipeline.

---
