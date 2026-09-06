import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function EquityCurve({ data = [] }) {
  // 1. Normalize data: handle strings, different key names, and invalid numbers
  const chartData = (data || []).map((item, idx) => {
    const rawVal = item.equity ?? item.balance ?? item.value ?? item.portfolio_value ?? 0;
    const cleanVal = typeof rawVal === "string" ? parseFloat(rawVal.replace(/[^0-9.-]+/g, "")) : Number(rawVal);

    return {
      trade: item.trade ?? idx + 1,
      equity: !isNaN(cleanVal) ? cleanVal : 0,
    };
  });

  // 2. Safe dynamic domain calculation (prevents collapse when min === max)
  const equityValues = chartData.map((d) => d.equity);
  const minVal = equityValues.length > 0 ? Math.min(...equityValues) : 0;
  const maxVal = equityValues.length > 0 ? Math.max(...equityValues) : 100000;

  const yDomain =
    minVal === maxVal
      ? [Math.max(0, minVal - 2000), maxVal + 2000]
      : [
          (dataMin) => Math.max(0, Math.floor(dataMin * 0.98)),
          (dataMax) => Math.ceil(dataMax * 1.02),
        ];

  return (
    <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-xl select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1f232d]">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-500" />
            <span>Account Equity Curve</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mark-to-market account value compounded after each trade fill
          </p>
        </div>
        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
          Cumulative Capital
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-slate-500 font-mono text-xs">
          No trading telemetry recorded to generate equity curve.
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 20, left: 15, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1f232d"
                vertical={false}
              />

              <XAxis
                dataKey="trade"
                stroke="#64748b"
                tickLine={false}
                axisLine={{ stroke: "#1f232d" }}
                tick={{ fontSize: 11, fontFamily: "monospace" }}
              />

              <YAxis
                stroke="#64748b"
                domain={yDomain}
                width={80}
                tickLine={false}
                axisLine={{ stroke: "#1f232d" }}
                tick={{ fontSize: 11, fontFamily: "monospace" }}
                tickFormatter={(val) =>
                  `₹${Number(val).toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}`
                }
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0b0e",
                  border: "1px solid #1f232d",
                  borderRadius: "10px",
                  color: "#f8fafc",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                }}
                formatter={(value) => [
                  `₹${Number(value).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  "Portfolio Balance",
                ]}
                labelFormatter={(label) => `Trade #${label}`}
              />

              <Line
                type="monotone"
                dataKey="equity"
                stroke="#f59e0b"
                strokeWidth={2.5}
                isAnimationActive={false}
                dot={{
                  r: 4,
                  fill: "#f59e0b",
                  stroke: "#0a0b0e",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: "#f59e0b",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}