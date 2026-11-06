#!/usr/bin/env python3
"""Read-only production security smoke checks; never submit a form or log secrets.

Designed for GitHub Actions. Uses only GET, does not send authentication cookies,
and intentionally avoids rate-limit exhaustion or mutation.
"""
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
import json
import os
import sys

BASE = os.getenv("AHQ_PUBLIC_BASE_URL", "https://www.alphahedgequant.com").rstrip("/")
PATHS = ("/", "/learn", "/api/waitlist", "/api/learn/progress", "/api/admin/analytics")
HEADERS = {"User-Agent": "AHQ-Owner-Security-Monitor/1.0", "Accept": "text/html,application/json"}
SECURITY = ("strict-transport-security", "x-content-type-options", "x-frame-options", "referrer-policy")

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, hdrs, newurl):
        return None

def fetch(path):
    target=BASE+path
    req=Request(target,headers=HEADERS,method="GET")
    try:
        response=build_opener(NoRedirect).open(req,timeout=15)
    except HTTPError as exc:
        response=exc
    except (URLError,TimeoutError,OSError) as exc:
        return {"path":path,"error":exc.__class__.__name__}
    with response:
        status=response.status
        h={k.lower():v for k,v in response.headers.items()}
        body=response.read(150000).decode("utf-8","replace")
    return {"path":path,"status":status,"headers":h,"body":body}

def main():
    if urlparse(BASE).scheme!="https":
        print("FAIL: public target is not HTTPS")
        return 1
    fails=[]
    warnings=[]
    for path in PATHS:
        res=fetch(path)
        if "error" in res:
            print(f"UNVERIFIED {path}: network/timeout ({res['error']})")
            warnings.append("Could not reach "+path)
            continue
        code=res["status"]
        h=res["headers"]
        body=res["body"]
        print(f"GET {path}: HTTP {code}")
        if path=="/":
            if code!=200:
                location_host=(urlparse(h.get("location","")).hostname or "").lower()
                if code in (301,302,303,307,308) and location_host.endswith(".clerk.accounts.dev"):
                    fails.append("Homepage redirected through Clerk development browser handshake; production instance not yet configured")
                else:
                    fails.append("Homepage did not return HTTP 200")
            for key in SECURITY:
                if not h.get(key): fails.append("Missing "+key+" on homepage")
            if "pk_test_" in body:
                fails.append("Production HTML exposes Clerk development/test publishable key")
            elif "pk_live_" not in body:
                warnings.append("Could not establish Clerk production key from public HTML")
        elif path=="/learn":
            if code not in (200,302,303,307,308,401,403,404):
                warnings.append("Unexpected Learn page status")
            if code==404 and h.get("x-clerk-auth-reason"):
                warnings.append("Clerk middleware returned 404 to anonymous reader; needs browser verification")
        elif path=="/api/waitlist":
            redirect_host=(urlparse(h.get("location","")).hostname or "").lower()
            if code in (301,302,303,307,308) and redirect_host.endswith(".clerk.accounts.dev"):
                fails.append("Public waitlist route is redirected via development-auth handshake")
            if code==200 and "email" in body.lower():
                fails.append("Waitlist GET may expose data (manual review required)")
            if code not in (403,404,405):
                warnings.append("Unexpected waitlist GET status")
        else:
            # If a protected JSON endpoint responds with authenticated data
            # without cookies, treat as a potentially serious access-control bug.
            if code==200 and "application/json" in h.get("content-type",""):
                try:
                    parsed=json.loads(body)
                except json.JSONDecodeError:
                    parsed={}
                if path.endswith("/progress") and ("progress" in parsed or "user_id" in parsed):
                    fails.append("Anonymous account progress potentially disclosed")
                if path.endswith("/analytics") and ("results" in parsed or "overview" in parsed):
                    fails.append("Anonymous admin analytics potentially disclosed")
            if code in (302,303,307,308):
                dest=urlparse(h.get("location",""))
                if dest.scheme and dest.scheme!="https":
                    fails.append("Auth redirect left HTTPS")
            if code==404 and "dev-browser" in h.get("x-clerk-auth-reason",""):
                warnings.append("Clerk development-browser rewrite prevented endpoint authorization verification")
            elif code not in (401,403,404,302,303,307,308):
                warnings.append("Verify access-control response for "+path)
        if h.get("access-control-allow-origin")=="*" and h.get("access-control-allow-credentials","").lower()=="true":
            fails.append("Wildcard CORS with credentials at "+path)
    for issue in warnings:
        print("REVIEW:",issue)
    for issue in fails:
        print("FAIL:",issue)
    print(f"Summary: {len(fails)} failing checks; {len(warnings)} items require manual review.")
    print("LIMITS: anonymous read-only checks; not a logged-in penetration test or database-role audit.")
    return 1 if fails else 0

if __name__=="__main__":
    sys.exit(main())
