import axios from "axios";

const API_URL = "http://127.0.0.1:8000";
const STORAGE_KEY = "quantnova_watchlists_v2";

// ─── Default seed watchlists ──────────────────────────────────────────────────
export const DEFAULT_WATCHLISTS = [
  {
    id: "wl_default",
    name: "My Watchlist",
    symbols: [
      { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd", exchange: "NSE" },
      { symbol: "TCS.NS", name: "Tata Consultancy Services", exchange: "NSE" },
      { symbol: "INFY.NS", name: "Infosys Limited", exchange: "NSE" },
      { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", exchange: "NSE" },
      { symbol: "TATAMOTORS.NS", name: "Tata Motors Limited", exchange: "NSE" },
      { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd", exchange: "NSE" },
    ],
  },
  {
    id: "wl_banking",
    name: "Banking",
    symbols: [
      { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", exchange: "NSE" },
      { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd", exchange: "NSE" },
      { symbol: "SBIN.NS", name: "State Bank of India", exchange: "NSE" },
      { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", exchange: "NSE" },
      { symbol: "AXISBANK.NS", name: "Axis Bank Ltd", exchange: "NSE" },
    ],
  },
  {
    id: "wl_it",
    name: "IT & Tech",
    symbols: [
      { symbol: "TCS.NS", name: "Tata Consultancy Services", exchange: "NSE" },
      { symbol: "INFY.NS", name: "Infosys Limited", exchange: "NSE" },
      { symbol: "WIPRO.NS", name: "Wipro Limited", exchange: "NSE" },
      { symbol: "HCLTECH.NS", name: "HCL Technologies Ltd", exchange: "NSE" },
      { symbol: "TECHM.NS", name: "Tech Mahindra Ltd", exchange: "NSE" },
    ],
  },
  {
    id: "wl_auto",
    name: "Automobile",
    symbols: [
      { symbol: "TATAMOTORS.NS", name: "Tata Motors Limited", exchange: "NSE" },
      { symbol: "MARUTI.NS", name: "Maruti Suzuki India", exchange: "NSE" },
      { symbol: "M&M.NS", name: "Mahindra & Mahindra", exchange: "NSE" },
      { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto Ltd", exchange: "NSE" },
    ],
  },
];

function getHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("[Watchlist] Local load error:", err);
  }
  return DEFAULT_WATCHLISTS;
}

function saveLocal(lists) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (err) {
    console.warn("[Watchlist] Local save error:", err);
  }
}

/**
 * Fetch all watchlists (tries backend first, falls back to local storage)
 */
export async function fetchWatchlists() {
  try {
    const res = await axios.get(`${API_URL}/watchlist`, {
      headers: getHeaders(),
      timeout: 4000,
    });
    if (res.data?.success && Array.isArray(res.data.watchlists) && res.data.watchlists.length > 0) {
      saveLocal(res.data.watchlists);
      return res.data.watchlists;
    }
  } catch (err) {
    console.warn("[Watchlist] Server unreachable, using local persistence:", err?.message);
  }
  return loadLocal();
}

/**
 * Create a new watchlist
 */
export async function createWatchlist(name, initialSymbols = []) {
  const cleanName = name.trim();
  try {
    const res = await axios.post(
      `${API_URL}/watchlist`,
      { name: cleanName, symbols: initialSymbols },
      { headers: getHeaders(), timeout: 4000 }
    );
    if (res.data?.success && res.data.watchlist) {
      const updated = await fetchWatchlists();
      return { success: true, watchlists: updated, newId: res.data.watchlist.id };
    }
  } catch (err) {
    console.warn("[Watchlist] Server create failed, using local fallback:", err?.message);
  }

  // Local fallback
  const current = loadLocal();
  if (current.some((w) => w.name.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error(`A watchlist named "${cleanName}" already exists`);
  }
  const newWl = {
    id: `wl_${Date.now()}`,
    name: cleanName,
    symbols: initialSymbols,
  };
  const updated = [...current, newWl];
  saveLocal(updated);
  return { success: true, watchlists: updated, newId: newWl.id };
}

/**
 * Rename a watchlist
 */
export async function renameWatchlist(watchlistId, newName) {
  const cleanName = newName.trim();
  try {
    await axios.put(
      `${API_URL}/watchlist/${watchlistId}`,
      { name: cleanName },
      { headers: getHeaders(), timeout: 4000 }
    );
  } catch (err) {
    console.warn("[Watchlist] Server rename fallback:", err?.message);
  }

  const current = loadLocal();
  const updated = current.map((w) => (w.id === watchlistId ? { ...w, name: cleanName } : w));
  saveLocal(updated);
  return updated;
}

/**
 * Delete a watchlist
 */
export async function deleteWatchlist(watchlistId) {
  try {
    await axios.delete(`${API_URL}/watchlist/${watchlistId}`, {
      headers: getHeaders(),
      timeout: 4000,
    });
  } catch (err) {
    console.warn("[Watchlist] Server delete fallback:", err?.message);
  }

  const current = loadLocal();
  const updated = current.filter((w) => w.id !== watchlistId);
  saveLocal(updated);
  return updated;
}

/**
 * Add a symbol to a watchlist
 */
export async function addSymbolToWatchlist(watchlistId, stockItem) {
  const rawSymbol = stockItem.symbol.trim().toUpperCase();
  const fullSymbol = rawSymbol.includes(".") ? rawSymbol : `${rawSymbol}.NS`;
  const cleanItem = {
    symbol: fullSymbol,
    name: stockItem.name || `${fullSymbol.replace(/\.(NS|BO)$/i, "")} Ltd`,
    exchange: stockItem.exchange || "NSE",
  };

  try {
    await axios.post(
      `${API_URL}/watchlist/${watchlistId}/symbols`,
      cleanItem,
      { headers: getHeaders(), timeout: 4000 }
    );
  } catch (err) {
    console.warn("[Watchlist] Server add symbol fallback:", err?.message);
  }

  const current = loadLocal();
  const updated = current.map((w) => {
    if (w.id !== watchlistId) return w;
    const exists = (w.symbols || []).some((s) => s.symbol === cleanItem.symbol);
    if (exists) throw new Error(`${cleanItem.symbol} is already in this watchlist`);
    return {
      ...w,
      symbols: [...(w.symbols || []), cleanItem],
    };
  });
  saveLocal(updated);
  return updated;
}

/**
 * Remove a symbol from a watchlist
 */
export async function removeSymbolFromWatchlist(watchlistId, symbol) {
  try {
    await axios.delete(
      `${API_URL}/watchlist/${watchlistId}/symbols/${encodeURIComponent(symbol)}`,
      { headers: getHeaders(), timeout: 4000 }
    );
  } catch (err) {
    console.warn("[Watchlist] Server remove symbol fallback:", err?.message);
  }

  const current = loadLocal();
  const updated = current.map((w) => {
    if (w.id !== watchlistId) return w;
    return {
      ...w,
      symbols: (w.symbols || []).filter((s) => s.symbol !== symbol),
    };
  });
  saveLocal(updated);
  return updated;
}

/**
 * Reorder symbols in a watchlist
 */
export async function reorderSymbols(watchlistId, reorderedSymbols) {
  try {
    await axios.put(
      `${API_URL}/watchlist/${watchlistId}/reorder`,
      { symbols: reorderedSymbols },
      { headers: getHeaders(), timeout: 4000 }
    );
  } catch (err) {
    console.warn("[Watchlist] Server reorder fallback:", err?.message);
  }

  const current = loadLocal();
  const updated = current.map((w) =>
    w.id === watchlistId ? { ...w, symbols: reorderedSymbols } : w
  );
  saveLocal(updated);
  return updated;
}
