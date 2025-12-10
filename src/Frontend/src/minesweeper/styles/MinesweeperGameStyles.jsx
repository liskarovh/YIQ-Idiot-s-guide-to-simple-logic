// minesweeper/styles/MinesweeperGameStyles.jsx
import colors from "../../Colors";

const styles = {
    page: {
        minHeight: "100vh",
        width: "100%",
        background: `linear-gradient(to bottom, ${colors.secondary} 0%, ${colors.primary} 20%, ${colors.primary} 60%, ${colors.secondary} 100%)`,
        paddingTop: 72
    },
    shell: {
        maxWidth: 1200,
        margin: "0 auto",
        padding: 24,
        color: colors.text,
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        gap: 28,
        alignItems: "start"
    },
    boardWrap: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18
    },
};

export default styles;
