export const API_URL = "/api/market";

export async function api(path, options = {}) {
  const route = path.startsWith("/api/") ? path.slice(4) : path;
  const res = await fetch(API_URL + route, {cache: "no-store", signal: options.signal});
  if (!res.ok) {
    // Keep the error actionable without exposing upstream credentials or
    // surfacing arbitrary provider messages to the user.
    let data = null;
    try { data = await res.json(); } catch {}
    const error = new Error("Market-data API HTTP " + res.status);
    error.status = res.status;
    error.code = typeof data?.errorCode === "string" ? data.errorCode : "MARKET_API_ERROR";
    throw error;
  }
  return res.json();
}

// Fetch one stock's deep fundamentals + price history + earnings.
// 1) Try /api/fundamentals/:symbol — ratios + annual/quarterly + price history.
// 2) Fall back to /api/stock then the screener feed.
export async function fetchStock(symbol, market = "NSE", basis = "consolidated") {
  const sym = String(symbol || "").toUpperCase();
  let providerData = null;
  try {
    const r = await api("/api/fundamentals/" + encodeURIComponent(sym) + "?market=" + market);
    if (r?.success && r.data) {
      providerData = r.data;
      if (market === "US" && r.data.price != null) {
        return { ...r.data, market, dataSource: { price: "Market data provider", fundamentals: "Market data provider" } };
      }
    }
  } catch {}
  if (market === "NSE" && !providerData) {
    try {
      const r = await api("/api/stock/" + encodeURIComponent(sym));
      if (r?.success && r.data) providerData = r.data;
    } catch {}
  }
  const scr = market === "US" ? "/api/us-screener" : "/api/screener";
  let row = null;
  try {
    const r = await api(scr);
    const rows = Array.isArray(r?.data) ? r.data : [];
    row = rows.find(x => String(x.symbol).toUpperCase() === sym) || null;
  } catch {}
  if (market !== "NSE") {
    if (!row && !providerData) return null;
    const source = row || providerData;
    return {
      symbol: source.symbol || sym, name: source.name || sym, sector: source.sector, industry: source.industry,
      price: source.price ?? null, change: source.change ?? null, changePct: source.changePct ?? null,
      open: source.open ?? null, high: source.high ?? null, low: source.low ?? null,
      prevClose: source.prevClose ?? null, volume: source.volume ?? null,
      fundamentals: source.fundamentals || source, history: source.history || [], annual: source.annual || [], quarterly: source.quarterly || [],
      market, dataSource: { price: "Screener feed", fundamentals: "Market data provider" },
    };
  }

  let summary = null, financialHistory = null;
  try {
    const params = "symbol=" + encodeURIComponent(sym) + "&basis=" + encodeURIComponent(basis);
    const [summaryResponse, historyResponse] = await Promise.all([
      fetch("/api/screener/fundamentals?view=summary&" + params, { cache: "no-store" }),
      fetch("/api/screener/fundamentals?view=history&" + params, { cache: "no-store" })
    ]);
    const [summaryBody, historyBody] = await Promise.all([
      summaryResponse.json().catch(() => ({})), historyResponse.json().catch(() => ({}))
    ]);
    if (summaryResponse.ok && summaryBody.ok && summaryBody.items?.length) summary = summaryBody.items[0];
    if (historyResponse.ok && historyBody.ok) financialHistory = historyBody;
  } catch {}

  if (!row && !providerData && !summary) return null;
  const price = row?.price ?? providerData?.price ?? null;
  const eps = summary?.epsBasicTTM ?? providerData?.fundamentals?.eps ?? null;
  const shares = summary?.sharesOutstandingCrore ?? null;
  const bookValue = summary?.bookValuePerShare ?? null;
  const derivedMarketCap = price > 0 && shares > 0 ? price * shares * 1e7 : null;
  const marketCap = row?.marketCap ?? providerData?.fundamentals?.marketCap ?? derivedMarketCap;
  const derivedPe = price > 0 && eps > 0 ? price / eps : null;
  const derivedPb = price > 0 && bookValue > 0 ? price / bookValue : null;
  const derivedPs = marketCap != null && summary?.revenueTTM > 0 ? (marketCap / 1e7) / summary.revenueTTM : null;
  const fundamentals = {
    ...(providerData?.fundamentals || {}),
    ...(row || {}),
    marketCap: marketCap ?? null,
    pe: row?.pe ?? providerData?.fundamentals?.pe ?? derivedPe ?? null,
    pb: row?.pb ?? providerData?.fundamentals?.pb ?? derivedPb ?? null,
    ps: row?.ps ?? providerData?.fundamentals?.ps ?? derivedPs ?? null,
    eps: eps ?? null,
    bookValue: bookValue ?? null,
    roe: summary?.roeTTMPct ?? null,
    roa: summary?.roaTTMPct ?? null,
    debtEquity: summary?.debtEquity ?? null,
    netMargin: summary?.netProfitMarginTTMPct ?? null,
    revenueGrowth: summary?.revenueGrowthTTMPct ?? null,
    earningsGrowth: summary?.epsGrowthTTMPct ?? null,
    netProfitGrowth: summary?.netProfitGrowthTTMPct ?? null,
    currentRatio: summary?.currentRatio ?? null,
    totalBorrowings: summary?.totalBorrowings ?? null,
    cash: summary?.cash ?? null,
    totalAssets: summary?.totalAssets ?? null,
    revenueTTM: summary?.revenueTTM ?? null,
    netProfitTTM: summary?.netProfitTTM ?? null,
    sharesOutstandingCrore: shares,
    bookValuePerShare: bookValue,
    cfoYtd: summary?.cfoYtd ?? null,
    cfiYtd: summary?.cfiYtd ?? null,
    cffYtd: summary?.cffYtd ?? null,
    capexYtd: summary?.capexYtd ?? null,
    latestQuarterPeriod: summary?.latestQuarterPeriod ?? null,
    latestAnnualPeriod: summary?.latestAnnualPeriod ?? null,
    basis,
    financialSource: summary ? "NSE filings workbook · latest revised values" : null,
    marketCapSource: row?.marketCap != null ? "Yahoo Finance" : derivedMarketCap != null ? "AHQ derived from reported paid-up capital and provider price" : null
  };
  const records = Array.isArray(financialHistory?.records) ? financialHistory.records : [];
  const annual = records.filter(r => r.statement === "annual_pnl").sort((a,b) => String(a.period_end).localeCompare(String(b.period_end))).map(r => ({
    label: String(r.period_end || "").slice(0,4), period_end: r.period_end,
    revenue: r.data?.fy_revenue ?? null, profit: r.data?.fy_net_profit ?? null,
    eps: r.data?.fy_eps_basic ?? null
  }));
  const quarterly = records.filter(r => r.statement === "quarterly_pnl").sort((a,b) => String(a.period_end).localeCompare(String(b.period_end))).map(r => ({
    label: String(r.period_end || "").slice(0,7), period_end: r.period_end,
    revenue: r.data?.revenue ?? null, profit: r.data?.net_profit ?? null,
    eps: r.data?.eps_basic_adj ?? r.data?.eps_basic ?? null
  }));
  return {
    symbol: sym, name: row?.name || providerData?.name || summary?.name || sym,
    sector: row?.sector || "Unclassified", industry: row?.industry || "Unclassified",
    classificationProvider: row?.classificationProvider || null,
    classificationStatus: row?.classificationStatus || "unclassified",
    price: price ?? null, change: row?.change ?? providerData?.change ?? null,
    changePct: row?.changePct ?? providerData?.changePct ?? null,
    open: row?.open ?? providerData?.open ?? null, high: row?.high ?? providerData?.high ?? null,
    low: row?.low ?? providerData?.low ?? null, prevClose: row?.prevClose ?? providerData?.prevClose ?? null,
    volume: row?.volume ?? providerData?.volume ?? null, fundamentals,
    history: providerData?.history || [], annual: annual.length ? annual : (providerData?.annual || []),
    quarterly: quarterly.length ? quarterly : (providerData?.quarterly || []),
    financialHistory, financialSummary: summary, market, basis,
    dataSource: {
      price: row?.priceSrc || (price != null ? "Market data provider" : "Unavailable"),
      fundamentals: summary ? "NSE filings workbook · " + basis : "Provider data unavailable",
      classification: row?.classificationProvider || "Unclassified"
    }
  };
}
