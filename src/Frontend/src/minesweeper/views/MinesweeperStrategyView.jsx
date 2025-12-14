/**
 * @file MinesweeperStrategyView.jsx
 * @brief A React component that displays Minesweeper strategy tips and techniques.
 *
 * @author Jan Kalina \<xkalinj00>
 */
import React, {useState} from "react";
import Header from "../../components/Header";
import {MinesweeperStrategyController} from "../controllers/MinesweeperStrategyController";
import MinesweeperStrategyStyles from "../styles/MinesweeperStrategyStyles";
import StrategyBox from "../components/MinesweeperStrategyComponents/StrategyBox";
import StrategyPill from "../components/MinesweeperStrategyComponents/StrategyPill";

// ABOUT assets
import AboutBoardExample from "../../assets/minesweeper/About/AboutBoardExample.png";
import AboutBoardSizes from "../../assets/minesweeper/About/AboutBoardSizes.png";

// BASIC EXAMPLES assets
import Pattern_121 from "../../assets/minesweeper/BasicPatterns/Pattern_121.png";
import Pattern_1211 from "../../assets/minesweeper/BasicPatterns/Pattern_1211.png";
import BasicCount1 from "../../assets/minesweeper/BasicPatterns/BasicCount1.png";
import BasicCount2 from "../../assets/minesweeper/BasicPatterns/BasicCount2.png";
import BasicCount3 from "../../assets/minesweeper/BasicPatterns/BasicCount3.png";
import BasicCount4 from "../../assets/minesweeper/BasicPatterns/BasicCount4.png";
import BasicCount5 from "../../assets/minesweeper/BasicPatterns/BasicCount5.png";
import BasicCount6 from "../../assets/minesweeper/BasicPatterns/BasicCount6.png";
import BasicCount7 from "../../assets/minesweeper/BasicPatterns/BasicCount7.png";
import BasicCount8 from "../../assets/minesweeper/BasicPatterns/BasicCount8.png";
import BasicChord1 from "../../assets/minesweeper/BasicPatterns/BasicChord1.png";
import BasicChord2 from "../../assets/minesweeper/BasicPatterns/BasicChord2.png";
import BasicFakeCorner1 from "../../assets/minesweeper/BasicPatterns/BasicFakeCorner1.png";
import BasicFakeCorner2 from "../../assets/minesweeper/BasicPatterns/BasicFakeCorner2.png";

// ADVANCED PATTERNS assets
import Adv_121 from "../../assets/minesweeper/AdvancedPatterns/Adv_121.png";
import Adv_1221 from "../../assets/minesweeper/AdvancedPatterns/Adv_1221.png";
import Adv_121_FromLeft from "../../assets/minesweeper/AdvancedPatterns/Adv_121_FromLeft.png";
import Adv_121_FromRight from "../../assets/minesweeper/AdvancedPatterns/Adv_121_FromRight.png";
import Adv_1221_FromLeft from "../../assets/minesweeper/AdvancedPatterns/Adv_1221_FromLeft.png";
import Adv_1221_FromRight from "../../assets/minesweeper/AdvancedPatterns/Adv_1221_FromRight.png";
import Adv_11X_Border1 from "../../assets/minesweeper/AdvancedPatterns/Adv_11X_Border1.png";
import Adv_11X_Border2 from "../../assets/minesweeper/AdvancedPatterns/Adv_11X_Border2.png";
import Adv_11X_CornerWrap1 from "../../assets/minesweeper/AdvancedPatterns/Adv_11X_CornerWrap1.png";
import Adv_11X_CornerWrap2 from "../../assets/minesweeper/AdvancedPatterns/Adv_11X_CornerWrap2.png";

// ADVANCED LOGIC assets
import AdvLogic_SubsetSafe_1 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_SubsetSafe_1.png";
import AdvLogic_SubsetSafe_2 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_SubsetSafe_2.png";
import AdvLogic_SubsetSafe_3 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_SubsetSafe_3.png";
import AdvLogic_SubsetSafe_4 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_SubsetSafe_4.png";
import AdvLogic_FindMines_1 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_FindMines_1.png";
import AdvLogic_FindMines_2 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_FindMines_2.png";
import AdvLogic_FindMines_3 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_FindMines_3.png";
import AdvLogic_FindMines_4 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_FindMines_4.png";
import AdvLogic_Chain_1 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_Chain_1.png";
import AdvLogic_Chain_2 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_Chain_2.png";
import AdvLogic_Chain_3 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_Chain_3.png";
import AdvLogic_Chain_4 from "../../assets/minesweeper/AdvancedLogic/AdvLogic_Chain_4.png";

// PATTERN REDUCTION assets
import PR_121_1 from "../../assets/minesweeper/PatternReduction/PR_121_1.png";
import PR_121_2 from "../../assets/minesweeper/PatternReduction/PR_121_2.png";
import PR_1221_1 from "../../assets/minesweeper/PatternReduction/PR_1221_1.png";
import PR_1221_2 from "../../assets/minesweeper/PatternReduction/PR_1221_2.png";
import PR_121_Hard from "../../assets/minesweeper/PatternReduction/PR_121_Hard.png";
import PR_1221_Hard from "../../assets/minesweeper/PatternReduction/PR_1221_Hard.png";
import PR_Mix_1 from "../../assets/minesweeper/PatternReduction/PR_Mix_1.png";
import PR_Mix_2 from "../../assets/minesweeper/PatternReduction/PR_Mix_2.png";

