import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  ArrowRight,
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import {
  formatINR,
  formatPnlINR,
  formatPercent,
  getCompanyName,
  getExchange,
  getCleanSymbol,
} from "@/utils/stockUtils";

export default function HoldingsTable({
  holdings = [],
  marketData = {},
  loading = false,
  onSelectHolding,
  onQuickTrade,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL | GAINERS | LOSERS | UNCHANGED
  const [sortField, setSortField] = useState("CURRENT_VALUE"); // SYMBOL | QTY | AVG_PRICE | CURRENT_PRICE | INVESTED | CURRENT_VALUE | PNL | PNL_PERCENT
  const [sortDirection, setSortDirection] = useState("DESC"); // ASC | DESC

  // Calculate full holdings with financial metrics
  const calculatedHoldings = useMemo(() => {
    return holdings.map((stock) => {
      const data = marketData[stock.symbol];
      const currentPrice = data?.price ?? data?.currentPrice;
      const hasQuote = typeof currentPrice === "number" && !Number.isNaN(currentPrice);

      const quantity = Number(stock.quantity) || 0;
      const averagePrice = Number(stock.averagePrice) || 0;
      const investedValue = quantity * averagePrice;

      const currentValue = hasQuote ? quantity * currentPrice : null;
      const pnl = currentValue !== null ? currentValue - investedValue : null;
      const pnlPercent = pnl !== null && investedValue > 0 ? (pnl / investedValue) * 100 : null;

      const cleanSymbol = getCleanSymbol(stock.symbol);
      const companyName = getCompanyName(stock.symbol);
      const exchange = getExchange(stock.symbol);

      return {
        ...stock,
        cleanSymbol,
        companyName,
        exchange,
        quantity,
        averagePrice,
        currentPrice: hasQuote ? currentPrice : null,
        investedValue,
        currentValue,
        pnl,
        pnlPercent,
        hasQuote,
      };
    });
  }, [holdings, marketData]);

  // Overall aggregate totals for table footer (representing COMPLETE portfolio)
  const totals = useMemo(() => {
    const totalShares = calculatedHoldings.reduce((sum, h) => sum + h.quantity, 0);
    const totalInvested = calculatedHoldings.reduce((sum, h) => sum + h.investedValue, 0);
    const totalCurrentValue = calculatedHoldings.reduce(
      (sum, h) => sum + (h.currentValue ?? h.investedValue),
      0
    );
    const totalPnl = totalCurrentValue - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return {
      totalShares,
      totalInvested,
      totalCurrentValue,
      totalPnl,
      totalReturnPercent,
    };
  }, [calculatedHoldings]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const gainers = calculatedHoldings.filter((h) => h.pnl !== null && h.pnl > 0).length;
    const losers = calculatedHoldings.filter((h) => h.pnl !== null && h.pnl < 0).length;
    const unchanged = calculatedHoldings.filter((h) => h.pnl === null || h.pnl === 0).length;
    return { all: calculatedHoldings.length, gainers, losers, unchanged };
  }, [calculatedHoldings]);

  // Filtered and sorted holdings
  const displayedHoldings = useMemo(() => {
    let result = [...calculatedHoldings];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.symbol.toLowerCase().includes(q) ||
          h.cleanSymbol.toLowerCase().includes(q) ||
          h.companyName.toLowerCase().includes(q)
      );
    }

    // Filter by type
    if (filterType === "GAINERS") {
      result = result.filter((h) => h.pnl !== null && h.pnl > 0);
    } else if (filterType === "LOSERS") {
      result = result.filter((h) => h.pnl !== null && h.pnl < 0);
    } else if (filterType === "UNCHANGED") {
      result = result.filter((h) => h.pnl === null || h.pnl === 0);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "SYMBOL":
          comparison = a.cleanSymbol.localeCompare(b.cleanSymbol);
          break;
        case "QTY":
          comparison = a.quantity - b.quantity;
          break;
        case "AVG_PRICE":
          comparison = a.averagePrice - b.averagePrice;
          break;
        case "CURRENT_PRICE":
          comparison = (a.currentPrice ?? 0) - (b.currentPrice ?? 0);
          break;
        case "INVESTED":
          comparison = a.investedValue - b.investedValue;
          break;
        case "CURRENT_VALUE":
          comparison = (a.currentValue ?? 0) - (b.currentValue ?? 0);
          break;
        case "PNL":
          comparison = (a.pnl ?? 0) - (b.pnl ?? 0);
          break;
        case "PNL_PERCENT":
          comparison = (a.pnlPercent ?? 0) - (b.pnlPercent ?? 0);
          break;
        default:
          comparison = (b.currentValue ?? 0) - (a.currentValue ?? 0);
      }
      return sortDirection === "ASC" ? comparison : -comparison;
    });

    return result;
  }, [calculatedHoldings, searchQuery, filterType, sortField, sortDirection]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortDirection("DESC");
    }
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* ── Table Top Bar ── */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2
              className="text-lg font-bold text-slate-900 tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Portfolio Holdings
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {holdings.length} {holdings.length === 1 ? "Position" : "Positions"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time positions, weighted average costs, mark-to-market prices, and returns
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search holding or symbol…"
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {[
              { id: "ALL", label: `All (${counts.all})` },
              { id: "GAINERS", label: `Gainers (${counts.gainers})` },
              { id: "LOSERS", label: `Losers (${counts.losers})` },
              { id: "UNCHANGED", label: `Unchanged (${counts.unchanged})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === tab.id
                    ? "bg-white text-indigo-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table Content ── */}
      {holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm">
            <Layers size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            No Open Positions
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
            You don&apos;t have any active stocks in your paper-trading portfolio yet. Place a virtual trade to start tracking holdings.
          </p>
          <button
            type="button"
            onClick={() => onQuickTrade && onQuickTrade({ side: "BUY" })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
          >
            <span>Execute Paper Trade</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : displayedHoldings.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No holdings match your search or filter query.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <th
                  onClick={() => handleSort("SYMBOL")}
                  className="py-3.5 px-5 cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Stock</span>
                    <ArrowUpDown size={12} className={sortField === "SYMBOL" ? "text-indigo-600" : "opacity-40"} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("QTY")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Quantity</span>
                    <ArrowUpDown size={12} className={sortField === "QTY" ? "text-indigo-600" : "opacity-40"} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("AVG_PRICE")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Avg Price</span>
                    <ArrowUpDown size={12} className={sortField === "AVG_PRICE" ? "text-indigo-600" : "opacity-40"} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("CURRENT_PRICE")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Current Price</span>
                    <ArrowUpDown size={12} className={sortField === "CURRENT_PRICE" ? "text-indigo-600" : "opacity-40"} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("INVESTED")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Invested</span>
                    <ArrowUpDown size={12} className={sortField === "INVESTED" ? "text-indigo-600" : "opacity-40"} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("CURRENT_VALUE")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Current Value</span>
                    <ArrowUpDown size={12} className={sortField === "CURRENT_VALUE" ? "text-indigo-600" : "opacity-40"} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("PNL")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>P&L</span>
                    <ArrowUpDown size={12} className={sortField === "PNL" ? "text-indigo-600" : "opacity-40"} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("PNL_PERCENT")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>P&L %</span>
                    <ArrowUpDown size={12} className={sortField === "PNL_PERCENT" ? "text-indigo-600" : "opacity-40"} />
                  </div>
                </th>

                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {displayedHoldings.map((stock) => {
                const isGain = stock.pnl !== null && stock.pnl > 0;
                const isLoss = stock.pnl !== null && stock.pnl < 0;

                return (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    onClick={() => onSelectHolding && onSelectHolding(stock)}
                  >
                    {/* Stock */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-indigo-700 font-mono border border-slate-200/60 shadow-2xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {stock.cleanSymbol.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                              {stock.cleanSymbol}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {stock.exchange}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium truncate max-w-[180px] sm:max-w-[240px]">
                            {stock.companyName}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-4 px-4 text-right font-medium text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stock.quantity}
                    </td>

                    {/* Average Price */}
                    <td className="py-4 px-4 text-right text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatINR(stock.averagePrice)}
                    </td>

                    {/* Current Price */}
                    <td className="py-4 px-4 text-right font-semibold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stock.hasQuote ? formatINR(stock.currentPrice) : "—"}
                    </td>

                    {/* Invested */}
                    <td className="py-4 px-4 text-right text-slate-700 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatINR(stock.investedValue)}
                    </td>

                    {/* Current Value */}
                    <td className="py-4 px-4 text-right font-bold text-indigo-950" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stock.currentValue !== null ? formatINR(stock.currentValue) : "—"}
                    </td>

                    {/* P&L */}
                    <td className="py-4 px-4 text-right font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stock.pnl === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className={isGain ? "text-emerald-600" : isLoss ? "text-rose-600" : "text-slate-700"}>
                          {formatPnlINR(stock.pnl)}
                        </span>
                      )}
                    </td>

                    {/* P&L % */}
                    <td className="py-4 px-4 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {stock.pnlPercent === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                            isGain
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isLoss
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {formatPercent(stock.pnlPercent)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onQuickTrade &&
                            onQuickTrade({
                              symbol: stock.symbol,
                              side: "BUY",
                              price: stock.currentPrice || stock.averagePrice,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-colors"
                          title="Buy more shares"
                        >
                          Buy
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onQuickTrade &&
                            onQuickTrade({
                              symbol: stock.symbol,
                              side: "SELL",
                              price: stock.currentPrice || stock.averagePrice,
                              maxQuantity: stock.quantity,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 transition-colors"
                          title="Sell shares"
                        >
                          Sell
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectHolding && onSelectHolding(stock)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Details"
                        >
                          <Info size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ── Table Footer Totals (representing complete portfolio) ── */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <td className="py-4 px-5 text-slate-900 font-extrabold uppercase">
                  Total Portfolio
                </td>
                <td className="py-4 px-4 text-right text-slate-600">
                  {totals.totalShares} shs
                </td>
                <td className="py-4 px-4 text-right text-slate-400">—</td>
                <td className="py-4 px-4 text-right text-slate-400">—</td>
                <td className="py-4 px-4 text-right text-slate-900">
                  {formatINR(totals.totalInvested)}
                </td>
                <td className="py-4 px-4 text-right text-indigo-700 font-black">
                  {formatINR(totals.totalCurrentValue)}
                </td>
                <td className="py-4 px-4 text-right font-black">
                  <span className={totals.totalPnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    {formatPnlINR(totals.totalPnl)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-extrabold ${
                      totals.totalPnl >= 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {formatPercent(totals.totalReturnPercent)}
                  </span>
                </td>
                <td className="py-4 px-5 text-right text-slate-400 text-[10px]">
                  {holdings.length} items
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}