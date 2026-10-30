#!/usr/bin/env python3
"""Send PDF extraction candidates to the AlphaHedgeQuant review queue.

Uses GitHub's short-lived OIDC token, never an exported database password.
No candidate is marked verified or displayed as an audited fact.
"""
import argparse
import json
import os
import sys
import time
from urllib.parse import quote

import requests

AUDIENCE = "ahq-annual-report-review-ingest-v1"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact", required=True)
    parser.add_argument("--endpoint", required=True)
    args = parser.parse_args()
    url = args.endpoint
    if url != "https://www.alphahedgequant.com/api/terminal/ingest":
        parser.error("Only the production AHQ review ingestion endpoint is permitted")
    token_url = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL")
    token_secret = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN")
    if not token_url or not token_secret:
        parser.error("GitHub Actions OIDC environment is unavailable; grant id-token: write")
    with open(args.artifact, "r", encoding="utf-8") as file:
        payload = json.load(file)
    if payload.get("verification") != "PENDING_REVIEW":
        parser.error("Only pending-review excerpts can be submitted")

    for attempt in range(1, 13):
        try:
            req_url = token_url + "&audience=" + quote(AUDIENCE, safe="")
            auth_resp = requests.get(req_url,
                headers={"Authorization": "bearer " + token_secret},
                timeout=12)
            auth_resp.raise_for_status()
            bearer = auth_resp.json().get("value")
            if not bearer:
                raise RuntimeError("GitHub returned no OIDC token")
            res = requests.post(url, json=payload, timeout=30,
                headers={"Authorization": "Bearer " + bearer},
                allow_redirects=False)
            if res.ok and res.json().get("ok"):
                data = res.json()
                print("Database ingestion accepted", data.get("received", 0),
                      "pending excerpts; newly inserted", data.get("inserted", 0),
                      "(not publicly verified)")
                return
            if res.status_code in (401, 403, 400, 413):
                raise RuntimeError("Ingestion rejected payload or OIDC authentication: HTTP " +
                                   str(res.status_code) + " " + res.text[:250])
            print(f"Attempt {attempt}/12: API HTTP {res.status_code}; retrying after deployment")
        except requests.RequestException as exc:
            print(f"Attempt {attempt}/12: network error {type(exc).__name__}; retrying")
        if attempt < 12:
            time.sleep(15)
    raise RuntimeError("Unable to deliver verified-origin excerpts to production ingestion endpoint")

if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        print(f"OIDC pending-review ingestion failed: {err}", file=sys.stderr)
        sys.exit(1)
