// Regex-/JSON-LD-basierte Extraktion von Immobilien-Exposé-Daten — ported aus
// dem Kapitalverwaltung-Datenmodell. Bewusst ohne LLM-Aufruf: reine
// Text-Heuristik, damit die Analyse offline und ohne API-Kosten funktioniert.

export interface AnalyzedListing {
  name?: string;
  purchasePrice?: number;
  livingArea?: number;
  rooms?: number;
  buildYear?: number;
}

export interface ExtendedAnalyzedListing extends AnalyzedListing {
  landArea?: number;
  energyClass?: string;
  condition?: string;
}

export const FIELD_LABELS_BASE: Record<keyof AnalyzedListing, string> = {
  name: "Bezeichnung",
  purchasePrice: "Kaufpreis",
  livingArea: "Wohnfläche",
  rooms: "Zimmer",
  buildYear: "Baujahr",
};

export const FIELD_LABELS_EXTENDED: Record<keyof ExtendedAnalyzedListing, string> = {
  ...FIELD_LABELS_BASE,
  landArea: "Grundstücksfläche",
  energyClass: "Energieklasse",
  condition: "Zustand",
};

const CONDITION_KEYWORDS = ["Neubau", "Neuwertig", "Gepflegt", "Modernisierungsbedürftig", "Sanierungsbedürftig"];
const ENERGY_CLASS_PATTERN = /Energie(?:effizienz)?klasse[:\s]*?([A-H]\+?)\b/i;
const BUILD_YEAR_PATTERN = /Baujahr[:\s]*?(\d{4})/i;
const ROOMS_PATTERN = /(\d+(?:[.,]\d+)?)\s?Zimmer/i;
const PURCHASE_PRICE_PATTERN = /(\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?)\s?€/;
const LIVING_AREA_LABELED_PATTERN = /Wohnfl[äa]che[^0-9]{0,20}(\d+(?:[.,]\d+)?)\s?m²/i;
const LIVING_AREA_GENERIC_PATTERN = /(\d+(?:[.,]\d+)?)\s?m²/;
const LAND_AREA_LABELED_PATTERN = /Grundst(?:ü|ue)ck(?:sfl[äa]che)?[^0-9]{0,20}(\d+(?:[.,]\d+)?)\s?m²/i;

// ── URL-Analyse (JSON-LD → Open-Graph/Regex-Fallback) ────────────────────

export function extractListingData(html: string): AnalyzedListing {
  const result: AnalyzedListing = {};

  for (const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(block[1].trim());
      walkJsonLd(parsed, result);
    } catch {
      // ungültiges/kaputtes JSON-LD ignorieren
    }
  }

  if (result.name === undefined) {
    const ogTitle = extractMetaContent(html, "og:title") ?? extractTag(html, "title");
    if (ogTitle) result.name = ogTitle.trim().slice(0, 120);
  }

  const visibleText = extractMetaContent(html, "og:description") ?? html.replace(/<[^>]+>/g, " ");

  if (result.purchasePrice === undefined) {
    const price = extractPurchasePrice(visibleText);
    if (price !== undefined) result.purchasePrice = price;
  }

  if (result.livingArea === undefined) {
    const m = visibleText.match(LIVING_AREA_GENERIC_PATTERN);
    if (m) {
      const n = Number(m[1].replace(",", "."));
      if (Number.isFinite(n)) result.livingArea = n;
    }
  }

  if (result.rooms === undefined) {
    const rooms = extractRooms(visibleText);
    if (rooms !== undefined) result.rooms = rooms;
  }

  if (result.buildYear === undefined) {
    const buildYear = extractBuildYear(visibleText);
    if (buildYear !== undefined) result.buildYear = buildYear;
  }

  return result;
}

