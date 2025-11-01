// Frontend/src/App.jsx
import GamePage from './react/tic_tac_toe/pages/GamePage.jsx';

export default function App() {
  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: 12, fontWeight: 700 }}>
        ITU – Tic-Tac-Toe (dev shell)
      </header>
      <GamePage />
      <footer style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        If you see this footer, React render works. If the board is missing,
        open DevTools → Console/Network for errors.
      </footer>
    </div>
  );
}
