import colors from "./Colors";

const styles = {
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
    mainTitleStyleWide: {
        fontSize: "5rem",
        fontWeight: "700",
        color: colors.text_header,
        margin: 0,
        marginBottom: "2.25rem",
        lineHeight: "1.1",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap"
    },
    mainTitleStyleNarrow: {
        fontSize: "1.5rem",
        fontWeight: "700",
        marginBottom: "0.75rem"

    },
    mainTitleStyleMedium: {
        fontSize: "2.25rem",
        fontWeight: "700",
        marginBottom: "1.25rem"

    },
    subtitleStyleWide: {
        fontSize: "2.5rem",
        fontWeight: "400",
        color: colors.text,
        margin: 0,
        lineHeight: "1.3",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap"
    },
    subtitleStyleNarrow: {
        fontSize: "1rem",
        fontWeight: "400"
    },
    subtitleStyleMedium: {
        fontSize: "1.5rem",
        fontWeight: "400"
    }

};

export default styles;
