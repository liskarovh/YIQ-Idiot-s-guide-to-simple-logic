// Tenoučký adapter pro React vrstvu: vytvoří klienta s baseUrl z ENV,
// zapne HTTP debug logy a reexportuje čisté validátory (bez AI).

import { getApiBaseUrl } from '../shared/env.js';

// Import přímo z našich sdílených JS modulů (ne přes index.js)
import { createTttClient } from '../../../javascript/tic_tac_toe/client.js';
import { inBounds, isCellEmpty, isRunning } from '../../../javascript/tic_tac_toe/validator.js';

// Jedna sdílená instance klienta pro celou app
export const ttt = createTttClient({ baseUrl: getApiBaseUrl() });

// Debug: ukaž, na jaké API míříme, a vyexportuj klienta do window pro ruční testy
console.log('[ENV] API baseUrl =', ttt.baseUrl);
if (typeof window !== 'undefined') {
  window.__ttt = ttt; // v konzoli pak můžeš volat: __ttt.new({...}), __ttt.play({...}), ...
}

// Debug wrapper: loguj každý HTTP call (request/response/error)
if (!ttt._debugWrapped) {
  const origFetch = ttt._fetch;
  ttt._debugWrapped = true;
  ttt._fetch = async (pathOrArgs, opts) => {
    console.log('[HTTP →]', pathOrArgs, opts || {});
    try {
      const json = await origFetch(pathOrArgs, opts);
      console.log('[HTTP ←]', json);
      return json;
    } catch (e) {
      console.warn('[HTTP ×]', e);
      throw e;
    }
  };
}

// Reexport validátorů pro React (sjednocení názvu isCellEmpty → isEmpty)
export { inBounds, isCellEmpty as isEmpty, isRunning };
