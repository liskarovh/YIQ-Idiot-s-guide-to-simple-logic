/**
 * @file GameLoader.jsx
 * @brief A loading screen component for the Minesweeper game.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import Colors from "../../../Colors";
import Loader from "../../../components/Loader";
import Header from "../../../components/Header";
import Banner from "../../../components/Banner";
import MinesweeperGameStyles from "../../styles/MinesweeperGameStyles";

function GameLoader({onSettings, error}) {
    return (
            <div style={MinesweeperGameStyles.contentStyle}>
                <Header
                        rightLinkTitle={"Settings"}
                        showBack={false}
                        onNavigate={onSettings}
                />

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    gap: "20px"
                }}
                >
                    <Loader size={80} />
                    <span style={{
                        color: Colors.text,
                        fontSize: "35px"
                    }}
                    >
                        Loading game...
                    </span>
                </div>

                <div style={MinesweeperGameStyles.errorWrap}>
                    <Banner
                            type={"error"}
                            error={error}
                    />
                </div>
            </div>
    );
}

export default GameLoader;
