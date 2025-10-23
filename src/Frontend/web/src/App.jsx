import React, { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''  // pokud prázdné, volá same-origin

export default function App() {
    const [health, setHealth] = useState(null)
    const [time, setTime] = useState(null)
    const [err, setErr] = useState(null)

    const call = async (path, setter) => {
        setErr(null)
        setter(null)
        try {
            const res = await fetch(`${API_BASE}${path}`)
            const json = await res.json()
            setter(json)
        } catch (e) {
            setErr(String(e))
        }
    }

    return (
        <div style={{fontFamily:'system-ui, sans-serif', padding: 24, lineHeight: 1.4}}>
            <h1>IS Frontend (Vite + React)</h1>
            <p>Backend URL: <code>{API_BASE || '(same origin)'}</code></p>
            <div style={{display: 'flex', gap: 8, marginBottom: 16}}>
                <button onClick={() => call('/api/health', setHealth)}>Test /api/health</button>
                <button onClick={() => call('/api/time', setTime)}>Test /api/time</button>
            </div>
            {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
            {time && <pre>{JSON.stringify(time, null, 2)}</pre>}
            {err && <pre style={{color: 'crimson'}}>{err}</pre>}
        </div>
    )
}
