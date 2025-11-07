/** @packageDocumentation
 * Minimal Express HTTP API for the Minesweeper backend.
 * Exposes endpoints to create a game, query state, apply actions (reveal/flag),
 * change UI mode, time-travel (undo/seek/preview), consume lives (revive), and request hints.
 * @remarks
 * All responses are JSON. Errors are returned as `{ error: string }` with non-2xx status codes.
 */

import express from "express";
import {createGame, flag, getGame, hint, preview, revive, reveal, seek, setMode, undo} from "./engine.js";
import {presetToOpts} from "./util.js";
import type {CreatePayloadCustom, CreatePayloadPreset, GameOptions} from "./types.js";

const app = express();
app.use(express.json());

/** Sends a 200 OK JSON response.
 * @param res Express response.
 * @param data Payload to serialize.
 */
function ok(res: any, data: any) {
    return res.status(200).json(data);
}

/** Sends a 201 Created JSON response.
 * @param res Express response.
 * @param data Payload to serialize.
 */
function created(res: any, data: any) {
    return res.status(201).json(data);
}

/** Sends an error JSON response with the given status.
 * @param res Express response.
 * @param msg Error message.
 * @param code HTTP status code (defaults to 400).
 */
function bad(res: any, msg: string, code = 400) {
    return res.status(code).json({error: msg});
}

/** Health/echo endpoint.
 * @route GET /echo
 * @returns 200 with `{ msg: "hello from TS" }`.
 */
app.get("/echo", (_req, res) => res.json({msg: "hello from TS"}));

/** Create a new game.
 * @route POST /game
 * @body `CreatePayloadPreset` **or** `CreatePayloadCustom`
 * @returns 201 with the initial `GameView` on success.
 * @errors 400 if required fields are missing or validation fails.
 * @remarks
 * When `preset` is provided, base options are derived via {@link presetToOpts} and can be overridden.
 */
app.post("/game", (req, res) => {
    try {
        const body = req.body as CreatePayloadCustom | CreatePayloadPreset;
        let opts: GameOptions;

        if("preset" in body && body.preset) {
            const base = presetToOpts(body.preset);
            opts = {
                ...base,
                firstClickNoGuess: !!body.firstClickNoGuess,
                lives: Math.max(0, body.lives ?? 0),
                quickFlag: !!body.quickFlag
            };
        }
        else {
            const custom = body as CreatePayloadCustom;
            opts = {
                rows: custom.rows!,
                cols: custom.cols!,
                mines: custom.mines!,
                firstClickNoGuess: !!custom.firstClickNoGuess,
                lives: custom.lives ?? 0,
                quickFlag: !!custom.quickFlag
            };
        }
        return created(res, createGame(opts));
    }
    catch(e: any) {
        return bad(res, e.message);
    }
});

/** Get current game state.
 * @route GET /game/:id
 * @param id Game UUID (path param).
 * @returns 200 with `GameView`.
 * @errors 404 if game is not found; 400 for other errors.
 */
app.get("/game/:id", (req, res) => {
    try {
        return ok(res, getGame(req.params.id));
    }
    catch(e: any) {
        return bad(res, e.message, e.message === "not found" ? 404 : 400);
    }
});

/** Reveal a cell.
 * @route POST /game/:id/reveal
 * @body `{ r: number; c: number }`
 * @returns 200 with updated `GameView`.
 * @errors 404 if not found; 409 if `"game over"`; 400 otherwise.
 * @remarks
 * Starts the timer on the first-ever action; trims future history if cursor is not at the end.
 * Lives are consumed immediately upon mine hit.
 */
app.post("/game/:id/reveal", (req, res) => {
    try {
        return ok(res, reveal(req.params.id, req.body.r, req.body.c));
    }
    catch(e: any) {
        return bad(
            res,
            e.message,
            e.message === "not found" ? 404 : e.message === "game over" ? 409 : 400
        );
    }
});

/** Place/remove/toggle a flag.
 * @route POST /game/:id/flag
 * @body `{ r: number; c: number; set?: boolean }`
 * @returns 200 with updated `GameView`.
 * @errors 404 if not found; 400 otherwise.
 * @remarks
 * `set=true` forces flagged; `false` forces unflagged; `undefined` toggles.
 * Permanent flags (after revive) cannot be toggled off.
 */
app.post("/game/:id/flag", (req, res) => {
    try {
        return ok(res, flag(req.params.id, req.body.r, req.body.c, req.body.set));
    }
    catch(e: any) {
        return bad(res, e.message, e.message === "not found" ? 404 : 400);
    }
});

