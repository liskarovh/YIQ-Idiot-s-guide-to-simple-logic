
export async function createGame(baseUrl, payload) {
    const res = await fetch(`${baseUrl}/game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    console.log("[SettingsView] handlePlay response status:", res.status);

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        console.error("[SettingsView] handlePlay error response:", error);

        throw new Error(error?.error || `HTTP ${res.status}`);
    }
    return res.json();
}

export function persistUiPrefs(gameId, uiPrefs) {
    localStorage.setItem(`ms:uiPrefs:${gameId}`, JSON.stringify(uiPrefs));
}

export function persistLastCreate(createPayload) {
    localStorage.setItem("ms:lastCreate", JSON.stringify(createPayload));
}
