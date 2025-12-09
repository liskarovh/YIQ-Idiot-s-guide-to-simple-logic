from flask import Blueprint, request, Response
import os
import json
import urllib.request
import urllib.error
import logging

# Logger setup for improved diagnostics
logger = logging.getLogger(__name__)

# Blueprint for the minesweeper routes
minesweeper_bp = Blueprint('minesweeper', __name__)

# Base URL autodetection
if "WEBSITE_HOSTNAME" in os.environ:
    # Azure production environment
    NODE_BASE = os.getenv(
            "MINESWEEPER_NODE_URL",
            "https://itu-minesweeper-backend-a0a0a0d4d3b6dmha.westeurope-01.azurewebsites.net"
            )
else:
    # Local development
    NODE_BASE = os.getenv("MINESWEEPER_NODE_URL", "http://127.0.0.1:5051")

# Remove any trailing slash
NODE_BASE = NODE_BASE.rstrip('/')

logger.info(f"[Minesweeper Proxy] Using Node backend at: {NODE_BASE}")
print(f"[Minesweeper Proxy] Using Node backend at: {NODE_BASE}")

def _build_url(path: str) -> str:
    """
    Build the full URL for the proxied request.

    Args:
        path: Endpoint path (e.g. '/capabilities', '/game/123')

    Returns:
        Full URL including query string if present.
    """
    # Ensure the path starts with a slash
    if not path.startswith("/"):
        path = f"/{path}"

    # Append query string if present
    query_string = request.query_string.decode("utf-8") if request.query_string else ""

    url = f"{NODE_BASE}{path}"
    if query_string:
        url += f"?{query_string}"

    logger.debug(f"[Minesweeper Proxy] Built URL: {url}")
    return url


def _proxy(method: str, path: str):
    """
    Generic proxy handler: forwards requests from Flask to the Node backend.

    Args:
        method: HTTP method (GET, POST, PUT, DELETE, etc.)
        path: Path to the endpoint on the Node backend

    Returns:
        Flask Response object containing data from the Node backend.
    """
    url = _build_url(path)

    logger.info(f"[Minesweeper Proxy] {method} {url}")

    # Prepare request body for POST/PUT/PATCH
    data = None
    if method.upper() in ("POST", "PUT", "PATCH"):
        data = request.get_data() or None
        if data:
            logger.debug(f"[Minesweeper Proxy] Request body: {data[:200]}...")  # Log first 200 bytes

    # Forward important headers
    headers = {}

    # Content-Type
    if request.headers.get("Content-Type"):
        headers["Content-Type"] = request.headers["Content-Type"]
    elif method.upper() in ("POST", "PUT", "PATCH"):
        headers["Content-Type"] = "application/json"

    # Accept
    if request.headers.get("Accept"):
        headers["Accept"] = request.headers["Accept"]
    else:
        headers["Accept"] = "application/json"

    # Idempotency-Key for POST requests
    if request.headers.get("Idempotency-Key"):
        headers["Idempotency-Key"] = request.headers["Idempotency-Key"]
        logger.debug(f"[Minesweeper Proxy] Forwarding Idempotency-Key")

    # Authorization (if needed in the future)
    if request.headers.get("Authorization"):
        headers["Authorization"] = request.headers["Authorization"]

    # X-Forwarded-For for tracking origin
    if request.remote_addr:
        headers["X-Forwarded-For"] = request.remote_addr

    # Create and send the request
    req = urllib.request.Request(url, data = data, headers = headers, method = method)

    try:
        with urllib.request.urlopen(req, timeout = 30) as resp:
            payload = resp.read()
            status = resp.getcode()
            content_type = resp.headers.get("Content-Type", "application/json")

            logger.info(f"[Minesweeper Proxy] Response: {status} {content_type}")

            # Build Flask response
            flask_resp = Response(payload, status = status, content_type = content_type)

            # Forward Location header (important for 201 Created)
            location = resp.headers.get("Location")
            if location:
                flask_resp.headers["Location"] = location
                logger.debug(f"[Minesweeper Proxy] Forwarding Location: {location}")

            return flask_resp

    # HTTP errors (4xx, 5xx) returned from the Node backend
    except urllib.error.HTTPError as e:
        logger.error(f"[Minesweeper Proxy] HTTP Error {e.code} from {url}: {e.reason}")

        # Attempt to read error response from backend
        try:
            error_body = e.read()
            error_content_type = e.headers.get("Content-Type", "application/json")
            return Response(error_body, status = e.code, content_type = error_content_type)

        # If reading the error body fails, return a generic error message
        except Exception as read_error:
            logger.error(f"[Minesweeper Proxy] Failed to read error body: {read_error}")
            return Response(
                    json.dumps({
                            "code":    "upstream_error",
                            "message": f"Upstream returned {e.code}: {e.reason}"
                            }
                            ),
                    status = e.code,
                    content_type = "application/json"
                    )

    # Network errors (DNS, timeout, SSL, connection refused)
    except urllib.error.URLError as e:
        logger.error(f"[Minesweeper Proxy] Network error contacting {url}: {e.reason}")
        return Response(
                json.dumps({
                        "code":    "bad_gateway",
                        "message": "Cannot connect to minesweeper backend",
                        "detail":  str(e.reason)
                        }
                        ),
                status = 502,
                content_type = "application/json"
                )

    # Unexpected errors
    except Exception as e:
        logger.error(f"[Minesweeper Proxy] Unexpected error contacting {url}: {e}", exc_info = True)
        return Response(
                json.dumps({
                        "code":    "proxy_error",
                        "message": "Proxy encountered an unexpected error",
                        "detail":  str(e)
                        }
                        ),
                status = 500,
                content_type = "application/json"
                )


