import React, { useState } from "react";
import { 
  Star, 
  Search, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp,
  ExternalLink 
} from "lucide-react";
import { Link } from "react-router-dom";

// Initial NSE Watchlist Data
const INITIAL_WATCHLIST = [
  {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries Ltd",
    price: 2942.50,
    change: 52.10,
    pctChange: 1.80,
    volume: "12.4M",
    dayHigh: 2960.00,
    dayLow: 2898.00,
    sparkline: [2898, 2915, 2908, 2930, 2925, 2948, 2942.5],
  },
  {
    symbol: "TCS.NS",
    name: "Tata Consultancy Services",
    price: 3814.20,
    change: -15.30,
    pctChange: -0.40,
    volume: "4.8M",
    dayHigh: 3845.00,
    dayLow: 3798.00,
    sparkline: [3840, 3825, 3830, 3810, 3805, 3818, 3814.2],
  },
  {
    symbol: "INFY.NS",
    name: "Infosys Limited",
    price: 1623.40,
    change: 33.40,
    pctChange: 2.10,
    volume: "8.2M",
    dayHigh: 1635.00,
    dayLow: 1595.00,
    sparkline: [1596, 1604, 1612, 1608, 1620, 1630, 1623.4],
  },
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank Ltd",
    price: 1648.10,
    change: -11.60,
    pctChange: -0.70,
    volume: "14.1M",
    dayHigh: 1665.00,
    dayLow: 1642.00,
    sparkline: [1664, 1658, 1650, 1655, 1645, 1646, 1648.1],
  },
  {
    symbol: "TATAMOTORS.NS",
    name: "Tata Motors Limited",
    price: 985.60,
    change: 13.60,
    pctChange: 1.40,
    volume: "9.5M",
    dayHigh: 994.00,
    dayLow: 973.00,
    sparkline: [974, 980, 978, 986, 982, 990, 985.6],
  },
  {
    symbol: "ICICIBANK.NS",
    name: "ICICI Bank Ltd",
    price: 1180.30,
    change: 7.10,
    pctChange: 0.60,
    volume: "10.3M",
    dayHigh: 1188.00,
    dayLow: 1172.00,
    sparkline: [1173, 1176, 1182, 1179, 1184, 1181, 1180.3],
  }
];

export default function Watchlist() {
  const [stocks, setStocks] = useState(INITIAL_WATCHLIST);
  const [searchQuery, setSearchQuery] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Search filter
  const filteredStocks = stocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Remove ticker from watchlist
  const handleRemove = (symbol) => {
    setStocks(stocks.filter((s) => s.symbol !== symbol));
  };

  // Add new ticker simulation
  const handleAddStock = (e) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    const formatted = newSymbol.toUpperCase().trim();
    const symbolWithExt = formatted.endsWith(".NS") ? formatted : `${formatted}.NS`;

    if (stocks.some((s) => s.symbol === symbolWithExt)) {
      alert("Ticker is already in your watchlist");
      return;
    }

    const newEntry = {
      symbol: symbolWithExt,
      name: `${formatted.replace(".NS", "")} Equities Ltd`,
      price: 1540.00,
      change: 12.50,
      pctChange: 0.82,
      volume: "3.2M",
      dayHigh: 1560.00,
      dayLow: 1520.00,
      sparkline: [1520, 1530, 1528, 1545, 1538, 1550, 1540],
    };

    setStocks([newEntry, ...stocks]);
    setNewSymbol("");
    setIsAdding(false);
  };

  // Render miniature SVG sparkline
  const renderSparkline = (data, isPositive) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 26;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={isPositive ? "#10b981" : "#ef4444"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div>
          <div className="flex items-center gap-2 mb-1 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <Star size={14} className="fill-blue-400" /> Curated Monitor
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Market Watchlist
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track real-time momentum, spreads, and fast execution setups for your primary assets.
          </p>
        </div>

        {/* Search & Add Stock */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Filter watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070b16] border border-[#162444] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
            />
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
          >
            <Plus size={15} /> Add Ticker
          </button>
        </div>
      </div>

      {/* 2. Add Ticker Slide-Down Panel */}
      {isAdding && (
        <form
          onSubmit={handleAddStock}
          className="p-4 bg-[#0c1328] border border-[#1d2d54] rounded-xl flex items-center gap-3 max-w-lg transition-all"
        >
          <input
            type="text"
            placeholder="Enter NSE Symbol (e.g. SBIN, WIPRO)..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="flex-1 bg-[#070b16] border border-[#162444] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-3 py-2 text-xs text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
        </form>
      )}

      {/* 3. Watchlist Table */}
      <div className="bg-[#0b1222] border border-[#162444] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#162444] bg-[#070b16]/70 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Symbol / Company</th>
                <th className="py-3.5 px-4 text-right">LTP (₹)</th>
                <th className="py-3.5 px-4 text-right">Change</th>
                <th className="py-3.5 px-4 text-center">Day Trend</th>
                <th className="py-3.5 px-4 text-right">24h Range</th>
                <th className="py-3.5 px-4 text-right">Volume</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131d36] text-xs">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500 font-mono">
                    No matching tickers found in watchlist.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      className="hover:bg-[#0c1427]/80 transition-colors group"
                    >
                      {/* Ticker Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleRemove(stock.symbol)}
                            title="Remove from Watchlist"
                            className="text-slate-600 hover:text-rose-400 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div>
                            <div className="font-bold text-white font-mono tracking-wide text-sm">
                              {stock.symbol.replace(".NS", "")}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {stock.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Last Traded Price */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-slate-100 text-sm">
                        ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Percentage & Rupee Change */}
                      <td className="py-4 px-4 text-right font-mono">
                        <div
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isPositive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <ArrowDownRight size={14} />
                          )}
                          <span>
                            {isPositive ? "+" : ""}
                            {stock.change.toFixed(2)} ({isPositive ? "+" : ""}
                            {stock.pctChange}%)
                          </span>
                        </div>
                      </td>

                      {/* Sparkline Visual */}
                      <td className="py-4 px-4">
                        <div className="flex justify-center">
                          {renderSparkline(stock.sparkline, isPositive)}
                        </div>
                      </td>

                      {/* 24h High / Low Range */}
                      <td className="py-4 px-4 text-right font-mono text-[11px]">
                        <div className="text-slate-300">H: ₹{stock.dayHigh.toFixed(2)}</div>
                        <div className="text-slate-500">L: ₹{stock.dayLow.toFixed(2)}</div>
                      </td>

                      {/* 24h Volume */}
                      <td className="py-4 px-4 text-right font-mono text-slate-300 font-medium">
                        {stock.volume}
                      </td>

                      {/* Quick Execution Trigger */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to="/trading"
                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold font-mono transition"
                          >
                            TRADE
                          </Link>
                          <Link
                            to="/market"
                            className="p-1 text-slate-500 hover:text-blue-400 transition"
                            title="Open in Chart"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}