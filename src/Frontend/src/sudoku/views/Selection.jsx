import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import Box from "../../components/Box";
import SettingRow from "../../components/SettingsRow";
import ButtonSelect from "../../components/ButtonSelect"
import { useOptionsController } from "../controllers/SettingsController";
import IconTextButton from "../../components/IconTextButton";
import { useSudokuNavigation } from "../controllers/NavigationController";
import { SettingsBox } from "./Settings";
import { useNewGame } from "../controllers/GameController";
import { useGameInfo } from "../models/GameInfoModel";

const contentStyle = {
    padding: '5rem 2rem 2rem 2rem',
}

const boxLayoutStyle = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    textAlign: 'center',
    padding: '2rem 2rem',
    gap: '6rem',
}

const boxStyle = {
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1.75rem'
}

const buttonsLayoutStyle = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '6rem',
}

const boxHeight = '600px'
const boxWidth = '650px'

function ContinuePanel() {
    const { options: gameInfo } = useGameInfo();
    const { setRelativeView } = useSudokuNavigation();

    // If no game mode is set, it implies no active/saved game
    if (!gameInfo.mode) return null;

    const formatTime = (totalSeconds) => {
        if (totalSeconds == null) return "00:00";
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return (
        <Box width={boxWidth} height="auto" style={{...boxStyle, paddingBottom: '2rem', justifyContent: 'center'}}>
            <h2 style={{margin: '0 0 1rem 0'}}>Resume Game</h2>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '1.2rem', marginBottom: '1rem'}}>
                <div>
                    <span style={{opacity: 0.6, marginRight: '10px'}}>Mode:</span> 
                    <strong>{gameInfo.mode}</strong>
                </div>
                <div>
                    <span style={{opacity: 0.6, marginRight: '10px'}}>Difficulty:</span> 
                    <strong>{gameInfo.difficulty}</strong>
                </div>
                <div>
                    <span style={{opacity: 0.6, marginRight: '10px'}}>Time:</span> 
                    <strong>{formatTime(gameInfo.timer)}</strong>
                </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'center'}}>
                <IconTextButton 
                    text="Continue"
                    onClick={() => setRelativeView("Game")}
                    style={{minWidth: '250px'}}
                />
            </div>
        </Box>
    );
}

function GameBasics() {
    const {options, handleOptionChange } = useOptionsController()

    function Mode() {
        return (
            <SettingRow label="Mode" control={
                <ButtonSelect
                options={["Learn", "Prebuilt", "Generated"]}
                selected={options["mode"]}
                onChange={(e) => {
                    handleOptionChange("mode", e)
                }}/>
            }/>
        )
    }

    switch(options["mode"]) {
        case "Learn":
            return (
                <Box width={boxWidth} height={boxHeight} style={boxStyle}>
                    <Mode/>
                    <SettingRow label="Technique" control={
                        <ButtonSelect options={["Hidden Singles", "Naked Singles", "Pointing and Claiming",
                            "Pairs and Triplets", "Fishing", "XY-Wings", "Rectangles", "Chains"]}
                        selected={options["learnDifficulty"]}
                        onChange={(e) => handleOptionChange("learnDifficulty", e)}
                        />
                    }/>
                </Box>
            );
        case "Prebuilt":
            return (
                <Box width={boxWidth} height={boxHeight} style={boxStyle}>
                    <Mode/>
                    <SettingRow label="Difficulty" control={
                        <ButtonSelect options={["Easy", "Medium", "Hard", "Very Hard", "Expert", "Extreme"]}
                        selected={options["prebuiltDifficulty"]}
                        onChange={(e) => handleOptionChange("prebuiltDifficulty", e)}
                        />
                    }/>
                </Box>
            );
        default:
            return (
                <Box width={boxWidth} height={boxHeight} style={boxStyle}>
                    <Mode/>
                    <SettingRow label="Difficulty" control={
                        <ButtonSelect options={["Basic", "Easy", "Medium", "Hard", "Very Hard", "Expert", "Extreme"]}
                        selected={options["generatedDifficulty"]}
                        onChange={(e) => handleOptionChange("generatedDifficulty", e)}
                        />
                    }/>
                </Box>
            );
    }
}

function Selection() {
  const navigate = useNavigate();
  const { setRelativeView } = useSudokuNavigation()
  const { newGame } = useNewGame()

  return (
    <div style={contentStyle}>
      <Header showBack={true} onNavigate={() => navigate("/")}/>
      <div style={boxLayoutStyle}>
        <ContinuePanel />
        <GameBasics/>
        <SettingsBox/>
      </div>
      <div style={buttonsLayoutStyle}>
            <IconTextButton text="New Game"
                onClick={newGame}
                style={{minWidth: '250px'}}
            />
            <IconTextButton text="Strategy"
                onClick={() => setRelativeView("Strategy")}
                style={{minWidth: '250px'}}
            />
      </div>
    </div>
  );
}

export default Selection;