#!/usr/bin/env python3
"""Static high-confidence client-code security sink audit.

Conservative check only: absence of findings is NOT a penetration-test result.
Prints file + line + category, not source or user data.
"""
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]/"alphahedgequant"
DIRECTORIES=("app","components","lib")
PATTERNS={
 "raw_html_injection":re.compile(r"dangerouslySetInnerHTML|\.innerHTML\s*=",re.I),
 "dynamic_code_execution":re.compile(r"\beval\s*\(|new\s+Function\s*\(|document\.write\s*\(",re.I),
 "shell_execution":re.compile(r"\b(?:execSync|spawnSync)\s*\(",re.I),
 "public_secret_env":re.compile(r"process\.env\.NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE)",re.I),
 "javascript_url":re.compile(r"['\"]javascript:[^'\"]{0,180}['\"]",re.I)
}
issues=[]
scanned=0
for part in DIRECTORIES:
 folder=ROOT/part
 if not folder.exists():continue
 for path in folder.rglob("*"):
  if not path.is_file() or path.suffix not in {".js",".jsx",".mjs",".ts",".tsx"}:continue
  scanned+=1
  for n,line in enumerate(path.read_text(encoding="utf8",errors="replace").splitlines(),1):
   stripped=line.strip()
   if stripped.startswith("//") or stripped.startswith("*"):continue
   for name,pattern in PATTERNS.items():
    if not pattern.search(line):continue
    relative=str(path.relative_to(ROOT))
    # Reviewed constant-only client theme initialization: no interpolation,
    # user-controlled HTML, or dynamic script values. Keep narrowly scoped.
    if (name=="raw_html_injection" and relative=="app/layout.jsx"
        and 'dangerouslySetInnerHTML={{ __html: `(function(){try{var theme=localStorage.getItem("ahq-theme")' in line
        and '${' not in line):
     continue
    # PostHog's project ingestion token is intentionally public and write-only.
    # POSTHOG_PERSONAL_API_KEY is distinct and remains server-only.
    if (name=="public_secret_env" and relative=="components/AnalyticsTracker.jsx"
        and stripped=="const key=process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;"):
     continue
    issues.append((relative,n,name))
print(f"Static sink scan: inspected {scanned} source files.")
for path,n,name in issues:
 print(f"REVIEW {path}:{n} category={name}")
if issues:
 print("Review potentially unsafe sinks. Source values intentionally not shown.")
 sys.exit(2)
print("No listed high-confidence sinks identified. Runtime/XSS/CSP verification still required.")
