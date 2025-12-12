/**
 * Schema for the capabilities response returned by the server.
 *
 * - Root must be an object containing `presets`, `limits` and `features`.
 * - `presets` is an array of preset game configurations (name, rows, cols, mines).
 * - `limits` describes allowed ranges for rows, cols, mines and lives (each with min/max).
 * - `features` toggles optional server features (undo, hints, timer).
 * - `additionalProperties: false` prevents unexpected top-level properties.
 */
export const CapabilitiesResponseSchema = {
    type: "object",
    required: ["presets", "limits", "features"],
    additionalProperties: false,
    properties: {
        presets: {
            type: "array",
            items: {
                type: "object",
                required: ["name", "rows", "cols", "mines"],
                additionalProperties: false,
                properties: {
                    name: {type: "string"},
                    rows: {type: "integer", minimum: 1},
                    cols: {type: "integer", minimum: 1},
                    mines: {type: "integer", minimum: 1}
                }
            }
        },
        limits: {
            type: "object",
            required: ["rows", "cols", "mines", "lives"],
            additionalProperties: false,
            properties: {
                rows: {
                    type: "object",
                    required: ["min", "max"],
                    additionalProperties: false,
                    properties: {min: {type: "integer"}, max: {type: "integer"}}
                },
                cols: {
                    type: "object",
                    required: ["min", "max"],
                    additionalProperties: false,
                    properties: {min: {type: "integer"}, max: {type: "integer"}}
                },
                mines: {
                    type: "object",
                    required: ["min", "max"],
                    additionalProperties: false,
                    properties: {min: {type: "integer"}, max: {type: "integer"}}
                },
                lives: {
                    type: "object",
                    required: ["min", "max"],
                    additionalProperties: false,
                    properties: {min: {type: "integer"}, max: {type: "integer"}}
                }
            }
        },
        features: {
            type: "object",
            additionalProperties: false,
            properties: {
                undo: {type: "boolean"},
                hints: {type: "boolean"},
                timer: {type: "boolean"}
            }
        }
    }
} as const;

/**
 * Schema for create-game request payload.
 *
 * Accepts one of two shapes:
 * - `{ preset: string, lives?: integer }` to start a preset game.
 * - `{ rows: integer, cols: integer, mines: integer, lives?: integer }` for custom board.
 *
 * - `oneOf` enforces exactly one of the alternatives.
 * - `lives` is optional and must be >= 0 when present.
 */
export const CreateGameRequestSchema = {
    type: "object",
    oneOf: [
        {
            required: ["preset", "lives"],
            additionalProperties: false,
            properties: {
                preset: {type: "string"},
                lives: {type: "integer", minimum: 0}
            }
        },
        {
            required: ["rows", "cols", "mines", "lives"],
            additionalProperties: true,
            properties: {
                rows: {type: "integer", minimum: 1},
                cols: {type: "integer", minimum: 1},
                mines: {type: "integer", minimum: 1},
                lives: {type: "integer", minimum: 0}
            }
        }
    ]
} as const;

/**
 * Schema for create-game response.
 *
 * - Must include `gameId`, `rows`, `cols`, and `mines`.
 * - `additionalProperties: true` allows server to include extra fields such as status, lives, createdAt, preset, etc.
 */
export const CreateGameResponseSchema = {
    type: "object",
    required: ["gameId", "rows", "cols", "mines"],
    additionalProperties: true, // e.g. status, lives, createdAt, preset, ...
    properties: {
        gameId: {type: "string"},
        rows: {type: "integer"},
        cols: {type: "integer"},
        mines: {type: "integer"}
    }
} as const;
