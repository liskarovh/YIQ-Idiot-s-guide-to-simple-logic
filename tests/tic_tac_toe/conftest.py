# tests/react/conftest.py
import sys
from pathlib import Path
import pytest

# ───────────────────────── locate repo root ─────────────────────────
# Hledáme adresář, který obsahuje 'src/Backend/app.py'
HERE = Path(__file__).resolve()
p = HERE.parent
repo_root = None
for _ in range(12):  # pár úrovní stačí
    if (p / "src" / "Backend" / "app.py").exists():
        repo_root = p
        break
    p = p.parent

if repo_root is None:
    raise RuntimeError("Repo root not found – očekávám src/Backend/app.py někde nad tests/")

BACKEND_ROOT = repo_root / "src" / "Backend"

# Přidej cesty do sys.path pro importy `app` a `react`
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

# ───────────────────────── imports after path setup ─────────────────────────
from app import app as flask_app  # src/Backend/app.py musí exportovat `app`
from tic_tac_toe import service as svc


@pytest.fixture(scope="session")
def app():
    """Sdílená Flask app pro testy."""
    flask_app.config.update(TESTING=True)
    return flask_app


@pytest.fixture(autouse=True)
def _reset_store():
    """
    Před každým testem vyčisti in-memory úložiště, pokud je aktivní fallback.
    Díky tomu jsou testy nezávislé (ID hry můžou být různé, ale stav se nepropíjí).
    """
    try:
        if hasattr(svc, "_MEM"):
            svc._MEM.clear()
    except Exception:
        pass
    yield


@pytest.fixture()
def client(app):
    """HTTP klient pro volání Flask endpointů v testech."""
    return app.test_client()
