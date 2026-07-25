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

-- Brute-force protection for login: one row per failed attempt, login gets
-- blocked while there are too many recent rows for that email.
CREATE TABLE IF NOT EXISTS login_attempts (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, created_at);

CREATE TABLE IF NOT EXISTS goals (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'sonstiges',
  target_amount   REAL NOT NULL,
  current_amount  REAL NOT NULL DEFAULT 0,
  target_date     TEXT,
  notes           TEXT,
  achieved_at     TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- Schema evolution: ALTER statements are safe to re-run (the migrate script
-- skips "duplicate column" errors), so this file stays a single source of truth.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin'));

-- Admin-configured comparison/affiliate deep-links (e.g. Check24), shown to
-- users on contracts in a matching category. No fake data: this table stays
-- empty (features unavailable) until an admin actually fills it in.
CREATE TABLE IF NOT EXISTS partner_tools (
  id                  TEXT PRIMARY KEY,
  category            TEXT NOT NULL,
  provider_name       TEXT NOT NULL,
  affiliate_id        TEXT,
  deep_link_template  TEXT NOT NULL, -- may contain {affiliate_id}, replaced at render time
  enabled             INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_partner_tools_category ON partner_tools(category);
