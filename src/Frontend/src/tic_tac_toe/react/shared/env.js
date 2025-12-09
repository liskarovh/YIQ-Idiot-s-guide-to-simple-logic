// Produkční origin backendu na App Service:
const PROD_BACKEND_ORIGIN = 'https://itu-backend-e6b3a9ckgsdtekd3.westeurope-01.azurewebsites.net';

export function getApiBaseUrl() {
  const hasProcEnv = typeof process !== 'undefined' && process?.env;
  const fromEnv = hasProcEnv ? process.env.REACT_APP_API_URL : '';

  const isBrowser = typeof window !== 'undefined';
  const host = isBrowser ? window.location.hostname : '';
  const isSwaHost = /\.azurestaticapps\.net$/i.test(host);

  // 1) Pokud běžíme na SWA, vždy použij App Service backend (žádná env proměnná netřeba)
  // 2) Jinak zkus env proměnnou (když budeš chtít v budoucnu),
  // 3) Jinak fallback: local dev origin.
  let origin = isSwaHost
    ? PROD_BACKEND_ORIGIN
    : (fromEnv && String(fromEnv).trim()) || (isBrowser ? window.location.origin : 'http://localhost:5000');

  origin = origin.replace(/\/+$/, '');
  return `${origin}/api/tictactoe`;
}
