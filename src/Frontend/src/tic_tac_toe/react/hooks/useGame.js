/**
 * @file    useGame.js
 * @brief   Central Tic-Tac-Toe game hook.
 *
 * Encapsulates ALL game-side logic:
 *  - wraps the HTTP client (ttt.client.js) for /new, /status, /play, /best-move, /restart, /timeout-lose
 *  - manages `game` DTO in React state
 *  - exposes helpers for hints (best move), last AI move, and pending move
 *  - restores unfinished games from sessionStorage (`ttt.lastGameId`)
 *  - initializes new games from saved settings (`ttt.settings`)
 *  - implements spectator mode (AI vs AI) via SSE with a polling fallback - doesnt work
 *  - provides a safe frontend-only timeout fallback when backend call fails
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-13
 */

// src/tic_tac_toe/react/hooks/useGame.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { ttt } from '../../javascript/ttt.client.js';
import { Difficulty, Mode, StartMark } from '../../javascript/constants.js';
import { useLocation } from 'react-router-dom';

/**
 * Normalize mode value into a stable string: "pve" or "pvp".
 */
const normMode = (v) =>
    String(v ?? '').toLowerCase().includes('pve') ? 'pve' : 'pvp';

/**
 * Normalize difficulty field into "easy" | "medium" | "hard".
 */
const normDiff = (v) => {
    const s = String(v ?? '').toLowerCase();
    if (s.includes('hard')) return 'hard';
    if (s.includes('medium')) return 'medium';
    return 'easy';
};

/**
 * Normalize start mark into "X" | "O".
 * Defaults to "X" for invalid or missing values.
 */
const normStart = (v) =>
    String(v).toUpperCase() === 'O' ? 'O' : 'X';

/**
 * Extract X/O player nicknames from backend DTO
 */
function extractPlayers(playersDto) {
    const X = playersDto?.X || playersDto?.x;
    const O = playersDto?.O || playersDto?.o;
    return { x: X?.nickname ?? null, o: O?.nickname ?? null };
}

/**
 * Helper for /new payload
 */
function computePlayersForNew({ mode, players, playerName }) {
    const m = normMode(mode);
    const px =
        players?.X?.nickname ??
        players?.x?.nickname ??
        players?.X ??
        players?.x ??
        playerName ??
        'Player1';
    const po =
        players?.O?.nickname ??
        players?.o?.nickname ??
        players?.O ??
        players?.o ??
        (m === 'pve' ? 'Computer' : 'Player2');
    return { X: { nickname: String(px) }, O: { nickname: String(po) } };
}

/**
 * Main game hook.
 *
 * Exposes:
 *  - primary game DTO (`game`)
 *  - loading / error flags
 *  - move & hint helpers (play, bestMove, restart, timeoutLose, endAsTimeout)
 *  - newGame, initFromSettings (for settings page / resume)
 *  - spectator state + spectatorPlayAgain for AI vs AI mode
 */
