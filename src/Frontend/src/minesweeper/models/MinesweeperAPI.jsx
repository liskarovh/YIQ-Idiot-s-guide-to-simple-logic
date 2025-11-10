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

function buildUrl(base, path) {
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${cleanBase}/${cleanPath}`;
}

export async function getJson(base, path, {signal} = {}) {
    const headers = {
        Accept: "application/json"
    };

    const url = buildUrl(base, path);
    const resp = await fetch(url, {
        method: "GET",
        headers,
        signal
    });

    const body = await readJsonSafe(resp);

    if(!resp.ok) {
        throw toUnifiedError(resp, body);
    }

    return body;
}

export async function postJson(base, path, payload, {signal, idempotencyKey} = {}) {
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json"
    };
    if(idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
    }

    const url = buildUrl(base, path);
    const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal
    });
    const body = await readJsonSafe(resp);
    if(!resp.ok) {
        throw toUnifiedError(resp, body);
    }

    const location = resp.headers.get("Location") || null;
    return {view: body, location};
}
