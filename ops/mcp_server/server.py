"""AHQ read-only MCP audit server. No production writes or secret exposure."""
import json
import os
import time
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from fastmcp import FastMCP

mcp = FastMCP("AlphaHedgeQuant Launch Quality")
SITE = "https://www.alphahedgequant.com"
BACKEND = "https://zerohedgequant-backend.onrender.com"
MAX_BYTES = 2048

def check(url, kind):
    start = time.monotonic()
    request = Request(url, headers={"User-Agent": "AHQ-Quality-Agent/0.1"})
    try:
        with urlopen(request, timeout=12) as response:
            code = response.status
            final = response.geturl()
            # Redirects must not silently send this checker to other hosts.
            from urllib.parse import urlparse
            if urlparse(final).hostname != urlparse(url).hostname:
                return {"target": kind, "status": "unknown", "reason": "redirected to different host"}
            return {"target": kind, "http_status": code, "latency_ms": round((time.monotonic()-start)*1000),
                    "state": "pass" if code < 400 else "fail",
                    "scope": "HTTP reachability only; not application functionality"}
    except HTTPError as error:
        return {"target": kind, "http_status": error.code, "state": "unknown" if kind=="backend" and error.code==404 else "fail",
                "scope": "Backend root 404 may be expected; configure a real health route"}
    except (URLError, TimeoutError, OSError) as error:
        return {"target": kind, "state": "fail", "error_type": type(error).__name__}

@mcp.tool()
def audit_public_site() -> dict:
    """Read-only HTTP availability test for the public AlphaHedgeQuant homepage."""
    return check(SITE, "homepage")

@mcp.tool()
def audit_backend_reachability() -> dict:
    """Read-only root reachability only; NOT an Upstox, pricing, or API integrity check."""
    return check(BACKEND, "backend")

@mcp.tool()
def audit_summary() -> dict:
    """Summarize launch checks without asserting untested systems are healthy."""
    results = [audit_public_site(), audit_backend_reachability()]
    return {"checked_at": datetime.now(timezone.utc).isoformat(),
            "results": results,
            "still_unverified": ["Clerk login/signup", "Upstox option chain freshness and correctness",
                                 "Vercel production deployment", "Neon writes", "quant backtests",
                                 "cron authorization", "data licensing"],
            "release_ready": False}

if __name__ == "__main__":
    mcp.run(transport="stdio")
