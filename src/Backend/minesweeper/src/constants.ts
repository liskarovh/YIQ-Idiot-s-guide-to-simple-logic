import type {Limits, Preset} from "./types.js";

export const cPresets: Readonly<Record<Lowercase<Preset>, Preset>> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard"
} as const;

export const cPresetParameters: Readonly<Record<Lowercase<Preset>, { rows: number; cols: number; mines: number }>> = {
    easy: {rows: 9, cols: 9, mines: 10},
    medium: {rows: 16, cols: 16, mines: 40},
    hard: {rows: 16, cols: 30, mines: 99}
} as const;

export const cCapabilitiesLimits: Readonly<Limits> = {
    rows: {min: 3, max: 30},
    cols: {min: 3, max: 30},
    mines: {min: 1, max: 900}, // finally we'll limit it by area (x - 1)(y - 1)
    lives: {min: 0, max: 10}
} as const;
