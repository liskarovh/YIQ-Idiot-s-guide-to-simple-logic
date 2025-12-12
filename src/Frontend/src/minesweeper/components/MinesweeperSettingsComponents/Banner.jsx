import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";

function Banner({type = "warning", error, customMessage}) {
    if(!error) {
        return null;
    }

    const {code, message, details} = error || {};

    return (
            <div role="alert"
                 style={MinesweeperSettingsStyles.errorBanner}
            >
                <strong>{code || "error"}</strong>: {message || "Something went wrong"}
                {details ?
                 <pre style={{whiteSpace: "pre-wrap"}}>{JSON.stringify(details, null, 2)}</pre> : null}
            </div>
    );
}

export default Banner;
