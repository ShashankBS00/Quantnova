import React from "react";
import { Link } from "react-router-dom";
import { Layers, ArrowRight } from "lucide-react";
import PnlBadge, { formatINR, formatPnlINR } from "@/components/common/PnlBadge";
import EmptyState from "@/components/common/EmptyState";

export default function HoldingsTable({
  holdings = [],
  marketData = {},
  loading = false,
}) {
  // Aggregate totals
  const totalInvested = holdings.reduce(
    (sum, stock) => sum + (stock.averagePrice || 0) * (stock.quantity || 0),
    0
  );

  const totalCurrentValue = holdings.reduce((sum, stock) => {
    const price = marketData[stock.symbol]?.currentPrice;
    return typeof price === "number" ? sum + price * (stock.quantity || 0) : sum;
  }, 0);

  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPercent =
    totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Portfolio Holdings
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {holdings.length} {holdings.length === 1 ? "Position" : "Positions"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time valuation and performance of your active assets
          </p>
        </div>

        {holdings.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Net P&L:</span>
            <PnlBadge
              value={totalPnl}
              percent={totalPnlPercent}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Table / Empty State */}
      {holdings.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No open positions"
          description="You don't have any stocks in your portfolio yet. Place a trade to start investing."
          action={
            <Link
              to="/trading"
              className="qn-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
            >
              <span>Explore Trading</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Stock</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Avg Price</th>
                <th className="py-3 px-4 text-right">Current Price</th>
                <th className="py-3 px-4 text-right">Invested</th>
                <th className="py-3 px-4 text-right">Current Value</th>
                <th className="py-3 px-4 text-right">P&L</th>
                <th className="py-3 px-5 text-right">P&L %</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {holdings.map((stock) => {
                const data = marketData[stock.symbol];
                const currentPrice = data?.currentPrice;
                const investedValue =
                  (stock.averagePrice || 0) * (stock.quantity || 0);
                const currentValue =
                  typeof currentPrice === "number"
                    ? currentPrice * (stock.quantity || 0)
                    : null;
                const pnl =
                  currentValue !== null ? currentValue - investedValue : null;
                const pnlPercentage =
                  pnl !== null && investedValue > 0
                    ? (pnl / investedValue) * 100
                    : null;

                const baseSymbol = stock.symbol.replace(/\.NS$/i, "");
                const isNSE = stock.symbol.toUpperCase().endsWith(".NS");

                return (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    {/* Stock */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-indigo-700 font-mono border border-slate-200/60">
                          {baseSymbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 tracking-tight">
                            {stock.symbol}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {isNSE ? "NSE Equity" : "Equity"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 font-medium tabular-nums">
                      {stock.quantity}
                    </td>

                    {/* Average Price */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(stock.averagePrice)}
                    </td>

                    {/* Current Price */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {loading
                        ? "--"
                        : typeof currentPrice === "number"
                        ? formatINR(currentPrice)
                        : "--"}
                    </td>

                    {/* Invested */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                      {formatINR(investedValue)}
                    </td>

                    {/* Current Value */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {currentValue !== null ? formatINR(currentValue) : "--"}
                    </td>

                    {/* P&L */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums">
                      {pnl === null ? (
                        <span className="text-slate-400">--</span>
                      ) : (
                        <span
                          className={
                            pnl > 0
                              ? "text-emerald-600"
                              : pnl < 0
                              ? "text-rose-600"
                              : "text-slate-700"
                          }
                        >
                          {formatPnlINR(pnl)}
                        </span>
                      )}
                    </td>

                    {/* P&L % */}
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                      {pnlPercentage === null ? (
                        <span className="text-slate-400">--</span>
                      ) : (
                        <PnlBadge
                          percent={pnlPercentage}
                          isPercentOnly
                          size="sm"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-slate-50/70 border-t border-slate-200 text-xs font-semibold text-slate-700">
                <td className="py-3 px-5 text-slate-900 font-bold">Total</td>
                <td className="py-3 px-4 text-right font-mono text-slate-500">
                  {holdings.reduce((sum, s) => sum + (s.quantity || 0), 0)} shs
                </td>
                <td className="py-3 px-4 text-right text-slate-400">--</td>
                <td className="py-3 px-4 text-right text-slate-400">--</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                  {formatINR(totalInvested)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                  {formatINR(totalCurrentValue)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  <span
                    className={
                      totalPnl > 0
                        ? "text-emerald-600"
                        : totalPnl < 0
                        ? "text-rose-600"
                        : "text-slate-700"
                    }
                  >
                    {formatPnlINR(totalPnl)}
                  </span>
                </td>
                <td className="py-3 px-5 text-right font-mono font-bold">
                  <PnlBadge
                    percent={totalPnlPercent}
                    isPercentOnly
                    size="sm"
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}