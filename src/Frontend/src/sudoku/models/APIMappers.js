/**
 * @file APIMappers.js
 * @brief Utility module for mapping front-end string-based game options and grid states to back-end integer-based API payloads and vice-versa.
 *
 * @author David Krejčí <xkrejcd00>
 */

/** @brief Mapping of game modes (frontend string) to API integer codes. */
const modeMap = {
    "Learn": 0,
    "Prebuilt": 1,
    "Generated": 2
}

/**
 * @brief Returns the difficulty map based on the game mode.
 * @param {string} mode - The game mode (e.g., "Learn").
 * @returns {object} Map of difficulty strings to integer codes.
 */
function getDifficultyMap(mode) {
    if (mode === "Learn") {
        return {
            "Hidden Singles": 0,
            "Naked Singles": 1,
            "Pointing and Claiming": 2,
            "Pairs and Triplets": 3,
            "Fishing": 4,
            "XY-Wings": 5,
            "Rectangles": 6,
            "Chains": 7,
        }
    }
    return {
        "Basic": 0,
        "Easy": 1,
        "Medium": 2,
        "Hard": 3,
        "Very Hard": 4,
        "Expert": 5,
        "Extreme": 6
    }
}

/** @brief Mapping of cell types (frontend string) to API integer codes. */
const typeMap = {
    "Given": 1,
    "Pencil": 2,
    "Value": 3
}

/** @brief Mapping of mistake checking options (frontend string) to API integer codes. */
const mistakesMap = {
    "OFF": 0,
    "Conflict": 1,
    "Solution": 2,
}

/** @brief Mapping of number selection methods (frontend string) to API integer codes. */
const selectMethodMap = {
    "Number": 0,
    "Cell": 1,
}

/** @brief Reverse mapping of mode codes (API integer) to frontend strings. */
const reverseModeMap = Object.fromEntries(Object.entries(modeMap).map(([k, v]) => [v, k]));
/** @brief Reverse mapping of cell type codes (API integer) to frontend strings. */
const reverseTypeMap = Object.fromEntries(Object.entries(typeMap).map(([k, v]) => [v, k]));
/** @brief Reverse mapping of mistake checking codes (API integer) to frontend strings. */
const reverseMistakesMap = Object.fromEntries(Object.entries(mistakesMap).map(([k, v]) => [v, k]));
/** @brief Reverse mapping of selection method codes (API integer) to frontend strings. */
const reverseSelectMethodMap = Object.fromEntries(Object.entries(selectMethodMap).map(([k, v]) => [v, k]));

/**
 * @brief Returns the reverse difficulty map based on the game mode.
 * @param {string} mode - The game mode (e.g., "Learn").
 * @returns {object} Map of integer codes to difficulty strings.
 */
function getReverseDifficultyMap(mode) {
    const map = getDifficultyMap(mode);
    return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
}


/**
 * @brief Maps the client-side grid state structure to the format required by the API.
 * Converts `null` values to `0` and cell type strings to integer codes.
 * @param {object} grid - The client-side grid object {values, pencils, types}.
 * @returns {object} The API payload grid object.
 */
export function mapGridToSend(grid) {
    const values = grid.values.map(row =>
        row.map(cellValue => (cellValue === null ? 0 : cellValue))
    );

    const types = grid.types.map(row =>
        row.map(type => typeMap[type])
    );

    return {
        values: values,
        pencils: grid.pencils,
        types: types
    }
}

/**
 * @brief Maps the API grid response to the client-side grid state structure.
 * Converts `0` values to `null` and cell type codes to strings. Corrects 'Value' type if cell is empty.
 * @param {object} grid - The API response grid object.
 * @returns {object} The client-side grid object {values, pencils, types, [mistakes]}.
 */
export function mapGridToReceive(grid) {
    const values = grid.values.map(row =>
        row.map(cellValue => (cellValue === 0 ? null : cellValue))
    );

    const pencils = grid.pencils;

    let types = grid.types.map(row => 
        row.map(type => reverseTypeMap[type])
    );

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let type = types[r][c];
            const value = values[r][c];

            // If the cell has no value but is marked as a Value type,
            // change it to Pencil (client-side convention)
            if (value === null && type === "Value") types[r][c] = "Pencil"
        }
    }

    const result = {
        values,
        pencils,
        types
    };

    if ("mistakes" in grid) result.mistakes = grid.mistakes;

    return result;
}

/**
 * @brief Maps the client-side game info state to the API format.
 * Converts mode and difficulty strings to integer codes.
 * @param {object} info - The client-side game info object.
 * @returns {object} The API payload game info object.
 */
export function mapInfoToSend(info) {
    
    return {
        ...info,
        mode: modeMap[info.mode],
        difficulty: getDifficultyMap(info.mode)[info.difficulty],
    }
}

/**
 * @brief Maps the API game info response to the client-side format.
 * Converts mode and difficulty integer codes back to strings.
 * @param {object} info - The API response game info object.
 * @returns {object} The client-side game info object.
 */
export function mapInfoToReceive(info) {
    return {
        ...info,
        mode: reverseModeMap[info.mode],
        difficulty: getReverseDifficultyMap(reverseModeMap[info.mode])[info.difficulty]
    };
}

/**
 * @brief Maps the client-side game options state to the API format.
 * Converts mode, difficulty, checkMistakes, and selectMethod strings to integer codes.
 * @param {object} options - The client-side options object.
 * @returns {object} The API payload options object.
 */
export function mapOptionsToSend(options) {
    return {
        ...options,
        mode: modeMap[options.mode],
        generatedDifficulty: getDifficultyMap("Generated")[options.generatedDifficulty],
        learnDifficulty: getDifficultyMap("Learn")[options.learnDifficulty],
        prebuiltDifficulty: getDifficultyMap("Prebuilt")[options.prebuiltDifficulty],
        checkMistakes: mistakesMap[options.checkMistakes],
        selectMethod: selectMethodMap[options.selectMethod],
    }
}

/**
 * @brief Maps the API options response to the client-side format.
 * Converts mode, difficulty, checkMistakes, and selectMethod integer codes back to strings.
 * @param {object} options - The API response options object.
 * @returns {object} The client-side options object.
 */
export function mapOptionsToReceive(options) {
    return {
        ...options,
        mode: reverseModeMap[options.mode],
        generatedDifficulty: getReverseDifficultyMap("Generated")[options.generatedDifficulty],
        learnDifficulty: getReverseDifficultyMap("Learn")[options.learnDifficulty],
        prebuiltDifficulty: getReverseDifficultyMap("Prebuilt")[options.prebuiltDifficulty],
        checkMistakes: reverseMistakesMap[options.checkMistakes],
        selectMethod: reverseSelectMethodMap[options.selectMethod],
    };
}