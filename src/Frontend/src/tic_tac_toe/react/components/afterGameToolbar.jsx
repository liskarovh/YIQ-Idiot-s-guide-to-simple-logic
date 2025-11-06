// src/Frontend/src/react/tic_tac_toe/components/afterGameToolbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import colors from '../../../Colors';
import { RestartIcon, NewGameIcon, InfoIcon } from './icons';

export default function AfterGameToolbar({
  onPlayAgain,
  onNewGame,
  onStrategy,
}) {
  const navigate = useNavigate();

  // Stejné rozměry a layout jako u běžného Toolbaru
  const wrap  = {
    display: 'grid',
    gridAutoFlow: 'column',
    justifyContent: 'center',
    alignItems: 'end',
    gap: 'clamp(16px, 4vw, 51px)',
    padding: 'clamp(4px, 1vw, 8px) 0',
    color: colors.text,
  };
  const item  = { display: 'grid', justifyItems: 'center', gap: '.25rem', userSelect: 'none' };
  const label = { fontSize: 'clamp(12px, 2.2vw, 18px)', color: colors.text, opacity: .9 };
  const btn   = { background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' };
  const icon  = { width: 'clamp(24px, 4vw, 36px)', height: 'clamp(24px, 4vw, 36px)' };

  const handleNewGame = (e) => {
    try { if (typeof onNewGame === 'function') onNewGame(e); } catch {}
    navigate('/tic_tac_toe/settings'); // vždy přesměruj
  };

  const handleStrategy = (e) => {
    try { if (typeof onStrategy === 'function') onStrategy(e); } catch {}
    navigate('/about'); // nebo '/tic-tac-toe/strategy' podle tvé routy
  };

  return (
    <div style={wrap} data-toolbar>
      {/* Play again = Restart */}
      <div style={item}>
        <button
          style={btn}
          onClick={onPlayAgain}
          aria-label="Play again"
          title="Play again"
        >
          <RestartIcon style={icon} />
        </button>
        <div style={label}>Play again</div>
      </div>

      {/* New game = white icon */}
      <div style={item}>
        <button
          style={btn}
          onClick={handleNewGame}
          aria-label="New game"
          title="New game"
        >
          <NewGameIcon style={{ ...icon, color: '#fff' }} />
        </button>
        <div style={label}>New game</div>
      </div>

      {/* Strategy */}
      <div style={item}>
        <button
          style={btn}
          onClick={handleStrategy}
          aria-label="Strategy"
          title="Strategy"
        >
          <InfoIcon style={icon} />
        </button>
        <div style={label}>Strategy</div>
      </div>
    </div>
  );
}
