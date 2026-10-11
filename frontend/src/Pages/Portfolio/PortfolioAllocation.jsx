import React, { useMemo } from "react";
import { PieChart as PieIcon, Layers, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR, formatPercent, getCompanyName, getCleanSymbol } from "@/utils/stockUtils";

const PALETTE = [
  "#4f46e5", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#6366f1", // Light Indigo
];

export default function PortfolioAllocation({
  holdings = [],
  marketData = {},
  cash = 100000,
  loading = false,
}) {
  const { data, totalEquities, grandTotal } = useMemo(() => {
    const items = holdings
      .map((stock) => {
        const quote = marketData[stock.symbol];
        const price = quote?.price ?? quote?.currentPrice ?? stock.averagePrice;
        const validPrice = typeof price === "number" && !Number.isNaN(price) ? price : Number(stock.averagePrice) || 0;
        const val = (Number(stock.quantity) || 0) * validPrice;

        return {
          symbol: stock.symbol,
          cleanSymbol: getCleanSymbol(stock.symbol),
          companyName: getCompanyName(stock.symbol),
          value: val,
          quantity: stock.quantity,
          price: validPrice,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const equitiesVal = items.reduce((sum, item) => sum + item.value, 0);
    const totalWithCash = equitiesVal + Math.max(0, Number(cash) || 0);

    return {
      data: items,
      totalEquities: equitiesVal,
      grandTotal: totalWithCash,
    };
  }, [holdings, marketData, cash]);

  const cashPercent = grandTotal > 0 ? (cash / grandTotal) * 100 : 100;
  const equitiesPercent = grandTotal > 0 ? (totalEquities / grandTotal) * 100 : 0;

  return (
    <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h2
              className="text-lg font-bold text-slate-900 tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Portfolio Allocation & Asset Weights
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Capital distribution across active equities and liquid cash reserves
            </p>
          </div>
        </div>

        {grandTotal > 0 && !loading && (
          <div className="flex items-center gap-3 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-slate-400 font-medium">Total Assets:</span>
            <span className="font-bold text-sm text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
              {formatINR(grandTotal)}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-xs font-medium">Calculating portfolio allocation…</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 text-slate-400 gap-2">
          <Layers className="w-8 h-8 stroke-1 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No Equities in Portfolio</p>
          <p className="text-xs text-slate-400 max-w-sm text-center">
            All virtual capital is currently held as liquid cash ({formatINR(cash)}). Asset weights will visualize once stocks are purchased.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Top Macro Split Bar: Cash vs Equities */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-bold text-slate-700 gap-2 mb-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-indigo-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                  Equities: {formatINR(totalEquities)} ({equitiesPercent.toFixed(1)}%)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Available Cash: {formatINR(cash)} ({cashPercent.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 flex shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${equitiesPercent}%` }}
                title={`Equities: ${equitiesPercent.toFixed(1)}%`}
              />
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                style={{ width: `${cashPercent}%` }}
                title={`Cash: ${cashPercent.toFixed(1)}%`}
              />
            </div>
          </div>

          {/* Donut Chart + Table Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Donut Chart */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full h-64 max-w-[280px] mx-auto relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="cleanSymbol"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={98}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${entry.symbol}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          const pct = totalEquities > 0 ? (item.value / totalEquities) * 100 : 0;
                          return (
                            <div
                              className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs space-y-1"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              <p className="font-bold text-slate-900">{item.cleanSymbol}</p>
                              <p className="text-slate-500 font-sans text-[11px]">{item.companyName}</p>
                              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-4">
                                <span className="text-slate-500">Valuation:</span>
                                <span className="font-bold text-indigo-700">{formatINR(item.value)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Weight:</span>
                                <span className="font-bold text-slate-900">{pct.toFixed(2)}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Equities
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {formatINR(totalEquities)}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    {data.length} Assets
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Allocation Breakdown List */}
            <div className="lg:col-span-7">
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-2">
                {data.map((item, index) => {
                  const pct = totalEquities > 0 ? (item.value / totalEquities) * 100 : 0;
                  const color = PALETTE[index % PALETTE.length];

                  return (
                    <div
                      key={item.symbol}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs tracking-tight">
                            {item.cleanSymbol}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-[280px]">
                            {item.companyName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <p className="font-bold text-slate-900 text-xs">{formatINR(item.value)}</p>
                        <p className="text-[11px] font-semibold text-indigo-600">
                          {pct.toFixed(2)}% of equity
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
