import { pool } from "./client.js";

const schemaSql = `
CREATE TABLE IF NOT EXISTS tenders (
  id BIGSERIAL PRIMARY KEY,
  source_tab TEXT NOT NULL,
  tender_number TEXT NOT NULL,
  entity TEXT,
  location TEXT,
  tender_name TEXT,
  tender_type TEXT,
  ai_category TEXT,
  estimated_value NUMERIC(18, 2),
  published_date TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  detail_url TEXT,
  download_url TEXT,
  source_url TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_tab, tender_number)
);

CREATE INDEX IF NOT EXISTS idx_tenders_source_tab ON tenders(source_tab);
CREATE INDEX IF NOT EXISTS idx_tenders_closing_date ON tenders(closing_date);
CREATE INDEX IF NOT EXISTS idx_tenders_estimated_value ON tenders(estimated_value);
CREATE INDEX IF NOT EXISTS idx_tenders_first_seen_at ON tenders(first_seen_at);

CREATE TABLE IF NOT EXISTS scrape_runs (
  id BIGSERIAL PRIMARY KEY,
  reason TEXT,
  status TEXT NOT NULL,
  message TEXT,
  row_count INTEGER DEFAULT 0,
  inserted_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
`;

export async function initDb() {
  await pool.query(schemaSql);
  await pool.query(`
    ALTER TABLE tenders
    ADD COLUMN IF NOT EXISTS ai_category TEXT
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenders_ai_category ON tenders(ai_category)
  `);
}
