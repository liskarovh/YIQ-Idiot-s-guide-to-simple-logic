import React from "react";
import Header from "../../../components/Header";
import MinesweeperBoxButton from "../MinesweeperCommonComponents/MinesweeperBoxButton";
import {PlayIcon} from "../../../assets/icons/PlayIcon";
import Banner from "../../../components/Banner";
import {RestartIcon} from "../../../assets/icons/RestartIcon";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles";

function SettingsLayout({
                            leftPanel,
                            rightPanel,
                            disabled,
                            onBack,
                            onPlay,
                            onResetOriginalSettings = null,
                            fromGame,
                            changesDetected,
                            error
                        }) {

    const playButtonTitle = (fromGame && typeof changesDetected === "string") ? "Start new game"
                                                                              : fromGame ? "Continue"
                                                                                         : "Play";

    const playButtonIcon = (fromGame && typeof changesDetected === "string") ?
                           <RestartIcon /> :
                           <PlayIcon />;

    return (
            <div style={MinesweeperSettingsStyles.contentStyle}>
                <Header showBack={false}
                        rightLinkTitle={playButtonTitle === "Play" ? "Back" : playButtonTitle}
                        onNavigate={onBack}
                />

                <div style={MinesweeperSettingsStyles.boxLayoutStyle}>
                    {leftPanel}
                    {rightPanel}
                </div>

                <div style={MinesweeperSettingsStyles.footer}>
                    <MinesweeperBoxButton
                            title={playButtonTitle}
                            icon={playButtonIcon}
                            disabled={disabled}
                            onClick={onPlay}
                    />

                    {fromGame &&
                     <MinesweeperBoxButton
                             title={"Reset to Original Settings"}
                             disabled={!fromGame || !changesDetected}
                             onClick={onResetOriginalSettings}
                             style={MinesweeperSettingsStyles.resetButton}
                     />}
                </div>

                <Banner type={"error"}
                        error={error}
                />

                <Banner type={"warning"}
                        customMessage={typeof changesDetected === "string" ? changesDetected : undefined}
                        style={MinesweeperSettingsStyles.warningBanner}
                />
            </div>
    );
}

export default SettingsLayout;
