import Header from "../../../components/Header";
import AutoScale from "../../../components/AutoScale";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";
import ErrorBanner from "../../components/MinesweeperSettingsComponents/ErrorBanner";

function GameLayout({onBack, leftPanel, rightPanel, error}) {
    return (
            <div style={MinesweeperSettingsStyles.contentStyle}>
                <Header showBack={true}
                        onNavigate={onBack}
                />
                <div style={MinesweeperSettingsStyles.boxLayoutStyle}>
                    <AutoScale
                            baseWidth={MinesweeperSettingsStyles.boxAutoscaleWidth}
                            baseHeight={MinesweeperSettingsStyles.boxAutoscaleHeight}
                            maxScale={MinesweeperSettingsStyles.boxAutoscaleMaxScale}
                            minScale={MinesweeperSettingsStyles.boxAutoscaleMinScale}
                            center={MinesweeperSettingsStyles.boxAutoscaleCenter}
                    >
                        {leftPanel}
                    </AutoScale>
                    <AutoScale
                            baseWidth={MinesweeperSettingsStyles.boxAutoscaleWidth}
                            baseHeight={MinesweeperSettingsStyles.boxAutoscaleHeight}
                            maxScale={MinesweeperSettingsStyles.boxAutoscaleMaxScale}
                            minScale={MinesweeperSettingsStyles.boxAutoscaleMinScale}
                            center={MinesweeperSettingsStyles.boxAutoscaleCenter}
                    >
                        {rightPanel}
                    </AutoScale>
                </div>
                <ErrorBanner error={error} />
            </div>
    );
}

export default GameLayout;
