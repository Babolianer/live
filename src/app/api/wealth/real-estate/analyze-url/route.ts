import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { extractListingData, FIELD_LABELS_BASE, type AnalyzedListing } from "@/lib/listing-extraction";

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

function noDataResponse() {
  return NextResponse.json({
    success: false,
    error: "Es konnten keine Daten von dieser Seite extrahiert werden. Bitte manuell ausfüllen.",
  });
}

// Blocks obvious SSRF targets (loopback/private/link-local/metadata hosts) —
// this fetches a user-supplied URL server-side, so it must not become a way
// to probe internal network addresses.
function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) return true;
  if (lower === "169.254.169.254") return true;
  const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  if (lower === "::1" || lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
  return false;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
  if (!rawUrl) return NextResponse.json({ success: false, error: "Bitte eine URL angeben." }, { status: 400 });

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return NextResponse.json({ success: false, error: "Ungültige URL." }, { status: 400 });
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return NextResponse.json({ success: false, error: "Nur http(s)-URLs werden unterstützt." }, { status: 400 });
  }
  if (isBlockedHost(url.hostname)) {
    return NextResponse.json({ success: false, error: "Diese Adresse wird nicht unterstützt." }, { status: 400 });
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; LifeAppBot/1.0)" },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Seite konnte nicht geladen werden (${res.status}).` });
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      return NextResponse.json({ success: false, error: "Seite ist zu groß." });
    }
    html = buffer.toString("utf-8");
  } catch {
    return NextResponse.json({ success: false, error: "Seite konnte nicht geladen werden." });
  }

  const data = extractListingData(html);
  const foundFields = (Object.keys(data) as (keyof AnalyzedListing)[]).filter((k) => data[k] !== undefined);
  const missingFields = (Object.keys(FIELD_LABELS_BASE) as (keyof AnalyzedListing)[]).filter((k) => !foundFields.includes(k));

  if (foundFields.length === 0) return noDataResponse();

  return NextResponse.json({
    success: true,
    data,
    foundFields: foundFields.map((f) => FIELD_LABELS_BASE[f]),
    missingFields: missingFields.map((f) => FIELD_LABELS_BASE[f]),
  });
}
