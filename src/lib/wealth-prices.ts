import { query, newId } from "@/lib/db";
import { LIVE_PRICE_ASSET_TYPES, type AssetTyp } from "@/lib/wealth-asset-constants";

const MASSIVE_CALL_LIMIT_PER_REFRESH = 5;

const cryptoIds: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", XRP: "ripple", LINK: "chainlink",
  ADA: "cardano", AVAX: "avalanche-2", DOGE: "dogecoin", ALGO: "algorand",
  ONDO: "ondo-finance", HBAR: "hedera-hashgraph", SUI: "sui", XLM: "stellar", MOVE: "movement",
};

let eurUsdRate: number | null = null;

async function getEurUsdRate(): Promise<number> {
  if (eurUsdRate) return eurUsdRate;
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?range=1d&interval=1d", {
      headers: { "user-agent": "LIFE-Wealth/1.0" },
    });
    const data = await res.json();
    const rate = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (typeof rate === "number" && rate > 0) {
      eurUsdRate = rate;
      return rate;
    }
  } catch {
    // fallback below
  }
  return 1.08;
}

function buildYahooCandidates(symbol: string): string[] {
  const normalized = symbol.trim().toUpperCase();
  const hasSuffix = normalized.includes(".") || normalized.includes("-") || normalized.endsWith("F");
  return hasSuffix ? [normalized] : [normalized, `${normalized}.DE`];
}

export async function fetchMassivePreviousClose(symbol: string) {
  const apiKey = process.env.MASSIVE_API_KEY;
  if (!apiKey) throw new Error("MASSIVE_API_KEY fehlt");

  const normalized = symbol.trim().toUpperCase();
  const url = new URL(`https://api.massive.com/v2/aggs/ticker/${encodeURIComponent(normalized)}/prev`);
  url.searchParams.set("adjusted", "true");
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url, { headers: { "user-agent": "LIFE-Wealth/1.0" }, cache: "no-store" });
  if (!response.ok) throw new Error(`Massive ${response.status}: ${normalized}`);

  const data = await response.json();
  const price = data.results?.[0]?.c;
  if (typeof price !== "number") throw new Error(`Massive liefert keinen Schlusskurs: ${normalized}`);
  return price;
}

export async function fetchMarketPrice(symbol: string): Promise<number> {
  const normalized = symbol.trim().toUpperCase();

  if (process.env.MASSIVE_API_KEY) {
    try {
      return await fetchMassivePreviousClose(symbol);
    } catch {
      // fall through to Yahoo
    }
  }

  const candidates = buildYahooCandidates(normalized);
  for (const yahooSymbol of candidates) {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`, {
      headers: { "user-agent": "LIFE-Wealth/1.0" },
    });
    if (!response.ok) continue;

    const data = await response.json();
    const result = data.chart?.result?.[0];
    const price = result?.meta?.regularMarketPrice ?? result?.indicators?.quote?.[0]?.close?.at(-1);
    if (typeof price !== "number") continue;

    const currency = result?.meta?.currency ?? "USD";
    if (currency === "EUR") return price;
    const rate = await getEurUsdRate();
    return price / rate;
  }

  throw new Error(`Kurs konnte nicht geladen werden: ${normalized}`);
}

export async function fetchCryptoPricesBatch(symbols: string[]): Promise<Record<string, number>> {
  const cgIds = symbols.map((s) => cryptoIds[s.trim().toUpperCase()]).filter(Boolean).join(",");

  if (cgIds) {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(cgIds)}&vs_currencies=eur`, {
        headers: { "user-agent": "LIFE-Wealth/1.0" },
        next: { revalidate: 300 },
      });
      if (response.ok) {
        const data = await response.json();
        const result: Record<string, number> = {};
        for (const sym of symbols) {
          const n = sym.trim().toUpperCase();
          const id = cryptoIds[n];
          if (id && typeof data[id]?.eur === "number") result[n] = data[id].eur;
        }
        if (Object.keys(result).length > 0) return result;
      }
    } catch {
      // fall through
    }
  }

  const apiKey = process.env.FREECRYPTOAPI_KEY;
  if (apiKey) {
    const result: Record<string, number> = {};
    for (const sym of symbols) {
      try {
        const normalized = sym.trim().toUpperCase();
        const response = await fetch(`https://api.freecryptoapi.com/v1/getData?symbol=${encodeURIComponent(normalized)}&token=${apiKey}`, {
          headers: { "user-agent": "LIFE-Wealth/1.0" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.status === "success" && data?.symbols?.[0]?.last) {
            result[sym] = parseFloat(data.symbols[0].last);
          }
        }
      } catch {
        // skip failed symbol
      }
    }
    return result;
  }

  return {};
}