function walkJsonLd(node: unknown, results: AnalyzedListing, depth = 0) {
  if (!node || typeof node !== "object" || depth > 6) return;
  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, results, depth + 1);
    return;
  }
  const obj = node as Record<string, unknown>;

  if (results.purchasePrice === undefined && "price" in obj) {
    const raw = obj.price;
    const priceValue =
      typeof raw === "object" && raw !== null
        ? ((raw as Record<string, unknown>).value ?? (raw as Record<string, unknown>)["@value"])
        : raw;
    const n = Number(String(priceValue).replace(/[^\d.,]/g, "").replace(",", "."));
    if (Number.isFinite(n) && n > 1000) results.purchasePrice = n;
  }
  if (results.rooms === undefined && "numberOfRooms" in obj) {
    const n = Number(obj.numberOfRooms);
    if (Number.isFinite(n)) results.rooms = n;
  }
  if (results.livingArea === undefined && "floorSize" in obj) {
    const fs = obj.floorSize;
    const raw = typeof fs === "object" && fs !== null ? (fs as Record<string, unknown>).value : fs;
    const n = Number(String(raw).replace(",", "."));
    if (Number.isFinite(n)) results.livingArea = n;
  }
  if (results.name === undefined && typeof obj.name === "string") {
    results.name = obj.name;
  }

  for (const key of Object.keys(obj)) {
    if (key === "price" || key === "numberOfRooms" || key === "floorSize" || key === "name") continue;
    walkJsonLd(obj[key], results, depth + 1);
  }
}

function extractMetaContent(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re1 = new RegExp(`<meta[^>]*(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, "i");
  const m1 = html.match(re1);
  if (m1) return m1[1];
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, "i");
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

function extractTag(html: string, tag: string): string | null {
  const m = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"));
  return m ? m[1] : null;
}

// ── Datei-Analyse (reiner Text aus PDF/OCR) ──────────────────────────────

export function extractExtendedListingData(text: string): ExtendedAnalyzedListing {
  const result: ExtendedAnalyzedListing = {};

  const firstLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (firstLine) result.name = firstLine.slice(0, 120);

  const price = extractPurchasePrice(text);
  if (price !== undefined) result.purchasePrice = price;

  const livingAreaLabeled = text.match(LIVING_AREA_LABELED_PATTERN);
  if (livingAreaLabeled) {
    const n = Number(livingAreaLabeled[1].replace(",", "."));
    if (Number.isFinite(n)) result.livingArea = n;
  } else {
    const generic = text.match(LIVING_AREA_GENERIC_PATTERN);
    if (generic) {
      const n = Number(generic[1].replace(",", "."));
      if (Number.isFinite(n)) result.livingArea = n;
    }
  }

  const landAreaMatch = text.match(LAND_AREA_LABELED_PATTERN);
  if (landAreaMatch) {
    const n = Number(landAreaMatch[1].replace(",", "."));
    if (Number.isFinite(n)) result.landArea = n;
  }

  const rooms = extractRooms(text);
  if (rooms !== undefined) result.rooms = rooms;

  const buildYear = extractBuildYear(text);
  if (buildYear !== undefined) result.buildYear = buildYear;

  const energyMatch = text.match(ENERGY_CLASS_PATTERN);
  if (energyMatch) result.energyClass = energyMatch[1].toUpperCase();

  const lowerText = text.toLowerCase();
  const condition = CONDITION_KEYWORDS.find((k) => lowerText.includes(k.toLowerCase()));
  if (condition) result.condition = condition;

  return result;
}

function extractPurchasePrice(text: string): number | undefined {
  const m = text.match(PURCHASE_PRICE_PATTERN);
  if (!m) return undefined;
  const n = Number(m[1].replace(/[.\s]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 1000 ? n : undefined;
}

function extractRooms(text: string): number | undefined {
  const m = text.match(ROOMS_PATTERN);
  if (!m) return undefined;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function extractBuildYear(text: string): number | undefined {
  const m = text.match(BUILD_YEAR_PATTERN);
  if (!m) return undefined;
  const n = Number(m[1]);
  return n > 1800 && n < 2100 ? n : undefined;
}
