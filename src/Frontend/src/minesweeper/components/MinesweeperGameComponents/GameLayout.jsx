import Header from "../../../components/Header";
import Banner from "../../../components/Banner";
import MinesweeperGameStyles from "../../styles/MinesweeperGameStyles.jsx";

function GameLayout({
                        onSettings,
                        statisticsArea,
                        boardArea,
                        actionsArea,
                        error,
                        isNarrow = false
                    }) {
    const statisticsAreaStyle = {
        ...MinesweeperGameStyles.statisticsAreaLeft,
        ...(isNarrow ? {
                            alignItems: "center",
                            maxWidth: "100%",
                            textAlign: "center",
                            justifyContent: "flex-start"
                        }
                     : {}
        )
    };

    const hasLeft = !!statisticsArea;

    const header = (
            <Header
                    rightLinkTitle={"Settings"}
                    showBack={false}
                    onNavigate={onSettings}
            />
    );

    if(isNarrow || !hasLeft) {
        return (
                <div style={MinesweeperGameStyles.contentStyle}>
                    {header}

                    <div style={{
                        ...MinesweeperGameStyles.boxLayoutStyle,
                        gridTemplateColumns: "1fr",
                        gridTemplateRows: "auto",
                        rowGap: "clamp(1rem, 3vw, 2rem)",
                        columnGap: 0,
                        padding: 0,
                        alignItems: "center",
                        marginLeft: "1rem"
                    }}
                    >
                        <div style={MinesweeperGameStyles.rightPanel}>
                            {boardArea}
                            <div style={{
                                padding: "12px 0",
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center"
                            }}
                            >
                                {actionsArea}
                            </div>
                        </div>
                    </div>
                    <div style={MinesweeperGameStyles.errorWrap}>
                        <Banner
                                type={"error"}
                                error={error}
                        />
                    </div>
                </div>
        );
    }

    return (
            <div style={MinesweeperGameStyles.contentStyle}>
                {header}

                <div style={{
                    ...MinesweeperGameStyles.boxLayoutStyle
                }}
                >
                    {/* Row 1, Column 1: Left panel */}
                    <div style={{
                        ...statisticsAreaStyle,
                        gridColumn: "1",
                        gridRow: "1"
                    }}
                    >
                        {statisticsArea}
                    </div>

                    {/* Row 1, Column 2: Board area */}
                    <div style={{
                        ...MinesweeperGameStyles.rightPanel,
                        gridColumn: "2",
                        gridRow: "1"
                    }}
                    >
                        {boardArea}
                    </div>

                    {/* Row 2: Actions span across both columns and are centered in their cell */}
                    <div style={{
                        gridColumn: "2",
                        gridRow: "2",
                        width: "100%",
                        padding: "0 12px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                    >
                        {actionsArea}
                    </div>
                </div>
                <div style={MinesweeperGameStyles.errorWrap}>
                    <Banner
                            type={"error"}
                            error={error}
                    />
                </div>
            </div>
    );
}

export default GameLayout;
