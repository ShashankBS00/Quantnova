import { useEffect, useState } from "react";
import { getMarketHistory } from "@/services/marketService";
import { TrendingUp, TrendingDown, Star } from "lucide-react";

const stocks = [
  "RELIANCE.NS",
  "TCS.NS",
  "INFY.NS",
  "HDFCBANK.NS",
];

export default function Watchlist({ selectedSymbol, onSelectStock }) {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const results = await Promise.all(
          stocks.map((symbol) => getMarketHistory(symbol, "5d"))
        );

        const formatted = results.map((result, index) => {
          const data = result.data;
          if (!data || data.length < 2) {
            return { symbol: stocks[index], price: null, change: null };
          }
          const previous = data[data.length - 2];
          const current = data[data.length - 1];
          const change = ((current.close - previous.close) / previous.close) * 100;
          return { symbol: stocks[index], price: current.close, change };
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
    <div className="qn-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Star size={15} style={{ color: 'var(--qn-gold)' }} />
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
              Watchlist
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
              Market overview
            </p>
          </div>
        </div>
        <span className="qn-badge" style={{ background: 'rgba(99,102,241,0.10)', color: 'var(--qn-text-2)', border: '1px solid rgba(99,102,241,0.18)' }}>
          {stocks.length} stocks
        </span>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-14 rounded-xl animate-pulse"
              style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.08)' }} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {marketData.map((stock) => {
            const isSelected = selectedSymbol === stock.symbol;
            const isPos = stock.change >= 0;
            return (
              <button
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(12,15,26,0.7)',
                  border: isSelected ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(99,102,241,0.08)',
                  boxShadow: isSelected ? '0 0 12px rgba(99,102,241,0.08)' : 'none',
                }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; } }}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.08)'; e.currentTarget.style.background = 'rgba(12,15,26,0.7)'; } }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: isSelected ? '#a5b4fc' : 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {stock.symbol.replace(".NS", "")}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                    NSE
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {stock.price !== null ? `₹${stock.price.toFixed(2)}` : "--"}
                  </p>
                  <p className="flex items-center justify-end gap-1 text-[11px] font-semibold"
                    style={{ color: isPos ? 'var(--qn-bull)' : 'var(--qn-bear)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {stock.change !== null && (isPos ? <TrendingUp size={10}/> : <TrendingDown size={10}/>)}
                    {stock.change !== null
                      ? `${isPos ? "+" : ""}${stock.change.toFixed(2)}%`
                      : "--"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
