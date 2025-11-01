// Frontend/src/react/tic_tac_toe/pages/GamePage.jsx
import { useEffect, useRef, useState } from 'react';

import Board from '../components/board.jsx';
import BestMoveOverlay from '../components/bestMoveOverlay.jsx';
import HUD from '../components/HUD.jsx';
import Controls from '../components/controls.jsx';
import SettingsPanel from '../components/settingsPanel.jsx';
import GameInfoPanel from '../components/gameInfoPanel.jsx';

import { useGame } from '../hooks/useGame.js';
import { getBuildInfo } from '../shared/env.js';

console.log('[GamePage] mounted');


// pouze jeden export default a jedna deklarace
export default function GamePage() {
  const {
    game, loading, error, pendingMove, hint,
    difficulty, mode, startMark,
    newGame, play, bestMove, restart,
    setDifficulty, setMode, setStartMark,
  } = useGame();

  // výchozí parametry pro první hru
  const defaultParams = { size: 3, kToWin: 3, mode, startMark, difficulty };

  // Guard proti dvojímu volání v React 18 StrictMode
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (!game) newGame(defaultParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Settings (pro další novou hru)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsValue, setSettingsValue] = useState(defaultParams);
  useEffect(() => {
    setSettingsValue(v => ({ ...v, mode, startMark, difficulty }));
  }, [mode, startMark, difficulty]);

  const buildInfo = getBuildInfo();

  // Dočasný fallback, ať stránka není prázdná před prvním DTO
  if (!game && !loading && !error) {
    return <div style={{ padding: 16 }}>Initializing game… (waiting for /new)</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <HUD
        gameId={game?.id}
        status={game?.status ?? null}
        player={game?.player ?? null}
        winner={game?.winner ?? null}
        error={error}
        loading={loading}
        buildInfo={buildInfo}
      />

      <Controls
        busy={loading}
        difficulty={difficulty}
        mode={mode}
        startMark={startMark}
        onNew={() => newGame(settingsValue)}
        onRestart={() => restart()}
        onBestMove={() => bestMove(difficulty)}
        onChangeDifficulty={setDifficulty}
        onChangeMode={setMode}
        onChangeStartMark={setStartMark}
      />

      <SettingsPanel
        open={settingsOpen}
        value={settingsValue}
        busy={loading}
        onToggle={() => setSettingsOpen(o => !o)}
        onChange={(partial) => setSettingsValue(v => ({ ...v, ...partial }))}
        onApply={(value) => newGame(value)}
      />

      {game && (
        <>
          <Board
            board={game.board}
            size={game.size}
            disabled={loading || game.status !== 'running'}
            pendingMove={pendingMove}
            winnerLine={null}
            onCell={(r, c) => play({ row: r, col: c })}
          />
          <BestMoveOverlay
            pendingMove={pendingMove}
            hint={hint}
            thinking={loading && !pendingMove}
          />
          <GameInfoPanel game={game} meta={null} />
        </>
      )}
    </div>
  );
}
