import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  ExternalLink,
  Trash2,
  Search,
  Plus,
} from "lucide-react";
import WatchlistSparkline from "./WatchlistSparkline";

// ─── Currency formatting ──────────────────────────────────────────────────────
function fmtPrice(val) {
  if (val == null || isNaN(val)) return "—";
  return `₹${Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Volume formatting ────────────────────────────────────────────────────────
function fmtVol(n) {
  if (!n) return "—";
  if (n >= 1e7) return (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return (n / 1e5).toFixed(2) + " L";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " K";
  return String(n);
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/60 animate-pulse">
          <td className="py-3.5 px-4">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md mb-1.5" />
            <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800/50 rounded-md" />
          </td>
          <td className="py-3.5 px-4 text-right">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md ml-auto" />
          </td>
          <td className="py-3.5 px-4 text-right">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md ml-auto" />
          </td>
          <td className="py-3.5 px-4 text-center">
            <div className="h-7 w-20 bg-slate-100 dark:bg-slate-800/50 rounded-md mx-auto" />
          </td>
          <td className="py-3.5 px-4 text-right">
            <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-md ml-auto" />
          </td>
          <td className="py-3.5 px-4 text-right">
            <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-md ml-auto" />
          </td>
          <td className="py-3.5 px-4 text-right">
            <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-md ml-auto" />
          </td>
          <td className="py-3.5 px-4 text-right">
            <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-md ml-auto" />
          </td>
          <td className="py-3.5 px-4 text-right">
            <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-md ml-auto" />
          </td>
          <td className="py-3.5 px-4 text-center">
            <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-md mx-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function WatchlistTable({
  stocks = [],
  quotes = {},
  loading = false,
  priceFlashMap = {},
  onSelectStock,
  onRemoveStock,
  onOpenAddModal,
  selectedSymbol,
}) {
  const [filterQuery, setFilterQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL"); // ALL | GAINERS | LOSERS | UNCHANGED
  const [sortKey, setSortKey] = useState(null); // 'symbol' | 'price' | 'change' | 'change_percent' | 'volume' | 'high' | 'low'
  const [sortDir, setSortDir] = useState("desc"); // 'asc' | 'desc'

  // Handle column header click for sorting
  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDir === "desc") setSortDir("asc");
      else {
        setSortKey(null);
        setSortDir("desc");
      }
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    let gainers = 0;
    let losers = 0;
    let unchanged = 0;

    stocks.forEach((s) => {
      const q = quotes[s.symbol];
      if (!q || q.change == null) return;
      if (q.change > 0) gainers++;
      else if (q.change < 0) losers++;
      else unchanged++;
    });

    return {
      all: stocks.length,
      gainers,
      losers,
      unchanged,
    };
  }, [stocks, quotes]);

  // Derived filtered & sorted list (never mutates original stock array)
  const processedStocks = useMemo(() => {
    let list = [...stocks];

    // 1. Text Search Filter
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const sym = item.symbol.toLowerCase();
        const name = (item.name || "").toLowerCase();
        return sym.includes(q) || name.includes(q);
      });
    }

    // 2. Category Tab Filter
    if (activeCategory !== "ALL") {
      list = list.filter((item) => {
        const q = quotes[item.symbol];
        if (!q || q.change == null) return false;
        if (activeCategory === "GAINERS") return q.change > 0;
        if (activeCategory === "LOSERS") return q.change < 0;
        if (activeCategory === "UNCHANGED") return q.change === 0;
        return true;
      });
    }

    // 3. Sorting
    if (sortKey) {
      list.sort((a, b) => {
        const qa = quotes[a.symbol];
        const qb = quotes[b.symbol];

        if (sortKey === "symbol") {
          const comp = a.symbol.localeCompare(b.symbol);
          return sortDir === "asc" ? comp : -comp;
        }

        const valA = qa ? qa[sortKey] ?? -Infinity : -Infinity;
        const valB = qb ? qb[sortKey] ?? -Infinity : -Infinity;

        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [stocks, quotes, filterQuery, activeCategory, sortKey, sortDir]);

  return (
    <div className="bg-white dark:bg-[#090e1c] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* ── Filter & Search Toolbar ────────────────────────────────────────── */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#070b16] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs: All, Gainers, Losers */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: "All", count: categoryCounts.all },
            { id: "GAINERS", label: "Gainers", count: categoryCounts.gainers, color: "text-emerald-600 dark:text-emerald-400" },
            { id: "LOSERS", label: "Losers", count: categoryCounts.losers, color: "text-rose-600 dark:text-rose-400" },
            { id: "UNCHANGED", label: "Unchanged", count: categoryCounts.unchanged },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeCategory === cat.id ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200" : "text-slate-400"
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* In-table search input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter list tickers…"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-8.5 pl-8.5 pr-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-colors"
          />
        </div>
      </div>

      {/* ── Table View ──────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse select-none">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-[#070b16] text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
              {/* Stock */}
              <th
                onClick={() => handleSort("symbol")}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Stock</span>
                  <ArrowUpDown size={11} className={sortKey === "symbol" ? "text-indigo-500" : "text-slate-300 dark:text-slate-600"} />
                </div>
              </th>

              {/* LTP */}
              <th
                onClick={() => handleSort("price")}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>LTP</span>
                  <ArrowUpDown size={11} className={sortKey === "price" ? "text-indigo-500" : "text-slate-300 dark:text-slate-600"} />
                </div>
              </th>

              {/* Change / Change % */}
              <th
                onClick={() => handleSort("change_percent")}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Change (%)</span>
                  <ArrowUpDown size={11} className={sortKey === "change_percent" ? "text-indigo-500" : "text-slate-300 dark:text-slate-600"} />
                </div>
              </th>

              {/* Trend Sparkline */}
              <th className="py-3 px-4 text-center">Trend (5D)</th>

              {/* Open */}
              <th
                onClick={() => handleSort("open")}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors hidden md:table-cell"
              >
                <span>Open</span>
              </th>

              {/* High */}
              <th
                onClick={() => handleSort("high")}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors hidden lg:table-cell"
              >
                <span>High</span>
              </th>

              {/* Low */}
              <th
                onClick={() => handleSort("low")}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors hidden lg:table-cell"
              >
                <span>Low</span>
              </th>

              {/* Previous Close */}
              <th
                onClick={() => handleSort("prev_close")}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors hidden xl:table-cell"
              >
                <span>Prev Close</span>
              </th>

              {/* Volume */}
              <th
                onClick={() => handleSort("volume")}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors hidden sm:table-cell"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Volume</span>
                  <ArrowUpDown size={11} className={sortKey === "volume" ? "text-indigo-500" : "text-slate-300 dark:text-slate-600"} />
                </div>
              </th>

              {/* Actions */}
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {loading && stocks.length === 0 ? (
              <TableSkeleton />
            ) : processedStocks.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-14 px-4 text-center text-slate-400">
                  {stocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                        <Plus size={22} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                        Your watchlist is empty
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
                        Add your favorite NSE/BSE stocks to monitor live prices, changes, and volume trends.
                      </p>
                      <button
                        onClick={onOpenAddModal}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                      >
                        + Add Stock to List
                      </button>
                    </div>
                  ) : (
                    <div className="py-6 font-mono text-xs">
                      No tickers matched the current filter.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              processedStocks.map((stock) => {
                const q = quotes[stock.symbol];
                const cleanSym = stock.symbol.replace(/\.(NS|BO)$/i, "");
                const isSelected = selectedSymbol === stock.symbol;

                const price = q?.price;
                const change = q?.change ?? 0;
                const changePct = q?.change_percent ?? 0;
                const isPos = change > 0;
                const isNeg = change < 0;

                // Price flash animation classes
                const flash = priceFlashMap[stock.symbol];
                let flashBg = "";
                if (flash === "up") flashBg = "bg-emerald-100/60 dark:bg-emerald-950/50 transition-colors duration-1000";
                else if (flash === "down") flashBg = "bg-rose-100/60 dark:bg-rose-950/50 transition-colors duration-1000";

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/25"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Stock Name & Symbol */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-6 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-500 transition-colors" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white tracking-wide">
                              {cleanSym}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-px rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold border border-slate-200 dark:border-slate-700/80">
                              {stock.exchange || "NSE"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[180px] sm:max-w-[220px] truncate">
                            {stock.name || `${cleanSym} Limited`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* LTP */}
                    <td className={`py-3 px-4 text-right font-mono text-xs font-bold text-slate-900 dark:text-white ${flashBg}`}>
                      {fmtPrice(price)}
                    </td>

                    {/* Change / Change % */}
                    <td className="py-3 px-4 text-right font-mono text-xs whitespace-nowrap">
                      {q && q.change != null ? (
                        <div
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isPos
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isNeg
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-500"
                          }`}
                        >
                          {isPos ? <ArrowUpRight size={13} /> : isNeg ? <ArrowDownRight size={13} /> : null}
                          <span>
                            {isPos ? "+" : ""}
                            {change.toFixed(2)} ({isPos ? "+" : ""}
                            {changePct.toFixed(2)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Sparkline (5D) */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        <WatchlistSparkline
                          data={q?.sparkline}
                          positive={isPos}
                          width={85}
                          height={26}
                        />
                      </div>
                    </td>

                    {/* Open */}
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      {fmtPrice(q?.open)}
                    </td>

                    {/* High */}
                    <td className="py-3 px-4 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 hidden lg:table-cell">
                      {fmtPrice(q?.high)}
                    </td>

                    {/* Low */}
                    <td className="py-3 px-4 text-right font-mono text-xs text-rose-600 dark:text-rose-400 hidden lg:table-cell">
                      {fmtPrice(q?.low)}
                    </td>

                    {/* Prev Close */}
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 hidden xl:table-cell">
                      {fmtPrice(q?.prev_close)}
                    </td>

                    {/* Volume */}
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                      {fmtVol(q?.volume)}
                    </td>

                    {/* Quick Action Buttons */}
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="py-3 px-4 text-center"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Quick Trade */}
                        <Link
                          to={`/trading?symbol=${encodeURIComponent(stock.symbol)}`}
                          title={`Place paper trade on ${cleanSym}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-600 hover:text-white font-mono text-[10.5px] font-bold transition-all shadow-2xs"
                        >
                          TRADE
                        </Link>

                        {/* Open Chart */}
                        <Link
                          to={`/market?symbol=${encodeURIComponent(stock.symbol)}`}
                          title={`Open interactive chart for ${cleanSym}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                        >
                          <ExternalLink size={13} />
                        </Link>

                        {/* Remove */}
                        <button
                          onClick={() => onRemoveStock(stock.symbol)}
                          title={`Remove ${cleanSym} from watchlist`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Table Footer Summary ───────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-[#070b16] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>
          Showing {processedStocks.length} of {stocks.length} securities
        </span>
        <div className="flex items-center gap-3">
          <span>Click any row for detailed statistics & quick options</span>
        </div>
      </div>
    </div>
  );
}