// GUESSING assets
import GuessFast5050 from "../../assets/minesweeper/Guessing/GuessFast5050.png";
import GuessFastVsDelay from "../../assets/minesweeper/Guessing/GuessFastVsDelay.png";
import GuessDelayMineCount from "../../assets/minesweeper/Guessing/GuessDelayMineCount.png";
import GuessNoFlagsOpens from "../../assets/minesweeper/Guessing/GuessNoFlagsOpens.png";
import GuessAvoidChainGuess from "../../assets/minesweeper/Guessing/GuessAvoidChainGuess.png";
import GuessUsefulBlueSquare from "../../assets/minesweeper/Guessing/GuessUsefulBlueSquare.png";
import GuessUsefulSquareMulti5050 from "../../assets/minesweeper/Guessing/GuessUsefulSquareMulti5050.png";
import GuessRandomSquareHeuristic from "../../assets/minesweeper/Guessing/GuessRandomSquareHeuristic.png";
import GuessLocal5050 from "../../assets/minesweeper/Guessing/GuessLocal5050.png";
import GuessLocal6633 from "../../assets/minesweeper/Guessing/GuessLocal6633.png";
import GuessPrepareToCalculate from "../../assets/minesweeper/Guessing/GuessPrepareToCalculate.png";
import GuessGlobalProbabilities from "../../assets/minesweeper/Guessing/GuessGlobalProbabilities.png";

// NO FLAGS assets
import NF_WinByOpening from "../../assets/minesweeper/NoFlag/NF_WinByOpening.png";
import NF_SeeMines_1 from "../../assets/minesweeper/NoFlag/NF_SeeMines_1.png";
import NF_SeeMines_2 from "../../assets/minesweeper/NoFlag/NF_SeeMines_2.png";
import NF_SeeMines_3 from "../../assets/minesweeper/NoFlag/NF_SeeMines_3.png";
import NF_PrioritizeSafe_1 from "../../assets/minesweeper/NoFlag/NF_PrioritizeSafe_1.png";
import NF_PrioritizeSafe_2 from "../../assets/minesweeper/NoFlag/NF_PrioritizeSafe_2.png";
import NF_PrioritizeSafe_3 from "../../assets/minesweeper/NoFlag/NF_PrioritizeSafe_3.png";
import NF_PrioritizeSafe_4 from "../../assets/minesweeper/NoFlag/NF_PrioritizeSafe_4.png";

// EFFICIENCY assets
import Eff_NoNeedToFlag from "../../assets/minesweeper/Efficiency/Eff_NoNeedToFlag.png";
import Eff_ChordBestNumber from "../../assets/minesweeper/Efficiency/Eff_ChordBestNumber.png";
import Eff_OnePointFiveClick from "../../assets/minesweeper/Efficiency/Eff_OnePointFiveClick.png";
import Eff_DontFlagUnchordable from "../../assets/minesweeper/Efficiency/Eff_DontFlagUnchordable.png";
import Eff_LocalChoice_1 from "../../assets/minesweeper/Efficiency/Eff_LocalChoice_1.png";
import Eff_LocalChoice_2 from "../../assets/minesweeper/Efficiency/Eff_LocalChoice_2.png";
import Eff_LocalChoice_3 from "../../assets/minesweeper/Efficiency/Eff_LocalChoice_3.png";
import Eff_LocalChoice_4 from "../../assets/minesweeper/Efficiency/Eff_LocalChoice_4.png";
import Eff_Compare_1 from "../../assets/minesweeper/Efficiency/Eff_Compare_1.png";
import Eff_Compare_2 from "../../assets/minesweeper/Efficiency/Eff_Compare_2.png";
import Eff_Compare_3 from "../../assets/minesweeper/Efficiency/Eff_Compare_3.png";
import Eff_Compare_4 from "../../assets/minesweeper/Efficiency/Eff_Compare_4.png";
import Eff_MouseScan from "../../assets/minesweeper/Efficiency/Eff_MouseScan.png";
import Eff_PracticeDirection from "../../assets/minesweeper/Efficiency/Eff_PracticeDirection.png";
import Eff_PathEfficient from "../../assets/minesweeper/Efficiency/Eff_PathEfficient.png";
import Eff_PathInefficient from "../../assets/minesweeper/Efficiency/Eff_PathInefficient.png";

