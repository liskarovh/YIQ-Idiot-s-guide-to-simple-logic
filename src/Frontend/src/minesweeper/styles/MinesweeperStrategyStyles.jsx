import styles from "../../Styles";
import colors from "../../Colors";

const MinesweeperStrategyStyles = {
    // Layout styles
    contentStyle: {
        width: "min(1200px, 92vw)",
        margin: "0 auto",
        padding: "7rem 0rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center"
    },
    boxBodyTextStyle: {
        margin: 0,
        padding: "0 clamp(12px, 2.2vw, 28px) clamp(6px, 1.6vw, 14px)",
        boxSizing: "border-box",
        marginLeft: "auto",
        marginRight: "auto",
        fontSize: "clamp(16px, 1.5vw, 22px)",
        lineHeight: 1.6,
        color: colors.text,
        textAlign: "left",
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "normal",
        hyphens: "auto"
    },
    section: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 24,
        marginTop: 20
    },

    // Titles
    title: {
        ...styles.mainTitleStyle,
        textAlign: "center",
        margin: "1.5rem 0 1.2rem"
    },
    subtitle: {
        fontSize: "clamp(20px, 2.5vw, 25px)",
        fontWeight: "400",
        color: colors.text,
        margin: "0 auto 3rem",
        lineHeight: "1.3",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        textAlign: "center",

    },

    // Strategy pills container
    pillsContainer: {
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        gap: "1.2rem",
        justifyContent: "center",
        maxWidth: "90%",
        marginBottom: "0.3rem",
    },
    pillText: {
        fontSize: "clamp(15px, 2vw, 17px)",
        fontWeight: 600
    },

    // Images
    image: {
        width: "100%",
        height: "auto",
        display: "block",
        borderRadius: 12,
        marginTop: 12
    },
    galleryGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
        alignItems: "start",
        alignContent: "center",
        justifyContent: "center",
        marginTop: "1.5rem",
    },
    galleryGridFour: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 14,
        alignItems: "start",
        alignContent: "center",
        justifyContent: "center",
        marginTop: "1.5rem",
    },
    galleryGridThree: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 14,
        alignItems: "start",
        alignContent: "center",
        justifyContent: "center",
        marginTop: "1.5rem",
    },
    galleryGridTwo: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
        alignItems: "start",
        alignContent: "center",
        marginTop: "1.5rem",
    },
    figureCaption: {
        margin: "10px 0 0",
        padding: "0 6px 6px",
        fontSize: "clamp(16px, 1.25vw, 20px)",
        lineHeight: 1.45,
        color: "#E2E8F0",
        opacity: 0.78,
        textAlign: "center",
    },

    // Bullets
    bulletBlock: {
        marginTop: 10,
    },
    bulletTitle: {
        fontWeight: 700,
        color: "#CBD5E1",
        marginBottom: "1.125rem",
        fontSize: "clamp(13px, 1.05vw, 15px)",
    },

};

export default MinesweeperStrategyStyles;
