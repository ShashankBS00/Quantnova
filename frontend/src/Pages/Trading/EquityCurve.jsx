import { useMemo } from "react";
import { TrendingUp, ShieldCheck, Sparkles, Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function EquityCurve({ data = [] }) {
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const rawValue =
        item.equity ?? item.balance ?? item.value ?? item.portfolio_value ?? 0;
      const value =
        typeof rawValue === "string"
          ? parseFloat(rawValue.replace(/[^0-9.-]+/g, ""))
          : Number(rawValue);

      return {
        trade: item.trade ?? index + 1,
        symbol: item.symbol || "TRADE",
        side: item.side || "ORDER",
        pnl: Number(item.pnl || 0),
        equity: Number.isFinite(value) ? value : 0,
      };
    });
  }, [data]);

  const stats = useMemo(() => {
    if (!chartData.length) {
      return {
        startEquity: 100000,
        currentEquity: 100000,
        peakEquity: 100000,
        netReturn: 0,
        netReturnPercent: 0,
      };
    }
    const values = chartData.map((d) => d.equity);
    const startEquity = values[0] || 100000;
    const currentEquity = values[values.length - 1] || startEquity;
    const peakEquity = Math.max(...values, startEquity);
    const netReturn = currentEquity - 100000;
    const netReturnPercent = (netReturn / 100000) * 100;

    return {
      startEquity: 100000,
      currentEquity,
      peakEquity,
      netReturn,
      netReturnPercent,
    };
  }, [chartData]);

  const values = chartData.map((item) => item.equity);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 100000;
  const yDomain =
    minValue === maxValue
      ? [Math.max(0, minValue - 2000), maxValue + 2000]
      : [
          (dataMin) => Math.max(0, Math.floor(dataMin * 0.98)),
          (dataMax) => Math.ceil(dataMax * 1.02),
        ];

  return (
    <section className="qn-card p-5 sm:p-7 border transition-all" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f9faff 100%)", borderColor: "rgba(99, 102, 241, 0.18)" }}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: "rgba(99, 102, 241, 0.12)" }}>
        <div className="flex items-start gap-3.5">
          <span
            className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl shadow-md text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)" }}
          >
            <TrendingUp size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Account Equity Curve & Cumulative Telemetry
              </h2>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-cyan-800 tracking-widest uppercase"
                style={{ background: "rgba(6, 182, 212, 0.12)", border: "1px solid rgba(6, 182, 212, 0.25)" }}
              >
                <Sparkles size={11} className="text-cyan-600" /> Mark-To-Market
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-normal">
              Chronological equity progression across simulated execution fills.
            </p>
          </div>
        </div>

        {/* Quick telemetry chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Base:</span>
            <span className="font-bold">{money(stats.startEquity)}</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold"
            style={{
              background: stats.netReturn >= 0 ? "rgba(16, 185, 129, 0.10)" : "rgba(239, 68, 68, 0.10)",
              borderColor: stats.netReturn >= 0 ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
              color: stats.netReturn >= 0 ? "#059669" : "#dc2626",
            }}
          >
            <span className="text-[10px] uppercase">Net Return:</span>
            <span>
              {stats.netReturn >= 0 ? "+" : "-"}
              {money(Math.abs(stats.netReturn))} ({stats.netReturnPercent >= 0 ? "+" : ""}{stats.netReturnPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {!chartData.length ? (
        <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed text-center" style={{ borderColor: "rgba(99, 102, 241, 0.2)", background: "rgba(245, 247, 255, 0.4)" }}>
          <Activity size={26} className="text-indigo-400 mb-2" />
          <p className="text-xs font-semibold text-slate-600">No trading telemetry recorded to generate an equity curve.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Execute buy and sell paper trades to record mark-to-market progression.</p>
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 15, bottom: 5 }}>
              <defs>
                <linearGradient id="analyticsEquityArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.40" />
                  <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.10)" vertical={false} />
              <XAxis
                dataKey="trade"
                tickLine={false}
                axisLine={{ stroke: "rgba(99, 102, 241, 0.16)" }}
                tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                tickFormatter={(val) => `Trade #${val}`}
              />
              <YAxis
                domain={yDomain}
                width={85}
                tickLine={false}
                axisLine={{ stroke: "rgba(99, 102, 241, 0.16)" }}
                tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div
                        className="rounded-2xl p-4 shadow-xl border backdrop-blur-md"
                        style={{
                          background: "rgba(255, 255, 255, 0.95)",
                          borderColor: "rgba(99, 102, 241, 0.22)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 mb-2">
                          <span className="text-xs font-bold text-slate-800">Trade #{dataPoint.trade} · {dataPoint.symbol}</span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              background: dataPoint.side === "BUY" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                              color: dataPoint.side === "BUY" ? "#059669" : "#dc2626",
                            }}
                          >
                            {dataPoint.side}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Account Balance:</span>
                            <span className="font-extrabold text-indigo-950">{money(dataPoint.equity)}</span>
                          </div>
                          {dataPoint.pnl !== 0 && (
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-500">Fill Realized P&L:</span>
                              <span className={`font-bold ${dataPoint.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                {dataPoint.pnl >= 0 ? "+" : ""}{money(dataPoint.pnl)}
                              </span>
                            </div>
                          )}
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
                strokeWidth={3}
                fill="url(#analyticsEquityArea)"
                dot={{ r: 3.5, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#06b6d4", stroke: "#ffffff", strokeWidth: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
