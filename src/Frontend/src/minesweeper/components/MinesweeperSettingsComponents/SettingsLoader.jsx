import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles";
import Box from "../../../components/Box";
import Loader from "../../../components/Loader";
import Colors from "../../../Colors";

function SettingsLoader() {
    return (
            <Box width={MinesweeperSettingsStyles.boxWidth}
                 height={MinesweeperSettingsStyles.boxHeight}
                 style={MinesweeperSettingsStyles.boxStyle}
            >
                <span><Loader size={60} /></span>
                <span style={{color: Colors.text, fontSize: "20px"}}>Loading default settings...</span>
            </Box>
    );
}

export default SettingsLoader;
