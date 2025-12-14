import React from "react";
import Header from "../../../components/Header";
import MinesweeperBoxButton from "../MinesweeperCommonComponents/MinesweeperBoxButton";
import {PlayIcon} from "../../../assets/icons/PlayIcon";
import Banner from "../../../components/Banner";
import {RestartIcon} from "../../../assets/icons/RestartIcon";

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

    const contentStyle = {
        padding: 'clamp(60px, 10vw, 112px) clamp(16px, 3vw, 32px) clamp(16px, 3vw, 32px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'clamp(16px, 2vw, 24px)'
    };

    const boxLayoutStyle = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        textAlign: 'center',
        alignItems: 'stretch',
        gap: 'clamp(20px, 3vw, 32px)',
        width: '100%',
        maxWidth: '1400px'
    };

    const footer = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(12px, 1.5vw, 16px)',
        marginTop: 'clamp(8px, 1vw, 12px)',
        width: '100%'
    };

    const resetButton = {
        fontSize: 'clamp(14px, 2vw, 16px)',
        padding: 'clamp(5px, 0.8vw, 6px) clamp(10px, 1.5vw, 12px)',
        height: 'auto'
    };

    const warningBanner = {
        marginTop: 'clamp(12px, 1.5vw, 16px)',
        textAlign: 'center'
    };

    return (
            <div style={contentStyle}>
                <Header showBack={false}
                        rightLinkTitle={playButtonTitle === "Play" ? "Back" : playButtonTitle}
                        onNavigate={onBack}
                />

                <div style={boxLayoutStyle}>
                    {leftPanel}
                    {rightPanel}
                </div>

                <div style={footer}>
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
                             style={resetButton}
                     />}
                </div>

                <Banner type={"error"}
                        error={error}
                />

                <Banner type={"warning"}
                        customMessage={typeof changesDetected === "string" ? changesDetected : undefined}
                        style={warningBanner}
                />
            </div>
    );
}

export default SettingsLayout;
