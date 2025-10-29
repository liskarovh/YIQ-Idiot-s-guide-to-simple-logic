# tests/tic_tac_toe/conftest.py
import os
import sys
from pathlib import Path
import pytest

# --- Najdi kořen repa (adresář, který obsahuje 'src/Backend/app.py') ---
HERE = Path(__file__).resolve()
p = HERE
repo_root = None
for _ in range(8):  # stačí pár úrovní nahoru
    if (p / "src" / "Backend" / "app.py").exists():
        repo_root = p
        break
    p = p.parent

if repo_root is None:
    raise RuntimeError("Repo root not found – expected src/Backend/app.py somewhere above tests/")

BACKEND_ROOT = str(repo_root / "src" / "Backend")

# --- Přidej src/Backend do sys.path, aby šly importy 'app' a 'tic_tac_toe' ---
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

# (Volitelné) Přidej i kořen repa – některým IDE to pomůže s „unresolved reference“
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

# --- Teď už můžeme importovat app a tic_tac_toe ---
from app import app as flask_app  # src/Backend/app.py – musí existovat
# rychlá sanity – nepovinné:
# import tic_tac_toe  # pokud chceš mít jistotu, že balík je vidět

@pytest.fixture(scope="session")
def app():
    flask_app.config.update(TESTING=True)
    return flask_app

@pytest.fixture()
def client(app):
    return app.test_client()
