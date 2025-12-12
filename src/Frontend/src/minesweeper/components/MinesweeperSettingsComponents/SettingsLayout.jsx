import Header from "../../../components/Header";
import AutoScale from "../../../components/AutoScale";
import BoxButton from "../../../components/BoxButton";
import {PlayIcon} from "../../../assets/icons/PlayIcon.jsx";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";
import Banner from "./Banner";
import {RestartIcon} from "../../../assets/icons/RestartIcon";

function SettingsLayout({leftPanel, rightPanel, disabled, onBack, onPlay, fromGame, changesDetected, error}) {
    const playButtonTitle = (fromGame && changesDetected) ? "Start new game"
                                                          : fromGame ? "Continue"
                                                                     : "Play";

    const playButtonIcon = (fromGame && changesDetected) ? <RestartIcon />
                                                          : <PlayIcon />;

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
                    <BoxButton
                            title={playButtonTitle}
                            icon={playButtonIcon}
                            disabled={disabled}
                            onClick={onPlay}
                    />
                </div>
                <Banner
                        error={error}
                />
                <Banner
                        error={changesDetected}
                />
            </div>
    );
}

export default SettingsLayout;
