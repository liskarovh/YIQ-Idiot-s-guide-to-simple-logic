import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import colors from "../Colors";

/**
 * HEADER COMPONENT - Navigation header
 *
 * Props:
 * - showBack: boolean - if true shows "Back", if false shows "About"
 * - onNavigate: function - callback when navigation link is clicked
 */

function useWindowScale(baseWidth = 1920, {min, max} = {}) {
    const [s, setS] = useState(1);
    useEffect(() => {
        const recalc = () => {
            const raw = window.innerWidth / baseWidth;
            const clamped = Math.max(min, Math.min(max, raw));
            setS(clamped);
        };
        recalc();
        window.addEventListener("resize", recalc);
        return () => window.removeEventListener("resize", recalc);
    }, [baseWidth, min, max]);
    return s;
}

function Header({showBack = false, onNavigate}) {
    const navigate = useNavigate();
    const s = useWindowScale(1920, {min: 0.7, max: 1});
    const [linkHover, setLinkHover] = useState(false);

    const handleLogoClick = () => {
        navigate("/", {replace: true});
    };

    const handleLinkClick = () => {
        if(showBack) {
            navigate(-1);
        }
        else {
            navigate("/about");
        }
    };

    const headerStyle = {
        width: "100%",
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "absolute",
        top: 0,
        left: 0,
        boxSizing: "border-box"
    };

    const leftSectionStyle = {
        display: "flex",
        alignItems: "center",
        gap: 15,
        flex: "1 1 auto",
        minWidth: 0
    };

    const logoStyle = {
        fontSize: `${50 * s}px`,
        fontWeight: "800",
        color: colors.text_header,
        cursor: "pointer",
        userSelect: "none"
    };

    const titleStyle = {
        fontSize: `${30 * s}px`,
        fontWeight: "600",
        color: colors.text,
        flex: "1 1 auto",
        minWidth: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    };

    const linkStyle = {
        fontSize: `${30 * s}px`,
        fontWeight: "600",
        color: linkHover ? colors.text_header : colors.text,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
        transition: "color 0.18s"
    };

    return (
            <header style={headerStyle}>
                <div style={leftSectionStyle}>
                    <span style={logoStyle} onClick={handleLogoClick}
                    >yIQ</span>
                    <span style={titleStyle}>Ydea impaired's quide to basic logic</span>
                </div>

                <span
                        style={linkStyle}
                        onClick={handleLinkClick}
                        onMouseEnter={() => setLinkHover(true)}
                        onMouseLeave={() => setLinkHover(false)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if(e.key === "Enter") {
                                onNavigate && onNavigate(showBack ? "back" : "/about");
                            }
                        }}
                >
        {showBack ? 'Back' : 'About'}
      </span>
            </header>
    );
}

export default Header;
