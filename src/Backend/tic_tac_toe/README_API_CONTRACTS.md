# Tic-Tac-Toe Backend API (Python / Flask)

Tento dokument fixuje **kontrakt** mezi FE a BE. Reálné chování kódu bude v dalším kroku upraveno tak, aby **přesně** odpovídalo této specifikaci (409 v terminálních stavech, sjednocený error tvar, atd.).

---

## Přehled endpointů

| Metoda | Cesta                          | Typ        | Stav |
|--------|--------------------------------|-----------|------|
| POST   | `/api/tictactoe/new`          | Stavová   | ✅   |
| POST   | `/api/tictactoe/play`         | Stavová   | ✅   |
| GET    | `/api/tictactoe/status/{id}`  | Stavová   | ✅   |
| POST   | `/api/tictactoe/best-move`    | Stateless | ✅   |
| POST   | `/api/tictactoe/restart`      | Stavová   | ➕   |
| POST   | `/api/tictactoe/resign`       | Stavová   | (volitelné) ➕ |
| GET    | `/api/health`                 | Utility   | ✅   |
| GET    | `/api/version`                | Utility   | ➕   |

Legenda: ✅ = existuje; ➕ = přibude v dalším kroku.

---

## Sjednocený tvar chyb (všechny 4xx/5xx)

Všechny chybové odpovědi mají stejný JSON formát:

```json
{
  "error": {
    "code": "InvalidInput",
    "message": "kToWin must be ≤ size",
    "meta": { "field": "kToWin" }
  }
}
```

### Seznam kódů chyb

| HTTP | `error.code`     | Kdy se vrací                                                                 |
|------|-------------------|------------------------------------------------------------------------------|
| 422  | `InvalidInput`    | Chybný vstup (rozměr boardu, `kToWin`, mimo rozsah, neexistující hráč atd.) |
| 409  | `GameOver`        | Akce nad terminálním stavem (win/draw) nebo nad hrou `status != running`     |
| 404  | `NotFound`        | Požadovaný `gameId` neexistuje                                               |
| 503  | `EngineTimeout`   | Solver/AI nestihl limit                   |
| 500  | `Internal`        | Neočekávaná chyba na serveru                                                 |

---

## DTO kontrakty

### 1) `GameDTO` (odpovědi z `/new`, `/status/{id}`, `/restart`, `/resign`)

```json
{
  "id": "string",
  "size": 5,
  "k_to_win": 4,
  "board": [[".",".","."],[".",".","."],[".",".","."]],
  "player": "X",
  "status": "running",          // "running" | "win" | "draw"
  "winner": null,               // "X" | "O" | null
  "start_mark": "X",            // "X" | "O"
  "human_mark": "X",            // pokud hraje člověk (PvE/PvP)
  "turnTimerSec": 0             // 0 = bez limitu tahu (pokud používáme)
}
```

> **Pozn.:** `board` je matice `size × size` se znaky `"." | "X" | "O"`.

---

### 2) `POST /api/tictactoe/new`

**Request:**
```json
{
  "size": 3,                // [3..8]
  "kToWin": 3,              // [3..size]
  "startMark": "X",         // "X" | "O" | "Random"
  "humanMark": "X",         // volitelné
  "mode": "PvP",            // volitelné: "PvP" | "PvE"
  "turnTimerSec": 0,        // volitelné: 0 = vypnuto
  "difficulty": "easy"      // volitelné pro PvE, "easy" | "medium" | "hard"
}
```

**Response 200:**
```json
{ "game": <GameDTO> }
```

**Chyby:** `InvalidInput` (422)

---

### 3) `POST /api/tictactoe/play` (stavová)

**Request:**
```json
{
  "gameId": "string",
  "row": 0,
  "col": 2
}
```

**Response 200:**
```json
{ "game": <GameDTO> }
```

**Chyby:**  
- `NotFound` (404) – hra neexistuje  
- `GameOver` (409) – `status != running` (win/draw), nelze táhnout  
- `InvalidInput` (422) – nelegální tah nebo mimo rozsah

---

### 4) `GET /api/tictactoe/status/{gameId}`

