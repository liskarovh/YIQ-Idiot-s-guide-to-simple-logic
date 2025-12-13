/**
 * @brief Banner component to display messages of various types.
 *
 * @param type "error" | "warning" | "notification" | "success"
 * @param customMessage Custom message to display
 * @param error Error object containing code, message, and details
 * @param style Additional styles to apply
 */
function Banner({type = "error", customMessage = null, error, style}) {
    // Determine if we should render anything
    if(type === "error") {
        if(!error && !customMessage) {
            return null;
        }
    }
    else {
        if(!customMessage) {
            return null;
        }
    }

    // Determine the message to display
    let displayMessage;
    const {code, message, details} = error || {};
    if(type === "error") {
        displayMessage = customMessage || message || "Something went wrong.";
    }
    else {
        displayMessage = customMessage;
    }

    // Determine the style based on the type
    let bannerStyle;
    switch(type) {
        case "warning":
            bannerStyle = {
                border: "1px solid #ffb86b",
                background: "#fce5c7",
                color: "#b45309",
                borderRadius: 8,
                padding: 12
            };
            break;
        case "notification":
            bannerStyle = {
                border: "1px solid #ffe08a",
                background: "#fff7cc",
                color: "#7a4b00",
                borderRadius: 8,
                padding: 12
            };
            break;
        case "success":
            bannerStyle = {
                border: "1px solid #bbf7d0",
                background: "#dcfce7",
                color: "#166534",
                borderRadius: 8,
                padding: 12
            };
            break;
        default:
        case "error":
            bannerStyle = {
                border: "1px solid #fecaca",
                background: "#fee2e2",
                color: "#b91c1c",
                borderRadius: 8,
                padding: 12
            };
            break;
    }

    const finalBannerStyle = {...bannerStyle, ...style};

    return (
            <div role="alert"
                 style={finalBannerStyle}
            >
                {type === "error" ? (
                        <>
                            <strong>{code || "error"}</strong>: {displayMessage}
                            {details ? (
                                    <pre style={{whiteSpace: "pre-wrap"}}>
                                        {JSON.stringify(details, null, 2)}
                                    </pre>
                            ) : null}
                        </>
                ) : (
                         displayMessage
                 )}
            </div>
    );
}

export default Banner;
