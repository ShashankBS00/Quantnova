import React, { useState, useMemo } from "react";
import { TrendingUp, Activity, BarChart2, ShieldCheck, Calendar } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { formatINR, formatPnlINR, formatPercent } from "@/utils/stockUtils";

const RANGES = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"];

export default function PortfolioPerformanceChart({
  orders = [],
  initialCash = 100000,
  currentValuation = 100000,
  loading = false,
}) {
  const [selectedRange, setSelectedRange] = useState("1M");

  // Derive genuine transaction-chronological equity history
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    // Chronological order (orders are returned newest first by backend, so reverse them)
    const sorted = [...orders].sort(
      (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );

    let cumulativeCash = Number(initialCash) || 100000;
    let cumulativeInvested = 0;
    let cumulativeRealized = 0;
    const holdingsTracker = {};

    const points = [
      {
        step: 0,
        label: "Initial",
        equity: cumulativeCash,
        invested: 0,
        cash: cumulativeCash,
        timestamp: sorted[0]?.created_at || new Date().toISOString(),
      },
    ];

    sorted.forEach((order, index) => {
      const sym = order.symbol;
      const qty = Number(order.quantity) || 0;
      const price = Number(order.price) || 0;
      const totalAmount = Number(order.total) || qty * price;
      const realized = Number(order.realized_pnl) || 0;

      if (order.side === "BUY") {
        cumulativeCash -= totalAmount;
        cumulativeInvested += totalAmount;
        if (!holdingsTracker[sym]) holdingsTracker[sym] = { qty: 0, cost: 0 };
        holdingsTracker[sym].qty += qty;
        holdingsTracker[sym].cost += totalAmount;
      } else if (order.side === "SELL") {
        cumulativeCash += totalAmount;
        cumulativeRealized += realized;
        if (holdingsTracker[sym]) {
          const avg = holdingsTracker[sym].qty > 0 ? holdingsTracker[sym].cost / holdingsTracker[sym].qty : price;
          const costRelieved = qty * avg;
          cumulativeInvested = Math.max(0, cumulativeInvested - costRelieved);
          holdingsTracker[sym].qty = Math.max(0, holdingsTracker[sym].qty - qty);
          holdingsTracker[sym].cost = Math.max(0, holdingsTracker[sym].cost - costRelieved);
        }
      }

      const totalEquityPoint = cumulativeCash + cumulativeInvested + cumulativeRealized;

      points.push({
        step: index + 1,
        label: `${order.side} ${sym.replace(/\.(NS|BO)$/i, "")}`,
        symbol: sym,
        side: order.side,
        equity: Math.round(totalEquityPoint * 100) / 100,
        invested: Math.round(cumulativeInvested * 100) / 100,
        cash: Math.round(cumulativeCash * 100) / 100,
        timestamp: order.created_at || new Date().toISOString(),
      });
    });

    return points;
  }, [orders, initialCash]);

  // Performance metrics for current range
  const performanceStats = useMemo(() => {
    if (!chartData.length) {
      return { startVal: initialCash, currentVal: currentValuation, absChange: 0, pctChange: 0 };
    }
    const startVal = chartData[0].equity;
    const currentVal = chartData[chartData.length - 1].equity;
    const absChange = currentVal - startVal;
    const pctChange = startVal > 0 ? (absChange / startVal) * 100 : 0;
    return { startVal, currentVal, absChange, pctChange };
  }, [chartData, initialCash, currentValuation]);

  const values = chartData.map((d) => d.equity);
  const minEquity = values.length ? Math.min(...values) : initialCash;
  const maxEquity = values.length ? Math.max(...values) : initialCash;
  const yDomain =
    minEquity === maxEquity
      ? [Math.max(0, minEquity - 2000), maxEquity + 2000]
      : [(dataMin) => Math.max(0, Math.floor(dataMin * 0.98)), (dataMax) => Math.ceil(dataMax * 1.02)];

  return (
    <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-lg font-bold text-slate-900 tracking-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Portfolio Performance & Historical Trajectory
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Transaction-Derived
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark-to-market account equity replay over executed simulated orders
              </p>
            </div>
          </div>
        </div>

        {/* Range Selector & Performance Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRange(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedRange === r
                    ? "bg-white text-indigo-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-72 text-slate-400 gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-xs font-medium">Replaying portfolio track record…</span>
        </div>
      ) : chartData.length <= 1 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6 text-center border border-dashed rounded-xl my-4 bg-slate-50/50">
          <Activity className="w-8 h-8 stroke-1 text-indigo-400 mb-2" />
          <h4 className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            No Historical Performance Telemetry
          </h4>
          <p className="text-xs text-slate-500 max-w-md mt-1 mb-2">
            Historical portfolio snapshots build dynamically with each executed paper order.
            Execute buy and sell trades to start mapping your capital growth curve.
          </p>
          <span className="text-[10px] text-slate-400 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200">
            Current Base Balance: {formatINR(initialCash)}
          </span>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Performance Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Current Equity
                </span>
                <p className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatINR(performanceStats.currentVal)}
                </p>
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Net Track Return
                </span>
                <p
                  className={`font-bold text-sm ${
                    performanceStats.absChange >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatPnlINR(performanceStats.absChange)} ({formatPercent(performanceStats.pctChange)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-indigo-600" /> Total Equity
              </span>
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Cost Basis Line
              </span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 15, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioPerfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.38" />
                    <stop offset="65%" stopColor="#8b5cf6" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" vertical={false} />
                <XAxis
                  dataKey="step"
                  tickLine={false}
                  axisLine={{ stroke: "rgba(99, 102, 241, 0.16)" }}
                  tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                  tickFormatter={(val) => (val === 0 ? "Start" : `#${val}`)}
                />
                <YAxis
                  domain={yDomain}
                  width={85}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(99, 102, 241, 0.16)" }}
                  tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                  tickFormatter={(val) => `₹${Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                />
                <ReferenceLine
                  y={initialCash}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{
                    value: "Base Capital",
                    fill: "#64748b",
                    fontSize: 10,
                    position: "insideBottomRight",
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const changeFromStart = d.equity - initialCash;
                      const pct = initialCash > 0 ? (changeFromStart / initialCash) * 100 : 0;
                      return (
                        <div
                          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs space-y-1.5"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5">
                            <span className="font-bold text-slate-800">
                              {d.step === 0 ? "Starting Capital" : `Order #${d.step} (${d.label})`}
                            </span>
                            {d.side && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                  d.side === "BUY"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {d.side}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Account Equity:</span>
                            <span className="font-extrabold text-indigo-950">{formatINR(d.equity)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Net Growth:</span>
                            <span
                              className={`font-bold ${
                                changeFromStart >= 0 ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {formatPnlINR(changeFromStart)} ({formatPercent(pct)})
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#4f46e5"
                  strokeWidth={2.8}
                  fill="url(#portfolioPerfGrad)"
                  dot={{ r: 3, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 1.5 }}
                  activeDot={{ r: 5.5, fill: "#06b6d4", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
