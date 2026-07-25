-- Project LIFE — SQLite / Turso (libSQL) schema
-- Run via `npm run db:migrate` (reads this file and executes it against TURSO_DATABASE_URL).
-- All timestamps are ISO-8601 strings written by the application (not DB-side defaults),
-- so behavior is identical for a local file DB and a remote Turso DB.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY, -- sha256 hash of the session token
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name   TEXT NOT NULL,
  stored_path     TEXT NOT NULL, -- Vercel Blob URL
  mime_type       TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  extracted_text  TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);

CREATE TABLE IF NOT EXISTS contracts (
  id                     TEXT PRIMARY KEY,
  user_id                TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  category               TEXT NOT NULL DEFAULT 'sonstiges',
  amount                 REAL,
  billing_cycle          TEXT NOT NULL DEFAULT 'monthly'
                           CHECK (billing_cycle IN ('monthly','yearly','one_time')),
  contract_end           TEXT,
  cancellation_deadline  TEXT,
  document_id            TEXT REFERENCES documents(id) ON DELETE SET NULL,
  notes                  TEXT,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON ai_messages(user_id, created_at);
