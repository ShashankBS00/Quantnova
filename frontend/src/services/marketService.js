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