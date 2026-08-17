import { getMarketHistory } from "@/services/marketService";

export async function getCurrentMarketData(symbol) {
  const result = await getMarketHistory(symbol, "5d");

  const data = result.data;

  if (!data || data.length === 0) {
    throw new Error(`No market data available for ${symbol}`);
  }

  const current = data[data.length - 1];

  const previous =
    data.length >= 2
      ? data[data.length - 2]
      : current;

  return {
    symbol,
    currentPrice: current.close,
    previousClose: previous.close,
  };
}

export async function getCurrentPrice(symbol) {
  const data = await getCurrentMarketData(symbol);

  return data.currentPrice;
}