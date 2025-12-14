const boxWidth = 650;
const boxHeight = 450;

const MinesweeperSettingsStyles = {
    // Box sizes
    boxWidth: boxWidth,
    boxHeight: boxHeight,

    // Autoscale preset
    boxAutoscaleWidth: boxWidth + 100,
    boxAutoscaleHeight: boxHeight + 100,
    boxAutoscaleMaxScale: 1,
    boxAutoscaleMinScale: 0.6,

    // Settings row sizes and flags
    boxAutoscaleCenter: true,
    settingsRowInline: true,
    sliderGameplayPanelWidth: 240,
    sliderGameBasicsPanelWidth: 295,
    numberFieldMaxDigits: 3,

    // Object styles
    contentStyle: {
        padding: "7rem 2rem 2rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    },
    boxLayoutStyle: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        padding: "0rem 0rem 0rem 2rem",
        flexWrap: "wrap",
        textAlign: "center",
        alignItems: "flex-start"
    },
    boxStyle: {
        display: "flex",
        flexDirection: "column",
        maxWidth: boxWidth,
        maxHeight: boxHeight,
        gap: "1.75rem"
    },
    sliderAndNumberFieldStyle: {
        display: "flex",
        alignItems: "center",
        gap: 12
    },
    footer: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        marginTop: "1rem",
        width: "100%"
    },
    infoText: {
        fontSize: 12,
        opacity: 0.8
    },
    warningBanner: {
        marginTop: "1rem",
        textAlign: "center"
    },
    resetButton: {
        fontSize: 16,
        padding: "6px 12px",
        height: 34
    }
};

export default MinesweeperSettingsStyles;
