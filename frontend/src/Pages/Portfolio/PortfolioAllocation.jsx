import React, { useMemo } from "react";
import { PieChart as PieIcon, Layers } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@/components/common/PnlBadge";

const COLORS = [
  "#4f46e5", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#3b82f6", // Blue
];

export default function PortfolioAllocation({
  holdings = [],
  marketData = {},
  loading = false,
}) {
  const { data, total } = useMemo(() => {
    const items = holdings
      .map((stock) => {
        const price = marketData[stock.symbol]?.currentPrice;
        if (typeof price === "number") {
          return {
            name: stock.symbol,
            value: stock.quantity * price,
            quantity: stock.quantity,
            price: price,
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value);

    const totalVal = items.reduce((sum, item) => sum + item.value, 0);
    return { data: items, total: totalVal };
  }, [holdings, marketData]);

  return (
    <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Portfolio Allocation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Asset distribution based on current market valuation
            </p>
          </div>
        </div>

        {total > 0 && !loading && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Total Valuation:
            </span>
            <span className="font-mono font-bold text-sm text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
              {formatINR(total)}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-xs font-medium">Updating allocation…</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 text-slate-400 gap-2">
          <Layers className="w-8 h-8 stroke-1 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            No allocation data available
          </p>
          <p className="text-xs text-slate-400">
            Holdings will automatically appear here once trades are executed.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Donut Chart */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full h-60 max-w-[260px] mx-auto relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {data.map((stock, index) => (
                      <Cell
                        key={stock.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatINR(val), "Value"]}
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid rgba(79, 70, 229, 0.16)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(79, 70, 229, 0.08)",
                      color: "#1e293b",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stat */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Equity
                </span>
                <span className="mt-0.5 text-base font-extrabold font-mono text-slate-900 tracking-tight">
                  {formatINR(total)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {data.length} {data.length === 1 ? "Stock" : "Stocks"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Allocation Breakdown List */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Breakdown by Asset
            </div>

            {data.map((stock, index) => {
              const percentage = total > 0 ? (stock.value / total) * 100 : 0;
              const color = COLORS[index % COLORS.length];

              return (
                <div
                  key={stock.name}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: color }}
                      />
                      <span className="font-bold text-sm text-slate-900 tracking-tight truncate">
                        {stock.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {stock.quantity} shs
                      </span>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {formatINR(stock.value)}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold font-mono"
                        style={{
                          background: `${color}15`,
                          color: color,
                        }}
                      >
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar track */}
                  <div className="mt-2.5 h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percentage}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