const YAHOO_RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1d": { range: "1d", interval: "5m" },
  "7d": { range: "5d", interval: "15m" },
  "30d": { range: "1mo", interval: "1d" },
  "90d": { range: "3mo", interval: "1d" },
  "1y": { range: "1y", interval: "1wk" },
  max: { range: "max", interval: "1mo" },
};

async function fetchYahooChart(symbol: string, range: string, interval: string): Promise<{ date: string; price: number }[]> {
  const candidates = buildYahooCandidates(symbol);
  for (const yahooSymbol of candidates) {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=${interval}`,
      { headers: { "user-agent": "LIFE-Wealth/1.0" }, next: { revalidate: 300 } }
    );
    if (!response.ok) continue;

    const data = await response.json();
    const result = data.chart?.result?.[0];
    const timestamps: number[] | undefined = result?.timestamp;
    const closes: (number | null)[] | undefined = result?.indicators?.quote?.[0]?.close;
    if (!timestamps || !closes) continue;

    const currency = result?.meta?.currency ?? "USD";
    const rate = currency === "EUR" ? 1 : await getEurUsdRate();

    const points = timestamps
      .map((ts, i) => ({ ts, price: closes[i] }))
      .filter((p): p is { ts: number; price: number } => typeof p.price === "number")
      .map((p) => ({ date: new Date(p.ts * 1000).toISOString(), price: currency === "EUR" ? p.price : p.price / rate }));

    if (points.length > 0) return points;
  }
  throw new Error(`Chartdaten konnten nicht geladen werden: ${symbol}`);
}

export async function fetchStockChartData(symbol: string, timeframe = "90d") {
  const { range, interval } = YAHOO_RANGE_MAP[timeframe] ?? YAHOO_RANGE_MAP["90d"];
  return fetchYahooChart(symbol, range, interval);
}

export async function fetchStockChartHistoryDaily(symbol: string) {
  return fetchYahooChart(symbol, "max", "1d");
}

export async function fetchCryptoChartData(symbol: string, days: number | "max" = 90) {
  const normalized = symbol.trim().toUpperCase();
  const cgId = cryptoIds[normalized];
  if (!cgId) throw new Error(`Keine CoinGecko-ID für ${symbol}`);

  const daysParam = days === "max" ? "max" : String(days);
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=eur&days=${daysParam}`, {
    headers: { "user-agent": "LIFE-Wealth/1.0" },
    next: { revalidate: 600 },
  });
  if (!response.ok) throw new Error(`CoinGecko ${response.status}: ${symbol}`);

  const data = await response.json();
  return (data.prices || []).map(([ts, price]: [number, number]) => ({ date: new Date(ts).toISOString(), price }));
}

// ── Persistence ──────────────────────────────────────────────────────

function dayStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function persistLatestPriceForAsset(userId: string, assetId: string, price: number, date: Date = new Date()) {
  if (!(price > 0)) return;
  const priceDate = date.toISOString();
  await query(`UPDATE wealth_assets SET price_per_unit=?, price_updated_at=? WHERE id=? AND user_id=?`, [price, priceDate, assetId, userId]);

  const dayIso = dayStart(date).toISOString();
  const existing = await query<{ id: string }[]>(
    `SELECT id FROM wealth_price_history WHERE asset_id = ? AND date >= ? ORDER BY date DESC LIMIT 1`,
    [assetId, dayIso]
  );
  if (existing[0]) {
    await query(`UPDATE wealth_price_history SET price=? WHERE id=?`, [price, existing[0].id]);
  } else {
    await query(`INSERT INTO wealth_price_history (id, user_id, asset_id, date, price, created_at) VALUES (?, ?, ?, ?, ?, ?)`, [
      newId(), userId, assetId, priceDate, price, new Date().toISOString(),
    ]);
  }
}

// Ensures a live-priceable asset has dense, persistent price history — full
// backfill when the existing history isn't deep enough, otherwise only fills
// gaps since the last stored day.
export async function ensurePriceHistoryCoverage(userId: string, asset: { id: string; symbol: string | null; typ: AssetTyp }) {
  if (!asset.symbol || !LIVE_PRICE_ASSET_TYPES.includes(asset.typ)) return;
  const symbol = asset.symbol;

  const existingRows = await query<{ date: string }[]>(
    `SELECT date FROM wealth_price_history WHERE asset_id = ? ORDER BY date ASC`,
    [asset.id]
  );
  const existingDays = new Set(existingRows.map((r) => dayStart(new Date(r.date)).getTime()));

  const yesterday = dayStart(new Date());
  yesterday.setDate(yesterday.getDate() - 1);
  const oneYearAgo = dayStart(new Date());
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const ninetyDaysAgo = dayStart(new Date());
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const earliestDay = existingRows.length > 0 ? dayStart(new Date(existingRows[0].date)).getTime() : null;
  const latestDay = existingRows.length > 0 ? dayStart(new Date(existingRows[existingRows.length - 1].date)).getTime() : null;
  const recentCount = existingRows.filter((r) => new Date(r.date).getTime() >= ninetyDaysAgo.getTime()).length;

  const needsFullBackfill = earliestDay === null || earliestDay > oneYearAgo.getTime();
  const needsRefresh = !needsFullBackfill && (latestDay === null || latestDay < yesterday.getTime() || recentCount < 45);
  if (!needsFullBackfill && !needsRefresh) return;

  try {
    const points = needsFullBackfill
      ? asset.typ === "CRYPTO" ? await fetchCryptoChartData(symbol, "max") : await fetchStockChartHistoryDaily(symbol)
      : asset.typ === "CRYPTO" ? await fetchCryptoChartData(symbol, 90) : await fetchStockChartData(symbol, "90d");
    if (points.length === 0) return;

    const byDay = new Map<number, number>();
    for (const p of points) {
      const day = dayStart(new Date(p.date)).getTime();
      if (!existingDays.has(day)) byDay.set(day, p.price);
    }
    if (byDay.size === 0) return;

    for (const [day, price] of byDay.entries()) {
      await query(`INSERT INTO wealth_price_history (id, user_id, asset_id, date, price, created_at) VALUES (?, ?, ?, ?, ?, ?)`, [
        newId(), userId, asset.id, new Date(day).toISOString(), price, new Date().toISOString(),
      ]);
    }
    const lastEntry = Array.from(byDay.entries()).sort((a, b) => a[0] - b[0]).at(-1)!;
    await query(`UPDATE wealth_assets SET price_per_unit=?, price_updated_at=? WHERE id=?`, [lastEntry[1], new Date().toISOString(), asset.id]);
  } catch {
    // Live source unreachable — existing history stays as-is, retried next call.
  }
}

export async function listPriceHistory(assetId: string, userId: string, limit = 365) {
  const rows = await query<{ date: string; price: number }[]>(
    `SELECT date, price FROM wealth_price_history WHERE asset_id = ? AND user_id = ? ORDER BY date DESC LIMIT ?`,
    [assetId, userId, limit]
  );
  return rows.reverse();
}

