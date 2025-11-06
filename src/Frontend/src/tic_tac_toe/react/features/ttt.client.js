// src/Frontend/src/react/react/features/ttt.client.js
// Tenoučký adapter pro React: vytvoří API klient, poskytne validátory na DTO
// a zapne jednoduché HTTP logování + helpers pro HARD hint a stateless best-move.

import { getApiBaseUrl } from '../shared/env.js';
import { createTttClient } from '../../javascript/client.js';

import {
  inBounds as _inBounds,
  isCellEmpty as _isCellEmpty,
  isRunning as _isRunning,
} from '../../javascript/validator.js';

// ───────────────────────── helpers ─────────────────────────
function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const k of Object.getOwnPropertyNames(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v);
  }
  return obj;
}
const isDev = () =>
  (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production');

const normalizeMode = (m) => {
  const s = String(m ?? '').toLowerCase();
  if (s.includes('pve') || s.includes('bot')) return 'pve';
  if (s.includes('pvp') || s.includes('2'))   return 'pvp';
  return 'pvp';
};

const normNick = (v) => {
  if (v == null) return undefined;
  const s = String(
    typeof v === 'object' ? (v.nickname ?? v.name ?? v.nick ?? '') : v
  ).trim();
  return s.length ? s : undefined;
};

const buildPlayers = (p) => {
  const mode = normalizeMode(p?.mode);
  const px =
    normNick(p?.players?.X?.nickname) ??
    normNick(p?.players?.x?.nickname) ??
    normNick(p?.players?.X) ??
    normNick(p?.players?.x) ??
    normNick(p?.playerName);
  const po =
    normNick(p?.players?.O?.nickname) ??
    normNick(p?.players?.o?.nickname) ??
    normNick(p?.players?.O) ??
    normNick(p?.players?.o);
  return {
    X: { nickname: String(px ?? 'Player1') },
    O: { nickname: String(po ?? (mode === 'pve' ? 'Computer' : 'Player2')) },
  };
};

const normalizeStartMark = (s) => {
  const v = String(s ?? 'X').toUpperCase();
  return v === 'O' ? 'O' : 'X';
};
const normalizeDifficulty = (d) => {
  const v = String(d ?? 'easy').toLowerCase();
  return v === 'hard' ? 'hard' : v === 'medium' ? 'medium' : 'easy';
};

// ───────────────────────── klient ─────────────────────────
export const ttt = createTttClient({ baseUrl: getApiBaseUrl() });

// DTO-friendly validátory pro React vrstvu
export function inBounds(dto, r, c) {
  const size = dto?.size ?? (dto?.game?.size);
  return _inBounds(size, r, c);
}
export function isEmpty(dto, r, c) {
  const board = dto?.board ?? dto?.game?.board;
  return _isCellEmpty(board, r, c);
}
export function isRunning(dto) {
  const status = dto?.status ?? dto?.game?.status;
  return _isRunning(status);
}

// Debug: ukaž API base a povol ruční volání
console.log('[ENV] API baseUrl =', ttt?.baseUrl || getApiBaseUrl());
if (typeof window !== 'undefined') window.__ttt = ttt;

// Debug wrapper všech HTTP (neruší shape odpovědí – jen loguje + freeze v dev)
if (!ttt._debugWrapped) {
  const orig = ttt._fetch;
  ttt._debugWrapped = true;
  ttt._fetch = async (pathOrArgs, opts) => {
    console.log('[HTTP →]', pathOrArgs, opts || {});
    try {
      const json = await orig(pathOrArgs, opts);
      if (isDev() && json && typeof json === 'object') {
        try { deepFreeze(json); } catch {}
      }
      console.log('[HTTP ←]', json);
      return json;
    } catch (e) {
      console.warn('[HTTP ×]', e);
      throw e;
    }
  };
}

// ───────────────────────── NEW: bezpečný builder + throttle + trace ─────────────────────────
let __lastNewTs = 0;
let __newSeq = 0;

function buildNewPayload(p = {}) {
  const mode       = normalizeMode(p.mode);
  const startMark  = normalizeStartMark(p.startMark);
  const difficulty = normalizeDifficulty(p.difficulty);
  const players    = buildPlayers(p);

  return {
    size: Number(p.size ?? 3),
    kToWin: Number(p.kToWin ?? p.size ?? 3),
    startMark,
    mode,
    difficulty,
    turnTimerSec: Number(p.turnTimerSec) || 0,
    humanMark: p.humanMark ?? (mode === 'pve' ? startMark : undefined),
    players,
    // BE může ignorovat, ale ponecháme pro kompatibilitu
    playerName: normNick(p.playerName) ?? players?.X?.nickname ?? 'Player1',
  };
}

function maybeTraceNew(original, built) {
  if (typeof window === 'undefined' || !window.__TTT_DEBUG__) return;
  const id = ++__newSeq;
  console.groupCollapsed(`%c[ttt.new] #${id}`, 'color:#6cf;font-weight:bold');
  console.log('original:', original);
  console.log('built:', built);
  console.trace('call stack');
  console.groupEnd();
}

function guardThrottle() {
  const THR = Number(typeof window !== 'undefined' ? (window.__TTT_NEW_THROTTLE_MS ?? 800) : 800);
  const t = Date.now();
  if (t - __lastNewTs < THR) {
    console.warn('[ttt.new] blocked duplicate within', THR, 'ms');
    throw new Error('Duplicate /new blocked');
  }
  __lastNewTs = t;
}

// Pohodlné metody (syntactic sugar nad _fetch) — bezpečná verze NEW
ttt.new = (p = {}) => {
  guardThrottle();
  const body = buildNewPayload(p);
  maybeTraceNew(p, body);
  return ttt._fetch('/new', { method: 'POST', json: body });
};

ttt.status   = (id) => ttt._fetch(`/status/${encodeURIComponent(id)}`, { method: 'GET' });
ttt.play     = (p)  => ttt._fetch('/play',      { method: 'POST', json: p });
ttt.bestMove = (p)  => ttt._fetch('/best-move', { method: 'POST', json: p });
ttt.restart  = (p)  => ttt._fetch('/restart',   { method: 'POST', json: p });

// ───────────────────────── NEW: helpers pro konzistentní best-move ─────────────────────────

// Stavová poradna: server vždy vyhodnotí HARD (ignoruje klientskou difficulty).
// Tento helper explicitně NEposílá difficulty, aby to bylo jasné z volání.
ttt.bestMoveHard = ({ gameId }) => {
  if (!gameId) throw new Error('bestMoveHard: gameId is required');
  return ttt._fetch('/best-move', { method: 'POST', json: { gameId } });
};

// Stateless best-move – umožní ti testovat bota v jiné obtížnosti (např. easy).
// Očekává přesný tvar, nic neodvozujeme na FE (držíme se zásady „BE = source of truth“).
ttt.bestMoveStateless = ({ board, size, kToWin, player, difficulty }) => {
  if (!Array.isArray(board)) throw new Error('bestMoveStateless: board is required');
  return ttt._fetch('/best-move', {
    method: 'POST',
    json: {
      board,
      size: Number(size),
      kToWin: Number(kToWin),
      player: String(player ?? 'X').toUpperCase(),
      difficulty: normalizeDifficulty(difficulty),
    },
  });
};

// ───────────────────────── NEW: timeout lose (prohra na čas) ─────────────────────────
// Volá BE, aby ukončil hru jako "timeout". FE tak nefejkuje výsledek a drží se zdroje pravdy.
ttt.timeoutLose = ({ gameId, reason = 'time' }) => {
  if (!gameId) throw new Error('timeoutLose: gameId is required');
  // Pokud má BE jinou cestu, změň '/timeout-lose' (např. na '/timeout' nebo '/forfeit')
  return ttt._fetch('/timeout-lose', { method: 'POST', json: { gameId, reason } });
};

// Malé utilitky pro FE vrstvy (bez mutací, jen čtení)
export const dto = Object.freeze({
  // bezpečný „extractor“ pro explain z /best-move
  getExplainRich: (r) => r?.explainRich ?? null,
  // bezpečný „extractor“ pro explain z /play (autoplay bota)
  getAiExplainRich: (r) => r?.ai?.explainRich ?? null,
  // poslední AI tah (pokud byl)
  getAiMove: (r) => r?.aiMove ?? r?.ai?.move ?? null,
});