**Response 200:**
```json
{ "game": <GameDTO> }
```

**Chyby:** `NotFound` (404)

---

### 5) `POST /api/tictactoe/restart` (nová hra se stejnými parametry)

**Request:**
```json
{ "gameId": "string" }
```

**Response 200:**
```json
{ "game": <GameDTO> }
```

**Chyby:** `NotFound` (404)

---

### 6) `POST /api/tictactoe/resign` (volitelné)

**Request:**
```json
{ "gameId": "string" }
```

**Response 200:**
```json
{ "game": <GameDTO> }   // status="win", winner = soupeř hráče na tahu
```

**Chyby:**  
- `NotFound` (404)  
- `GameOver` (409) – hra už skončila

---

### 7) `POST /api/tictactoe/best-move` (stateless)

**Request:**
```json
{
  "board": [[".",".","."],[".",".","."],[".",".","."]],
  "player": "X",
  "size": 3,
  "kToWin": 3,
  "difficulty": "easy",       // "easy" | "medium" | "hard"
  "timeCapMs": 150            // volitelné; jinak default dle difficulty
}
```

**Response 200:**
```json
{
  "move": [1, 1],
  "score": 0.73,
  "explain": "mcts rollouts=400; size=3; k=3; player=X",
  "stats": { "rollouts": 400, "elapsedMs": 92 },
  "version": "py-omega-1.2.0"
}
```

**Chyby:**
- `GameOver` (409) – pokud je vstupní pozice terminální (`win`/`draw`)  
  ```json
  {
    "error": {
      "code": "GameOver",
      "message": "Position is terminal; best-move is undefined.",
      "meta": { "status": "win", "winner": "X" }
    }
  }
  ```
- `InvalidInput` (422) – špatné parametry/board  
- `EngineTimeout` (503) – solver nestihl limit

---

### 8) `GET /api/health`

**Response 200:**
```json
{ "ok": true }
```

---

### 9) `GET /api/version`

**Response 200:**
```json
{ "version": "py-omega-1.2.0" }
```

---

## Pravidla a terminální stav

- **Terminální** = `checkWinOrDraw(board, kToWin)` detekuje výhru (`winner ∈ {"X","O"}`) nebo remízu (`winner = null`, `status="draw"`).
- `/best-move` na terminálním vstupu → **409 `GameOver`** (viz výše).
- Stavová `/play`: pokud `status != running` → **409 `GameOver`** s `meta.winner`.

---

## Obtížnosti a časové limity

- `difficulty` je mapována na **časový limit výpočtu** a parametry enginu (hloubka/rollouts).
- BE **garantuje návrat v limitu** (vrátí „nejlepší dosud nalezený tah“).
- V odpovědi je vždy `stats.elapsedMs` (a `stats.rollouts`, pokud dává smysl).

_Příklad mapování (informativní, může se ladit):_
- `easy` → `timeCapMs = 60–120`
- `medium` → `120–300`
- `hard` → `300–2000`

---

## Manuální akceptační scénáře (rychlý checklist)

### A) /best-move — běžný
```
POST /api/tictactoe/best-move
{ "board":[[".",".","."],[".",".","."],[".",".","."]],"player":"X","size":3,"kToWin":3,"difficulty":"easy" }

Očekávám: 200 + klíče move, score, stats.elapsedMs, version
```

### B) /best-move — terminální vstup
```
POST /api/tictactoe/best-move
{ "board":[["X","X","X"],[".",".","."],[".",".","."]], "player":"O", "size":3, "kToWin":3, "difficulty":"easy" }

Očekávám: 409 + error.code="GameOver", meta.status="win", meta.winner="X"
(Pozn.: aktuální implementace může vracet 200; bude upraveno v dalším kroku.)
```

### C) /play po konci hry
```
POST /api/tictactoe/play
{ "gameId":"...", "row":2, "col":2 }

Předpoklad: hra už je ve stavu win/draw
Očekávám: 409 + error.code="GameOver"
(Pozn.: pokud dnes vrací 200, upravíme v dalším kroku.)
```

