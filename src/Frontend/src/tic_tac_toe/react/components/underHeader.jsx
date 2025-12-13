/**
 * @file    underHeader.jsx
 * @brief   Layout wrapper positioned directly under the sticky Header component.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { useLayoutEffect, useState } from 'react';

/**
 * Wrapper placed below a sticky Header. It ensures the content never overlaps the Header.
 *
 * Props:
 *  - headerRef   : ref to the DOM node containing <Header/>
 *  - minRem?     : baseline Header height in rem used as a fallback estimate (default 5.0)
 *  - center?     : boolean, vertical centering of children (default true)
 *  - scrollY?    : 'hidden' | 'auto' – vertical overflow behavior (default 'hidden')
 *  - style?      : additional inline styles for the wrapper
 */
export default function UnderHeader({
                                        headerRef,
                                        minRem = 5.0,
                                        center = true,
                                        scrollY = 'hidden',
                                        style,
                                        children,
                                    }) {
    const [headerPx, setHeaderPx] = useState(0);

    useLayoutEffect(() => {
        const recalc = () => {
            const h = headerRef?.current?.getBoundingClientRect().height || 0;
            setHeaderPx(Math.round(h));
        };
        recalc();

        const ro = new ResizeObserver(recalc);
        if (headerRef?.current) ro.observe(headerRef.current);
        window.addEventListener('resize', recalc);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', recalc);
        };
    }, [headerRef]);

    // Fallback for the initial render
    const fallbackOffset = `calc(${minRem}rem + env(safe-area-inset-top, 0px))`;


    const headerOffsetCss =
            headerPx > 0
                    ? `calc(${headerPx}px + env(safe-area-inset-top, 0px))`
                    : fallbackOffset;

    const wrapperStyle = {
        marginTop: headerOffsetCss,
        minHeight: `calc(100svh - ${headerOffsetCss})`,
        paddingBottom: 12,
        display: 'flex',
        alignItems: center ? 'center' : 'flex-start',
        justifyContent: 'center',
        overflowX: 'hidden',
        overflowY: scrollY,
        ...style,
    };

    return <div style={wrapperStyle}>{children}</div>;
}
