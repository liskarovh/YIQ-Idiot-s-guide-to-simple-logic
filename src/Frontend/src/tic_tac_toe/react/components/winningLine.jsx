import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * WinningLineOverlay
 * Kreslí čáru přes výherní sekvenci (seq = [{row,col}, ...]) nad boardem.
 * - Najde DOM buňky podle data atributů data-row / data-col.
 * - Spočítá středy první a poslední buňky relativně k containeru.
 * - Vykreslí <svg><line/></svg> přes celý container (absolute, pointer-events: none).
 */
export default function WinningLineOverlay({
  containerRef,     // ref na wrapper boardu (musí mít position:relative)
  seq,              // [{row,col}, ...] v pořadí od začátku do konce
  strokeWidth = 8,  // tloušťka čáry
  color = '#22d3ee',// výchozí tyrkys
  glow = true,      // hezký glow efekt
}) {
  const [line, setLine] = useState(null); // {x1,y1,x2,y2}
  const ro = useRef(null);

  const first = useMemo(() => (Array.isArray(seq) && seq.length > 0 ? seq[0] : null), [seq]);
  const last  = useMemo(() => (Array.isArray(seq) && seq.length > 0 ? seq[seq.length - 1] : null), [seq]);

  useLayoutEffect(() => {
    if (!containerRef?.current || !first || !last) {
      setLine(null);
      return;
    }
    const container = containerRef.current;

    const qCell = (r, c) =>
      container.querySelector(`[data-cell="1"][data-row="${r}"][data-col="${c}"]`);

    const a = qCell(first.row, first.col);
    const b = qCell(last.row,  last.col);
    if (!a || !b) {
      setLine(null);
      return;
    }

    const crect = container.getBoundingClientRect();
    const arect = a.getBoundingClientRect();
    const brect = b.getBoundingClientRect();

    const center = (rect) => ({
      x: rect.left - crect.left + rect.width  / 2,
      y: rect.top  - crect.top  + rect.height / 2,
    });

    const A = center(arect);
    const B = center(brect);
    setLine({ x1: A.x, y1: A.y, x2: B.x, y2: B.y });

    // ResizeObserver: přepočet při resize/relayoutu
    if (typeof ResizeObserver !== 'undefined') {
      ro.current?.disconnect?.();
      ro.current = new ResizeObserver(() => {
        const crect2 = container.getBoundingClientRect();
        const arect2 = a.getBoundingClientRect();
        const brect2 = b.getBoundingClientRect();
        const A2 = center(arect2);
        const B2 = center(brect2);
        setLine({ x1: A2.x, y1: A2.y, x2: B2.x, y2: B2.y });
      });
      ro.current.observe(container);
    }

    return () => {
      ro.current?.disconnect?.();
    };
  }, [containerRef, first, last]);

  if (!line) return null;

  const id = 'win-glow-' + Math.random().toString(36).slice(2);

  return (
    <svg
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        overflow: 'visible',
        zIndex: 10,
      }}
    >
      {glow && (
        <defs>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={color} floodOpacity="0.9"/>
          </filter>
        </defs>
      )}
      <line
        x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        filter={glow ? `url(#${id})` : undefined}
      />
    </svg>
  );
}