// ── Refresh (synchronous — no in-memory job tracker, safe on serverless) ──

export interface PriceRefreshResult {
  symbol: string;
  name: string;
  oldPrice?: number;
  price?: number;
  ok: boolean;
  error?: string;
}

async function getNextBatch<T extends { id: string }>(userId: string, kind: "stocks" | "crypto", items: T[]) {
  if (!items.length) return { batch: [] as T[] };

  const existing = await query<{ cursor: number }[]>(`SELECT cursor FROM wealth_price_cursors WHERE user_id = ? AND kind = ?`, [userId, kind]);
  const cursor = existing[0]?.cursor ?? 0;
  const start = cursor % items.length;
  const ordered = [...items.slice(start), ...items.slice(0, start)];
  const batch = ordered.slice(0, MASSIVE_CALL_LIMIT_PER_REFRESH);
  const nextCursor = (start + batch.length) % items.length;

  if (existing[0]) {
    await query(`UPDATE wealth_price_cursors SET cursor=?, updated_at=? WHERE user_id=? AND kind=?`, [nextCursor, new Date().toISOString(), userId, kind]);
  } else {
    await query(`INSERT INTO wealth_price_cursors (user_id, kind, cursor, updated_at) VALUES (?, ?, ?, ?)`, [userId, kind, nextCursor, new Date().toISOString()]);
  }
  return { batch };
}

export async function refreshPrices(userId: string, type: "stocks" | "crypto" | "all" = "all") {
  const assets = await query<{ id: string; name: string; symbol: string; typ: AssetTyp; price_per_unit: number }[]>(
    `SELECT id, name, symbol, typ, price_per_unit FROM wealth_assets WHERE user_id = ? AND symbol IS NOT NULL AND symbol != ''`,
    [userId]
  );

  const stocksEtfs = assets.filter((a) => (a.typ === "STOCK" || a.typ === "ETF" || a.typ === "METAL") && (type === "stocks" || type === "all"));
  const cryptos = assets.filter((a) => a.typ === "CRYPTO" && (type === "crypto" || type === "all"));

  const results: PriceRefreshResult[] = [];

  if (stocksEtfs.length > 0) {
    const { batch } = await getNextBatch(userId, "stocks", stocksEtfs);
    for (const asset of batch) {
      try {
        const oldPrice = asset.price_per_unit;
        const price = await fetchMarketPrice(asset.symbol);
        await persistLatestPriceForAsset(userId, asset.id, price);
        results.push({ symbol: asset.symbol, name: asset.name, oldPrice, price, ok: true });
      } catch (error) {
        results.push({ symbol: asset.symbol, name: asset.name, ok: false, error: error instanceof Error ? error.message : "Unbekannter Fehler" });
      }
    }
  }

  if (cryptos.length > 0) {
    const symbols = cryptos.map((a) => a.symbol);
    const batchPrices = await fetchCryptoPricesBatch(symbols);
    for (const asset of cryptos) {
      try {
        const oldPrice = asset.price_per_unit;
        const price = batchPrices[asset.symbol];
        if (typeof price !== "number") throw new Error(`Kein Kurs für ${asset.symbol}`);
        await persistLatestPriceForAsset(userId, asset.id, price);
        results.push({ symbol: asset.symbol, name: asset.name, oldPrice, price, ok: true });
      } catch (error) {
        results.push({ symbol: asset.symbol, name: asset.name, ok: false, error: error instanceof Error ? error.message : "Unbekannter Fehler" });
      }
    }
  }

  return {
    provider: process.env.MASSIVE_API_KEY ? "massive" : "yahoo-fallback",
    cryptoProvider: "coingecko",
    securitiesSeen: stocksEtfs.length,
    cryptosSeen: cryptos.length,
    results,
  };
}
