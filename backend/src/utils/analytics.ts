import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  }
  return pool!;
}

interface LogEntry {
  url: string;
  ip: string;
  success: boolean;
  error?: string;
}

export async function logRequest(entry: LogEntry): Promise<void> {
  const db = getPool();
  if (!db) return; // Skip if no database configured

  try {
    await db.query(
      `INSERT INTO request_logs (url_hash, ip_hash, success, error_message, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        hashValue(entry.url),
        hashValue(entry.ip),
        entry.success,
        entry.error || null,
      ]
    );
  } catch (err) {
    // Non-critical — don't throw
    console.error('Analytics log error:', err);
  }
}

export async function incrementViewCount(urlHash: string): Promise<void> {
  const db = getPool();
  if (!db) return;

  try {
    await db.query(
      `INSERT INTO popular_links (url_hash, view_count, last_viewed)
       VALUES ($1, 1, NOW())
       ON CONFLICT (url_hash) DO UPDATE
       SET view_count = popular_links.view_count + 1,
           last_viewed = NOW()`,
      [urlHash]
    );
  } catch (err) {
    console.error('View count error:', err);
  }
}

import crypto from 'crypto';
function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

// Database schema (run once on setup)
export const DB_SCHEMA = `
CREATE TABLE IF NOT EXISTS request_logs (
  id BIGSERIAL PRIMARY KEY,
  url_hash VARCHAR(16) NOT NULL,
  ip_hash VARCHAR(16) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_created ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_request_logs_url ON request_logs(url_hash);

CREATE TABLE IF NOT EXISTS popular_links (
  url_hash VARCHAR(16) PRIMARY KEY,
  view_count BIGINT NOT NULL DEFAULT 0,
  last_viewed TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_popular_links_views ON popular_links(view_count DESC);
`;
