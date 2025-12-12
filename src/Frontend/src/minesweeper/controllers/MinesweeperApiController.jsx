import {ApiClient, API_BASE} from "../models/MinesweeperApiClient";

function buildUrl(path) {
    const cleanBase = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${cleanBase}/${cleanPath}`;
}

function readJsonSafe(response) {
    let contentType = "";
    if(response && response.headers) {
        if(typeof response.headers.get === "function") {
            contentType = response.headers.get("content-type") || response.headers.get("Content-Type") || "";
        }
        else {
            contentType = response.headers["content-type"] || response.headers["Content-Type"] || "";
        }
    }

    // Check if content type is JSON
    if(contentType.includes("application/json")) {
        return response.data;
    }

    // Else, not JSON
    return null;
}

function toUnifiedError(response, body) {
    const status = response && response.status ? response.status : 0;
    const statusMessage = response && response.statusText ? response.statusText : "Request failed";

    // Check if body contains code/message
    if(body && typeof body === "object" && ("code" in body || "message" in body)) {
        return {
            code: body.code || `http_${status}`,
            message: body.message || statusMessage,
            details: body.details || null,
            status
        };
    }

    // Fallback to HTTP status
    return {
        code: `http_${status}`,
        message: statusMessage,
        details: body,
        status
    };
}

function generateIdempotencyKey() {
    return crypto?.randomUUID
           ? crypto.randomUUID()
           : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function MinesweeperApiController() {
    async function getJson(path, {params, signal} = {}) {
        const headers = {
            Accept: "application/json"
        };
        let url = buildUrl(path);

        // Build query string from params object
        if(params && typeof params === "object") {
            const urlSearchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if(value === undefined || value === null) {
                    return;
                }
                if(Array.isArray(value)) {
                    value.forEach(value => {
                        urlSearchParams.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
                    });
                }
                else if(typeof value === "object") {
                    urlSearchParams.append(key, JSON.stringify(value));
                }
                else {
                    urlSearchParams.append(key, String(value));
                }
            });

            // Append query string to URL
            const queryString = urlSearchParams.toString();
            if(queryString) {
                url += (url.includes("?") ? "&" : "?") + queryString;
            }
        }

        try {
            const response = await ApiClient.get(url, {headers, signal});
            const body = readJsonSafe(response);

            if(!(response.status >= 200 && response.status < 300)) {
                throw toUnifiedError(response, body);
            }

            return body;
        }
        catch(e) {
            if(e && e.response) {
                throw toUnifiedError(e.response, readJsonSafe(e.response));
            }
            throw e;
        }
    }

    async function postJson(path, payload, {signal} = {}) {
        // Prepare headers
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Idempotency-Key": generateIdempotencyKey()
        };

        // Build full URL
        const url = buildUrl(path);

        // Ensure we send a JSON string; if payload undefined, send empty object {}
        const bodyToSend = typeof payload === "string" ? payload : JSON.stringify(payload === undefined ? {} : payload);

        // Make POST request
        try {
            const response = await ApiClient.post(url, bodyToSend, {headers, signal});
            const body = readJsonSafe(response);

            if(!(response.status >= 200 && response.status < 300)) {
                throw toUnifiedError(response, body);
            }

            // Extract Location header if present
            let location = null;
            if(response && response.headers) {
                if(typeof response.headers.get === "function") {
                    location = response.headers.get("location") || response.headers.get("Location") || null;
                }
                else {
                    location = response.headers["location"] || response.headers["Location"] || null;
                }
            }

            return {
                view: body,
                location
            };
        }
        catch(e) {
            if(e && e.response) {
                throw toUnifiedError(e.response, readJsonSafe(e.response));
            }
            throw e;
        }
    }

    function isAbortLikeError(e) {
        if(!e) {
            return false;
        }
        return e.name === "AbortError"
               || e.name === "CanceledError"
               || e.message === "canceled"
               || e.code === "ERR_CANCELED";
    }

    return {
        // Methods
        getJson,
        postJson,

        // Utilities
        isAbortLikeError
    };
}
