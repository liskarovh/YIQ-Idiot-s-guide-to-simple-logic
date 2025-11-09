import Header from "../../../components/Header";
import AutoScale from "../../../components/AutoScale";
import PlayButton from "../../../components/PlayButton";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";
import ErrorBanner from "./ErrorBanner";

function SettingsLayout({onBack, leftPanel, rightPanel, onPlay, error, disabled}) {
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
                <div style={MinesweeperSettingsStyles.footer}>
                    <PlayButton
                            onClick={onPlay}
                            disabled={disabled}
                    >
                        Play
                    </PlayButton>
                </div>
                <ErrorBanner
                        error={error}
                />
            </div>
    );
}

export default SettingsLayout;
