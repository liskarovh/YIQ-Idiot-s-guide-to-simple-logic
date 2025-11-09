function readJsonSafe(resp) {
    const ct = resp.headers.get("content-type") || "";
    if(ct.includes("application/json")) {
        return resp.json();
    }
    return Promise.resolve(null);
}

function toUnifiedError(resp, body) {
    if(body && typeof body === "object" && ("code" in body || "message" in body)) {
        return {code: body.code || `http_${resp.status}`, message: body.message || resp.statusText, details: body.details || null, status: resp.status};
    }
    return {code: `http_${resp.status}`, message: resp.statusText || "Request failed", details: body, status: resp.status};
}

export async function getCapabilities(base, {signal} = {}) {
    const resp = await fetch(`${base}/capabilities`, {method: "GET", headers: {Accept: "application/json"}, signal});
    const body = await readJsonSafe(resp);
    if(!resp.ok) {
        throw toUnifiedError(resp, body);
    }
    return body; // authoritative caps from server
}

export async function createGame(base, payload, {signal, idempotencyKey} = {}) {
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json"
    };
    if(idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
    }


    const resp = await fetch(`${base}/game`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal
    });
    const body = await readJsonSafe(resp);
    if(!resp.ok) {
        throw toUnifiedError(resp, body);
    }


    // Honor semantics: 201 + Location
    const location = resp.headers.get("Location") || null;
    return {view: body, location};
}

export function persistUiPrefs(gameId, uiPrefs) {
    localStorage.setItem(`ms:uiPrefs:${gameId}`, JSON.stringify(uiPrefs));
}

export function persistLastCreate(createPayload) {
    localStorage.setItem("ms:lastCreate", JSON.stringify(createPayload));
}
