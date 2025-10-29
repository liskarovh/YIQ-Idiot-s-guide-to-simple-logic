# Tic-Tac-Toe / Connect-K — Backend API (Python/Flask)

Tenký backend nad externí AI (Omega_Gomoku_AI — MCTS) pro piškvorky / Connect-K.  
FE nikdy nepočítá logiku hry — pouze volá API a vykresluje výsledek.

---

## 1) Modulová struktura (adresář `src/Backend/tic-tac-toe/`)

```
tic-tac-toe/
  __init__.py      # Flask Blueprint (url_prefix="/api/tictactoe")
  routes.py        # HTTP endpointy: /best-move, /play
  adapter.py       # "lepidlo" na submodul omega_gomoku_ai (MCTS)
  rules.py         # validace vstupu, aplikace tahu, výhra/remíza (K-v-řadě)
  config.py        # DIFFICULTY_MAP, limity, timeout, čtení ENV
  types.py         # typové aliasy (Board, Move, Player) — zjednoduší čitelnost
```

> Pozn.: Externí AI je git submodule v:  
> `src/Backend/third_party/omega_gomoku_ai/Omega_Gomoku_AI`

Blueprint bude registrován v `app.py`:
```py
# app.py (ukázka zápisu – implementace přijde v dalším kroku)
# from tic_tac_toe import bp as ttt_bp
# app.register_blueprint(ttt_bp, url_prefix="/api/tictactoe")
```

---

## 2) Datové struktury

- **Board**: `string[][]` — `size × size`, hodnoty `"." | "X" | "O"`. (0-based indexy)
- **Player**: `"X"` nebo `"O"`. (X **vždy začíná**)
- **Move**: `[row, col]` (0-based)

---

## 3) Endpointy

### POST `/api/tictactoe/best-move`
Vrátí nejlepší tah AI (MCTS) pro aktuální stav.

**Request body**
```json
{
  "board": [[".",".","."],[".",".","."],[".",".","."]],
  "player": "X",
  "size": 3,
  "kToWin": 3,
  "difficulty": "easy" 
}
```

**Response 200**
```json
{
  "move": [0, 0],
  "explain": "mcts rollouts=2000; size=3; k=3; player=X"
}
```

**Chyby**
- 400 — nevalidní JSON / chybějící pole / špatné typy
- 422 — porušení pravidel (např. nesedí pořadí na tahu, špatný `kToWin` vůči size)
- 503 — překročen timeout výpočtu (doporučení snížit obtížnost / zmenšit size)
- 500 — neočekávaná chyba

---

### POST `/api/tictactoe/play`
Aplikuje tah hráče, zvaliduje a vrátí nový stav.

**Request body**
```json
{
  "board": [[".",".","."],[".",".","."],[".",".","."]],
  "player": "X",
  "move": [0, 0],
  "size": 3,
  "kToWin": 3
}
```

**Response 200 (validní tah, hra pokračuje)**
```json
{
  "board": [["X",".","."],[".",".","."],[".",".","."]],
  "valid": true,
  "winner": null,
  "next": "O"
}
```

**Response 200 (výhra)**
```json
{
  "board": [["X","X","X"],[".",".","."],[".",".","."]],
  "valid": true,
  "winner": "X",
  "next": null
}
```

**Chyby**
- 422 — nelegální tah (mimo desku / pole není volné / není daný hráč na tahu)
- 400 / 500 — viz výše

---

## 4) Obtížnosti a konfigurace

**Výchozí mapování (v `config.py`):**
- `easy` → `rollouts ≈ 400`, `greedy ≈ 0.1`
- `medium` → `rollouts ≈ 2000`, `greedy = 0.0`
- `hard` → `rollouts ≈ 8000` (u 15×15 až 10–25k), `greedy = 0.0`

**ENV overrides (Azure App Settings už připraveno v pipeline):**
- `CONNECTK_ROLLOUTS_EASY`
- `CONNECTK_ROLLOUTS_MEDIUM`
- `CONNECTK_ROLLOUTS_HARD`

> Adapter tyto hodnoty načte a použije pro MCTS.

---

## 5) Limity a pravidla

- `size`: min **3**, max **19** (doporučeno)
- `kToWin`: **3–5** a `kToWin ≤ size`
- Deska obsahuje pouze `"." | "X" | "O"`
- **Pořadí na tahu**:  
  - `X` pokud `count(X) == count(O)`  
  - `O` pokud `count(X) == count(O) + 1`
- Výhra = **≥ kToWin** v řadě: horizontálně / vertikálně / diagonály (↘, ↙).
- Remíza = deska plná a nikdo nevyhrál.

---

## 6) Timeout & rate-limit

- Timeout výpočtu `/best-move`: **3–5 s** (nastaví se v `config.py`).  
  Překročení → HTTP **503** s hláškou „try lower difficulty / smaller size“.
- Rate-limit (doporučení, implementace později):  
  - `/best-move`: ~ **20 req/min** / IP  
  - `/play`: ~ **120 req/min** / IP

---

## 7) Logging (doporučeno)

- `/best-move`: logovat `size`, `kToWin`, `difficulty`, `rollouts`, **duration_ms**, OK/ERR
- `/play`: logovat nelegální tahy, a při výhře `winner` + směr (H/V/D)

---

## 8) Příklady cURL (smoke testy)

**Best-move (3×3, hard)**
```bash
curl -sS -X POST "$BASE/api/tictactoe/best-move" \
  -H "Content-Type: application/json" \
  -d '{"board":[[".",".","."],[".",".","."],[".",".","."]],"player":"X","size":3,"kToWin":3,"difficulty":"hard"}'
```

**Play (validní tah)**
```bash
curl -sS -X POST "$BASE/api/tictactoe/play" \
  -H "Content-Type: application/json" \
  -d '{"board":[[".",".","."],[".",".","."],[".",".","."]],"player":"X","move":[0,0],"size":3,"kToWin":3}'
```

> `BASE` je kořen vaší App Service (např. `https://…azurewebsites.net`).

---

## 9) Co je implementačně „naše“ vs. „převzaté“

- **Naše (malé, testovatelné):**  
  `rules.py` (validace, legální tah, aplikace tahu, výhra/remíza),  
  `routes.py` (HTTP kontrakty + JSON chyby),  
  `config.py` (obtížnosti, limity, timeout),  
  `__init__.py` (Blueprint).

- **Převzaté:**  
  MCTS AI a `Board(size, n_in_row)` z `Omega_Gomoku_AI` (submodule).  
  My jen mapujeme náš `board` na jejich struktury a zavoláme `select_action()`.

---

## 10) Chybové kódy (shrnutí)

- **400** — špatný tvar vstupu (JSON, typy, chybějící pole)
- **422** — validní JSON, ale porušení pravidel hry (nelegální tah, špatný hráč na tahu, `kToWin > size`, atd.)
- **503** — timeout výpočtu `/best-move`
- **500** — ostatní neočekávané chyby (bez tracebacku v odpovědi)

---

## 11) Poznámka k indexům
Všude používáme **0-based** indexy `[row, col]`. FE musí zobrazovat a posílat souřadnice konzistentně.

---
