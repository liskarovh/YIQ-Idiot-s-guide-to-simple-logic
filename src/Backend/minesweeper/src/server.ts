import express, {type Request, type Response, type NextFunction} from "express";
import {createGame, flag, getGame, hint, preview, revive, reveal, seek, setMode, undo} from "./engine";
import {normalizeCreatePayload, buildCapabilitiesPayload} from "./util";
import {CapabilitiesResponseSchema, CreateGameRequestSchema, CreateGameResponseSchema} from "./jsonSchemas";
import {validate, toUnifiedError} from "./ajvValidation";
import {Idempotency} from "./idempotency";
import {cCapabilitiesLimits} from "./constants";
import type {CreatePayload} from "./types";

/**
 * In-memory idempotency cache instance used by the create-game endpoint.
 */
const idempotency = new Idempotency(10 * 60 * 1000);

/**
 * Express application instance.
 */
const app = express();

/**
 * Middleware to parse JSON request bodies.
 */
app.use(express.json());

/**
 * Request/Response logger middleware.
 *
 * - Logs request start, headers (with sensitive values redacted), and body.
 * - Monkey-patches `res.json`, `res.send` and `res.setHeader` to log outgoing response body and headers.
 * - Ensures a final log on `finish` to capture responses that didn't use patched send/json.
 *
 * @param req Express Request object.
 * @param res Express Response object.
 * @param next NextFunction to pass control to the next middleware.
 */
function apiLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const id = `${method} ${url} ${start}`;

    console.log(`[SERVER.ts][REQ start] ${id}`);
    console.log(`[SERVER.ts][REQ headers] ${id}`, sanitizeHeaders(req.headers));
    console.log(`[SERVER.ts][REQ body] ${id}`, req.body);  // body may be undefined for GET

    // Keep original implementations
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalSetHeader = res.setHeader.bind(res);

    /**
     * Logs the response details including status, duration, and body.
     *
     * @param body The response body to log.
     */
    function logResponse(body: unknown) {
        const duration = Date.now() - start;
        const status = res.statusCode;
        console.log(`[SERVER.ts][RESP] ${id} status=${status} duration=${duration}ms body:`, body);
    }

    // Monkey-patch 'json' and send to log response body
    res.json = (body?: any) => {
        logResponse(body);
        return originalJson(body);
    };

    // Monkey-patch 'send' to log response body
    res.send = (body?: any) => {
        logResponse(body);
        return originalSend(body);
    };

    // Monkey-patch 'setHeader' to log header sets
    res.setHeader = (name: string, value: number | string | string[]) => {
        console.log(`[SERVER.ts][RESP header set] ${id} ${name}:`, value);
        return originalSetHeader(name, value);
    };

    // Ensure we always log when response finishes (in case send/json not used)
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[SERVER.ts][FINISH] ${id} status=${res.statusCode} duration=${duration}ms`);
    });

    // Proceed to next middleware
    next();
} // apiLogger()

/**
 * Sanitize request headers for logging.
 *
 * - Redacts sensitive headers such as 'Authorization' and 'Idempotency-Key'.
 *
 * @param headers The original request headers.
 * @returns A sanitized shallow copy of the headers with redactions applied.
 */
function sanitizeHeaders(headers: any) {
    // Shallow copy headers
    const copy: any = {...headers};

    // If no headers, return as is
    if(!copy) {
        return copy;
    }

    // List of sensitive headers to redact
    const sensitive = new Set(["authorization", "idempotency-key", "idempotencykey"]);

    // Iterate and redact sensitive headers
    for(const key of Object.keys(copy)) {
        const lower = key.toLowerCase();  // case-insensitive check

        // Redact sensitive headers
        if(sensitive.has(lower)) {
            const val = copy[key];
            copy[key] = Array.isArray(val) ? val.map(() => "[REDACTED]") : "[REDACTED]";
        }
    }

    return copy;  // return sanitized copy
} // sanitizeHeaders()

/**
 * Set consistent Location header for created games.
 *
 * - Uses the canonical API path used for idempotency caching.
 * - Centralized so both response and cache can rely on the same format.
 *
 * @param response Express Response object.
 * @param gameId The ID of the created game.
 */
function setLocation(response: Response, gameId: string) {
    // Construct location path
    const locationPath = `/game/${gameId}`;

    // Set Location header
    response.setHeader("Location", locationPath);
    console.log("[SERVER.ts][setLocation] setting Location header:", locationPath);
} // setLocation()

/**
 * Unified error handler that normalizes thrown errors and sends a consistent payload.
 *
 * - Delegates normalization to `toUnifiedError`.
 *
 * @param error The error object thrown.
 * @param response Express Response object.
 * @param next NextFunction.
 * @return Response JSON body with normalized error payload and the appropriate status.
 */
function errorHandler(error: unknown, response: Response, next: NextFunction): Response | void {
    // If headers already sent, delegate to default Express handler
    if(response.headersSent) {
        return next(error as any);
    }

    try {
        const {status, payload} = toUnifiedError(error);
        return response.status(status).json(payload);
    }
    catch(e) {

        console.error("[SERVER.ts][ERROR HANDLER] failed to normalize error:", e);
        return response.status(500).json({code: "internal_error", message: "Internal server error"});
    }
}

/**
 * API request/response logging middleware.
 */
app.use(apiLogger);

app.get("/echo", (_request, response) =>
    response.json({msg: "Hello from TS!"})
);

app.get("/capabilities", validate({response: CapabilitiesResponseSchema}), (_request, response) => {
    const payload = buildCapabilitiesPayload();

    console.log("[SERVER.ts][CAPABILITIES] returning payload:", payload);
    return response.status(200).json(payload);
});

app.get("/game/:id", (request, response, next) => {
    console.log("[SERVER.ts][GET /game/:id] id:", request.params.id);

    try {
        const result = getGame(request.params.id);
        console.log("[SERVER.ts][GET /game/:id] found:", {gameId: result.gameId});

        return response.status(200).json(result);
    }
    catch(e: any) {
        console.error("[SERVER.ts][GET /game/:id] error:", e);
        return next({statusCode: (e.message === "not found") ? 404 : 400, message: e.message});
    }
});

app.post(
    "/game",
    validate({request: CreateGameRequestSchema, response: CreateGameResponseSchema}),
    (request: Request, response: Response, next: NextFunction) => {
        const start = Date.now(); // for duration logging

        try {
            const key = request.get("Idempotency-Key") || undefined;
            console.log(`[SERVER.ts][POST /game] start idempotencyKey=${key}`);

            // Check for cached response if idempotency key provided
            const cached = idempotency.get(key);
            if(cached) {
                console.log(`[SERVER.ts][POST /game] found cached response for key=${key} -> location=${cached.location} status=${cached.status}`);
                response.setHeader("Location", cached.location);
                return response.status(cached.status).json(cached.body);
            }

            // Parse and log payload
            const body = request.body as CreatePayload;
            console.log("[SERVER.ts][POST /game] payload received:", body);

            // Normalize the create payload
            const normalizedPayload = normalizeCreatePayload(body, cCapabilitiesLimits);
            console.log("[SERVER.ts][POST /game] normalized payload:", normalizedPayload);

            // Create game
            const gameView = createGame(normalizedPayload);
            console.log("[SERVER.ts][POST /game] game created:", {gameId: gameView.gameId, rows: gameView.rows, cols: gameView.cols, mines: gameView.mines});

            // Build response body including preset info
            const responseBody = {
                ...gameView,
                preset: normalizedPayload.preset
            };

            // Set Location header
            setLocation(response, gameView.gameId);

            // Cache the response for idempotency
            const status = 201;
            const location = `/game/${gameView.gameId}`;
            idempotency.set(key, status, location, responseBody);
            console.log(`[SERVER.ts][POST /game] cached idempotency for key=${key} -> ${location}, status=${status}`);

            // Calculate duration
            const duration = Date.now() - start;

            // Send response
            console.log(`[SERVER.ts][POST /game] finished duration=${duration}ms sending response`);
            return response.status(status).json(responseBody);
        }
        catch(e: any) {
            console.error("[SERVER.ts][POST /game] exception:", e);
            return next(e);
        }
    }
);

app.post("/game/:id/reveal", (request, response, next) => {
    console.log("[SERVER.ts][POST /game/:id/reveal] id:", request.params.id, "r:", request.body.r, "c:", request.body.c);

    try {
        const result = reveal(request.params.id, request.body.r, request.body.c);
        console.log("[SERVER.ts][POST /game/:id/reveal] result:", result);

        return response.status(200).json(result);
    }
    catch(e: any) {
        console.error("[SERVER.ts][POST /game/:id/reveal] error:", e);
        const statusCode = (e.message === "not found") ? 404
                                                       : (e.message === "game over") ? 409
                                                                                     : 400;
        return next({statusCode, message: e.message});
    }
});

app.post("/game/:id/flag", (request, response, next) => {
    console.log("[SERVER.ts][POST /game/:id/flag] id:", request.params.id, "r:", request.body.r, "c:", request.body.c, "set:", request.body.set);

    try {
        const result = flag(request.params.id, request.body.r, request.body.c, request.body.set);
        console.log("[SERVER.ts][POST /game/:id/flag] result:", result);

        return response.status(200).json(result);
    }
    catch(e: any) {
        console.error("[SERVER.ts][POST /game/:id/flag] error:", e);
        return next({statusCode: (e.message === "not found") ? 404 : 400, message: e.message});
    }
});

app.post("/game/:id/mode", (request, response, next) => {
    console.log("[SERVER.ts][POST /game/:id/mode] id:", request.params.id, "quickFlag:", !!request.body.quickFlag);

    try {
        const result = setMode(request.params.id, !!request.body.quickFlag);
        console.log("[SERVER.ts][POST /game/:id/mode] result:", result);

        return response.status(200).json(result);
    }
    catch(e: any) {
        console.error("[SERVER.ts][POST /game/:id/mode] error:", e);
        return next({statusCode: (e.message === "not found") ? 404 : 400, message: e.message});
    }
});

app.post("/game/:id/undo", (request, response, next) => {
    // Default to 1 step if not provided
    const steps = Number.isFinite(request.body?.steps) ? request.body.steps : 1;
    console.log("[SERVER.ts][POST /game/:id/undo] id:", request.params.id, "steps:", steps);

    try {
        const result = undo(request.params.id, steps);
        console.log("[SERVER.ts][POST /game/:id/undo] result:", result);

        return response.status(200).json(result);
    }
    catch(e: any) {
        console.error("[SERVER.ts][POST /game/:id/undo] error:", e);
        return next({statusCode: (e.message === "not found") ? 404 : 400, message: e.message});
    }
});

app.post("/game/:id/seek", (request, response, next) => {
    console.log("[SERVER.ts][POST /game/:id/seek] id:", request.params.id, "toIndex:", request.body.toIndex);

    try {
        const result = seek(request.params.id, request.body.toIndex);
        console.log("[SERVER.ts][POST /game/:id/seek] result:", result);

        return response.status(200).json(result);
    }
    catch(e: any) {
        console.error("[SERVER.ts][POST /game/:id/seek] error:", e);
        return next({statusCode: (e.message === "not found") ? 404 : 400, message: e.message});
    }
});

app.post("/game/:id/preview", (request, response, next) => {
    console.log("[SERVER.ts][POST /game/:id/preview] id:", request.params.id, "toIndex:", request.body.toIndex);

    try {
        const result = preview(request.params.id, request.body.toIndex);

        console.log("[SERVER.ts][POST /game/:id/preview] result:", result);
        return response.status(200).json(result);
    }
    catch(e: any) {
        console.error("[SERVER.ts][POST /game/:id/preview] error:", e);
        return next({statusCode: (e.message === "not found") ? 404 : 400, message: e.message});
    }
});

app.post("/game/:id/revive", (request, response, next) => {
    console.log("[SERVER.ts][POST /game/:id/revive] id:", request.params.id, "toIndex:", request.body?.toIndex);

    try {
        const result = revive(request.params.id, request.body?.toIndex);
        console.log("[SERVER.ts][POST /game/:id/revive] result:", result);

        return response.status(200).json(result);
    }
    catch(e: any) {
        console.error("[SERVER.ts][POST /game/:id/revive] error:", e);

        const statusCode = (e.message === "not found") ? 404
                                                       : (e.message === "no lives left") ? 409
                                                                                         : 400;
        return next({statusCode, message: e.message});
    }
});

app.get("/game/:id/hint", (request, response, next) => {
    console.log("[SERVER.ts][POST /game/:id/hint] id:", request.params.id);

    try {
        const result = hint(request.params.id);
        console.log("[SERVER.ts][POST /game/:id/hint] result:", result);

        return response.status(200).json(result);
    }
    catch(e: any) {
        console.error("[SERVER.ts][POST /game/:id/hint] error:", e);
        return next({statusCode: (e.message === "not found") ? 404 : 400, message: e.message});
    }
});

/**
 * Error handling middleware to convert errors to unified format.
 */
app.use(errorHandler);

/**
 * Port to bind the server to.
 */
const PORT = Number(process.env.MINESWEEPER_NODE_PORT) || 5051;

/**
 * Host to bind the server to.
 */
const HOST = process.env.MINESWEEPER_NODE_HOST || "0.0.0.0";

/**
 * Start the Express server.
 */
app.listen(PORT, HOST, () => {
    console.log(`Minesweeper TS backend running on http://${HOST}:${PORT}`);
});

