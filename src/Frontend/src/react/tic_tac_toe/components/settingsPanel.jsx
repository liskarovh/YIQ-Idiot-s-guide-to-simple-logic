// Frontend/src/react/tic_tac_toe/components/SettingsPanel.jsx

/**
 * @param {{
 *  open: boolean,
 *  value: {
 *    size:number, kToWin:number,
 *    mode:'pvp'|'pve',
 *    startMark:'X'|'O'|'Random',
 *    difficulty:'easy'|'medium'|'hard'
 *  },
 *  busy?: boolean,
 *  onToggle: () => void,
 *  onChange: (partial: Partial<{
 *    size:number, kToWin:number,
 *    mode:'pvp'|'pve', startMark:'X'|'O'|'Random',
 *    difficulty:'easy'|'medium'|'hard'
 *  }>) => void,
 *  onApply: (value:any) => void
 * }} props
 */
export default function SettingsPanel({ open, value, busy = false, onToggle, onChange, onApply }) {
  if (!open) return <button type="button" onClick={onToggle}>Open settings</button>;

  const onField = (k) => (e) => {
    const v = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    onChange({ [k]: v });
  };

  return (
    <div>
      <button type="button" onClick={onToggle}>Close settings</button>

      <div>
        <label>Size:
          <input type="number" min={3} max={15} value={value.size} disabled={busy} onChange={onField('size')} />
        </label>
        <label>K to win:
          <input type="number" min={3} max={15} value={value.kToWin} disabled={busy} onChange={onField('kToWin')} />
        </label>
        <label>Mode:
          <select value={value.mode} disabled={busy} onChange={onField('mode')}>
            <option value="pvp">PvP</option>
            <option value="pve">PvE</option>
          </select>
        </label>
        <label>Start:
          <select value={value.startMark} disabled={busy} onChange={onField('startMark')}>
            <option value="X">X</option>
            <option value="O">O</option>
            <option value="Random">Random</option>
          </select>
        </label>
        <label>Difficulty:
          <select value={value.difficulty} disabled={busy} onChange={onField('difficulty')}>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </label>
      </div>

      <button type="button" disabled={busy} onClick={() => onApply(value)}>Apply</button>
    </div>
  );
}
