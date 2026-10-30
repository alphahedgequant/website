#!/usr/bin/env python3
"""Source-first annual-report excerpt indexer for the AlphaHedgeQuant terminal.

This indexes *candidate passages*, not verified financial facts. Human approval is
required before a passage appears in the public terminal. PDF annual report URL is
explicitly provided by a repository maintainer; no speculative relationships are made.
"""
import argparse
import hashlib
import ipaddress
import os
import re
import socket
import sys
from urllib.parse import urlsplit

import fitz
import psycopg
import requests

MAX_BYTES = 25_000_000
CATEGORIES = {
    "financial_statements": [
        r"statement of profit and loss", r"consolidated balance sheet",
        r"standalone balance sheet", r"statement of cash flows",
        r"consolidated statement of", r"notes to the financial statements",
    ],
    "segments": [
        r"segment revenue", r"segment information", r"operating segments",
        r"business segments", r"reportable segments",
    ],
    "geography": [
        r"geographical segment", r"geographical information",
        r"geographical revenue", r"geographic revenues",
        r"revenue from india", r"revenue from outside india",
    ],
    "major_customers": [
        r"major customer", r"single external customer",
        r"customer account(s|ed)? for", r"customer concentration",
        r"10% or more of", r"customer contributing more than",
    ],
    "suppliers": [
        r"key supplier", r"major supplier", r"principal supplier",
        r"supplier concentration", r"procurement from",
    ],
    "cash_flows": [
        r"cash flow from operating activities",
        r"cash generated from operations",
        r"net cash from operating activities",
    ],
}
PATTERNS = {name: [re.compile(p, re.I) for p in patterns] for name, patterns in CATEGORIES.items()}


def safe_source(raw_url):
    url = urlsplit(raw_url)
    if url.scheme != "https" or url.username or url.password or url.port or not url.hostname:
        raise ValueError("Source must be a direct HTTPS document link without credentials or custom ports")
    if len(raw_url) > 1500:
        raise ValueError("Report source URL too long")
    hostname = url.hostname.lower()
    # Do not let an editor-submitted URL query cloud metadata or private services.
    results = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
    if not results:
        raise ValueError("Unable to resolve report host")
    for result in results:
        address = ipaddress.ip_address(result[4][0])
        if not address.is_global:
            raise ValueError("Report host resolves to a non-public address")
    return raw_url


def download_pdf(url):
    response = requests.get(url, timeout=(10, 35), allow_redirects=False, stream=True,
                            headers={"User-Agent": "AlphaHedgeQuantResearch/1.0 (annual report indexer)"})
    if response.status_code in (301, 302, 303, 307, 308):
        raise ValueError("Report host redirected; supply its final official PDF URL")
    response.raise_for_status()
    size = int(response.headers.get("Content-Length", 0))
    if size > MAX_BYTES:
        raise ValueError("Annual report exceeds 25 MB limit")
    chunks, total = [], 0
    for chunk in response.iter_content(256 * 1024):
        total += len(chunk)
        if total > MAX_BYTES:
            raise ValueError("Annual report exceeds 25 MB limit")
        chunks.append(chunk)
    data = b"".join(chunks)
    if not data.startswith(b"%PDF"):
        raise ValueError("Source did not return a PDF")
    return data


def identify_candidates(document, source_url, symbol, fiscal_period):
    counts = {cat: 0 for cat in PATTERNS}
    found = []
    for idx in range(min(len(document), 700)):
        page = document.load_page(idx)
        page_text = page.get_text("text", sort=True)
        page_text = re.sub(r"\s+", " ", page_text).strip()
        if not page_text:
            continue
        for cat, regexes in PATTERNS.items():
            if counts[cat] >= 18:
                continue
            seen_on_page = 0
            for regex in regexes:
                for m in regex.finditer(page_text):
                    if seen_on_page >= 2 or counts[cat] >= 18:
                        break
                    excerpt = page_text[max(0, m.start() - 180):min(len(page_text), m.end() + 500)]
                    excerpt = excerpt.strip()
                    if len(excerpt) < 45:
                        continue
                    digest = hashlib.sha256(
                        (symbol + "|" + source_url + "|" + str(idx + 1) + "|" + cat + "|" + excerpt).encode()
                    ).hexdigest()
                    found.append((symbol, fiscal_period, source_url, idx + 1,
                                  cat, excerpt, digest))
                    counts[cat] += 1
                    seen_on_page += 1
                if seen_on_page >= 2 or counts[cat] >= 18:
                    break
    return found


def persist(database_url, candidates, symbol, fiscal_period, source_url, document):
    with psycopg.connect(database_url, connect_timeout=15) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS terminal_report_documents (
                  id BIGSERIAL PRIMARY KEY,
                  symbol TEXT NOT NULL,
                  fiscal_period TEXT NOT NULL,
                  source_url TEXT NOT NULL,
                  page_count INTEGER NOT NULL,
                  indexed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                  UNIQUE(symbol, fiscal_period, source_url)
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS terminal_report_excerpts (
                  id BIGSERIAL PRIMARY KEY,
                  symbol TEXT NOT NULL,
                  fiscal_period TEXT NOT NULL,
                  source_url TEXT NOT NULL,
                  source_page INTEGER NOT NULL,
                  category TEXT NOT NULL,
                  evidence TEXT NOT NULL,
                  checksum TEXT NOT NULL UNIQUE,
                  review_status TEXT NOT NULL DEFAULT 'pending_review',
                  reviewed_by TEXT,
                  reviewed_at TIMESTAMPTZ,
                  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS terminal_report_excerpt_symbol_idx
                  ON terminal_report_excerpts(symbol, review_status, category)
            """)
            cur.execute("""
                INSERT INTO terminal_report_documents(symbol, fiscal_period, source_url, page_count)
                VALUES (%s,%s,%s,%s)
                ON CONFLICT(symbol,fiscal_period,source_url)
                DO UPDATE SET page_count=EXCLUDED.page_count, indexed_at=now()
            """, (symbol, fiscal_period, source_url, len(document)))
            inserted = 0
            for row in candidates:
                cur.execute("""
                    INSERT INTO terminal_report_excerpts
                      (symbol,fiscal_period,source_url,source_page,category,evidence,checksum)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT(checksum) DO NOTHING
                """, row)
                inserted += cur.rowcount
        conn.commit()
    return inserted


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", required=True)
    parser.add_argument("--period", required=True)
    parser.add_argument("--url", required=True)
    args = parser.parse_args()
    symbol = args.symbol.strip().upper()
    if not re.fullmatch(r"[A-Z0-9&_.-]{1,40}", symbol):
        parser.error("Invalid NSE symbol")
    if not re.fullmatch(r"[A-Za-z0-9 /-]{4,32}", args.period):
        parser.error("Invalid fiscal-period label")
    database_url = os.environ.get("NEON_DATABASE_URL")
    if not database_url:
        parser.error("Set NEON_DATABASE_URL in GitHub Actions secrets")
    url = safe_source(args.url)
    pdf = download_pdf(url)
    with fitz.open(stream=pdf, filetype="pdf") as document:
        records = identify_candidates(document, url, symbol, args.period)
        added = persist(database_url, records, symbol, args.period, url, document)
        print(f"Indexed {len(document)} PDF pages. Found {len(records)} candidate passages; "
              f"{added} newly added. All candidates require editorial verification.")
    print("Nothing has been automatically published as audited figures or verified relationships.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Annual report indexing failed: {exc}", file=sys.stderr)
        sys.exit(1)
