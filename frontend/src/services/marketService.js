import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

/**
 * Fetch market history from the backend.
 * @param {string} symbol   e.g. "RELIANCE.NS"
 * @param {string} period   e.g. "1mo", "3mo", "1y" — historical window
 * @param {string} interval e.g. "1d", "1h", "5m" — candle size
 * @param {AbortSignal} [signal] optional AbortController signal
 */
export const getMarketHistory = async (
  symbol = "RELIANCE.NS",
  period = "1mo",
  interval = "1d",
  signal = undefined
) => {
  const response = await API.get("/market/history", {
    params: { symbol, period, interval },
    signal,
  });
  return response.data;
};

/**
 * Fetch batch market quotes for multiple symbols with 5-day historical trend.
 * @param {string[]} symbols e.g. ["RELIANCE.NS", "TCS.NS"]
 * @param {AbortSignal} [signal]
 */
export const getBatchQuotes = async (symbols = [], signal = undefined) => {
  if (!symbols || symbols.length === 0) return { success: true, count: 0, quotes: {} };
  const symbolsParam = Array.isArray(symbols) ? symbols.join(",") : symbols;
  const response = await API.get("/market/quotes", {
    params: { symbols: symbolsParam },
    signal,
  });
  return response.data;
};

/**
 * Search Indian stocks on NSE / BSE via Yahoo Finance.
 * @param {string} query
 * @param {AbortSignal} [signal]
 */
export const searchMarketStocks = async (query = "", signal = undefined) => {
  if (!query || !query.trim()) return { success: true, query: "", count: 0, results: [] };
  const response = await API.get("/market/search", {
    params: { q: query.trim(), limit: 12 },
    signal,
  });
  return response.data;
};