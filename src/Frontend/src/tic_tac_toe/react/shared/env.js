// Frontend/src/tic_tac_toe/react/shared/env.js

// Cíl: vzít BACKEND origin z REACT_APP_API_URL (stejně jako Sudoku)
// a zajistit, že výsledkem bude vždy BASE = "<origin>/api/tictactoe".

export function getApiBaseUrl() {
  const hasProcEnv = (typeof process !== 'undefined') && process?.env;

  // 1) vezmeme backend origin ze stejné proměnné jako Sudoku
  let origin = hasProcEnv && process.env.REACT_APP_API_URL
    ? String(process.env.REACT_APP_API_URL)
    : (typeof window !== 'undefined' && window.location?.origin)
        ? String(window.location.origin)
        : '';

  origin = origin.replace(/\/+$/, '');

  // 2) zajistíme, že je tam cesta /api/tictactoe (jednou, ne víckrát)
  let url = origin;
  if (!/\/api\/tictactoe\/?$/.test(url)) {
    url = `${origin}/api/tictactoe`;
  }
  return url.replace(/\/+$/, '');
}
