import { createClient, type Client } from "@libsql/client";

declare global {
  var __lifeDbClient: Client | undefined;
}

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL || "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient({ url, authToken, intMode: "number" });
}

// Reused across hot-reloads in dev so we don't open a new connection per request.
export const db = globalThis.__lifeDbClient ?? createDbClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__lifeDbClient = db;
}

export async function query<T = Record<string, unknown>[]>(
  sql: string,
  params: unknown[] = []
): Promise<T> {
  const result = await db.execute({ sql, args: params as never[] });
  // libSQL's Row objects aren't plain objects (array-like with a hidden
  // prototype) — RSC payloads and "use client" props require plain objects,
  // so convert every row explicitly instead of passing rows through as-is.
  const plainRows = result.rows.map((row) =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
  );
  return plainRows as T;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
