// Frontend/src/react/tic_tac_toe/components/Controls.jsx

/**
 * @param {{
 *  busy?: boolean,
 *  difficulty: 'easy'|'medium'|'hard',
 *  mode: 'pvp'|'pve',
 *  startMark: 'X'|'O'|'Random',
 *  onNew: () => void,
 *  onRestart: () => void,
 *  onBestMove: () => void,
 *  onChangeDifficulty: (d:'easy'|'medium'|'hard') => void,
 *  onChangeMode: (m:'pvp'|'pve') => void,
 *  onChangeStartMark: (s:'X'|'O'|'Random') => void
 * }} props
 */
export default function Controls({
  busy = false,
  difficulty, mode, startMark,
  onNew, onRestart, onBestMove,
  onChangeDifficulty, onChangeMode, onChangeStartMark,
}) {
  return (
    <div>
      <button type="button" disabled={busy} onClick={onNew}>New</button>
      <button type="button" disabled={busy} onClick={onRestart}>Restart</button>
      <button type="button" disabled={busy} onClick={onBestMove}>Best move</button>

      <div>
        <label>
          Difficulty:
          <select
            value={difficulty}
            disabled={busy}
            onChange={e => onChangeDifficulty(e.target.value)}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </label>

        <label>
          Mode:
          <select
            value={mode}
            disabled={busy}
            onChange={e => onChangeMode(e.target.value)}
          >
            <option value="pvp">PvP</option>
            <option value="pve">PvE</option>
          </select>
        </label>

        <label>
          Start:
          <select
            value={startMark}
            disabled={busy}
            onChange={e => onChangeStartMark(e.target.value)}
          >
            <option value="X">X</option>
            <option value="O">O</option>
            <option value="Random">Random</option>
          </select>
        </label>
      </div>
    </div>
  );
}
