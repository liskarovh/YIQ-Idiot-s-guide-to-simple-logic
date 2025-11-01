// Frontend/src/react/tic_tac_toe/shared/env.js

const DEFAULT_API =
  (typeof window !== 'undefined' && window.location?.origin)
    ? `${window.location.origin}/api/tictactoe`
    : '/api/tictactoe';

export function getApiBaseUrl() {
  const hasProcEnv = (typeof process !== 'undefined') && process && process.env;
  const url = hasProcEnv && process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL
    : DEFAULT_API;
  return String(url).replace(/\/+$/, '');
}

export function getBuildInfo() {
  const hasProcEnv = (typeof process !== 'undefined') && process && process.env;
  const commit = hasProcEnv ? process.env.REACT_APP_BUILD_COMMIT : null;
  const pr     = hasProcEnv ? process.env.REACT_APP_BUILD_PR     : null;
  const env    = hasProcEnv ? process.env.REACT_APP_ENV          : null;
  return { commit, pr, env };
}
