// Shared Neon schema for the public NSE filings dataset.
// The original filing rows are preserved in JSONB; typed keys support fast lookups.
let schemaPromise;
export function ensureNseFundamentalsSchema(sql) {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
  await sql`CREATE TABLE IF NOT EXISTS ahq_nse_fundamental_imports (
    import_id TEXT PRIMARY KEY,
    source_workbook TEXT NOT NULL,
    source_sha256 TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('staging','published','failed')),
    expected_coverage INTEGER NOT NULL,
    expected_summary INTEGER NOT NULL,
    expected_financials INTEGER NOT NULL,
    expected_filings INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ahq_nse_fundamental_current (
    slot BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (slot = TRUE),
    import_id TEXT NOT NULL REFERENCES ahq_nse_fundamental_imports(import_id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ahq_nse_fundamental_coverage (
    import_id TEXT NOT NULL REFERENCES ahq_nse_fundamental_imports(import_id),
    symbol TEXT NOT NULL,
    data JSONB NOT NULL,
    PRIMARY KEY(import_id,symbol)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ahq_nse_fundamental_summary (
    import_id TEXT NOT NULL REFERENCES ahq_nse_fundamental_imports(import_id),
    symbol TEXT NOT NULL,
    basis TEXT NOT NULL CHECK (basis IN ('consolidated','standalone')),
    data JSONB NOT NULL,
    PRIMARY KEY(import_id,symbol,basis)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ahq_nse_financial_records (
    import_id TEXT NOT NULL REFERENCES ahq_nse_fundamental_imports(import_id),
    symbol TEXT NOT NULL,
    basis TEXT NOT NULL CHECK (basis IN ('consolidated','standalone')),
    statement TEXT NOT NULL CHECK (statement IN ('quarterly_pnl','annual_pnl','balance_sheet','cash_flow_ytd')),
    period_type TEXT NOT NULL,
    period_end DATE NOT NULL,
    first_public_at TEXT,
    n_versions INTEGER,
    kind TEXT,
    data JSONB NOT NULL,
    PRIMARY KEY(import_id,symbol,basis,statement,period_end)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ahq_nse_filing_index (
    import_id TEXT NOT NULL REFERENCES ahq_nse_fundamental_imports(import_id),
    symbol TEXT NOT NULL,
    basis TEXT NOT NULL CHECK (basis IN ('consolidated','standalone')),
    period_end DATE,
    public_at TEXT,
    revision BOOLEAN,
    parsed BOOLEAN,
    url TEXT NOT NULL,
    data JSONB NOT NULL,
    PRIMARY KEY(import_id,url)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS ahq_nse_financial_lookup_idx
    ON ahq_nse_financial_records(import_id,symbol,basis,statement,period_end DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS ahq_nse_filing_lookup_idx
    ON ahq_nse_filing_index(import_id,symbol,basis,period_end DESC,public_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS ahq_nse_summary_basis_idx
    ON ahq_nse_fundamental_summary(import_id,basis,symbol)`;
  })().catch(error => { schemaPromise = null; throw error; });
  return schemaPromise;
}
