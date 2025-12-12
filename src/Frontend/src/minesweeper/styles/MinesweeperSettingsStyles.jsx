const boxWidth = 650;
const boxHeight = 450;

const MinesweeperSettingsStyles = {
    // Box sizes
    boxWidth: boxWidth,
    boxHeight: boxHeight,

    // Autoscale preset
    boxAutoscaleWidth: boxWidth + 100,
    boxAutoscaleHeight: boxHeight + 100,
    boxAutoscaleMaxScale: 0.8,
    boxAutoscaleMinScale: 0.5,

    // Settings row sizes and flags
    boxAutoscaleCenter: true,
    settingsRowInline: true,
    sliderGameplayPanelWidth: 240,
    sliderGameBasicsPanelWidth: 295,
    numberFieldMaxDigits: 3,

    // Object styles
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
    contentStyle: {
        padding: "7rem 2rem 2rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    },
    sliderAndNumberFieldStyle: {
        display: "flex",
        alignItems: "center",
        gap: 12
    },
    footer: {
        display: "flex",
        justifyContent: "center",
        marginTop: "2rem",
        width: "100%"
    },
    infoText: {
        fontSize: 12,
        opacity: 0.8
    },
    errorBanner: {
        border: "1px solid #f44",
        background: "#fee",
        color: "#900",
        borderRadius: 8,
        padding: 12
    }
};

export default MinesweeperSettingsStyles;