/** Toggle quick-flag UI mode.
 * @route POST /game/:id/mode
 * @body `{ quickFlag: boolean }`
 * @returns 200 with `{ ok: true, quickFlagEnabled }`.
 * @errors 404 if not found; 400 otherwise.
 * @remarks
 * This is a UI preference; engine rules do not change.
 */
app.post("/game/:id/mode", (req, res) => {
    try {
        return ok(res, setMode(req.params.id, !!req.body.quickFlag));
    }
    catch(e: any) {
        return bad(res, e.message, e.message === "not found" ? 404 : 400);
    }
});

/** Step the timeline backward by `steps` (default 1).
 * @route POST /game/:id/undo
 * @body `{ steps?: number }`
 * @returns 200 with updated `GameView`.
 * @errors 404 if not found; 400 otherwise.
 * @remarks
 * Undo moves cursor back but does NOT trim future actions - they remain for potential redo.
 * Undo skips states with revealed mines (to avoid showing explosion state).
 * Lives are NOT restored by undo.
 */
app.post("/game/:id/undo", (req, res) => {
    try {
        const steps = Number.isFinite(req.body?.steps) ? req.body.steps : 1;
        return ok(res, undo(req.params.id, steps));
    }
    catch(e: any) {
        return bad(res, e.message, e.message === "not found" ? 404 : 400);
    }
});

/** Seek to an absolute action index.
 * @route POST /game/:id/seek
 * @body `{ toIndex: number }`
 * @returns 200 with updated `GameView`.
 * @errors 404 if not found; 400 otherwise.
 * @remarks
 * Used in exploded state to browse history before reviving.
 * Changes cursor but does not trim actions.
 */
app.post("/game/:id/seek", (req, res) => {
    try {
        return ok(res, seek(req.params.id, req.body.toIndex));
    }
    catch(e: any) {
        return bad(res, e.message, e.message === "not found" ? 404 : 400);
    }
});

/** Preview a snapshot at a specific index without changing game state.
 * @route POST /game/:id/preview
 * @body `{ toIndex: number }`
 * @returns 200 with `GameView` (with `isPreview=true`).
 * @errors 404 if not found; 400 otherwise.
 * @remarks
 * Used for displaying history in game over state without modifying cursor or game state.
 * Response includes `isPreview: true` and `previewIndex` fields.
 */
app.post("/game/:id/preview", (req, res) => {
    try {
        return ok(res, preview(req.params.id, req.body.toIndex));
    }
    catch(e: any) {
        return bad(res, e.message, e.message === "not found" ? 404 : 400);
    }
});

/** Consume one life and revive from a checkpoint.
 * @route POST /game/:id/revive
 * @body `{ toIndex?: number }`
 * @returns 200 with updated `GameView` (forced `status = "playing"`).
 * @errors 404 if not found; 409 if `"no lives left"`; 400 otherwise.
 * @remarks
 * If `toIndex` is provided, revive to that specific action.
 * If omitted, revive from one step before the explosion.
 * The exploded mine is automatically permanently flagged after revive.
 */
app.post("/game/:id/revive", (req, res) => {
    try {
        return ok(res, revive(req.params.id, req.body?.toIndex));
    }
    catch(e: any) {
        return bad(
            res,
            e.message,
            e.message === "not found" ? 404 : e.message === "no lives left" ? 409 : 400
        );
    }
});

/** Get a coarse hint around a hidden mine.
 * @route GET /game/:id/hint
 * @returns 200 with `{ type: "none" }` or `{ type: "mine-area", rect: { r0, c0, r1, c1 } }`.
 * @errors 404 if not found; 400 otherwise.
 * @remarks
 * Finds the most useful unflagged mine (closest to opened cells) and returns its 3×3 neighborhood.
 */
app.get("/game/:id/hint", (req, res) => {
    try {
        return ok(res, hint(req.params.id));
    }
    catch(e: any) {
        return bad(res, e.message, e.message === "not found" ? 404 : 400);
    }
});

const PORT = Number(process.env.MINESWEEPER_NODE_PORT) || 5051;
const HOST = process.env.MINESWEEPER_NODE_HOST || "0.0.0.0";

/** Starts the HTTP server.
 * @remarks
 * Binds to `${HOST}:${PORT}` by default. Set `MINESWEEPER_NODE_PORT` to change the port.
 */
app.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Minesweeper TS backend running on http://${HOST}:${PORT}`);
});
