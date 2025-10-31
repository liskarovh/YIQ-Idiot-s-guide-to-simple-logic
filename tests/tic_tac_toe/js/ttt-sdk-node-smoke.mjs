// ttt-sdk-node-smoke.mjs
// Minimal E2E smoke against local Flask backend.
// Usage: node ttt-sdk-node-smoke.mjs [baseUrl]
// Default baseUrl: http://127.0.0.1:5000

const BASE = process.argv[2] || "http://127.0.0.1:5000";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { json = { __raw: txt }; }
  return { status: res.status, json };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { json = { __raw: txt }; }
  return { status: res.status, json };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

(async () => {
  console.log(`[SMOKE] Base = ${BASE}`);

  // 1) NEW
  const rNew = await post("/api/tictactoe/new", { size: 3, kToWin: 3 });
  console.log("[NEW]", rNew.status, rNew.json);
  assert(rNew.status === 200, "NEW should be 200");
  const gid = rNew.json?.game?.id;
  assert(typeof gid === "string", "NEW must return game.id");

  // 2) PLAY (X 0,0)
  const rPlay = await post("/api/tictactoe/play", { gameId: gid, row: 0, col: 0 });
  console.log("[PLAY]", rPlay.status, rPlay.json);
  assert(rPlay.status === 200, "PLAY should be 200");
  assert(rPlay.json?.game?.board?.[0]?.[0] === "X", "Cell (0,0) should be X");
  assert(rPlay.json?.game?.player === "O", "Player should toggle to O");

  // 3) BEST-MOVE (stateful)
  const rBm = await post("/api/tictactoe/best-move", { gameId: gid, difficulty: "easy" });
  console.log("[BEST-MOVE]", rBm.status, rBm.json);
  assert(rBm.status === 200, "BEST-MOVE should be 200");
  const mv = rBm.json?.move;
  assert(Array.isArray(mv) && mv.length === 2, "BEST-MOVE must return [row, col]");
  assert(typeof rBm.json?.stats?.elapsedMs === "number", "elapsedMs number");
  assert(typeof rBm.json?.version === "string", "version string");
  assert(typeof rBm.json?.analysis === "object" && typeof rBm.json?.explain === "string", "analysis & explain present");
  assert(rBm.json?.meta?.difficulty === "easy", "meta.difficulty should echo");

  // 4) STATUS
  const rSt = await get(`/api/tictactoe/status/${gid}`);
  console.log("[STATUS]", rSt.status, rSt.json);
  assert(rSt.status === 200, "STATUS should be 200");
  assert(rSt.json?.game?.id === gid, "STATUS must return same id");

  console.log("✅ Node smoke test OK");
  process.exit(0);
})().catch(err => {
  console.error("❌ Smoke failed:", err?.stack || err);
  process.exit(1);
});