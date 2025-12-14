/**
 * @file Selection.jsx
 * @brief Main game selection screen component, handling new game setup, resuming, and user preferences.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React from "react";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import Box from "../../components/Box";
import ButtonSelect from "../../components/ButtonSelect";
import ToggleButton from "../../components/ToggleButton"; 
import BoxButton from "../../components/BoxButton"; 
import { useOptionsController } from "../controllers/SettingsController";
import { useSudokuNavigation } from "../controllers/NavigationController";
import { useNewGame } from "../controllers/GameController";
import { useGameInfo } from "../models/GameInfoModel";
import colors from "../../Colors";
import { Play, Settings2, BookOpen, RotateCcw, BrainCircuit, Eye, Palette, Timer } from "lucide-react";

/**
 * @brief Reusable component for a control row displaying a label, description, icon, and an interactive control element.
 * * @param {object} props - The component props.
 * @param {string} props.label - The main text label.
 * @param {string} props.description - Secondary descriptive text.
 * @param {JSX.Element} props.control - The interactive control element (e.g., ToggleButton, ButtonSelect).
 * @param {LucideIcon} props.icon - Lucide icon component.
 * @returns {JSX.Element} The ControlRow component.
 */
function ControlRow({ label, description, control, icon: Icon }) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "clamp(0.4rem, 1vw, 0.6rem) 0",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            gap: 'clamp(0.5rem, 1.5vw, 1rem)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.2vw, 10px)', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                {Icon && <Icon size={18} color={colors.text} style={{ flexShrink: 0 }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontSize: 'clamp(0.8rem, 1.6vw, 0.9rem)', fontWeight: "600", color: colors.text_header, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                    {description && (
                        <span style={{ fontSize: 'clamp(0.7rem, 1.3vw, 0.75rem)', color: colors.text_faded, lineHeight: 1.2 }}>
                            {description}
                        </span>
                    )}
                </div>
            </div>
            <div style={{ flexShrink: 0 }}>
                {control}
            </div>
        </div>
    );
}

/**
 * @brief Component for rendering a section title within a card.
 * * @param {object} props - The component props.
 * @param {string} props.title - The title text.
 * @param {LucideIcon} props.icon - Lucide icon component.
 * @returns {JSX.Element} The SectionHeader component.
 */
