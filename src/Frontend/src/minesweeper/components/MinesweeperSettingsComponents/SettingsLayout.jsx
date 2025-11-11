import Header from "../../../components/Header";
import AutoScale from "../../../components/AutoScale";
import BoxButton from "../../../components/BoxButton";
import {PlayIcon} from "../../../assets/icons/PlayIcon.jsx";
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
                    <BoxButton
                            title={"Play"}
                    icon={<PlayIcon />}
                            disabled={disabled}
                            onClick={onPlay}
                    />
                </div>
                <ErrorBanner
                        error={error}
                />
            </div>
    );
}

export default SettingsLayout;
