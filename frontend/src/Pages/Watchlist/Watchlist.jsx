import { useEffect, useState } from "react";
import { getMarketHistory } from "@/services/marketService";

const stocks = [
  "RELIANCE.NS",
  "TCS.NS",
  "INFY.NS",
  "HDFCBANK.NS",
];
export default function Watchlist({
  selectedSymbol,
  onSelectStock,
}) {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const results = await Promise.all(
          stocks.map((symbol) =>
            getMarketHistory(symbol, "5d")
          )
        );

        const formatted = results.map((result, index) => {
          const data = result.data;

          if (!data || data.length < 2) {
            return {
              symbol: stocks[index],
              price: null,
              change: null,
            };
          }

          const previous = data[data.length - 2];
          const current = data[data.length - 1];

          const change =
            ((current.close - previous.close) / previous.close) * 100;

          return {
            symbol: stocks[index],
            price: current.close,
            change,
          };
        });

        setMarketData(formatted);
      } catch (error) {
        console.error("Failed to load watchlist:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Watchlist
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Market overview
          </p>
        </div>

        <span className="text-sm text-slate-500">
          {stocks.length} stocks
        </span>
      </div>

      {loading ? (
        <div className="text-slate-400 py-6">
          Loading market data...
        </div>
      ) : (
        <div className="space-y-3">
          {marketData.map((stock) => (
           <button
  key={stock.symbol}
  onClick={() => onSelectStock(stock.symbol)}
 className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${
  selectedSymbol === stock.symbol
    ? "bg-blue-600/20 border border-blue-500"
    : "bg-slate-800/60 hover:bg-slate-700"
}`}
>
              <div>
                <p className="font-medium text-white">
                  {stock.symbol}
                </p>

                <p className="text-xs text-slate-500">
                  NSE
                </p>
              </div>

              <div className="text-right">
                <p className="text-white font-medium">
                  {stock.price !== null
                    ? `₹${stock.price.toFixed(2)}`
                    : "--"}
                </p>

                <p
                  className={
                    stock.change >= 0
                      ? "text-green-400 text-sm"
                      : "text-red-400 text-sm"
                  }
                >
                  {stock.change !== null
                    ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}%`
                    : "--"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}