# === Endpoints ===

@minesweeper_bp.route('/capabilities', methods = ['GET'])
def capabilities():
    """Fetch capabilities from the Node backend."""
    return _proxy('GET', '/capabilities')


@minesweeper_bp.route('/game', methods = ['POST'])
def create_game():
    """Create a new game."""
    return _proxy('POST', '/game')


@minesweeper_bp.route('/game/<game_id>', methods = ['GET'])
def get_game(game_id):
    """Retrieve game state."""
    return _proxy('GET', f'/game/{game_id}')


@minesweeper_bp.route('/game/<game_id>/reveal', methods = ['POST'])
def reveal(game_id):
    """Reveal a cell."""
    return _proxy('POST', f'/game/{game_id}/reveal')


@minesweeper_bp.route('/game/<game_id>/flag', methods = ['POST'])
def flag(game_id):
    """Set or remove a flag."""
    return _proxy('POST', f'/game/{game_id}/flag')


@minesweeper_bp.route('/game/<game_id>/mode', methods = ['POST'])
def mode(game_id):
    """Change game mode (quick flag)."""
    return _proxy('POST', f'/game/{game_id}/mode')


@minesweeper_bp.route('/game/<game_id>/undo', methods = ['POST'])
def undo(game_id):
    """Undo a move."""
    return _proxy('POST', f'/game/{game_id}/undo')


@minesweeper_bp.route('/game/<game_id>/seek', methods = ['POST'])
def seek(game_id):
    """Seek to a specific history index."""
    return _proxy('POST', f'/game/{game_id}/seek')


@minesweeper_bp.route('/game/<game_id>/preview', methods = ['POST'])
def preview(game_id):
    """Preview game state at a specific index."""
    return _proxy('POST', f'/game/{game_id}/preview')


@minesweeper_bp.route('/game/<game_id>/revive', methods = ['POST'])
def revive(game_id):
    """Revive after losing."""
    return _proxy('POST', f'/game/{game_id}/revive')


@minesweeper_bp.route('/game/<game_id>/hint', methods = ['GET'])
def hint(game_id):
    """Get a hint."""
    return _proxy('GET', f'/game/{game_id}/hint')


@minesweeper_bp.route('/echo', methods = ['GET'])
def echo():
    """Proxy echo endpoint."""
    return _proxy('GET', '/echo')


@minesweeper_bp.route('/health', methods = ['GET'])
def health():
    """
    Simple health-check endpoint for the proxy layer.
    Returns a JSON object directly from Flask (no proxying).
    """
    return Response(
            json.dumps({
                    "status":  "healthy",
                    "proxy":   "minesweeper",
                    "backend": NODE_BASE
                    }
                    ),
            status = 200,
            content_type = "application/json"
            )