export function useGame() {
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pendingMove, setPendingMove] = useState(null);
    const [hint, setHint] = useState(null); // { move, explain, explainRich, stats, analysis }

    // Last server-side autoplay (PvE) from /play
    const [lastAi, setLastAi] = useState(null);

    const location = useLocation();
    const didInitRef = useRef(false);

    // ───────────────────────── Spectator infrastructure ─────────────────────────
    // Live EventSource instance for SSE-based spectator mode.
    const esRef = useRef(null);
    const pollRef = useRef(null);
    const spectatorGameIdRef = useRef(null);

    // Remember last spectator configuration to support "Play again"
    const lastSpectatorCfgRef = useRef({
                                           size: 3,
                                           kToWin: 3,
                                           difficulty: 'easy',
                                           moveDelayMs: undefined,
                                       });

    const [difficulty, setDifficulty] = useState(Difficulty.EASY);
    const [mode, setMode] = useState(Mode.PVP);
    const [startMark, setStartMark] = useState(StartMark.X);
    const [players, setPlayers] = useState({ x: null, o: null });

    // Detect spectator route (/tic-tac-toe/spectate) from current location.
    const isSpectator = String(location?.pathname || '').includes(
        '/tic-tac-toe/spectate',
    );

    // Spectator-specific dynamic state
    const [specLastMove, setSpecLastMove] = useState(null); // { player,row,col }
    const [specExplain, setSpecExplain] = useState(null);
    const [specExplainRich, setSpecExplainRich] = useState(null);
    const [specStats, setSpecStats] = useState(null);

    // These are spectator-level, not only inside game DTO
    const [specStatus, setSpecStatus] = useState(null); // "running" | "win" | "draw" | "timeout" | ...
    const [specWinner, setSpecWinner] = useState(null); // "X" | "O" | null
    const [specWinningSequence, setSpecWinningSequence] = useState(null); // [[r,c], ...]

    /**
     * Build absolute SSE URL for spectator events.
     *
     * Behavior:
     *  - Takes REACT_APP_API_URL (if present) and uses only its origin.
     *  - Falls back to `window.location.origin` if env is not configured.
     *  - Resolves ttt.baseUrl (which may be relative or absolute) against the origin.
     *  - Returns `<base>/spectator/events?gameId=...`.
     */
    const buildSpectatorSseUrl = useCallback((gid) => {
        const envBase = process.env.REACT_APP_API_URL || '';

        let baseOrigin = '';

        // REACT_APP_API_URL is a full URL
        if (envBase && envBase.startsWith('http')) {
            try {
                baseOrigin = new URL(envBase).origin;
            } catch {
                baseOrigin = '';
            }
        }

        // Env is missing or invalid, fallback to the FE origin.
        if (!baseOrigin) {
            if (typeof window !== 'undefined') {
                baseOrigin = window.location.origin;
            } else {
                baseOrigin = 'http://localhost';
            }
        }

        // Client base URL
        const rawBaseUrl = ttt.baseUrl || '/api/tictactoe';

        // new URL:
        let fullBase;
        try {
            fullBase = new URL(rawBaseUrl, baseOrigin).toString();
        } catch {
            fullBase = rawBaseUrl;
        }
        fullBase = fullBase.replace(/\/+$/, '');

        const url = `${fullBase}/spectator/events?gameId=${encodeURIComponent(
            gid,
        )}`;

        if (typeof window !== 'undefined') {
            console.log('[useGame] spectator SSE URL =', url);
        }

        return url;
    }, []);

    /**
     * Close all active spectator streams:
     *  - EventSource (SSE)
     *  - polling interval (if any)
     */
    const closeSpectatorStreams = useCallback(() => {
        if (esRef.current) {
            try {
                esRef.current.close();
            } catch {
                // ignore
            }
            esRef.current = null;
        }
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    /**
     * Start periodic polling as a resilient fallback when SSE is not available. - SHOULDNT HAPPEN, KEPT JUST FOR FUTURE IMPROVEMENT (doesnt work properly)
     */
    const startSpectatorPolling = useCallback((gid) => {
        if (!gid) return;
        if (pollRef.current) return;

        pollRef.current = setInterval(async () => {
            try {
                const st = await ttt._fetch(
                    `/spectator/state?gameId=${encodeURIComponent(gid)}`,
                );
                const g = st?.game || st;
                if (g) {
                    setGame(g);
                    if (g?.players) setPlayers(extractPlayers(g.players));
                }

                const statusStr = String(
                    st?.status || st?.game?.status || g?.status || 'running',
                ).toLowerCase();

                setSpecStatus(statusStr || null);
                if ('winner' in st) {
                    setSpecWinner(st.winner);
                } else if ('winner' in (g || {})) {
                    setSpecWinner(g.winner);
                }

                if (Array.isArray(st?.winningSequence)) {
                    setSpecWinningSequence(st.winningSequence);
                } else if (Array.isArray(st?.winning_sequence)) {
                    setSpecWinningSequence(st.winning_sequence);
                }

                if (statusStr !== 'running') {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }
            } catch {
                // polling error
            }
        }, 1200);
    }, []);

    /**
     * Open SSE stream for spectator mode.
     *
     * Behavior:
     *  - closes previous streams
     *  - subscribes to "state", "move" and "end" events
     *  - keeps `game` and spectator state in sync
     *  - if SSE fails, falls back to polling on the same gameId
     */
    const openSpectatorStream = useCallback(
        (gid) => {
            if (!gid) return;
            closeSpectatorStreams();

            spectatorGameIdRef.current = gid;

            try {
                const es = new EventSource(buildSpectatorSseUrl(gid));
                esRef.current = es;

                // Full state snapshot
                es.addEventListener('state', (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        const g = data?.game || null;
                        if (g) {
                            setGame(g);
                            if (g?.players) setPlayers(extractPlayers(g.players));
                        }

                        if (typeof data?.status === 'string') {
                            setSpecStatus(data.status.toLowerCase());
                        } else if (g?.status) {
                            setSpecStatus(String(g.status).toLowerCase());
                        }

                        if ('winner' in (data || {})) {
                            setSpecWinner(data.winner);
                        } else if ('winner' in (g || {})) {
                            setSpecWinner(g.winner);
                        }

                        if (Array.isArray(data?.winningSequence)) {
                            setSpecWinningSequence(data.winningSequence);
                        } else if (Array.isArray(data?.winning_sequence)) {
                            setSpecWinningSequence(data.winning_sequence);
                        }
                    } catch {
                        // ignore parse error
                    }
                });

                // Incremental updates
                es.addEventListener('move', (e) => {
                    try {
                        const data = JSON.parse(e.data);

                        setGame((g) => {
                            if (!g) return g;
                            const next = {
                                ...g,
                                board: data?.board || g.board,
                                moves: Number.isFinite(data?.moves)
                                       ? data.moves
                                       : g.moves,
                            };

                            //  status/winner in move events
                            if (data?.status) {
                                next.status = data.status;
                            }
                            if ('winner' in data) {
                                next.winner = data.winner;
                            }
                            if (Array.isArray(data?.winningSequence)) {
                                next.winning_sequence = data.winningSequence;
                                next.winningSequence = data.winningSequence;
                            }

                            return next;
                        });

                        if (data?.status) {
                            setSpecStatus(String(data.status).toLowerCase());
                        }
                        if ('winner' in (data || {})) {
                            setSpecWinner(data.winner);
                        }
                        if (Array.isArray(data?.winningSequence)) {
                            setSpecWinningSequence(data.winningSequence);
                        }

                        setSpecLastMove({
                                            player: data?.player,
                                            row: data?.row,
                                            col: data?.col,
                                        });

                        setSpecExplain(data?.explain ?? null);
                        setSpecExplainRich(data?.explainRich ?? null);
                        setSpecStats(data?.stats ?? null);
                    } catch (err) {
                        console.warn('[useGame] SSE move parse ×', err);
                    }
                });

                // End event: final status and winner, then detach from SSE
                es.addEventListener('end', (e) => {
                    try {
                        const data = JSON.parse(e.data);

                        setGame((g) => {
                            if (!g) return g;
                            const next = {
                                ...g,
                                status: data?.status || g.status,
                                winner: data?.winner ?? g.winner,
                            };

                            if (Array.isArray(data?.winningSequence)) {
                                next.winning_sequence = data.winningSequence;
                                next.winningSequence = data.winningSequence;
                            }

                            return next;
                        });

                        if (data?.status) {
                            setSpecStatus(String(data.status).toLowerCase());
                        }
                        if ('winner' in (data || {})) {
                            setSpecWinner(data.winner);
                        }
                        if (Array.isArray(data?.winningSequence)) {
                            setSpecWinningSequence(data.winningSequence);
                        }
                    } catch {
                        // ignore
                    }

                    closeSpectatorStreams();
                });

                es.onerror = () => {
                    // SSE failed - fallback to polling
                    try {
                        es.close();
                    } catch {
                        // ignore
                    }
                    esRef.current = null;

                    const gidNow = spectatorGameIdRef.current;
                    startSpectatorPolling(gidNow);
                };
            } catch {
                // EventSource construction failed - polling fallback in case - SHOULDNT HAPPEN
                startSpectatorPolling(gid);
            }
        },
        [buildSpectatorSseUrl, closeSpectatorStreams, startSpectatorPolling],
    );

    /**
     * Create a new spectator match on backend and initialize local state.
     *
     * Used both on first entry to /spectate and for "Play again"
     */
    const createSpectatorGame = useCallback(
        async ({ size, kToWin, difficulty: diff, moveDelayMs }) => {
            const payload = {
                size: Number(size) || 3,
                kToWin: Number(kToWin) || 3,
                difficulty: diff || 'easy',
            };
            if (typeof moveDelayMs === 'number') {
                payload.moveDelayMs = moveDelayMs;
            }

            const base = (ttt.baseUrl || '/api/tictactoe').replace(/\/+$/, '');
            const url = `${base}/spectator/new`;

            // Debug – request
            console.log('[useGame] POST spectator/new →', url, payload);

            let init = {};
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    const err = new Error(
                        `Spectator /new failed: ${res.status} ${res.statusText} ${text}`,
                    );
                    console.warn('[useGame] spectator /new HTTP ×', err);
                    throw err;
                }

                const ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    try {
                        init = await res.json();
                    } catch (e) {
                        console.warn(
                            '[useGame] spectator/new JSON parse ×',
                            e,
                        );
                        init = {};
                    }
                } else {
                    console.warn(
                        '[useGame] spectator/new: non-JSON response, ct =',
                        ct,
                    );
                    init = {};
                }

                console.log('[useGame] spectator/new response =', init);
            } catch (err) {
                console.warn('[useGame] spectator /new network ×', err);
                throw err;
            }

            const st = init?.state || {};

            // Robustly extract gameId
            //  { gameId }, { id }, { state: { ... } }, { state: { game: { ... } } }, etc.
            const gid =
                init?.gameId ??
                init?.id ??
                st?.gameId ??
                st?.id ??
                st?.game?.id ??
                st?.game?.gameId ??
                null;

            // Reset spectator
            setSpecLastMove(null);
            setSpecExplain(null);
            setSpecExplainRich(null);
            setSpecStats(null);
            setSpecStatus('running');
            setSpecWinner(null);
            setSpecWinningSequence(null);

            if (st?.game) {
                const g = st.game;
                setGame(g);
                if (g?.players) setPlayers(extractPlayers(g.players));

                const statusStr = String(
                    st?.status || g?.status || 'running',
                ).toLowerCase();
                setSpecStatus(statusStr || null);

                if ('winner' in st) {
                    setSpecWinner(st.winner);
                } else if ('winner' in g) {
                    setSpecWinner(g.winner);
                }

                if (Array.isArray(st?.winningSequence)) {
                    setSpecWinningSequence(st.winningSequence);
                } else if (Array.isArray(st?.winning_sequence)) {
                    setSpecWinningSequence(st.winning_sequence);
                }
            } else {
                // Backend did not send state.game
                setGame(null);
            }

            if (!gid) {
                console.warn(
                    '[useGame] spectator/new: missing gameId in response, init =',
                    init,
                );
                return null;
            }

            // Reflect new gameId in the browser URL
            try {
                const urlObj = new URL(window.location.href);
                urlObj.searchParams.set('gameId', gid);
                window.history.replaceState({}, '', urlObj.toString());
            } catch {
                // ignore
            }

            return gid;
        },
        [],
    );

    // ───────────────────────── /new (standard game) ─────────────────────────
    /**
     * Create a brand new game (non-spectator).
     *
     * Normalizes payload for backend, updates global mode/difficulty/startMark,
     * resets transient state and persists lastGameId for resume-on-home.
     */
    const newGame = useCallback(
        async (p) => {
            const payload = {
                size: Number(p?.size ?? 3),
                kToWin: Number(p?.kToWin ?? p?.size ?? 3),
                mode: normMode(p?.mode ?? mode),
                startMark: normStart(p?.startMark ?? startMark),
                difficulty: normDiff(p?.difficulty ?? difficulty),
                humanMark: p?.humanMark,
                turnTimerSec: Number(p?.turnTimerSec) || 0,
                players: computePlayersForNew({
                                                  mode: p?.mode ?? mode,
                                                  players: p?.players,
                                                  playerName: p?.playerName,
                                              }),
                playerName: p?.playerName ?? undefined,
            };

            // Mirror current config
            setMode(payload.mode);
            setStartMark(payload.startMark);
            setDifficulty(payload.difficulty);

            setLoading(true);
            setError(null);
            setHint(null);
            setPendingMove(null);
            setLastAi(null);
            try {
                const dto = await ttt.new(payload);
                const g = dto?.game ?? dto;
                setGame(g);
                sessionStorage.setItem('ttt.lastGameId', g.id);
                if (g?.players) setPlayers(extractPlayers(g.players));
            } catch (e) {
                console.warn('[useGame] newGame() ×', e);
                setError(e?.message || 'New game failed');
            } finally {
                setLoading(false);
            }
        },
        [mode, startMark, difficulty],
    );

    // ───────────────────────── init-from-settings ─────────────────────────
    /**
     * Initialize a game based on previously saved settings (`ttt.settings`),
     * Returns:
     *  - true  if a new game was successfully started from settings.
     *  - false if there was no saved config or parsing failed.
     */
    const initFromSettings = useCallback(
        () => {
            if (game) return true;
            const raw = sessionStorage.getItem('ttt.settings');
            if (!raw) return false;
            try {
                const cfg = JSON.parse(raw);
                const m = normMode(cfg?.mode);
                const sm = normStart(cfg?.startMark);
                const df = normDiff(cfg?.difficulty);
                setMode(m);
                setStartMark(sm);
                setDifficulty(df);

                const playerName =
                    cfg?.playerName ??
                    cfg?.players?.X?.nickname ??
                    cfg?.players?.x?.nickname ??
                    cfg?.players?.X ??
                    cfg?.players?.x ??
                    undefined;

                void newGame({
                                 size: cfg?.size,
                                 kToWin: cfg?.kToWin ?? cfg?.size,
                                 mode: cfg?.mode,
                                 startMark: cfg?.startMark,
                                 difficulty: cfg?.difficulty,
                                 turnTimerSec: cfg?.timer?.enabled
                                               ? cfg?.timer?.seconds
                                               : 0,
                                 humanMark: cfg?.humanMark,
                                 playerName,
                                 players: cfg?.players ?? undefined,
                             });
                return true;
            } catch (e) {
                console.warn('[useGame] initFromSettings ×', e);
                sessionStorage.removeItem('ttt.settings');
                return false;
            }
        },
        [game, newGame],
    );

    /**
     *  - If  on /spectate, set up spectator mode.
     *  - Otherwise (GamePage), resume from lastGameId if possible,
     *    or create a fresh game
     */
    useEffect(() => {
        // ───────── 1) Spectator init (AI vs AI, SSE) ─────────
        if (isSpectator) {
            (async () => {
                try {
                    setLoading(true);

                    const qp = new URLSearchParams(location.search);
                    let gid = qp.get('gameId') || qp.get('gid') || null;

                    if (!gid) {
                        const size = Number(qp.get('size')) || 3;
                        const kToWin =
                            Number(qp.get('kToWin') || qp.get('k_to_win')) ||
                            Math.min(size, 3);
                        const diff = qp.get('difficulty') || 'easy';
                        const mdStr = qp.get('moveDelayMs');
                        const md =
                            mdStr != null
                            ? Math.max(0, Number(mdStr) || 0)
                            : undefined;

                        lastSpectatorCfgRef.current = {
                            size,
                            kToWin,
                            difficulty: diff,
                            moveDelayMs: md,
                        };

                        gid = await createSpectatorGame({
                                                            size,
                                                            kToWin,
                                                            difficulty: diff,
                                                            moveDelayMs: md,
                                                        });
                    } else {
                        spectatorGameIdRef.current = gid;
                    }

                    if (gid) {
                        openSpectatorStream(gid);
                    }
                } catch (e) {
                    console.warn('[useGame] spectator init ×', e);
                } finally {
                    setLoading(false);
                }
            })();

            // Clean up when navigating away from /spectate
            return () => {
                closeSpectatorStreams();
            };
        }

        // ───────── 2) Standard init (home = GamePage) ─────────
        if (didInitRef.current) return;
        didInitRef.current = true;

        const search = new URLSearchParams(location.search);
        const forceFresh =
            search.get('fresh') === '1' ||
            search.get('fresh') === 'true';

        const gid = search.get('gid');
        const storedLastId = sessionStorage.getItem('ttt.lastGameId');
        const lastId = gid || storedLastId;

        /**
         * Helper: start a brand new game using settings or default values.
         */
        const startFresh = () => {
            const ok = initFromSettings();
            if (ok) return;

            void newGame({
                             size: 3,
                             kToWin: 3,
                             mode,
                             startMark,
                             difficulty,
                         });
        };

        if (forceFresh) {
            sessionStorage.removeItem('ttt.lastGameId');
            try {
                const u = new URL(window.location.href);
                u.searchParams.delete('fresh');
                u.searchParams.delete('gid');
                window.history.replaceState(window.history.state, '', u.toString());
            } catch {
                // ignore
            }

            startFresh();
            return;
        }

        // Try to resume the last running game
        if (lastId) {
            (async () => {
                try {
                    setLoading(true);
                    const dto = await ttt.status(lastId);
                    const g = dto?.game ?? dto;

                    const rawStatus = g?.status || g?.game?.status || 'running';
                    const status = String(rawStatus).toLowerCase();
                    const running = status === 'running';

                    if (running) {
                        setGame(g);
                        if (g?.id) {
                            sessionStorage.setItem('ttt.lastGameId', g.id);
                        }
                        setMode(g?.mode || Mode.PVP);
                        setStartMark(
                            g?.startMark || StartMark.X,
                        );
                        setDifficulty(g?.difficulty || Difficulty.EASY);
                        if (g?.players) setPlayers(extractPlayers(g.players));
                        return;
                    }

                    // Game is finished
                    sessionStorage.removeItem('ttt.lastGameId');
                    startFresh();
                } catch (e) {
                    console.warn('[useGame] resume/status ×', e);
                    sessionStorage.removeItem('ttt.lastGameId');
                    startFresh();
                } finally {
                    setLoading(false);
                }
            })();
        } else {
            startFresh();
        }
    }, [location.search, isSpectator]);

    /**
     * Public: start a new spectator game with the last used configuration.
     */
    const spectatorPlayAgain = useCallback(
        async () => {
            if (!isSpectator) return;

            closeSpectatorStreams();

            // Reset transient spectator state.
            setSpecLastMove(null);
            setSpecExplain(null);
            setSpecExplainRich(null);
            setSpecStats(null);
            setSpecStatus('running');
            setSpecWinner(null);
            setSpecWinningSequence(null);

            const {
                size,
                kToWin,
                difficulty: diff,
                moveDelayMs: md,
            } = lastSpectatorCfgRef.current || {};

            try {
                const gid = await createSpectatorGame({
                                                          size: Number(size) || 3,
                                                          kToWin: Number(kToWin) || 3,
                                                          difficulty: diff || 'easy',
                                                          moveDelayMs:
                                                              typeof md === 'number' ? md : undefined,
                                                      });

                if (gid) {
                    openSpectatorStream(gid);
                }
            } catch (e) {
                console.warn('[useGame] spectatorPlayAgain ×', e);
            }
        },
        [
            isSpectator,
            closeSpectatorStreams,
            createSpectatorGame,
            openSpectatorStream,
        ],
    );

    // ───────────────────────── /play ─────────────────────────
    /**
     * Perform a player move (row, col).
     *
     * Steps:
     *  1) Validate game is running and the cell is inside the board + empty.
     *  2) Mark `pendingMove` so the UI can show a ghost move while waiting.
     *  3) Call backend /play and adopt the returned game DTO.
     *  4) Store AI autoplay metadata
     */
    const play = useCallback(
        async ({ row, col }) => {
            if (!game) return;

            const size = game?.size ?? game?.board?.length ?? 0;
            const running =
                String(game?.status || '').toLowerCase() === 'running';
            const inBoundsRaw =
                Number.isInteger(row) &&
                Number.isInteger(col) &&
                row >= 0 &&
                col >= 0 &&
                row < size &&
                col < size;
            const cellVal = game?.board?.[row]?.[col];
            const emptyRaw = cellVal === '.';

            if (!running || !inBoundsRaw || !emptyRaw) {
                setError('Invalid move');
                return;
            }

            setPendingMove({ row, col, mark: String(game.player ?? 'X').toUpperCase() });
            setLoading(true);
            setError(null);

            try {
                // Backend may immediately return bot autoplay + explainRich
                const played = await ttt.play({gameId: game.id, row, col, });
                const g1 = played?.game ?? played;
                setGame(g1);
                if (g1?.players) setPlayers(extractPlayers(g1.players));
                setHint(null);
                setLastAi(played?.ai || null);
            } catch (e) {
                console.warn('[useGame] play() ×', e);
                setError(e?.message || 'Play failed');
            } finally {
                setPendingMove(null);
                setLoading(false);
            }
        },
        [game],
    );

    // ───────────────────────── /best-move (HARD helper) ─────────────────────────
    /**
     * Internal helper: request best move from backend (HARD difficulty),
     * update hint state and return the parsed payload.
     */
    const requestBestMove = useCallback(
        async () => {
            if (!game) throw new Error('No active game');

            const dto = await ttt.bestMoveHard({ gameId: game.id });

            const move = Array.isArray(dto?.move) ? dto.move : null;
            const explain = dto?.explain ?? dto?.meta ?? '';
            const explainRich = dto?.explainRich ?? null;
            const stats = dto?.stats ?? null;
            const analysis = dto?.analysis ?? null;

            if (move) {
                setHint({ move, explain, explainRich, stats, analysis });
            } else {
                setHint(null);
            }

            return { move, explain, explainRich, stats, analysis };
        },
        [game],
    );

    const getBestMove = requestBestMove;

    /**
     * Public wrapper around requestBestMove
     */
    const bestMove = useCallback(
        async () => {
            if (!game) return null;
            setLoading(true);
            setError(null);
            try {
                return await requestBestMove();
            } catch (e) {
                console.warn('[useGame] bestMove() ×', e);
                setError(e?.message || 'Best-move failed');
                throw e;
            } finally {
                setLoading(false);
            }
        },
        [game, requestBestMove],
    );

    // ───────────────────────── /restart ─────────────────────────
    /**
     * Restart game on backend, resetting the board but keeping configuration
     * (size, K, mode, etc.).
     */
    const restart = useCallback(
        async () => {
            if (!game) return;
            setLoading(true);
            setError(null);
            setHint(null);
            setPendingMove(null);
            setLastAi(null);
            try {
                const dto = await ttt.restart({ gameId: game.id });
                const g = dto?.game ?? dto;
                setGame(g);
                if (g?.players) setPlayers(extractPlayers(g.players));
                sessionStorage.setItem('ttt.lastGameId', g.id);
            } catch (e) {
                console.warn('[useGame] restart() ×', e);
                setError(e?.message || 'Restart failed');
            } finally {
                setLoading(false);
            }
        },
        [game],
    );

    // ───────────────────────── Timeout ─────────────────────────
    /**
     * Pure frontend timeout resolution.
     */
    const endAsTimeout = useCallback((whoTimedOut) => {
        setGame((g) => {
            if (!g) return g;
            const alreadyEnded =
                String(g.status || '').toLowerCase() !== 'running';
            if (alreadyEnded) return g;

            const current = String(
                whoTimedOut ?? g.player ?? 'X',
            ).toUpperCase();
            const winner = current === 'X' ? 'O' : 'X';
            return { ...g, status: 'timeout', winner };
        });
    }, []);

    /**
     * Backend timeout handler:
     */
    const timeoutLose = useCallback(
        async () => {
            if (!game) return;
            try {
                if (ttt?.timeoutLose) {
                    const dto = await ttt.timeoutLose({ gameId: game.id });
                    const g = dto?.game ?? dto;
                    if (g) {
                        setGame(g);
                        if (g?.players) {
                            setPlayers(extractPlayers(g.players));
                        }
                        sessionStorage.setItem('ttt.lastGameId', g.id);
                        return;
                    }
                }
            } catch (e) {
                console.warn(
                    '[useGame] timeoutLose() BE × → fallback FE',
                    e,
                );
            }

            // Purely local timeout
            setGame((g) => {
                if (!g) return g;
                if (
                    String(g.status || '').toLowerCase() !==
                    'running'
                ) {
                    return g;
                }
                const current = String(g.player ?? 'X').toUpperCase();
                const winner = current === 'X' ? 'O' : 'X';
                return { ...g, status: 'timeout', winner };
            });
        },
        [game],
    );

    return {
        game,
        loading,
        error,
        pendingMove,
        hint,
        lastAi,
        difficulty,
        mode,
        startMark,
        players,
        setDifficulty,
        setMode,
        setStartMark,
        newGame,
        initFromSettings,
        play,
        bestMove,
        requestBestMove,
        getBestMove,
        restart,

        // Timeout API
        timeoutLose,
        endAsTimeout,

        // Spectator API
        isSpectator,
        spectator: {
            lastMove: specLastMove,
            explain: specExplain,
            explainRich: specExplainRich,
            stats: specStats,
            status: specStatus,
            winner: specWinner,
            winningSequence: specWinningSequence,
        },
        spectatorPlayAgain,
    };
}
