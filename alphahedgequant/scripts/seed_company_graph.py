#!/usr/bin/env python3
"""Idempotently stage repository-uploaded workbooks into the AHQ PostgreSQL company graph.

Records retain UNVERIFIED source classification. Never marks workbook numbers audited.
Requires additive db/001_company_graph.sql migration to have run first.
"""
import hashlib
import json
import os
import pathlib
import re
import sys
import psycopg

ROOT = pathlib.Path(__file__).resolve().parents[1]
FILE = ROOT / "lib" / "terminalWorkbookData.json"
SECTIONS = {"annual": "income", "quarterly": "income",
            "balance": "balance", "cashflow": "cashflow"}

def run():
    database_url = os.environ.get("NEON_DATABASE_URL")
    if not database_url:
        raise SystemExit("NEON_DATABASE_URL must be configured as a protected CI secret")
    data = json.loads(FILE.read_text(encoding="utf-8"))
    companies = 0
    facts = 0
    with psycopg.connect(database_url, connect_timeout=15) as conn:
        with conn.cursor() as cur:
            for symbol, company in sorted(data.items()):
                if not re.fullmatch(r"[A-Z0-9&_.-]{1,40}", symbol):
                    raise ValueError(f"Invalid symbol {symbol!r}")
                cur.execute("""
                  SELECT company_id FROM ahq_security
                  WHERE exchange='NSE' AND symbol=%s AND valid_to IS NULL
                """, (symbol,))
                found = cur.fetchone()
                if found:
                    company_id = found[0]
                else:
                    cur.execute("INSERT INTO ahq_company(legal_name) VALUES(%s) RETURNING id",
                                (company["name"],))
                    company_id = cur.fetchone()[0]
                    cur.execute("""
                      INSERT INTO ahq_security(company_id,exchange,symbol)
                      VALUES(%s,'NSE',%s)
                    """, (company_id, symbol))
                payload = json.dumps(company,sort_keys=True,separators=(",",":"))
                digest = hashlib.sha256((symbol+"|"+payload).encode()).hexdigest()
                cur.execute("""
                  INSERT INTO ahq_source(source_kind,document_title,source_checksum,verification_status)
                  VALUES('uploaded_workbook',%s,%s,'unverified')
                  ON CONFLICT(source_checksum) DO UPDATE
                    SET document_title=EXCLUDED.document_title
                  RETURNING id
                """, (f"{symbol} source workbook — user supplied; unaudited",digest))
                source_id=cur.fetchone()[0]
                for section, statement in SECTIONS.items():
                    period_type = "quarterly" if section == "quarterly" else "annual"
                    for row in company.get(section,[]):
                        period=row["period"]
                        if not re.fullmatch(r"20\d\d-\d\d-\d\d", period):
                            raise ValueError(f"Invalid period for {symbol}: {period}")
                        for metric,value in row.items():
                            if metric=="period":
                                continue
                            if not isinstance(value,(int,float)) or isinstance(value,bool):
                                raise ValueError(f"Invalid {symbol} {section} {metric}")
                            # Source worksheet 'annual' etc. retained in metric namespace,
                            # preventing ambiguous historical lines and label collisions.
                            cur.execute("""
                              INSERT INTO ahq_company_fact
                              (company_id,source_id,metric,statement,period_end,
                               period_type,reporting_scope,value,unit)
                              VALUES(%s,%s,%s,%s,%s,%s,'unknown',%s,'INR_crore_workbook_unverified')
                              ON CONFLICT (company_id,source_id,metric,statement,period_end,period_type,reporting_scope)
                              DO UPDATE SET value=EXCLUDED.value,unit=EXCLUDED.unit
                            """,(company_id,source_id,section+"."+metric,statement,period,period_type,value))
                            facts += 1
                companies += 1
        conn.commit()
    print(json.dumps({"companies_processed":companies,"financial_facts_upserted":facts,
                      "verification_status":"unverified"}))

if __name__=="__main__":
    run()