function SectionHeader({ title, icon: Icon }) {
    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'clamp(8px, 1.2vw, 10px)', 
            marginBottom: 'clamp(0.8rem, 1.5vw, 1rem)', 
            paddingBottom: 'clamp(0.4rem, 1vw, 0.6rem)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
            {Icon && <Icon size={22} color={colors.text_header} />}
            <h3 style={{ margin: 0, color: colors.text_header, fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', fontWeight: '700' }}>{title}</h3>
        </div>
    );
}

/**
 * @brief Main component for the Game Selection and Settings screen.
 * @returns {JSX.Element} The Selection component.
 */
function Selection() {
    const navigate = useNavigate();
    const {newGame} = useNewGame();
    const {goBack, setRelativeView, absoluteSetView} = useSudokuNavigation();
    /** @brief Hook to manage user-selected game options/preferences. */
    const { options, handleOptionChange } = useOptionsController();
    /** @brief Hook to retrieve information about the currently active game. */
    const { options: gameInfo } = useGameInfo();

    /**
     * @brief Card component to display and allow resuming of a previously started game.
     * @returns {JSX.Element | null} The ResumeCard component or null if no active game exists.
     */
    const ResumeCard = () => {
        if (!gameInfo.mode) return null;

        /**
         * @brief Formats total seconds into MM:SS string.
         * @param {number} totalSeconds - The total time in seconds.
         * @returns {string | null} Formatted time string or null.
         */
        const formatTime = (totalSeconds) => {
            if (totalSeconds == null) return null;
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        return (
            <Box width="100%" height="auto" style={{ boxSizing: "border-box", padding: '1rem 2rem 1rem 2rem'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
                    <div style={{ flex: '1 1 0', minWidth: '200px' }}>
                        <h3 style={{ margin: '0 0 clamp(0.3rem, 0.6vw, 0.4rem) 0', color: colors.text_faded, fontSize: 'clamp(0.7rem, 1.3vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resume Session</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(0.4rem, 1vw, 0.6rem)', fontSize: 'clamp(1rem, 2vw, 1.1rem)', color: colors.text_header, alignItems: 'center' }}>
                            <span style={{ fontWeight: '700' }}>{gameInfo.mode}</span>
                            <span style={{ opacity: 0.7, fontSize: 'clamp(0.85rem, 1.7vw, 0.95rem)' }}>{gameInfo.difficulty}</span>
                            
                            {gameInfo.timer != null && (
                                <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: 'clamp(0.85rem, 1.7vw, 0.95rem)' }}>
                                    {formatTime(gameInfo.timer)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Smaller Continue Button */}
                    <BoxButton 
                        title="Continue"
                        icon={<Play color={colors.text_header} fill={colors.text_header} size={14} />} 
                        onClick={() => absoluteSetView('Game')}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            gap: '0.4rem',
                            minWidth: 'auto'
                        }}
                    />
                </div>
            </Box>
        );
    };

    /**
     * @brief Card component for selecting the mode and difficulty of a new game.
     * @returns {JSX.Element} The GameSetupCard component.
     */
    const GameSetupCard = () => {
        /**
         * @brief Provides a description for the selected game mode.
         * @param {string} mode - The selected game mode.
         * @returns {string} The description.
         */
        const getModeDescription = (mode) => {
            switch(mode) {
                case "Learn": return "Master specific techniques step-by-step.";
                case "Prebuilt": return "Curated puzzles with calibrated difficulty.";
                case "Generated": return "Infinite randomized puzzles.";
                default: return "";
            }
        };

        return (
            <Box width="100%" height="auto" style={{ boxSizing: "border-box" }}>
                <SectionHeader title="New Game" icon={BrainCircuit} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 1.8vw, 1.2rem)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.4rem, 0.8vw, 0.5rem)' }}>
                        <span style={{ color: colors.text_faded, fontWeight: '600', fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mode</span>
                        <ButtonSelect
                            options={["Learn", "Prebuilt", "Generated"]}
                            selected={options["mode"]}
                            onChange={(e) => handleOptionChange("mode", e)}
                        />
                         <span style={{ 
                             fontSize: 'clamp(0.7rem, 1.3vw, 0.75rem)', 
                             color: colors.text_faded, 
                             marginLeft: '0.2rem',
                             opacity: 0.8
                        }}>
                            {getModeDescription(options["mode"])}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.4rem, 0.8vw, 0.5rem)' }}>
                        <span style={{ color: colors.text_faded, fontWeight: '600', fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Difficulty</span>
                        {options["mode"] === "Learn" && (
                            <ButtonSelect 
                                options={["Hidden Singles", "Naked Singles", "Pointing and Claiming", "Pairs and Triplets", "Fishing", "XY-Wings", "Rectangles", "Chains"]}
                                selected={options["learnDifficulty"]}
                                onChange={(e) => handleOptionChange("learnDifficulty", e)}
                            />
                        )}

                        {options["mode"] === "Prebuilt" && (
                            <ButtonSelect 
                                options={["Easy", "Medium", "Hard", "Very Hard", "Expert", "Extreme"]}
                                selected={options["prebuiltDifficulty"]}
                                onChange={(e) => handleOptionChange("prebuiltDifficulty", e)}
                            />
                        )}

                        {options["mode"] === "Generated" && (
                            <ButtonSelect 
                                options={["Basic", "Easy", "Medium", "Hard", "Very Hard", "Expert", "Extreme"]}
                                selected={options["generatedDifficulty"]}
                                onChange={(e) => handleOptionChange("generatedDifficulty", e)}
                            />
                        )}
                    </div>

                    <div style={{ marginTop: 'clamp(0.3rem, 0.8vw, 0.5rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 1vw, 0.6rem)' }}>
                        <BoxButton 
                            title="Start New Game" 
                            icon={<RotateCcw color={colors.primary} size={18} />}
                            onClick={() => {
                                newGame();
                                absoluteSetView('Game');
                            }}
                            style={{ 
                                width: '100%',
                                background: colors.text_header,
                                color: colors.primary,
                                fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                                padding: 'clamp(10px, 1.8vw, 12px)',
                                fontWeight: '800'
                            }}
                        />
                        <BoxButton 
                            title="Strategy Guide" 
                            icon={<BookOpen color={colors.text_header} size={18} />} 
                            onClick={() => setRelativeView('Strategy')}
                            style={{ 
                                width: '100%',
                                background: 'transparent', 
                                border: '2px solid rgba(255,255,255,0.2)', 
                                color: colors.text_header,
                                fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                                padding: 'clamp(10px, 1.8vw, 12px)',
                                fontWeight: '700'
                            }}
                        />
                    </div>
                </div>
            </Box>
        );
    };

    /**
     * @brief Card component for setting visual and assistance preferences.
     * @returns {JSX.Element} The PreferencesCard component.
     */
    const PreferencesCard = () => {
        /**
         * @brief Provides a description for the selected error checking type.
         * @param {string} type - The selected error checking type.
         * @returns {string} The description.
         */
        const getErrorCheckDescription = (type) => {
            switch(type) {
                case "Immediate": return "Checks against the solution.";
                case "Conflict": return "Checks for direct rule breaks.";
                case "OFF": return "No automatic checking.";
                default: return "";
            }
        };

        return (
            <Box width="100%" height="auto" style={{ boxSizing: "border-box" }}>
                <SectionHeader title="Preferences" icon={Settings2} />

                <div>
                    <h4 style={{ margin: `0 0 clamp(0.4rem, 0.8vw, 0.5rem) 0`, color: colors.text_faded, fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>Visual</h4>
                    <ControlRow 
                        label="Highlight Numbers" 
                        description="Highlight cells with selected number"
                        icon={Eye}
                        control={
                            <ToggleButton 
                                checked={options["highlightNumbers"]} 
                                onChange={(v) => handleOptionChange("highlightNumbers", v)} 
                            />
                        }
                    />
                    <ControlRow 
                        label="Highlight Areas" 
                        description="Highlight row, column and box"
                        icon={Palette}
                        control={
                            <ToggleButton 
                                checked={options["highlightAreas"]} 
                                onChange={(v) => handleOptionChange("highlightAreas", v)} 
                            />
                        }
                    />
                    <ControlRow 
                        label="Highlight Completed" 
                        description="Dim completed numbers"
                        control={
                            <ToggleButton 
                                checked={options["highlightCompleted"]} 
                                onChange={(v) => handleOptionChange("highlightCompleted", v)} 
                            />
                        }
                    />
                </div>

                <div>
                    <h4 style={{ margin: `clamp(0.8rem, 1.5vw, 1rem) 0 clamp(0.4rem, 0.8vw, 0.5rem) 0`, color: colors.text_faded, fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>Assistance</h4>
                     <ControlRow 
                        label="Explain Hints" 
                        description="Show reasoning for hints"
                        control={
                            <ToggleButton 
                                checked={options["explainSmartHints"]} 
                                onChange={(v) => handleOptionChange("explainSmartHints", v)} 
                            />
                        }
                    />
                     <ControlRow 
                        label="Error Checking" 
                        description={getErrorCheckDescription(options["checkMistakes"])}
                        control={
                            <ButtonSelect 
                                options={["Immediate", "Conflict", "OFF"]}
                                selected={options["checkMistakes"]}
                                onChange={(e) => handleOptionChange("checkMistakes", e)}
                            />
                        }
                    />
                </div>

                <div>
                    <h4 style={{ margin: `clamp(0.8rem, 1.5vw, 1rem) 0 clamp(0.4rem, 0.8vw, 0.5rem) 0`, color: colors.text_faded, fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>System</h4>
                    <ControlRow 
                        label="Timer" 
                        icon={Timer}
                        control={
                            <ToggleButton 
                                checked={options["timer"]} 
                                onChange={(v) => handleOptionChange("timer", v)} 
                            />
                        }
                    />
                </div>
            </Box>
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'auto'
        }}>
            <Header rightLinkTitle='Home' onNavigate={() => navigate('/')} />
            
            <div style={{
                padding: 'clamp(70px, 10vh, 80px) clamp(1rem, 2vw, 2rem) clamp(2rem, 5vh, 3rem)',
                margin: '0 auto',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(1rem, 2vw, 1.5rem)',
                    width: '100%', 
                    maxWidth: '1600px',
                    margin: '0 auto'
                }}>
                    <ResumeCard />
                    
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        flexDirection: 'row',
                        gap: 'clamp(1.5rem, 3vw, 2.5rem)',
                        width: '100%'
                    }}>
                        <div style={{ 
                            flex: '1 1 400px', 
                            minWidth: 'min(100%, 300px)', 
                            maxWidth: '100%'
                        }}>
                            <GameSetupCard />
                        </div>
                        <div style={{ 
                            flex: '1 1 400px', 
                            minWidth: 'min(100%, 300px)',
                            maxWidth: '100%'
                        }}>
                            <PreferencesCard />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Selection;