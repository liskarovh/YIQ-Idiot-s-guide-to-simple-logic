/**
 * @file MinesweeperSettingsStyles.jsx
 * @brief Styles for the Minesweeper settings components.
 *
 * @author Jan Kalina \<xkalinj00>
 */

const MinesweeperSettingsStyles = {
    // Settings row sizes and flags
    settingsRowInline: true,

    // Object styles
    contentStyle: {
        padding: 'clamp(60px, 10vw, 112px) clamp(16px, 3vw, 32px) clamp(16px, 3vw, 32px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'clamp(16px, 2vw, 24px)'
    },
    boxLayoutStyle: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        textAlign: 'center',
        alignItems: 'stretch',
        gap: 'clamp(20px, 3vw, 32px)',
        width: '100%',
        maxWidth: '1400px'
    },
    boxStyle: {
        display: "flex",
        flexDirection: "column",
        maxWidth: 650,
        maxHeight: 450,
        gap: "1.75rem"
    },
    sliderAndNumberFieldStyle: {
        display: "flex",
        alignItems: "center",
        gap: 12
    },
    footer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(12px, 1.5vw, 16px)',
        marginTop: 'clamp(8px, 1vw, 12px)',
        width: '100%'
    },
    warningBanner: {
        marginTop: 'clamp(12px, 1.5vw, 16px)',
        textAlign: 'center'
    },
    resetButton: {
        fontSize: 'clamp(14px, 2vw, 16px)',
        padding: 'clamp(5px, 0.8vw, 6px) clamp(10px, 1.5vw, 12px)',
        height: 'auto'
    }
};

export default MinesweeperSettingsStyles;
