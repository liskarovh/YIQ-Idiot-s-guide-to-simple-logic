// Frontend/src/react/tic_tac_toe/components/bestMoveOverlay.jsx

/**
 * @param {{
 *  pendingMove?: {row:number,col:number,player:'X'|'O'} | null,
 *  hint?: {row:number,col:number,meta?:any} | null,
 *  thinking?: boolean
 * }} props
 */
export default function BestMoveOverlay({ pendingMove = null, hint = null, thinking = false }) {
  return (
    <div aria-live="polite">
      {thinking && <div>AI thinking…</div>}
      {hint && <div>Hint: ({hint.row}, {hint.col})</div>}
      {pendingMove && <div>Ghost: ({pendingMove.row}, {pendingMove.col}) {pendingMove.player}</div>}
    </div>
  );
}
