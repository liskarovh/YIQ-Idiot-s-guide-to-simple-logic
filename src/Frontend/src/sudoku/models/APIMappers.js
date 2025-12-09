
const modeMap = {
    "Learn": 0,
    "Prebuilt": 1,
    "Generated": 2
}

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

const typeMap = {
    "Given": 1,
    "Pencil": 2,
    "Value": 3
}

// const areasMap = {
//     "OFF": 0,
//     "Selected": 1,
//     "All Digits": 2,
// }

const mistakesMap = {
    "OFF": 0,
    "Conflict": 1,
    "Solution": 2,
}

const selectMethodMap = {
    "Number": 0,
    "Cell": 1,
}

const reverseModeMap = Object.fromEntries(Object.entries(modeMap).map(([k, v]) => [v, k]));
const reverseTypeMap = Object.fromEntries(Object.entries(typeMap).map(([k, v]) => [v, k]));
//const reverseAreasMap = Object.fromEntries(Object.entries(areasMap).map(([k, v]) => [v, k]));
const reverseMistakesMap = Object.fromEntries(Object.entries(mistakesMap).map(([k, v]) => [v, k]));
const reverseSelectMethodMap = Object.fromEntries(Object.entries(selectMethodMap).map(([k, v]) => [v, k]));

function getReverseDifficultyMap(mode) {
    const map = getDifficultyMap(mode);
    return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
}


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
            // change it to Pencil
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


export function mapInfoToSend(info) {
    
    return {
        ...info,
        mode: modeMap[info.mode],
        difficulty: getDifficultyMap(info.mode)[info.difficulty],
    }
}

export function mapInfoToReceive(info) {
    return {
        ...info,
        mode: reverseModeMap[info.mode],
        difficulty: getReverseDifficultyMap(reverseModeMap[info.mode])[info.difficulty]
    };
}

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