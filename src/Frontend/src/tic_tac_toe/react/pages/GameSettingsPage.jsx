import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ttt } from '../features/ttt.client.js';

export default function GameSettingsPage() {
  const nav = useNavigate();

  const [mode, setMode] = useState('pve');
  const [difficulty, setDifficulty] = useState('easy');
  const [size, setSize] = useState(5);
  const [k, setK] = useState(5);
  const [start, setStart] = useState('X');
  const [yourSymbol, setYourSymbol] = useState('X');
  const [timerOn, setTimerOn] = useState(true);
  const [timerSec, setTimerSec] = useState(90);

  const [xName, setXName] = useState('Player1');
  const [oName, setOName] = useState('Computer');

  useEffect(() => {
    setOName(mode === 'pve' ? 'Computer' : 'Player2');
    if (mode === 'pvp') setYourSymbol('X');
  }, [mode]);

  const allowedK = [3, 4, 5].filter(v => v <= size);
  useEffect(() => {
    setK(prev => (allowedK.includes(prev) ? prev : (allowedK.at(-1) ?? 3)));
  }, [size]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onPlay() {
    const startMark = (start === 'random') ? (Math.random() < 0.5 ? 'X' : 'O') : start;
    const kToWin = Math.min(Math.max(k, 3), Math.min(size, 5));

    const players = {
      x: (xName || 'Player1').trim(),
      o: (oName || (mode === 'pve' ? 'Computer' : 'Player2')).trim(),
    };

    const settings = {
      mode,
      size: Number(size),
      kToWin,
      startMark,
      humanMark: yourSymbol,
      difficulty,
      timer: { enabled: !!timerOn, seconds: Number(timerSec) || 0 },
      // POZOR: players sem NASCHVÁL NEUKLÁDÁME (nepersistovat přezdívky ve FE)
    };

    try {
      const dto = await ttt.new({
        size: Number(size),
        kToWin,
        mode,
        startMark,
        difficulty,
        turnTimerSec: settings.timer.enabled ? settings.timer.seconds : 0,
        humanMark: yourSymbol,
        playerName: players.x, // fallback pro X na BE
        players,               // BE uloží do Game.players
      });
      const created = dto?.game ?? dto;

      // Persistujeme pouze ID hry a volitelně nastavení bez players
      sessionStorage.setItem('ttt.lastGameId', created.id);
      sessionStorage.setItem('ttt.settings', JSON.stringify(settings));

      const timerSeed = {
        enabled: !!timerOn,
        totalSec: Number(timerSec) || 0,
        startedAt: Date.now(),
      };
      sessionStorage.setItem('ttt.timer', JSON.stringify(timerSeed));

      nav('/tic-tac-toe');
    } catch (e) {
      console.warn('[TTT Settings] /new ×', e);
      alert(e?.message || 'Failed to create game');
    }
  }

  const pageStyle = { color: '#fff', padding: '24px', maxWidth: 920, margin: '0 auto', lineHeight: 1.6 };
  const fieldsetStyle = { border: '1px solid rgba(255,255,255,0.15)', padding: '12px 16px', marginBottom: 16, borderRadius: 8 };
  const legendStyle = { padding: '0 6px', fontWeight: 700 };
  const labelStyle = { marginRight: 16, display: 'inline-flex', alignItems: 'center', gap: 6 };
  const inputTextStyle = { padding: '6px 8px', borderRadius: 6, border: '1px solid #444', background: 'rgba(255,255,255,0.06)', color: '#fff' };
  const numberStyle = { ...inputTextStyle, width: 90 };

  return (
    <div style={pageStyle}>
      <h1 style={{marginTop:0}}>Game settings</h1>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Mode</legend>
        <label style={labelStyle}><input type="radio" name="mode" checked={mode==='pve'} onChange={()=>setMode('pve')} /> Bot</label>
        <label style={labelStyle}><input type="radio" name="mode" checked={mode==='pvp'} onChange={()=>setMode('pvp')} /> 2 Players</label>
      </fieldset>

      <fieldset style={{...fieldsetStyle, opacity: mode==='pve' ? 1 : 0.6}} disabled={mode!=='pve'}>
        <legend style={legendStyle}>Bot difficulty</legend>
        <label style={labelStyle}><input type="radio" name="diff" checked={difficulty==='easy'} onChange={()=>setDifficulty('easy')} /> Easy</label>
        <label style={labelStyle}><input type="radio" name="diff" checked={difficulty==='medium'} onChange={()=>setDifficulty('medium')} /> Medium</label>
        <label style={labelStyle}><input type="radio" name="diff" checked={difficulty==='hard'} onChange={()=>setDifficulty('hard')} /> Hard</label>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Board size</legend>
        {[3,4,5,6,7,8].map(n => (
          <label key={n} style={labelStyle}>
            <input type="radio" name="size" checked={size===n} onChange={()=>setSize(n)} /> {n}×{n}
          </label>
        ))}
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>K to win</legend>
        <label style={{...labelStyle, marginRight:0}}>
          <select
            value={k}
            onChange={e=>setK(Number(e.target.value))}
            style={{...inputTextStyle, padding:'6px 10px'}}
          >
            {allowedK.map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </label>
        <span style={{marginLeft:12, opacity:0.8}}>Choose 3 … {Math.min(size, 5)}</span>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Starting player</legend>
        <label style={labelStyle}><input type="radio" name="start" checked={start==='X'} onChange={()=>setStart('X')} /> X</label>
        <label style={labelStyle}><input type="radio" name="start" checked={start==='O'} onChange={()=>setStart('O')} /> O</label>
        <label style={labelStyle}><input type="radio" name="start" checked={start==='random'} onChange={()=>setStart('random')} /> Random</label>
      </fieldset>

      <fieldset style={{...fieldsetStyle, opacity: mode==='pve' ? 1 : 0.6}} disabled={mode!=='pve'}>
        <legend style={legendStyle}>Your symbol (PvE)</legend>
        <label style={labelStyle}><input type="radio" name="you" checked={yourSymbol==='X'} onChange={()=>setYourSymbol('X')} /> X</label>
        <label style={labelStyle}><input type="radio" name="you" checked={yourSymbol==='O'} onChange={()=>setYourSymbol('O')} /> O</label>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Turn timer</legend>
        <label style={labelStyle}>
          <input type="checkbox" checked={!!timerOn} onChange={e=>setTimerOn(e.target.checked)} /> Enabled
        </label>
        <label style={labelStyle}>
          Seconds: <input
            type="number"
            min={5}
            max={600}
            step={5}
            value={timerSec}
            onChange={e=>setTimerSec(Number(e.target.value) || 0)}
            style={numberStyle}
          />
        </label>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Names</legend>
        <div style={{marginBottom:8}}>
          <label style={labelStyle}>X name <input style={inputTextStyle} value={xName} onChange={e=>setXName(e.target.value)} /></label>
        </div>
        <div>
          <label style={labelStyle}>O name <input style={inputTextStyle} value={oName} onChange={e=>setOName(e.target.value)} /></label>
        </div>
      </fieldset>

      <div style={{marginTop:16, display:'flex', gap:12}}>
        <button onClick={onPlay} style={{padding:'10px 18px', borderRadius:8}}>Play</button>
        <button onClick={()=>nav(-1)} style={{padding:'10px 18px', borderRadius:8}}>Back</button>
      </div>
    </div>
  );
}
