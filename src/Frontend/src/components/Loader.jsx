import Colors from "../Colors";

const LoaderStyles = {
    container: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5rem"
    },
    svg: {
        width: "44px",
        height: "44px",
        display: "block"
    }
};

function Loader({ size = 44 }) {
    const sizeValue = typeof size === "number" ? `${size}px` : size;
    const svgStyle = { ...LoaderStyles.svg, width: sizeValue, height: sizeValue };

    return (
            <div
                    style={LoaderStyles.container}
                    role="status"
                    aria-live="polite"
                    aria-label="Loading"
            >
                <svg
                        style={svgStyle}
                        viewBox="0 0 44 44"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        focusable="false"
                >
                    {/* Faint ring */}
                    <circle
                            cx="22"
                            cy="22"
                            r="18"
                            fill="none"
                            stroke={Colors.secondary}
                            strokeWidth="4"
                            strokeOpacity="0.12"
                    />
                    {/* Rotating arc */}
                    <circle
                            cx="22"
                            cy="22"
                            r="18"
                            fill="none"
                            stroke={Colors.text}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="80 200"
                    >
                        <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="0 22 22"
                                to="360 22 22"
                                dur="0.9s"
                                repeatCount="indefinite"
                        />
                    </circle>
                </svg>
            </div>
    );
}

export default Loader;
