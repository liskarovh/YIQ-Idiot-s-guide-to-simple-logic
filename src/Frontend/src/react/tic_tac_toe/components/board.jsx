// Frontend/src/react/tic_tac_toe/components/Board.jsx

/**
 * @param {{
 *   board: ('.'|'X'|'O')[][],
 *   size: number,
 *   disabled?: boolean,
 *   pendingMove?: { row:number, col:number, player:'X'|'O' } | null,
 *   winnerLine?: Array<[number, number]> | null,
 *   onCell: (row:number, col:number) => void
 * }} props
 */
export default function Board({ board, size, disabled = false, pendingMove = null, winnerLine = null, onCell }) {
  const isWinnerCell = (r, c) => !!winnerLine?.some(([wr, wc]) => wr === r && wc === c);
  const renderCell = (r, c) => {
    const mark = board?.[r]?.[c] ?? '.';
    const isPending = pendingMove && pendingMove.row === r && pendingMove.col === c;

    return (
      <button
        key={`${r}-${c}`}
        type="button"
        disabled={disabled || mark !== '.'}
        onClick={() => onCell(r, c)}
        aria-label={`Cell ${r},${c}`}
        style={{ minWidth: 40, minHeight: 40 }}
      >
        {isPending ? pendingMove.player : (mark === '.' ? '' : mark)}
        {isWinnerCell(r, c) ? '★' : null}
      </button>
    );
  };

  return (
    <div role="grid" aria-disabled={disabled}>
      {Array.from({ length: size }, (_, r) => (
        <div role="row" key={r}>
          {Array.from({ length: size }, (_, c) => renderCell(r, c))}
        </div>
      ))}
    </div>
  );
}
