-- AlphaHedgeQuant unified company intelligence graph.
-- Additive migration. Does not drop or overwrite existing terminal tables.
BEGIN;
CREATE TABLE IF NOT EXISTS ahq_company (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 legal_name TEXT NOT NULL,
 domicile TEXT,
 company_status TEXT NOT NULL DEFAULT 'active' CHECK(company_status IN ('active','delisted','merged','unknown')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ahq_security (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 company_id BIGINT NOT NULL REFERENCES ahq_company(id),
 exchange TEXT NOT NULL,
 symbol TEXT NOT NULL,
 isin TEXT,
 valid_from DATE,
 valid_to DATE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT ahq_security_date_chk CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from),
 UNIQUE(exchange,symbol,valid_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS ahq_security_current_idx ON ahq_security(exchange,symbol) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS ahq_security_isin_idx ON ahq_security(isin) WHERE isin IS NOT NULL;
CREATE TABLE IF NOT EXISTS ahq_source (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_kind TEXT NOT NULL CHECK(source_kind IN ('annual_report','exchange_filing','uploaded_workbook','provider','other')),
 document_title TEXT NOT NULL,
 source_url TEXT,
 source_checksum TEXT,
 period_label TEXT,
 published_at DATE,
 uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 verification_status TEXT NOT NULL DEFAULT 'unverified'
   CHECK(verification_status IN ('unverified','pending_review','verified','rejected')),
 CHECK(source_url IS NULL OR source_url LIKE 'https://%')
);
CREATE UNIQUE INDEX IF NOT EXISTS ahq_source_checksum_idx ON ahq_source(source_checksum) WHERE source_checksum IS NOT NULL;
CREATE TABLE IF NOT EXISTS ahq_company_fact (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 company_id BIGINT NOT NULL REFERENCES ahq_company(id),
 source_id BIGINT NOT NULL REFERENCES ahq_source(id),
 metric TEXT NOT NULL,
 statement TEXT NOT NULL CHECK(statement IN ('income','balance','cashflow','ratios','segment','other')),
 period_end DATE NOT NULL,
 period_type TEXT NOT NULL CHECK(period_type IN ('annual','quarterly','ttm','point_in_time')),
 reporting_scope TEXT NOT NULL CHECK(reporting_scope IN ('consolidated','standalone','unknown')),
 value NUMERIC(28,6) NOT NULL,
 unit TEXT NOT NULL,
 source_page TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(company_id,source_id,metric,statement,period_end,period_type,reporting_scope)
);
CREATE INDEX IF NOT EXISTS ahq_company_fact_lookup_idx ON ahq_company_fact(company_id,statement,period_end DESC);
CREATE TABLE IF NOT EXISTS ahq_company_relationship (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 from_company_id BIGINT NOT NULL REFERENCES ahq_company(id),
 to_company_id BIGINT REFERENCES ahq_company(id),
 counterparty_name TEXT,
 relationship_type TEXT NOT NULL CHECK(relationship_type IN ('customer','supplier','parent','subsidiary','associate','competitor','other')),
 share_pct NUMERIC(7,4) CHECK(share_pct BETWEEN 0 AND 100),
 share_basis TEXT CHECK(share_basis IN ('company_revenue','segment_revenue','procurement','ownership','not_reported')),
 fiscal_period TEXT NOT NULL,
 source_id BIGINT NOT NULL REFERENCES ahq_source(id),
 source_page TEXT,
 evidence TEXT NOT NULL,
 review_status TEXT NOT NULL DEFAULT 'pending_review'
   CHECK(review_status IN ('pending_review','verified','rejected')),
 CHECK (to_company_id IS NOT NULL OR NULLIF(TRIM(counterparty_name),'') IS NOT NULL),
 CHECK (share_pct IS NULL OR share_basis IS DISTINCT FROM 'not_reported'),
 CHECK (from_company_id IS DISTINCT FROM to_company_id)
);
CREATE INDEX IF NOT EXISTS ahq_relationship_from_idx ON ahq_company_relationship(from_company_id,relationship_type);
CREATE INDEX IF NOT EXISTS ahq_relationship_to_idx ON ahq_company_relationship(to_company_id);
COMMIT;
