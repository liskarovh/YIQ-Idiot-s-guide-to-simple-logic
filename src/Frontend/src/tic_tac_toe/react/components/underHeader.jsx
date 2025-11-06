import React, { useLayoutEffect, useState } from 'react';

/**
 * Wrapper pod sticky Headerem. Nemůže překrýt Header.
 *
 * Props:
 *  - headerRef   : ref na DOM node s <Header/>
 *  - center?     : boolean (default true) – vertikální centrování
 *  - minRem?     : baseline výšky Headeru v rem (default 7.0)
 *  - extraTopPx? : dodatečný horní offset v px (default 8)
 *  - scrollY?    : 'hidden' | 'auto' (default 'hidden')
 *  - style?      : extra styly
 */
export default function UnderHeader({
  headerRef,
  center = true,
  minRem = 7.0,
  extraTopPx = 8,
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

  const headerOffsetCss =
    `max(calc(${minRem}rem + env(safe-area-inset-top, 0px) + ${extraTopPx}px), ${headerPx}px)`;

  const wrapperStyle = {
    marginTop: headerOffsetCss,
    minHeight: `calc(100svh - ${headerOffsetCss})`,
    paddingBottom: 12,
    display: 'flex',
    alignItems: center ? 'center' : 'flex-start',
    justifyContent: 'center',
    overflowX: 'hidden',
    overflowY: scrollY,   // <<< řízení scrollu zvenku
    ...style,
  };

  return <div style={wrapperStyle}>{children}</div>;
}
