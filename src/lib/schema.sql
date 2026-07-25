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
ALTER TABLE users ADD COLUMN onboarding_dismissed INTEGER NOT NULL DEFAULT 0;

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

CREATE TABLE IF NOT EXISTS ai_conversations (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Neuer Chat',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, updated_at);

-- Multi-conversation chat + attachments. Existing rows keep conversation_id
-- NULL until scripts/migrate.mjs backfills a conversation per user (real
-- chat history is never dropped).
ALTER TABLE ai_messages ADD COLUMN conversation_id TEXT REFERENCES ai_conversations(id) ON DELETE CASCADE;
ALTER TABLE ai_messages ADD COLUMN attachments TEXT;
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS wealth_entries (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'sonstiges'
                CHECK (category IN ('konto','depot','krypto','sachwert','sonstiges')),
  value       REAL NOT NULL,
  notes       TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_entries_user ON wealth_entries(user_id);

-- Snapshot of total net worth, recorded whenever a wealth entry changes.
-- Real history only — no synthetic/backfilled data points.
CREATE TABLE IF NOT EXISTS wealth_snapshots (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_value REAL NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_snapshots_user ON wealth_snapshots(user_id, created_at);

CREATE TABLE IF NOT EXISTS vehicles (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL, -- e.g. "BMW M140i"
  license_plate     TEXT,
  purchase_date     TEXT,
  value             REAL,
  inspection_due    TEXT, -- TÜV/HU due date
  document_id       TEXT REFERENCES documents(id) ON DELETE SET NULL,
  notes             TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);

CREATE TABLE IF NOT EXISTS properties (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL, -- e.g. "Eigentumswohnung Musterstraße 1"
  address         TEXT,
  purchase_date  TEXT,
  value          REAL,
  document_id    TEXT REFERENCES documents(id) ON DELETE SET NULL,
  notes          TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_properties_user ON properties(user_id);

-- One row per day per user. Manual entry only — no wearable/health-API sync
-- (that would need real OAuth credentials for Apple Health / Google Fit).
CREATE TABLE IF NOT EXISTS health_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    TEXT NOT NULL,
  steps       INTEGER,
  water_liters REAL,
  sleep_hours REAL,
  workout     TEXT,
  notes       TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  UNIQUE(user_id, log_date)
);
CREATE INDEX IF NOT EXISTS idx_health_logs_user ON health_logs(user_id, log_date);

-- ── Vermögen (Wealth) v2 — ported from the Kapitalverwaltung data model ─────
-- Supersedes wealth_entries/wealth_snapshots above (kept in place, unused,
-- for historical data — see scripts/migrate.mjs backfill). Real assets with
-- quantity/avg-price instead of a single manual value, buy/sell transactions,
-- savings plans, savings goals, debts, price history and live price refresh.

-- A container for assets (bank, broker, crypto exchange, retirement, ...).
CREATE TABLE IF NOT EXISTS wealth_groups (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  typ               TEXT NOT NULL DEFAULT 'OTHER'
                      CHECK (typ IN ('BANK','BROKER','RETIREMENT','CRYPTO_EXCHANGE','METALS','REAL_ESTATE','SAVINGS','LONGTERM','OTHER')),
  farbe             TEXT NOT NULL DEFAULT '#6366f1',
  icon              TEXT NOT NULL DEFAULT 'wallet',
  sort_order        INTEGER NOT NULL DEFAULT 0,
  stale_after_days  INTEGER NOT NULL DEFAULT 30,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_groups_user ON wealth_groups(user_id, sort_order);

CREATE TABLE IF NOT EXISTS wealth_sectors (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  UNIQUE(user_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_wealth_sectors_user ON wealth_sectors(user_id);

CREATE TABLE IF NOT EXISTS wealth_assets (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id          TEXT NOT NULL REFERENCES wealth_groups(id) ON DELETE CASCADE,
  sector_id         TEXT REFERENCES wealth_sectors(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  typ               TEXT NOT NULL DEFAULT 'OTHER'
                      CHECK (typ IN ('STOCK','ETF','CRYPTO','CASH','METAL','TAGESGELD','IMMOBILIE','OTHER')),
  quantity          REAL NOT NULL DEFAULT 1,
  price_per_unit    REAL NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'EUR',
  isin              TEXT,
  symbol            TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  price_updated_at  TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_assets_user ON wealth_assets(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_wealth_assets_group ON wealth_assets(group_id);
CREATE INDEX IF NOT EXISTS idx_wealth_assets_symbol ON wealth_assets(user_id, symbol);

CREATE TABLE IF NOT EXISTS wealth_transactions (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id         TEXT NOT NULL REFERENCES wealth_assets(id) ON DELETE CASCADE,
  date             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('BUY','SELL')),
  quantity         REAL NOT NULL,
  price_per_unit   REAL NOT NULL,
  notes            TEXT,
  savings_plan_id  TEXT REFERENCES wealth_savings_plans(id) ON DELETE SET NULL,
  is_anchor        INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_transactions_asset ON wealth_transactions(asset_id, date);
CREATE INDEX IF NOT EXISTS idx_wealth_transactions_plan ON wealth_transactions(savings_plan_id);

-- A debt/loan, optionally financing a specific asset (e.g. a mortgage on a
-- real-estate asset) — but attachable to any asset, matching the source model.
CREATE TABLE IF NOT EXISTS wealth_debts (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id          TEXT NOT NULL REFERENCES wealth_assets(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  original_amount   REAL NOT NULL,
  remaining_amount  REAL NOT NULL,
  interest_rate     REAL NOT NULL DEFAULT 0,
  monthly_payment   REAL NOT NULL DEFAULT 0,
  start_date        TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_debts_asset ON wealth_debts(asset_id);

CREATE TABLE IF NOT EXISTS wealth_savings_plans (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  amount           REAL NOT NULL,
  interval         TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (interval IN ('MONTHLY','QUARTERLY','YEARLY')),
  start_date       TEXT NOT NULL,
  end_date         TEXT,
  target_asset_id  TEXT NOT NULL REFERENCES wealth_assets(id) ON DELETE CASCADE,
  notes            TEXT,
  anchor_date      TEXT,
  anchor_quantity  REAL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_savings_plans_user ON wealth_savings_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_wealth_savings_plans_asset ON wealth_savings_plans(target_asset_id);

CREATE TABLE IF NOT EXISTS wealth_savings_goals (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  target_type           TEXT NOT NULL CHECK (target_type IN ('STOCK','ETF','CRYPTO','CASH','METAL','TAGESGELD','IMMOBILIE','OTHER')),
  target_amount         REAL NOT NULL,
  monthly_contribution  REAL NOT NULL DEFAULT 0,
  unit_label            TEXT NOT NULL DEFAULT 'EUR',
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_savings_goals_user ON wealth_savings_goals(user_id);

CREATE TABLE IF NOT EXISTS wealth_price_history (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id    TEXT NOT NULL REFERENCES wealth_assets(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  price       REAL NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_price_history_asset ON wealth_price_history(asset_id, date);

-- Rotation cursor for batched live price refreshes (one row per user+kind).
CREATE TABLE IF NOT EXISTS wealth_price_cursors (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('stocks','crypto')),
  cursor      INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, kind)
);

CREATE TABLE IF NOT EXISTS wealth_net_worth_snapshots (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            TEXT NOT NULL,
  net_worth       REAL NOT NULL,
  total_debts     REAL NOT NULL DEFAULT 0,
  breakdown_json  TEXT NOT NULL,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_wealth_net_worth_snapshots_user ON wealth_net_worth_snapshots(user_id, date);

CREATE TABLE IF NOT EXISTS wealth_expenses (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  amount        REAL NOT NULL,
  category      TEXT NOT NULL DEFAULT 'Sonstiges',
  type          TEXT NOT NULL CHECK (type IN ('INCOME','EXPENSE')),
  description   TEXT NOT NULL,
  is_recurring  INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wealth_expenses_user ON wealth_expenses(user_id, date);