export default function MinesweeperStrategyView() {
    const ctrl = MinesweeperStrategyController();
    const [tab, setTab] = useState("about");

    // ABOUT section content
    const about = {
        whatIsMinesweeper: {
            title: "What is Minesweeper?",
            text: "Minesweeper is a game where mines are hidden in a grid of squares. Safe squares have numbers telling you how many mines touch the square. You can use the number clues to solve the game by opening all of the safe squares. If you click on a mine you lose the game!"
        },
        rules: {
            title: "Basic Rules",
            paragraphs: [
                "Windows Minesweeper always makes the first click safe. When you open a square that does not touch any mines, it will be empty and the adjacent squares will automatically open in all directions until reaching squares that contain numbers. A common strategy for starting games is to randomly click until you get a big opening with lots of numbers.",
                "If you flag all of the mines touching a number, chording on the number opens the remaining squares. Chording is when you press both mouse buttons at the same time. This can save you a lot of work. However, if you place the correct number of flags on the wrong squares, chording will explode the mines."
            ]
        },
        difficulty: {
            title: "Difficulty and Map Size",
            text: "The three difficulty levels are Beginner (9×9 with 10 mines), Intermediate (16×16 with 40 mines) and Expert (30×16 with 99 mines). The game ends when all safe squares have been opened. A counter shows the number of mines without flags, and a clock shows your time in seconds. Minesweeper saves your best time for each difficulty level.",
            extra: "You can also play Custom games up to 30×24 with a minimum of 10 mines and a maximum of (x−1)(y−1) mines."
        }
    };

    // BASIC PATTERNS section content
    const basic = {
        exactCount: {
            title: "Exact-count rule",
            intro: "Start with direct deductions. If a number has exactly N covered neighbors, those neighbors must be mines. (Neighbors include diagonals.)",
            text: "When a number’s remaining mine count equals the number of still-covered squares around it, every one of those covered squares is a mine.",
            examples: [
                {img: BasicCount1, caption: "Corner 1: only one covered neighbor remains → that square is a mine."},
                {img: BasicCount2, caption: "A 2 with exactly two covered neighbors remaining → both are mines."},
                {img: BasicCount3, caption: "A 3 with three covered neighbors remaining → all three are mines."},
                {img: BasicCount4, caption: "A 4 with four covered neighbors remaining → all four are mines."},
                {img: BasicCount5, caption: "Same rule applies for 5: five remaining neighbors → all five are mines."},
                {img: BasicCount6, caption: "Same for 6: six remaining neighbors → all six are mines."},
                {img: BasicCount7, caption: "Same for 7: seven remaining neighbors → all seven are mines."},
                {img: BasicCount8, caption: "Same for 8: eight remaining neighbors → all eight are mines."}
            ]
        },

        chordPreview: {
            title: "Quick check with chord",
            text: "A practical trick: hold both buttons (chord) on a number to visually ‘press’ the surrounding squares without opening them. It helps you quickly see how many covered squares are still adjacent to that number.",
            examples: [
                {
                    img: BasicChord1,
                    caption: "Here, the highlighted 2 still touches three covered squares, so it’s not a direct solve. The other 2 touches only two covered squares, so both must be mines."
                },
                {
                    img: BasicChord2,
                    caption: "The highlighted 2 still touches three covered squares (not direct). The 3 touches exactly three covered squares → all three are mines."
                }
            ]
        },

        fakeCorner: {
            title: "Avoid the “fake corner 1” trap",
            text: "A common mistake is treating a corner 1 as if it must point to the only nearby covered square. If that 1 already touches a confirmed mine, it’s already satisfied — and the remaining covered corner square is safe.",
            examples: [
                {img: BasicFakeCorner1, caption: "The corner 1 is already satisfied by an existing mine → the marked square is safe."},
                {img: BasicFakeCorner2, caption: "Same idea: corner 1 already touches a mine → the highlighted square is not a mine."}
            ]
        }
    };

    // ADVANCED PATTERNS section content
    const advancedPatterns = {
        intro: {
            title: "Advanced Patterns",
            paragraphs: [
                "A pattern is a recurring number arrangement with a single forced outcome. Learning patterns matters because it reduces decision time.",
                "Two high-value patterns to memorize early are 1-2-1 and 1-2-2-1."
            ]
        },

        famous: {
            title: "Two patterns worth memorising",
            examples: [
                {img: Adv_121, caption: "1-2-1: the mines are forced in a unique way."},
                {img: Adv_1221, caption: "1-2-2-1: also has a unique forced placement."}
            ]
        },

        pattern12x: {
            title: "The underlying rule: 1-2-X",
            paragraphs: [
                "Both 1-2-1 and 1-2-2-1 can be viewed as instances of a more general rule: when you have 1-2-X along an edge, the far square (X-side) is forced to be a mine.",
                "Reasoning shortcut: the '2' needs two mines across three candidate squares, while the '1' restricts one mine to a subset of two of those squares. The remaining mine is forced into the third square."
            ],
            groups: [
                {
                    title: "Applying 1-2-X on 1-2-1",
                    items: [
                        {img: Adv_121, caption: "1-2-1 baseline position."},
                        {img: Adv_121_FromLeft, caption: "Apply 1-2-X from the left."},
                        {img: Adv_121_FromRight, caption: "Apply 1-2-X from the right."}
                    ]
                },
                {
                    title: "Applying 1-2-X on 1-2-2-1",
                    items: [
                        {img: Adv_1221, caption: "1-2-2-1 baseline position."},
                        {img: Adv_1221_FromLeft, caption: "Apply 1-2-X from the left."},
                        {img: Adv_1221_FromRight, caption: "Apply 1-2-X from the right."}
                    ]
                }
            ]
        },

        pattern11x: {
            title: "The counter-pattern: 1-1-X from a border",
            paragraphs: [
                "Another useful rule appears when 1-1-X starts from a border. In that case, the third square from the border is forced to be empty.",
                "Conceptually it is the opposite direction of 1-2-X: instead of forcing a mine into the third square, it forces safety there."
            ],
            examples: [
                {img: Adv_11X_Border1, caption: "Border 1-1-X: one mine is constrained into the smaller subset; the remaining square is forced safe."},
                {img: Adv_11X_Border2, caption: "Same logic with a slightly different shape: the third square remains the safe outcome."}
            ]
        },

        wrap: {
            title: "1-1-X can wrap around corners",
            text: "The same subset logic can “bend” around a corner. Treat the border constraint as continuous, and apply the same forced-safety conclusion.",
            examples: [
                {img: Adv_11X_CornerWrap1, caption: "Corner wrap example: the forced safe squares follow the bend."},
                {img: Adv_11X_CornerWrap2, caption: "Corner wrap example with multiple 1s: the same subset reasoning applies."}
            ]
        }
    };

    // ADVANCED LOGIC section content
    const advancedLogic = {
        subsetIntro: {
            title: "Advanced logic",
            paragraphs: [
                "Sometimes a mine is guaranteed to be inside a smaller subset of squares. When that happens, the remaining squares in the larger set must be safe.",
                "This “subset” idea is the core of the 1-1-X family: you use overlapping neighborhoods to prove that a particular square cannot contain a mine."
            ]
        },

        subsetSafe: {
            title: "Subset logic → forced safe squares (1-1-X style)",
            examples: [
                {img: AdvLogic_SubsetSafe_1, caption: "Two overlapping 1s: if one mine is constrained to the smaller pair, the next square along the border becomes a forced safe square."},
                {img: AdvLogic_SubsetSafe_2, caption: "Same concept in a slightly larger shape: one constraint is a subset of the other, so the “extra” square is safe to open."},
                {img: AdvLogic_SubsetSafe_3, caption: "Subset logic is not limited to 1s. When a larger number’s candidates contain the smaller set, the outside squares become safe."},
                {img: AdvLogic_SubsetSafe_4, caption: "If a bigger clue effectively reduces to a smaller one (after accounting for known mines), the remaining difference can identify safe squares."}
            ]
        },

        mineFirst: {
            title: "Sometimes it’s better to find mines first",
            paragraphs: [
                "Advanced boards often give you more progress by proving mines first, then converting the position into a simpler subset / 1-1-X deduction.",
                "Think of it as alternating modes: (1) lock down a mine count, (2) use subset logic to open safe squares, (3) repeat."
            ],
            examples: [
                {img: AdvLogic_FindMines_1, caption: "By resolving the mine placement inside the constrained subset, the remaining uncertain squares become safe candidates to open."},
                {img: AdvLogic_FindMines_2, caption: "Once the mine count is fixed, the leftover squares outside the subset are forced safe (and can reveal the next region)."},
                {img: AdvLogic_FindMines_3, caption: "Overlapping constraints can force a mine into a specific square; after that, the rest collapses into an easy safe move."},
                {img: AdvLogic_FindMines_4, caption: "If a clue becomes effectively smaller after accounting for a known mine, you can apply subset logic to mark forced mines or open forced safes."}
            ]
        },

        chains: {
            title: "Build chains of deductions",
            paragraphs: [
                "You can combine basic rules, subset logic, and patterns into a deduction chain: each step gives just enough information to unlock the next step.",
                "A useful mental model is to alternate between ‘prove mines’ and ‘open safes’, using the new information to keep the chain going."
            ],
            examples: [
                {img: AdvLogic_Chain_1, caption: "Step sequence example: confirm mines, then use 1-1-X logic to open a critical safe square that breaks the position open."},
                {img: AdvLogic_Chain_2, caption: "Another chain: once a vertical mine group is forced, subset logic reveals the next safe click and extends the opening."},
                {img: AdvLogic_Chain_3, caption: "Short chain: one mine is forced, then 1-1-X produces a safe square that unlocks the highlighted region."},
                {img: AdvLogic_Chain_4, caption: "Mixed chain: reduce a large clue into simpler effective clues, then use subset logic to identify the next safe square."}
            ]
        }
    };

    // PATERN REDUCTION section content
    const patternReduction = {
        intro: {
            title: "Pattern Reduction",
            paragraphs: [
                "Many complex-looking positions can be simplified into familiar patterns.",
                "The key idea is to reduce numbers by subtracting confirmed mines. For example, if a mine is already accounted for next to a 3, that clue behaves like a 2 for the remaining unknown squares."
            ]
        },

        row1: {
            text: "After reduction, classic shapes like 1-2-1 and 1-2-2-1 often appear even if they were not obvious at first glance.",
            items: [
                {img: PR_121_1, caption: "Reduced into a 1-2-1 structure."},
                {img: PR_121_2, caption: "Another view of the same 1-2-1 after subtracting known mines."},
                {img: PR_1221_1, caption: "Reduced into a 1-2-2-1 structure."},
                {img: PR_1221_2, caption: "Same idea: reduction reveals the 1-2-2-1 pattern."}
            ]
        },

        row2: {
            text: "The next examples require you to “see” the reduction in your head. If you do not spot the pattern immediately, alternate between reducing numbers and applying 1-2-X / subset logic until the position collapses.",
            items: [
                {img: PR_121_Hard, caption: "Harder case: reduce first, then look for 1-2-1."},
                {img: PR_1221_Hard, caption: "Harder case: reduction reveals a 1-2-2-1."},
                {img: PR_Mix_1, caption: "Mixed case: multiple reduced patterns can coexist."},
                {img: PR_Mix_2, caption: "Another mixed case: reduction + 1-2-X completes the solve."}
            ]
        }
    };

    // FIRST CLICK section content
    const firstClick = {
        intro: {
            title: "First Click",
            paragraphs: [
                "A good start needs two things: an opening (empty area) and enough numbers around it to begin real deduction.",
                "Most players click around until they find an opening. The interesting trade-off is: edges tend to produce openings more often, while the middle tends to produce larger openings when it does open."
            ]
        },

        tradeoff: {
            title: "Middle vs edges: what are you optimizing?",
            paragraphs: [
                "If you optimize for comfort and faster early progress, starting closer to the middle usually gives you more space and more numbers to work with.",
                "If you optimize for finding any opening quickly, clicking closer to the edges can be more consistent—but the openings are often smaller."
            ]
        },

        systemNotes: {
            title: "Version and rules matter",
            paragraphs: [
                "In many implementations the first click is guaranteed to be safe (you won’t lose immediately). That does not always mean the first click guarantees a large opening.",
                "Some versions also bias the first move by relocating a mine if necessary, which can make certain corner/edge behaviors slightly different from what you would expect in a purely random board."
            ]
        },

        recommendations: {
            title: "Practical recommendations",
            bullets: [
                {
                    title: "Beginner / learning",
                    text: "Start near the middle. You will usually get more information early, which makes the rest of the game easier to read."
                },
                {
                    title: "Speed-focused (low time per attempt)",
                    text: "If you are willing to reset quickly, favor fast starts: click and commit. The time you save can outweigh the extra restarts."
                },
                {
                    title: "Win-rate focused",
                    text: "Avoid forcing early uncertainty. If the board offers multiple safe expansion areas, clear those first and postpone risky guesses."
                },
                {
                    title: "Personal preference",
                    text: "There is no universally best first click. Decide whether you prefer fewer restarts or bigger openings, and choose your start accordingly."
                }
            ]
        },

        takeaway: {
            title: "Rule of thumb",
            paragraphs: [
                "If you’re unsure: click near the middle. It’s the most reliable way to get a readable board quickly."
            ]
        }
    };

    // GUESSING section content
    const guessing = {
        intro: {
            title: "Guessing",
            paragraphs: [
                "Sometimes a board gives you no forced move. When that happens, the goal shifts from deduction to risk management.",
                "Different players optimize for different outcomes: some prefer faster runs with more resets, others maximize win-rate even if it costs time."
            ]
        },

        approaches: {
            title: "Common approaches",
            bullets: [
                {
                    title: "1) Guess immediately when forced",
                    text: "If there is no way to gain new information, making the guess right away can be the most time-efficient approach (even if it loses more often)."
                },
                {
                    title: "2) Delay the guess",
                    text: "Before you commit to a 50/50, check whether the position connects to other unopened areas. Solving elsewhere can reveal constraints that remove the guess."
                },
                {
                    title: "3) Progress-first (often with fewer flags)",
                    text: "Many players over-flag and then chord into a bad assumption. A safer habit is to prioritize opening squares that are clearly safe and keep flags minimal and accurate."
                }
            ]
        },

        examplesRow1: [
            {img: GuessFast5050, caption: "A truly forced 50/50: if nothing else is solvable, a quick guess is a reasonable default."},
            {img: GuessFastVsDelay, caption: "Same situation, two mindsets: guess now versus clear other areas first and hope new info removes the guess."},
            {img: GuessDelayMineCount, caption: "Sometimes the uncertainty is about “how many mines” in a group. Solving elsewhere can pin the remaining count and reduce the ambiguity."},
            {img: GuessNoFlagsOpens, caption: "When you can’t deduce mines, aim for safe progress: open what’s definitely safe, and only flag when it’s certain."}
        ],

        usefulGuess: {
            title: "Make your guess count",
            paragraphs: [
                "Not all guesses are equal. Prefer a move that can simplify the board or prevent a second guess later.",
                "As a rule of thumb: avoid opening a square that, regardless of outcome, leaves you with the same ambiguity somewhere else."
            ]
        },

        examplesRow2: [
            {img: GuessAvoidChainGuess, caption: "Avoid “chain guessing”: choose an order that gives you a chance to react instead of forcing multiple guesses in sequence."},
            {img: GuessUsefulBlueSquare, caption: "Prefer a test move that can collapse possibilities. A side square may resolve the situation more often than a middle square."},
            {img: GuessUsefulSquareMulti5050, caption: "When several 50/50s exist, pick a square that can eliminate multiple uncertainties at once (information gain)."},
            {img: GuessRandomSquareHeuristic, caption: "If you are completely blind: treat any “random click” as a heuristic. In some generators/boards, picking a square likely to open space can be better than poking inside tight clusters."}
        ],

        probability: {
            title: "Probability play (advanced)",
            paragraphs: [
                "A stronger approach is to estimate probabilities from constraints. Local probability (one small region) is often manageable; global probability (the whole board) can get expensive.",
                "If you care about win-rate, this is the direction to go. If you care about time, you’ll typically combine quick heuristics with occasional deeper calculation."
            ]
        },

        examplesRow3: [
            {img: GuessLocal5050, caption: "Local uncertainty example: several independent 50/50-style decisions appear."},
            {img: GuessLocal6633, caption: "Local constraints can also create uneven odds (not always true 50/50)."},
            {img: GuessPrepareToCalculate, caption: "Systematic approach: label unknown squares and enumerate valid mine placements consistent with the numbers."},
            {img: GuessGlobalProbabilities, caption: "Global probability summary: once you enumerate solutions, you can rank moves by risk instead of guessing blindly."}
        ]
    };

    // NO FLAGS section content
    const noFlags = {
        intro: {
            title: "No Flags",
            paragraphs: [
                "You win Minesweeper by opening all safe squares. Flags are only a tool, not a win condition.",
                "The No-Flags style has one goal: maximize safe openings and minimize unnecessary extra clicks."
            ]
        },

        openings: {
            title: "Look for openings, not flags",
            paragraphs: [
                "An opening is an empty area that cascades open. If you click inside an opening, you don’t need to manually click all surrounding numbers — they are often just border information.",
                "Good No-Flags play tends to prioritize moves that can expand an opening or quickly reveal new information."
            ]
        },

        patternVision: {
            title: "“Seeing” mines through patterns",
            paragraphs: [
                "The key skill is not placing flags, but quickly recognizing where mines are likely to be so you can choose a safe square to open.",
                "In practice, players use simple patterns (e.g., 1–1–X and its subsets) to estimate which squares are almost certainly numbers and which squares might lead to an opening."
            ]
        },

        examplesRow1: [
            {img: NF_WinByOpening, caption: "Flagging is optional: you win by opening safe squares. Marking mines can sometimes be purely cosmetic."},
            {img: NF_SeeMines_1, caption: "No-Flags mindset: “read” the mines from the numbers, and instead of flagging, look for a move that opens new safe squares."},
            {img: NF_SeeMines_2, caption: "Patterns help you identify squares that are almost certainly numbers versus squares that could be an opening. The goal is to open an opening candidate."},
            {img: NF_SeeMines_3, caption: "The stronger the constraint (higher numbers / tighter structure), the more it pays to choose a move that unlocks space instead of “painting” flags."}
        ],

        prioritization: {
            title: "Priority: safe squares now, numbers later",
            paragraphs: [
                "When you have multiple safe moves, No-Flags often opens first the ones that could be an opening (or unlock one).",
                "Squares that will very likely be just border numbers are often better left for later."
            ]
        },

        examplesRow2: [
            {img: NF_PrioritizeSafe_1, caption: "Different kinds of safe moves: some are just numbers, others may expand an opening. No-Flags prefers opening candidates."},
            {img: NF_PrioritizeSafe_2, caption: "If you have opening candidates, open them before pure border numbers — you often gain more information with fewer clicks."},
            {img: NF_PrioritizeSafe_3, caption: "When there are multiple routes, choose the one that maximizes the chance of revealing new space."},
            {img: NF_PrioritizeSafe_4, caption: "In uncertain situations (e.g., a local 50/50), avoid opening squares that are guaranteed to be just numbers and look for a move with better impact."}
        ]
    };

    // EFFICIENCY section content
    const efficiency = {
        intro: {
            title: "Minesweeper Efficiency",
            paragraphs: [
                "In general, fewer actions means less time. Efficiency is about reducing unnecessary clicks, chording smartly, and keeping your mouse movement purposeful."
            ]
        },

        rules: {
            title: "Core rules",
            bullets: [
                {
                    title: "1) Don’t flag unless it enables a chord",
                    text: "A flag is only useful if it helps you open additional squares safely (via chording). If nothing can be opened, the flag is usually just extra work."
                },
                {
                    title: "2) Chord where it opens the most",
                    text: "If multiple numbers are adjacent to the same flagged mines, prefer chording the number that clears the largest area."
                },
                {
                    title: "3) Learn the “1.5 click” chord technique",
                    text: "Instead of separate flag + chord actions, combine them: place the flag, start holding the left button, slide onto the number, then release to chord. Done well, it reduces the action count and feels smoother at speed."
                }
            ]
        },

        examplesRuleRow: [
            {img: Eff_NoNeedToFlag, caption: "If a flag does not enable any chord/opening, it likely provides no efficiency benefit."},
            {img: Eff_ChordBestNumber, caption: "Choose the chord that clears the most squares, not the most convenient-looking number."},
            {img: Eff_OnePointFiveClick, caption: "Use the 1.5-click motion: flag, slide, and chord in one continuous sequence."},
            {img: Eff_DontFlagUnchordable, caption: "Avoid spending flags on squares you will never chord against. Invest effort only where it unlocks openings."}
        ],

        switching: {
            title: "Switch between Flagging and No-Flags locally",
            paragraphs: [
                "Efficient play often blends styles. Some positions are faster with chording and flags; others are faster with pure safe opening (No-Flags).",
                "A practical heuristic: lower numbers usually reward chording (more adjacent squares to clear), while higher numbers often have fewer remaining adjacent squares and can be faster to resolve with careful opening."
            ]
        },

        examplesSwitchRow1: [
            {img: Eff_LocalChoice_1, caption: "In some clusters, a No-Flags approach can solve the local area with fewer actions."},
            {img: Eff_LocalChoice_2, caption: "In other clusters, flagging plus a single well-chosen chord can be faster than multiple separate opens."},
            {img: Eff_LocalChoice_3, caption: "Compare action cost: repeated flag+chord versus a direct No-Flags clear."},
            {img: Eff_LocalChoice_4, caption: "Pick the method that minimizes total actions in that exact local shape."}
        ],

        examplesSwitchRow2: [
            {img: Eff_Compare_1, caption: "An efficient flagger aims for a minimal sequence: one flag + one chord whenever possible."},
            {img: Eff_Compare_2, caption: "A No-Flags line often seeks an opening candidate first—sometimes fewer clicks, sometimes more."},
            {img: Eff_Compare_3, caption: "Efficiency is not just speed: it is reducing unnecessary repetitions (extra chords/extra flags)."},
            {img: Eff_Compare_4, caption: "If a route causes repeated chording or repeated guesses, it may be less efficient overall."}
        ],

        mouse: {
            title: "Mouse path and scanning",
            paragraphs: [
                "Move your mouse with intent. New players often chase “easy spots” and waste time jumping around the board.",
                "Strong players solve locally while scanning ahead, so the cursor travels the shortest distance and the next move is already planned."
            ]
        },

        metric: {
            title: "Measuring efficiency: IOE",
            paragraphs: [
                "A common metric is the Index of Efficiency (IOE): total actions divided by 3BV (the minimum number of left-clicks needed to clear a board). Lower IOE is better.",
                "You can practice specifically for efficiency: play slower, focus on fewer actions per situation, and your efficiency tends to carry over into normal speed play."
            ]
        },

        examplesMouseRow: [
            {img: Eff_MouseScan, caption: "Avoid “cursor hopping”. Try to solve what is near your current position before relocating."},
            {img: Eff_PracticeDirection, caption: "If you always solve from the same direction, practice the opposite direction to reduce unnecessary travel."},
            {img: Eff_PathEfficient, caption: "Example of a compact mouse path: most movement is directly tied to opening progress."},
            {img: Eff_PathInefficient, caption: "Example of an inefficient path: excessive back-and-forth movement with little gain per motion."}
        ]
    };

    return (
            <div>
                <Header showBack={true}
                        onNavigate={ctrl.onBack}
                />
                <div style={MinesweeperStrategyStyles.contentStyle}>
                    {/* Title and Subtitle */}
                    <div>
                        <h1 style={MinesweeperStrategyStyles.title}>
                            Minesweeper Game Strategy
                        </h1>
                        <p style={MinesweeperStrategyStyles.subtitle}>
                            This guide is based on the non-profit website "minesweepergame.com" run by "thefinerminer".
                        </p>
                    </div>

                    {/* Pills */}
                    <div style={MinesweeperStrategyStyles.pillsContainer}>
                        <StrategyPill
                                active={tab === "about"}
                                onClick={() => setTab("about")}
                        >
                            <span style={MinesweeperStrategyStyles.pillText}>
                                About
                            </span>
                        </StrategyPill>
                        <StrategyPill
                                active={tab === "basic"}
                                onClick={() => setTab("basic")}
                        >
                            <span style={MinesweeperStrategyStyles.pillText}>
                                Basic Patterns
                            </span>
                        </StrategyPill>
                        <StrategyPill
                                active={tab === "advancedPatterns"}
                                onClick={() => setTab("advancedPatterns")}
                        >
                            <span style={MinesweeperStrategyStyles.pillText}>
                                Advanced Patterns
                            </span>
                        </StrategyPill>
                        <StrategyPill
                                active={tab === "advancedLogic"}
                                onClick={() => setTab("advancedLogic")}
                        >
                            <span style={MinesweeperStrategyStyles.pillText}>
                                Advanced Logic
                            </span>
                        </StrategyPill>
                        <StrategyPill
                                active={tab === "patternReduction"}
                                onClick={() => setTab("patternReduction")}
                        >
                            <span style={MinesweeperStrategyStyles.pillText}>
                                Pattern Reduction
                            </span>
                        </StrategyPill>
                        <StrategyPill
                                active={tab === "first"}
                                onClick={() => setTab("first")}
                        >
                            <span style={MinesweeperStrategyStyles.pillText}>
                                First Click
                            </span>
                        </StrategyPill>
                        <StrategyPill
                                active={tab === "guessing"}
                                onClick={() => setTab("guessing")}
                        >
                            <span style={MinesweeperStrategyStyles.pillText}>
                                Guessing
                            </span>
                        </StrategyPill>
                        <StrategyPill
                                active={tab === "noflags"}
                                onClick={() => setTab("noflags")}
                        >
                            <span style={MinesweeperStrategyStyles.pillText}>
                                No Flags
                            </span>
                        </StrategyPill>
                        <StrategyPill
                                active={tab === "efficiency"}
                                onClick={() => setTab("efficiency")}
                        >
                            <span style={MinesweeperStrategyStyles.pillText}>
                                Efficiency
                            </span>
                        </StrategyPill>
                    </div>

                    {/* ABOUT content */}
                    {tab === "about" && (
                            <>
                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={about.whatIsMinesweeper.title}
                                    >
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                            {about.whatIsMinesweeper.text}
                                        </p>
                                    </StrategyBox>
                                </section>
                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={about.rules.title}
                                    >
                                        {about.rules.paragraphs.map((paragraph, idx) => (
                                                <p style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                   key={idx}
                                                >
                                                    {paragraph}
                                                </p>
                                        ))}
                                    </StrategyBox>

                                    <StrategyBox
                                            transparent={true}
                                    >
                                        <img src={AboutBoardExample}
                                             alt="Minesweeper board example"
                                             style={MinesweeperStrategyStyles.image}
                                        />
                                    </StrategyBox>
                                </section>
                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={about.difficulty.title}
                                    >
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                            {about.difficulty.text}
                                        </p>
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                            {about.difficulty.extra}
                                        </p>
                                    </StrategyBox>
                                </section>
                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            transparent={true}
                                    >
                                        <img src={AboutBoardSizes}
                                             alt="Minesweeper board sizes"
                                             style={MinesweeperStrategyStyles.image}
                                        />
                                    </StrategyBox>
                                </section>
                            </>
                    )}

                    {/* BASIC PATTERNS content */}
                    {tab === "basic" && (
                            <>
                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={basic.exactCount.title}
                                    >
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                            {basic.exactCount.intro}
                                        </p>
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                            {basic.exactCount.text}
                                        </p>
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGrid}>
                                    {basic.exactCount.examples.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Exact count example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>
                                                    {ex.caption}
                                                </p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={basic.chordPreview.title}
                                    >
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                            {basic.chordPreview.text}
                                        </p>
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridTwo}>
                                    {basic.chordPreview.examples.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Chord preview example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>
                                                    {ex.caption}
                                                </p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={basic.fakeCorner.title}
                                    >
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                            {basic.fakeCorner.text}
                                        </p>
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridTwo}>
                                    {basic.fakeCorner.examples.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Fake corner example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>
                                                    {ex.caption}
                                                </p>
                                            </StrategyBox>
                                    ))}
                                </div>
                            </>
                    )}

                    {/* ADVANCED PATTERNS content */}
                    {tab === "advancedPatterns" && (
                            <>
                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={advancedPatterns.intro.title}
                                    >
                                        {advancedPatterns.intro.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={advancedPatterns.famous.title}
                                    >
                                        <div style={MinesweeperStrategyStyles.galleryGridTwo}>
                                            {advancedPatterns.famous.examples.map((ex, idx) => (
                                                    <StrategyBox
                                                            key={idx}
                                                            transparent={true}
                                                    >
                                                        <img
                                                                src={ex.img}
                                                                alt={`Advanced pattern example ${idx + 1}`}
                                                                style={MinesweeperStrategyStyles.image}
                                                        />
                                                        <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                                    </StrategyBox>
                                            ))}
                                        </div>
                                    </StrategyBox>
                                </section>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={advancedPatterns.pattern12x.title}
                                    >
                                        {advancedPatterns.pattern12x.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                {advancedPatterns.pattern12x.groups.map((group, gIdx) => (
                                        <section
                                                key={gIdx}
                                                style={MinesweeperStrategyStyles.section}
                                        >
                                            <StrategyBox
                                                    title={group.title}
                                            >
                                                <div style={MinesweeperStrategyStyles.galleryGridThree}>
                                                    {group.items.map((it, idx) => (
                                                            <StrategyBox
                                                                    key={idx}
                                                                    transparent={true}
                                                            >
                                                                <img
                                                                        src={it.img}
                                                                        alt={`${group.title} ${idx + 1}`}
                                                                        style={MinesweeperStrategyStyles.image}
                                                                />
                                                                <p style={MinesweeperStrategyStyles.figureCaption}>{it.caption}</p>
                                                            </StrategyBox>
                                                    ))}
                                                </div>
                                            </StrategyBox>
                                        </section>
                                ))}

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={advancedPatterns.pattern11x.title}
                                    >
                                        {advancedPatterns.pattern11x.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridTwo}>
                                    {advancedPatterns.pattern11x.examples.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`1-1-X border example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={advancedPatterns.wrap.title}
                                    >
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>{advancedPatterns.wrap.text}</p>
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridTwo}>
                                    {advancedPatterns.wrap.examples.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`1-1-X corner wrap example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>
                            </>
                    )}

                    {/* ADVANCED LOGIC content */}
                    {tab === "advancedLogic" && (
                            <>
                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={advancedLogic.subsetIntro.title}>
                                        {advancedLogic.subsetIntro.paragraphs.map((p, idx) => (
                                                <p
                                                        key={idx}
                                                        style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={advancedLogic.subsetSafe.title} />
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {advancedLogic.subsetSafe.examples.map((ex, idx) => (
                                            <StrategyBox key={idx} transparent={true}>
                                                <img
                                                        src={ex.img}
                                                        alt={`Advanced logic subset example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>
                                                    {ex.caption}
                                                </p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={advancedLogic.mineFirst.title}>
                                        {advancedLogic.mineFirst.paragraphs.map((p, idx) => (
                                                <p
                                                        key={idx}
                                                        style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {advancedLogic.mineFirst.examples.map((ex, idx) => (
                                            <StrategyBox key={idx} transparent={true}>
                                                <img
                                                        src={ex.img}
                                                        alt={`Advanced logic mine-first example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>
                                                    {ex.caption}
                                                </p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={advancedLogic.chains.title}>
                                        {advancedLogic.chains.paragraphs.map((p, idx) => (
                                                <p
                                                        key={idx}
                                                        style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {advancedLogic.chains.examples.map((ex, idx) => (
                                            <StrategyBox key={idx} transparent={true}>
                                                <img
                                                        src={ex.img}
                                                        alt={`Advanced logic chain example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>
                                                    {ex.caption}
                                                </p>
                                            </StrategyBox>
                                    ))}
                                </div>
                            </>
                    )}

                    {/* PATTERN REDUCTION content */}
                    {tab === "patternReduction" && (
                            <>
                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={patternReduction.intro.title}>
                                        {patternReduction.intro.paragraphs.map((p, idx) => (
                                                <p
                                                        key={idx}
                                                        style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title="Reduction examples">
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                            {patternReduction.row1.text}
                                        </p>
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {patternReduction.row1.items.map((it, idx) => (
                                            <StrategyBox key={idx} transparent={true}>
                                                <img
                                                        src={it.img}
                                                        alt={`Pattern reduction example row 1 - ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>
                                                    {it.caption}
                                                </p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title="More complex reductions">
                                        <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                            {patternReduction.row2.text}
                                        </p>
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {patternReduction.row2.items.map((it, idx) => (
                                            <StrategyBox key={idx} transparent={true}>
                                                <img
                                                        src={it.img}
                                                        alt={`Pattern reduction example row 2 - ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>
                                                    {it.caption}
                                                </p>
                                            </StrategyBox>
                                    ))}
                                </div>
                            </>
                    )}

                    {tab === "first" && (
                            <>
                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={firstClick.intro.title}>
                                        {firstClick.intro.paragraphs.map((p, idx) => (
                                                <p key={idx} style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={firstClick.tradeoff.title}>
                                        {firstClick.tradeoff.paragraphs.map((p, idx) => (
                                                <p key={idx} style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={firstClick.systemNotes.title}>
                                        {firstClick.systemNotes.paragraphs.map((p, idx) => (
                                                <p key={idx} style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={firstClick.recommendations.title}>
                                        {firstClick.recommendations.bullets.map((b, idx) => (
                                                <div key={idx} style={MinesweeperStrategyStyles.bulletBlock}>
                                                    <div style={MinesweeperStrategyStyles.bulletTitle}>{b.title}</div>
                                                    <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>{b.text}</p>
                                                </div>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section style={MinesweeperStrategyStyles.section}>
                                    <StrategyBox title={firstClick.takeaway.title}>
                                        {firstClick.takeaway.paragraphs.map((p, idx) => (
                                                <p key={idx} style={MinesweeperStrategyStyles.boxBodyTextStyle}>
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>
                            </>
                    )}


                    {/* GUESSING content */}
                    {tab === "guessing" && (
                            <>
                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={guessing.intro.title}
                                    >
                                        {guessing.intro.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={guessing.approaches.title}
                                    >
                                        {guessing.approaches.bullets.map((b, idx) => (
                                                <div key={idx}
                                                     style={MinesweeperStrategyStyles.bulletBlock}
                                                >
                                                    <div style={MinesweeperStrategyStyles.bulletTitle}>{b.title}</div>
                                                    <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>{b.text}</p>
                                                </div>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {guessing.examplesRow1.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Guessing example row 1 - ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={guessing.usefulGuess.title}
                                    >
                                        {guessing.usefulGuess.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {guessing.examplesRow2.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Guessing example row 2 - ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={guessing.probability.title}
                                    >
                                        {guessing.probability.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {guessing.examplesRow3.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Guessing example row 3 - ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>
                            </>
                    )}

                    {/* NO FLAGS content */}
                    {tab === "noflags" && (
                            <>
                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={noFlags.intro.title}
                                    >
                                        {noFlags.intro.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={noFlags.openings.title}
                                    >
                                        {noFlags.openings.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={noFlags.patternVision.title}
                                    >
                                        {noFlags.patternVision.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {noFlags.examplesRow1.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`No Flags example row 1 - ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={noFlags.prioritization.title}
                                    >
                                        {noFlags.prioritization.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {noFlags.examplesRow2.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`No Flags example row 2 - ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>
                            </>
                    )}


                    {/* EFFICIENCY content */}
                    {tab === "efficiency" && (
                            <>
                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={efficiency.intro.title}
                                    >
                                        {efficiency.intro.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={efficiency.rules.title}
                                    >
                                        {efficiency.rules.bullets.map((b, idx) => (
                                                <div key={idx}
                                                     style={MinesweeperStrategyStyles.bulletBlock}
                                                >
                                                    <div style={MinesweeperStrategyStyles.bulletTitle}>{b.title}</div>
                                                    <p style={MinesweeperStrategyStyles.boxBodyTextStyle}>{b.text}</p>
                                                </div>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {efficiency.examplesRuleRow.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Efficiency rule example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={efficiency.switching.title}
                                    >
                                        {efficiency.switching.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {efficiency.examplesSwitchRow1.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Efficiency switching example row 1 - ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {efficiency.examplesSwitchRow2.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Efficiency switching example row 2 - ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={efficiency.mouse.title}
                                    >
                                        {efficiency.mouse.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <section
                                        style={MinesweeperStrategyStyles.section}
                                >
                                    <StrategyBox
                                            title={efficiency.metric.title}
                                    >
                                        {efficiency.metric.paragraphs.map((p, idx) => (
                                                <p key={idx}
                                                   style={MinesweeperStrategyStyles.boxBodyTextStyle}
                                                >
                                                    {p}
                                                </p>
                                        ))}
                                    </StrategyBox>
                                </section>

                                <div style={MinesweeperStrategyStyles.galleryGridFour}>
                                    {efficiency.examplesMouseRow.map((ex, idx) => (
                                            <StrategyBox
                                                    key={idx}
                                                    transparent={true}
                                            >
                                                <img
                                                        src={ex.img}
                                                        alt={`Efficiency mouse example ${idx + 1}`}
                                                        style={MinesweeperStrategyStyles.image}
                                                />
                                                <p style={MinesweeperStrategyStyles.figureCaption}>{ex.caption}</p>
                                            </StrategyBox>
                                    ))}
                                </div>
                            </>
                    )}
                </div>
            </div>
    );
}
