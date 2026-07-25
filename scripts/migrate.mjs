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
  client.close();
}

main().catch((err) => {
  console.error("Migration fehlgeschlagen:", err.message);
  process.exit(1);
});
