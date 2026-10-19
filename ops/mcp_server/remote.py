"""Remote MCP transport: bearer-token gated, off until user configures key."""
import hmac
import os
from starlette.responses import JSONResponse
from server import mcp

class TokenGuard:
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        configured = os.environ.get("AHQ_MCP_BEARER_TOKEN", "")
        supplied = dict(scope.get("headers", [])).get(b"authorization", b"").decode("latin1")
        expected = "Bearer " + configured
        if not configured or len(configured) < 32:
            response = JSONResponse({"error": "MCP disabled: configure a 32+ character bearer token in Render"}, status_code=503)
            return await response(scope, receive, send)
        if not hmac.compare_digest(supplied, expected):
            response = JSONResponse({"error": "Unauthorized"}, status_code=401, headers={"WWW-Authenticate": "Bearer"})
            return await response(scope, receive, send)
        return await self.app(scope, receive, send)

app = TokenGuard(mcp.http_app(path="/mcp"))
