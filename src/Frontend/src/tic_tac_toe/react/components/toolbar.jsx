// src/Frontend/src/react/react/components/toolbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import colors from '../../../Colors';
import { BestMoveIcon, RestartIcon, PauseIcon, PowerIcon, InfoIcon } from './icons';

export default function Toolbar({
  onBestMove,
  onRestart,
  onPause,
  onPower,
  onStrategy,
  paused = false,
  bestMoveActive = false,
}) {
  const navigate = useNavigate();

  const wrap  = {
    display: 'grid',
    gridAutoFlow: 'column',
    justifyContent: 'center',
    alignItems: 'end',
    gap: 'clamp(16px, 4vw, 51px)',
    padding: 'clamp(4px, 1vw, 8px) 0',
    color: colors.text
  };
  const item  = { display: 'grid', justifyItems: 'center', gap: '.25rem', userSelect: 'none' };
  const label = { fontSize: 'clamp(12px, 2.2vw, 18px)', color: colors.text, opacity: .9 };
  const btn   = { background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' };
  const icon  = { width: 'clamp(24px, 4vw, 36px)', height: 'clamp(24px, 4vw, 36px)' };

  const dimmed = { opacity: .45, filter: 'grayscale(0.2)', pointerEvents: 'none', cursor: 'default' };

  const handleStrategy = (e) => {
    try { if (typeof onStrategy === 'function') onStrategy(e); } catch {}
    navigate('/tic-tac-toe/strategy');          // ← naviguj vždy
  };

  return (
    <div style={wrap}>
      {/* Best move */}
      <div style={item}>
        <button
          style={{
            ...btn,
            ...(paused ? dimmed : null),
            ...(bestMoveActive ? { filter: 'drop-shadow(0 0 8px rgba(45,193,45,0.7))' } : null)
          }}
          onClick={onBestMove}
          aria-label="Best move"
          aria-disabled={paused}
          disabled={paused}
          title="Show best move"
        >
          <BestMoveIcon
            style={{
              ...icon,
              ...(bestMoveActive ? { color: colors.win } : null)
            }}
          />
        </button>
        <div
          style={{
            ...label,
            ...(bestMoveActive ? { color: colors.win, opacity: 1 } : null),
            ...(paused ? { opacity: .45 } : null)
          }}
        >
          Best move
        </div>
      </div>

      {/* Restart */}
      <div style={item}>
        <button style={btn} onClick={onRestart} aria-label="Restart" title="Restart game">
          <RestartIcon style={icon} />
        </button>
        <div style={label}>Restart</div>
      </div>

      {/* Pause / Resume */}
      <div style={item}>
        <button
          style={btn}
          onClick={onPause}
          aria-label={paused ? 'Resume' : 'Pause'}
          aria-pressed={paused}
          title={paused ? 'Resume' : 'Pause'}
        >
          <PauseIcon style={icon} />
        </button>
        <div style={label}>{paused ? 'Resume' : 'Pause'}</div>
      </div>

      {/* End */}
      <div style={item}>
        <button style={btn} onClick={onPower} aria-label="End" title="End game">
          <PowerIcon style={icon} />
        </button>
        <div style={label}>End</div>
      </div>

      {/* Strategy */}
      {/* Strategy */}
      <div style={item}>
        <button
          style={{ ...btn, ...(paused ? dimmed : null) }}
          onClick={handleStrategy}
          aria-label="Strategy"
          aria-disabled={paused}
          disabled={paused}
          title="Show strategy"
        >
          <InfoIcon style={icon} />
        </button>
        <div style={{ ...label, ...(paused ? { opacity: .45 } : null) }}>Strategy</div>
      </div>
    </div>
  );
}
