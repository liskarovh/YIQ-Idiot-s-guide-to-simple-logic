import colors from "./Colors";

const styles = {
    // Layout
    container: {
        minHeight: "100vh",
        width: "100%",
        background: `linear-gradient(to bottom,
        ${colors.secondary} 0%,
        ${colors.primary} 20%,
        ${colors.primary} 60%,
        ${colors.secondary} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    box: {
        backgroundColor: colors.secondary,
        boxShadow: "2px 4px 4px rgba(255, 255, 255, 0.25)",
        borderRadius: "1rem",
        overflow: "hidden",
        width: "37.5rem",
        height: "25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        padding: "1rem"
    },

    // Main title
    mainTitleStyle: {
        fontSize: "clamp(40px, 4.5vw, 80px)",
        fontWeight: "700",
        color: colors.text_header,
        margin: 0,
        marginBottom: "2.25rem",
        lineHeight: "1.1",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
    },

    // Subtitle
    subtitleStyle: {
        fontSize: "clamp(20px, 3vw, 40px)",
        fontWeight: "400",
        color: colors.text,
        margin: 0,
        lineHeight: "1.3",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap"
    },
};

export default styles;
