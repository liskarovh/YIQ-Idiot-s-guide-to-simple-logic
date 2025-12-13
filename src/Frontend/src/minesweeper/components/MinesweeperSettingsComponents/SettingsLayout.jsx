import React, {useRef, useState, useEffect} from "react";
import Header from "../../../components/Header";
import AutoScale from "../../../components/AutoScale";
import BoxButton from "../../../components/BoxButton";
import {PlayIcon} from "../../../assets/icons/PlayIcon.jsx";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";
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

    // Play button style
    const playButtonTitle = (fromGame && typeof changesDetected === "string") ? "Start new game"
                                                                              : fromGame ? "Continue"
                                                                                         : "Play";

    const playButtonIcon = (fromGame && typeof changesDetected === "string") ?
                           <RestartIcon /> :
                           <PlayIcon />;

    // Layout stacking detection
    const layoutRef = useRef(null);
    const leftContainerRef = useRef(null);
    const rightContainerRef = useRef(null);
    const [stacked, setStacked] = useState(false);

    // Check if the panels are stacked vertically
    useEffect(() => {
        const element = layoutRef.current;
        if(!element) {
            return;
        }

        // Function to check if children are stacked
        const checkStacked = () => {
            // Get only Element children (skip text nodes)
            const children = Array.from(element.children).filter(child => child instanceof Element);
            if(children.length < 2) {
                setStacked(false);
                return;
            }

            // Check the top positions of the children
            const firstTop = children[0].getBoundingClientRect().top;
            const isStacked = children.some((child, idx) => (idx > 0) && (Math.abs(child.getBoundingClientRect().top - firstTop) > 2));
            setStacked(isStacked);
        };

        // Initial check
        checkStacked();

        // Observe resize events
        let resizeObserver;
        if(typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(checkStacked);
            resizeObserver.observe(element);
        }

        // Also listen to window resize and orientation change
        window.addEventListener("resize", checkStacked);
        window.addEventListener("orientationchange", checkStacked);

        return () => {
            // Cleanup
            if(resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener("resize", checkStacked);
            window.removeEventListener("orientationchange", checkStacked);
        };
    }, []);

    // AutoScale options for panels
    const panelAutoScaleOptions = {
        baseWidth: MinesweeperSettingsStyles.boxAutoscaleWidth,
        baseHeight: MinesweeperSettingsStyles.boxAutoscaleHeight,
        maxScale: MinesweeperSettingsStyles.boxAutoscaleMaxScale,
        minScale: MinesweeperSettingsStyles.boxAutoscaleMinScale,
        center: MinesweeperSettingsStyles.boxAutoscaleCenter,
        fit: stacked ? "width" : "contain",
        offset: stacked ? {width: 6, height: 0, unit: "rem"} : undefined,
        style: {marginRight: stacked ? "1.35rem" : 0}
    };

    return (
            <div style={MinesweeperSettingsStyles.contentStyle}>
                <Header showBack={false}
                        rightLinkTitle={playButtonTitle}
                        onNavigate={onBack}
                />

                <div style={MinesweeperSettingsStyles.boxLayoutStyle}
                     ref={layoutRef}
                >
                    <div ref={leftContainerRef}>
                        <AutoScale {...panelAutoScaleOptions}
                                   {...{targetRef: leftContainerRef}}
                        >
                            {leftPanel}
                        </AutoScale>
                    </div>

                    <div ref={rightContainerRef}>
                        <AutoScale {...panelAutoScaleOptions}
                                   {...{targetRef: rightContainerRef}}
                        >
                            {rightPanel}
                        </AutoScale>
                    </div>
                </div>

                <div style={MinesweeperSettingsStyles.footer}>
                    <BoxButton
                            title={playButtonTitle}
                            icon={playButtonIcon}
                            disabled={disabled}
                            onClick={onPlay}
                    />

                    {fromGame &&
                     <BoxButton
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
