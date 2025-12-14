import React, {useLayoutEffect, useRef, useState} from "react";
import Box from "../../components/Box";
import colors from "../../Colors";

export default function InfoPanel({
                                      title = "Info",
                                      maxHeightPx,
                                      children,
                                      style: extraStyle = {},
                                      titleStyle: extraTitleStyle = {}
                                  }) {
    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        if(!maxHeightPx) {
            setScale(1);
            return;
        }
        const el = contentRef.current;
        if(!el) return;

        const prev = el.style.transform;
        el.style.transform = 'none';
        const natural = el.scrollHeight || 1;
        const target = Math.max(0, maxHeightPx - 48);
        el.style.transform = prev;

        const s = Math.min(1, target / natural);
        setScale(s > 0.98 ? 1 : s);
    }, [maxHeightPx, children]);

    const card = {
        boxSizing: 'border-box',
        borderRadius: 'clamp(20px, 3vw, 40px)',
        background: '#0F172A',
        color: colors?.text || '#CBD5E1',
        padding: 'clamp(18px, 2.8vw, 24px)',
        position: 'relative',
        zIndex: 1,
        maxHeight: maxHeightPx ? `${maxHeightPx}px` : undefined,
        overflow: 'hidden',
        height: 'fit-content',
        ...extraStyle
    };

    const contentWrap = {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        maxWidth: '100%'
    };

    const titleStyle = {
        margin: 0,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 'clamp(26px, 3.6vw, 45px)',
        lineHeight: 1.2,
        textAlign: 'center',
        color: colors?.text_header || '#FFFFFF',
        marginBottom: 'clamp(12px, 2vw, 16px)',
        ...extraTitleStyle
    };

    return (
            <Box style={card}>
                <div ref={contentRef} style={contentWrap}>
                    <h3 style={titleStyle}>{title}</h3>
                    {children}
                </div>
            </Box>
    );
}
