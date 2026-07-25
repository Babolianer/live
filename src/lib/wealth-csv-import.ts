// CSV-Import für Broker-Transaktionen (z. B. Scalable Capital-Export) —
// ported als flexibler Spalten-Matcher statt eines starren 1:1-Formats,
// weil Broker-Exportformate sich zwischen Anbietern/Versionen unterscheiden.

export type ParsedImportRow = {
  rowNumber: number;
  dateIso: string;
  type: "BUY" | "SELL";
  isin: string | null;
  name: string;
  quantity: number;
  pricePerUnit: number;
  notes: string | null;
};

export type CsvImportResult = {
  rows: ParsedImportRow[];
  errors: string[];
};

const COLUMN_SYNONYMS: Record<string, string[]> = {
  date: ["datum", "date", "buchungsdatum", "transaktionsdatum", "orderdatum", "zeit", "ausführungsdatum"],
  type: ["typ", "type", "art", "transaktionstyp", "ordertyp", "aktion", "richtung"],
  isin: ["isin"],
  name: ["name", "bezeichnung", "wertpapier", "titel", "asset", "beschreibung", "description", "produktname"],
  quantity: ["stück", "stueck", "anzahl", "quantity", "shares", "menge", "nominale"],
  price: ["kurs", "preis", "price", "betrag pro aktie", "preis pro stück", "preis pro anteil", "unitprice", "ausführungskurs", "kurswert"],
  amount: ["betrag", "amount", "gesamtbetrag", "gesamt", "wert"],
};

const BUY_KEYWORDS = ["kauf", "buy", "erwerb", "einbuchung"];
const SELL_KEYWORDS = ["verkauf", "sell", "veräuß", "veraeuss", "ausbuchung"];

function detectDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

/** Minimal RFC4180-ish CSV parser: handles quoted fields, escaped quotes and embedded newlines/delimiters. */
function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }
  return rows;
}

function parseGermanNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/[€\s]/g, "");
  if (!trimmed) return null;
  const negative = trimmed.startsWith("-") || trimmed.endsWith("-");
  let cleaned = trimmed.replace(/^-|-$/g, "");
  // "1.234,56" (German) vs "1,234.56" (US) vs plain "1234.56"/"1234,56"
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

function parseDateToIso(raw: string): string | null {
  const trimmed = raw.trim();
  const germanMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (germanMatch) {
    const [, d, m, y] = germanMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return null;
}

function buildColumnIndex(header: string[]): Record<string, number> {
  const normalized = header.map((h) => h.trim().toLowerCase());
  const index: Record<string, number> = {};
  for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    const pos = normalized.findIndex((col) => synonyms.some((syn) => col === syn || col.includes(syn)));
    if (pos !== -1) index[field] = pos;
  }
  return index;
}

export function parseBrokerCsv(text: string): CsvImportResult {
  const delimiter = detectDelimiter(text.split(/\r?\n/, 1)[0] ?? "");
  const rawRows = parseCsvRows(text, delimiter);
  if (rawRows.length < 2) {
    return { rows: [], errors: ["Die Datei enthält keine verwertbaren Zeilen."] };
  }

  const [header, ...dataRows] = rawRows;
  const columns = buildColumnIndex(header);

  const missingRequired = ["date", "quantity"].filter((f) => columns[f] === undefined);
  if (missingRequired.length > 0 || (columns.price === undefined && columns.amount === undefined)) {
    return {
      rows: [],
      errors: [
        "Spalten konnten nicht erkannt werden — benötigt werden mindestens Datum, Stückzahl und Kurs/Betrag. Gefundene Spalten: " +
          (header.join(", ") || "keine"),
      ],
    };
  }
  if (columns.isin === undefined && columns.name === undefined) {
    return { rows: [], errors: ["Weder ISIN- noch Name-Spalte gefunden — Assets können nicht zugeordnet werden."] };
  }

  const rows: ParsedImportRow[] = [];
  const errors: string[] = [];

  dataRows.forEach((cols, idx) => {
    const rowNumber = idx + 2; // +1 header, +1 1-based
    const get = (field: string) => (columns[field] !== undefined ? (cols[columns[field]] ?? "").trim() : "");

    const dateIso = parseDateToIso(get("date"));
    if (!dateIso) {
      errors.push(`Zeile ${rowNumber}: Datum "${get("date")}" konnte nicht gelesen werden — übersprungen.`);
      return;
    }

    const quantityRaw = parseGermanNumber(get("quantity"));
    if (quantityRaw === null || quantityRaw === 0) {
      errors.push(`Zeile ${rowNumber}: Stückzahl "${get("quantity")}" ungültig — übersprungen.`);
      return;
    }

    let pricePerUnit: number | null = null;
    if (columns.price !== undefined) {
      pricePerUnit = parseGermanNumber(get("price"));
    }
    if (pricePerUnit === null && columns.amount !== undefined) {
      const amount = parseGermanNumber(get("amount"));
      if (amount !== null) pricePerUnit = Math.abs(amount) / Math.abs(quantityRaw);
    }
    if (pricePerUnit === null) {
      errors.push(`Zeile ${rowNumber}: Kurs/Betrag konnte nicht gelesen werden — übersprungen.`);
      return;
    }

    const typeRaw = get("type").toLowerCase();
    let type: "BUY" | "SELL";
    if (BUY_KEYWORDS.some((k) => typeRaw.includes(k))) type = "BUY";
    else if (SELL_KEYWORDS.some((k) => typeRaw.includes(k))) type = "SELL";
    else type = quantityRaw < 0 ? "SELL" : "BUY";

    const name = get("name") || get("isin") || "Unbenanntes Asset";
    const isin = get("isin") || null;

    rows.push({
      rowNumber,
      dateIso,
      type,
      isin,
      name,
      quantity: Math.abs(quantityRaw),
      pricePerUnit: Math.abs(pricePerUnit),
      notes: null,
    });
  });

  return { rows, errors };
}
