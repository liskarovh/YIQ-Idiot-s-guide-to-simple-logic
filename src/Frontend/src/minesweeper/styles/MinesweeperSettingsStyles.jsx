const boxWidth = 650;
const boxHeight = 450;

const boxAutoscaleWidth = boxWidth + 100;
const boxAutoscaleHeight = boxHeight + 100;
const boxAutoscaleMaxScale = 1;
const boxAutoscaleMinScale = 0.5;
const boxAutoscaleCenter = true;

const settingsRowInline = true;

const numberFieldMaxDigits = 3;

const sliderGameplayPanelWidth = 240;
const sliderGameBasicsPanelWidth = 295;

const boxStyle = {
    display: "flex",
    flexDirection: "column",
    maxWidth: boxWidth,
    maxHeight: boxHeight,
    gap: "1.75rem"
};

const boxLayoutStyle = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    padding: "0rem 0rem 0rem 2rem",
    flexWrap: "wrap",
    textAlign: "center",
    alignItems: "flex-start"
};

const contentStyle = {
    padding: "7rem 2rem 2rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
};

const sliderAndNumberFieldStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12
};

const footer = {
    display: "flex",
    justifyContent: "center",
    marginTop: "2rem",
    width: "100%"
};

const MinesweeperSettingsStyles = {
    // sizes
    boxWidth,
    boxHeight,

    // autoscale
    boxAutoscaleWidth,
    boxAutoscaleHeight,
    boxAutoscaleMaxScale,
    boxAutoscaleMinScale,
    boxAutoscaleCenter,

    // flags
    settingsRowInline,
    numberFieldMaxDigits,

    // panel widths
    sliderGameplayPanelWidth,
    sliderGameBasicsPanelWidth,

    // style objects
    boxStyle,
    boxLayoutStyle,
    contentStyle,
    sliderAndNumberFieldStyle,
    footer
};

export default MinesweeperSettingsStyles;
