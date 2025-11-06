// Frontend/src/react/react/shared/env.js

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

