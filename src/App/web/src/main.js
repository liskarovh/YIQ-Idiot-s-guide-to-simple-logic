document.querySelector('#app').innerHTML = `
  <h1>IS Project</h1>
  <button id="btn">Fetch /api/time</button>
  <pre id="out"></pre>
`;
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
document.getElementById('btn').onclick = async () => {
    const r = await fetch(`${API}/api/time`);
    document.getElementById('out').textContent = JSON.stringify(await r.json(), null, 2);
};
