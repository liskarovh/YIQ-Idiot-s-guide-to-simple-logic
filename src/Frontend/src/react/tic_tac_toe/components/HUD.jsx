// Frontend/src/react/tic_tac_toe/components/HUD.jsx

/**
 * @param {{
 *  gameId?: string,
 *  status?: 'running'|'won'|'draw' | null,
 *  player?: 'X'|'O' | null,
 *  winner?: 'X'|'O' | null,
 *  error?: string | null,
 *  loading?: boolean,
 *  buildInfo?: { commit?:string|null, pr?:string|null, env?:string|null }
 * }} props
 */
export default function HUD({ gameId, status, player, winner, error, loading, buildInfo }) {
  return (
    <div>
      <div>ID: {gameId || '—'}</div>
      <div>Status: {status || '—'} {loading ? '(loading...)' : ''}</div>
      <div>Player: {player || '—'}</div>
      {status === 'won' && <div>Winner: {winner}</div>}
      {status === 'draw' && <div>It’s a draw</div>}
      {error && <div role="alert">Error: {error}</div>}
      {buildInfo && <div>Build: {buildInfo.commit || 'n/a'} {buildInfo.pr ? `(PR #${buildInfo.pr})` : ''} {buildInfo.env || ''}</div>}
    </div>
  );
}
