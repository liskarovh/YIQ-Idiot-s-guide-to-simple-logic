import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import Box from "../../components/Box";
import SettingRow from "../../components/SettingsRow";
import ButtonSelect from "../../components/ButtonSelect"
import { useOptionsController } from "../controllers/SettingsController";
import { useSudokuNavigation } from "../controllers/NavigationController";

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
  };

const boxStyle = {
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1.75rem'
}


const boxHeight = '700px'
const boxWidth = '650px'

export function SettingsBox() {
    const {options, handleOptionChange } = useOptionsController()

    return (
        <Box width={boxWidth} height={boxHeight} style={boxStyle}>
             <SettingRow label="Highlight Numbers"
            description="Highlights all cells that contain the selected number."
            control={
                <ButtonSelect options={["ON", "OFF"]}
                    selected={options["highlightNumbers"] ? "ON" : "OFF"}
                    onChange={(e) => handleOptionChange("highlightNumbers", e === "ON")}
                />
            }/>
            <SettingRow label="Highlight Areas"
            description="Highlights rows, columns and blocks of the selected cell. Has no effect in number-first mode"
            control={
                <ButtonSelect options={["ON", "OFF"]}
                    selected={options["highlightAreas"] ? "ON" : "OFF"}
                    onChange={(e) => handleOptionChange("highlightAreas", e === "ON")}
                />
            }/>
            <SettingRow label="Highlight Completed"
            description="Highlights the completed digits"
            control={
                <ButtonSelect options={["ON", "OFF"]}
                    selected={options["highlightCompleted"] ? "ON" : "OFF"}
                    onChange={(e) => handleOptionChange("highlightCompleted", e === "ON")}
                />
            }/>
            <SettingRow label="Check Mistakes"
            description="Highligths mistakes in red. Immediate checks the solution for mistakes, while conflict checks using basic rules."
            control={
                <ButtonSelect options={["Immediate", "Conflict", "OFF"]}
                    selected={options["checkMistakes"]}
                    onChange={(e) => handleOptionChange("checkMistakes", e)}
                />
            }/>
            <SettingRow label="Explain Smart Hints"
            description="Show explanation when using the smart hint"
            control={
                <ButtonSelect options={["ON", "OFF"]}
                    selected={options["explainSmartHints"] ? "ON" : "OFF"}
                    onChange={(e) => handleOptionChange("explainSmartHints", e === "ON")}
                />
            }/>
            <SettingRow label="Timer"
            control={
                <ButtonSelect options={["ON", "OFF"]}
                    selected={options["timer"] ? "ON" : "OFF"}
                    onChange={(e) => handleOptionChange("timer", e === "ON")}
                />
            }/>
            <SettingRow label="Autofill Notes"
            description="Automatically fills in notes for possible candidates at the start of the game"
            control={
                <ButtonSelect options={["ON", "OFF"]}
                    selected={options["autofillHints"] ? "ON" : "OFF"}
                    onChange={(e) => handleOptionChange("autofillHints", e === "ON")}
                />
            }/>
        </Box>
    )
}


function Settings() {
  const {goBack} = useSudokuNavigation()

  return (
    <div style={contentStyle}>
      <Header showBack={true} onNavigate={goBack}/>
      <div style={boxLayoutStyle}>
        <SettingsBox/>
      </div>
    </div>
  );
}

export default Settings;
