// Frontend/src/react/tic_tac_toe/components/GameInfoPanel.jsx

/**
 * @param {{ game: any, meta?: { movesCount?:number, lastMove?:{r:number,c:number,by:'X'|'O'}, analysis?:{elapsedMs?:number, rollouts?:number} } | null }} props
 */
export default function GameInfoPanel({ game, meta = null }) {
  if (!game) return null;
  return (
    <div>
      <div>Size: {game.size} | K: {game.kToWin}</div>
      <div>Player: {game.player} | Status: {game.status}</div>
      {meta?.lastMove && <div>Last move: {meta.lastMove.by} @ ({meta.lastMove.r}, {meta.lastMove.c})</div>}
      {meta?.analysis && <div>AI: {meta.analysis.rollouts ?? '—'} rollouts, {meta.analysis.elapsedMs ?? '—'} ms</div>}
    </div>
  );
}
