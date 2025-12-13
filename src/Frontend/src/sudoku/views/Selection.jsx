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
import useMeasure from "react-use-measure";
import colors from "../../Colors";
import { Play, Settings2, BookOpen, RotateCcw, BrainCircuit, Eye, Palette, Timer } from "lucide-react";

/**
 * REUSABLE ROW COMPONENT
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

function Selection() {
    const { options, handleOptionChange } = useOptionsController();
    const { options: gameInfo } = useGameInfo();

    const ResumeCard = () => {
        if (!gameInfo.mode) return null;

        const formatTime = (totalSeconds) => {
            if (totalSeconds == null) return null;
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        return (
            <Box width="100%" height="auto">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
                    <div style={{ flex: '1 1 0', minWidth: '200px' }}>
                        <h3 style={{ margin: '0 0 clamp(0.3rem, 0.6vw, 0.4rem) 0', color: colors.text_faded, fontSize: 'clamp(0.7rem, 1.3vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resume Session</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(0.4rem, 1vw, 0.6rem)', fontSize: 'clamp(1rem, 2vw, 1.1rem)', color: colors.text_header, alignItems: 'center' }}>
                            <span style={{ fontWeight: '700' }}>{gameInfo.mode}</span>
                            <span style={{ opacity: 0.7, fontSize: 'clamp(0.85rem, 1.7vw, 0.95rem)' }}>{gameInfo.difficulty}</span>
                            <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: 'clamp(0.85rem, 1.7vw, 0.95rem)' }}>
                                {formatTime(gameInfo.timer)}
                            </span>
                        </div>
                    </div>
                    
                    <BoxButton 
                        title="Continue"
                        icon={<Play color={colors.text_header} fill={colors.text_header} size={16} />} 
                        onClick={() => console.log('Continue game')}
                    />
                </div>
            </Box>
        );
    };

    const GameSetupCard = () => {
        return (
            <Box width="100%" height="auto">
                <SectionHeader title="New Game" icon={BrainCircuit} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 1.8vw, 1.2rem)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.4rem, 0.8vw, 0.5rem)' }}>
                        <span style={{ color: colors.text_faded, fontWeight: '600', fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mode</span>
                        <ButtonSelect
                            options={["Learn", "Prebuilt", "Generated"]}
                            selected={options["mode"]}
                            onChange={(e) => handleOptionChange("mode", e)}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.4rem, 0.8vw, 0.5rem)' }}>
                        <span style={{ color: colors.text_faded, fontWeight: '600', fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Difficulty</span>
                        {options["mode"] === "Learn" && (
                            <ButtonSelect 
                                options={["Hidden Singles", "Naked Singles", "Pointing", "Pairs/Triplets", "Fishing", "XY-Wings", "Chains"]}
                                selected={options["learnDifficulty"]}
                                onChange={(e) => handleOptionChange("learnDifficulty", e)}
                            />
                        )}

                        {options["mode"] === "Prebuilt" && (
                            <ButtonSelect 
                                options={["Easy", "Medium", "Hard", "Very Hard", "Expert"]}
                                selected={options["prebuiltDifficulty"]}
                                onChange={(e) => handleOptionChange("prebuiltDifficulty", e)}
                            />
                        )}

                        {options["mode"] !== "Learn" && options["mode"] !== "Prebuilt" && (
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
                            onClick={() => console.log('New game')}
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
                            onClick={() => console.log('Strategy')}
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

    const PreferencesCard = () => {
        return (
            <Box width="100%" height="auto">
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
                        control={
                            <ButtonSelect 
                                options={["Immediate", "Conflict", "OFF"]}
                                selected={options["checkMistakes"]}
                                onChange={(e) => handleOptionChange("checkMistakes", e)}
                                style={{ fontSize: 'clamp(0.75rem, 1.4vw, 0.8rem)' }} 
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
            <Header showBack={true} onNavigate={() => console.log('Navigate back')} />
            
            <div style={{
                padding: 'clamp(70px, 10vh, 80px) clamp(1rem, 2vw, 2rem) clamp(2rem, 5vh, 3rem)',
                margin: '0 auto',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(1rem, 2vw, 1.5rem)',
                    width: '95%'
                }}>
                    <ResumeCard />
                    
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        flexDirection: 'row',
                        gap: 'clamp(1rem, 2vw, 1.5rem)',
                        width: '100%'
                    }}>
                        <div style={{ flex: '1 1 400px', minWidth: 'min(100%, 300px)' }}>
                            <GameSetupCard />
                        </div>
                        <div style={{ flex: '1 1 400px', minWidth: 'min(100%, 300px)' }}>
                            <PreferencesCard />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Selection;
