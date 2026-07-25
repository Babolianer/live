// Applies src/lib/schema.sql against the DB configured via TURSO_DATABASE_URL / TURSO_AUTH_TOKEN
// (or a local ./local.db file if unset). Usage: npm run db:migrate
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@libsql/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "..", "src", "lib", "schema.sql");

// Minimal .env.local loader (no extra dependency) — Node doesn't read Next.js env files on its own.
async function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  try {
    const content = await readFile(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // no .env.local — rely on already-exported env vars
  }
}

await loadEnvLocal();

async function main() {
  const url = process.env.TURSO_DATABASE_URL || "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  console.log(`Verbinde mit ${url} ...`);
  const client = createClient({ url, authToken });

  const sql = await readFile(schemaPath, "utf8");
  // Strip full-line "--" comments before splitting on ";" — a semicolon inside
  // a comment (e.g. prose text) would otherwise be mistaken for a statement end.
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  // Run each statement individually (not in one batch transaction) so a
  // re-run is safe even with non-idempotent statements like `ALTER TABLE
  // ADD COLUMN` — one already-applied ALTER shouldn't roll back or block
  // every other statement in the file.
  let applied = 0;
  for (const statement of statements) {
    try {
      await client.execute(statement);
      applied++;
    } catch (err) {
      const isDuplicateColumn = /duplicate column name/i.test(err.message);
      if (isDuplicateColumn) {
        console.log(`Übersprungen (Spalte existiert bereits): ${statement.slice(0, 60)}...`);
        continue;
      }
      throw err;
    }
  }
  console.log(`Schema angewendet (${applied}/${statements.length} Statements ausgeführt).`);

  await backfillConversations(client);
  await backfillWealthAssets(client);

  client.close();
}

// One-time, idempotent backfill: any ai_messages row without a
// conversation_id (from before multi-conversation chat existed) gets
// grouped into a single conversation per user, preserving real chat
// history instead of dropping it.
async function backfillConversations(client) {
  const orphans = await client.execute(
    `SELECT DISTINCT user_id FROM ai_messages WHERE conversation_id IS NULL`
  );
  if (orphans.rows.length === 0) return;

  for (const row of orphans.rows) {
    const userId = row.user_id;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      args: [id, userId, "Erster Chat", now, now],
    });
    await client.execute({
      sql: `UPDATE ai_messages SET conversation_id = ? WHERE user_id = ? AND conversation_id IS NULL`,
      args: [id, userId],
    });
    console.log(`Bestehende Chat-Nachrichten für Nutzer ${userId} einer neuen Unterhaltung zugeordnet.`);
  }
}

// One-time, idempotent migration: each legacy wealth_entries row becomes a
// wealth_assets row (typ OTHER, quantity 1, price_per_unit = value) filed
// under an auto-created "Sonstiges" group, and the most recent
// wealth_snapshots total seeds the new net-worth history. Skipped per-user
// once they already have any wealth_assets row (already migrated, or
// started using the new model directly) — old tables are left untouched.
async function backfillWealthAssets(client) {
  const usersWithEntries = await client.execute(`SELECT DISTINCT user_id FROM wealth_entries`);
  if (usersWithEntries.rows.length === 0) return;

  for (const row of usersWithEntries.rows) {
    const userId = row.user_id;
    const existingAssets = await client.execute({
      sql: `SELECT COUNT(*) as count FROM wealth_assets WHERE user_id = ?`,
      args: [userId],
    });
    if (Number(existingAssets.rows[0].count) > 0) continue;

    const now = new Date().toISOString();
    const groupId = crypto.randomUUID();
    await client.execute({
      sql: `INSERT INTO wealth_groups (id, user_id, name, typ, farbe, icon, sort_order, stale_after_days, created_at, updated_at)
            VALUES (?, ?, 'Sonstiges', 'OTHER', '#6366f1', 'wallet', 0, 30, ?, ?)`,
      args: [groupId, userId, now, now],
    });

    const entries = await client.execute({
      sql: `SELECT id, name, value, notes, created_at, updated_at FROM wealth_entries WHERE user_id = ?`,
      args: [userId],
    });
    let sortOrder = 0;
    for (const entry of entries.rows) {
      await client.execute({
        sql: `INSERT INTO wealth_assets
                (id, user_id, group_id, sector_id, name, typ, quantity, price_per_unit, currency, isin, symbol, sort_order, notes, created_at, updated_at)
              VALUES (?, ?, ?, NULL, ?, 'OTHER', 1, ?, 'EUR', NULL, NULL, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), userId, groupId, entry.name, entry.value, sortOrder++, entry.notes, entry.created_at, entry.updated_at],
      });
    }

    const lastSnapshot = await client.execute({
      sql: `SELECT total_value, created_at FROM wealth_snapshots WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      args: [userId],
    });
    if (lastSnapshot.rows.length > 0) {
      const snap = lastSnapshot.rows[0];
      const dayStart = new Date(snap.created_at);
      dayStart.setHours(0, 0, 0, 0);
      await client.execute({
        sql: `INSERT OR IGNORE INTO wealth_net_worth_snapshots (id, user_id, date, net_worth, total_debts, breakdown_json)
              VALUES (?, ?, ?, ?, 0, ?)`,
        args: [crypto.randomUUID(), userId, dayStart.toISOString(), snap.total_value, JSON.stringify({ OTHER: snap.total_value })],
      });
    }

    console.log(`Vermögenswerte für Nutzer ${userId} migriert (${entries.rows.length} Einträge).`);
  }
}

main().catch((err) => {
  console.error("Migration fehlgeschlagen:", err.message);
  process.exit(1);
});
