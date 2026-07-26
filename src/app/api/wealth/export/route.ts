import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

const TABLES = [
  "wealth_groups",
  "wealth_sectors",
  "wealth_assets",
  "wealth_transactions",
  "wealth_debts",
  "wealth_savings_plans",
  "wealth_savings_goals",
  "wealth_expenses",
  "wealth_net_worth_snapshots",
] as const;

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(";"), ...rows.map((r) => columns.map((c) => escape(r[c])).join(";"))];
  return lines.join("\n");
}

/**
 * Full backup/export of a user's wealth data — JSON by default (round-trips
 * every table), or a single CSV table via ?table=wealth_transactions (matches
 * the broker-CSV-importer's column names, so exported transactions can be
 * re-imported elsewhere).
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const format = searchParams.get("format") ?? (table ? "csv" : "json");

  if (table) {
    if (!TABLES.includes(table as (typeof TABLES)[number])) {
      return NextResponse.json({ error: "Unbekannte Tabelle." }, { status: 400 });
    }
    const rows = await query<Record<string, unknown>[]>(`SELECT * FROM ${table} WHERE user_id = ?`, [user.id]);
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${table}.csv"`,
      },
    });
  }

  const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), userId: user.id };
  for (const t of TABLES) {
    data[t] = await query(`SELECT * FROM ${t} WHERE user_id = ?`, [user.id]);
  }

  if (format === "csv") {
    return NextResponse.json({ error: "CSV-Export nur pro Tabelle — bitte ?table=<name> angeben." }, { status: 400 });
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vermoegen-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
