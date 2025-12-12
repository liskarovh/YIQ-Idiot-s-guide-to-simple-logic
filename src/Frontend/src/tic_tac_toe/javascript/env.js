/**
 * @file    env.js
 * @brief   Shared environment helper for resolving the Tic-Tac-Toe API base URL.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

const PROD_BACKEND_ORIGIN =
        'https://itu-backend-e6b3a9ckgsdtekd3.westeurope-01.azurewebsites.net';

/**
 * Returns the base URL for the Tic-Tac-Toe API depending on the current host:
 * - Azure Static Web Apps frontend - fixed backend origin
 * - Local development (localhost/127.x/192.168.x) - same host on port 5000
 */
export function getApiBaseUrl() {
    const isBrowser = typeof window !== 'undefined';
    const host = isBrowser ? window.location.hostname : '';

    // Production: Static Web Apps frontend - fixed backend origin
    if (isBrowser && /\.azurestaticapps\.net$/i.test(host)) {
        const origin = PROD_BACKEND_ORIGIN.replace(/\/+$/, '');
        return `${origin}/api/tictactoe`;
    }

    // Local development: frontend on localhost/127.x/192.168.x - backend on same host:5000
    if (
        isBrowser &&
        (host === 'localhost' ||
         host === '127.0.0.1' ||
         /^192\.168\./.test(host))
    ) {
        const origin = `http://${host}:5000`;
        return `${origin}/api/tictactoe`;
    }

    // Fallback: same origin in browser, PROD_BACKEND_ORIGIN on server/tests
    const origin = isBrowser
                   ? window.location.origin.replace(/\/+$/, '')
                   : PROD_BACKEND_ORIGIN.replace(/\/+$/, '');
    return `${origin}/api/tictactoe`;
}

export { PROD_BACKEND_ORIGIN };
