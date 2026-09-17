import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function EquityCurve({ data = [] }) {
  const chartData = data.map((item, index) => {
    const rawValue = item.equity ?? item.balance ?? item.value ?? item.portfolio_value ?? 0;
    const value = typeof rawValue === "string" ? parseFloat(rawValue.replace(/[^0-9.-]+/g, "")) : Number(rawValue);
    return { trade: item.trade ?? index + 1, equity: Number.isFinite(value) ? value : 0 };
  });
  const values = chartData.map((item) => item.equity);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 100000;
  const yDomain = minValue === maxValue ? [Math.max(0, minValue - 2000), maxValue + 2000] : [(dataMin) => Math.max(0, Math.floor(dataMin * 0.98)), (dataMax) => Math.ceil(dataMax * 1.02)];

  return (
    <section className="qn-card p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: "var(--qn-border)" }}>
        <div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(8, 145, 178, 0.09)", color: "var(--qn-cyan)" }}><TrendingUp size={18} /></span><div><h2 className="text-lg font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Account equity curve</h2><p className="mt-0.5 text-xs" style={{ color: "var(--qn-text-3)" }}>Mark-to-market account value after each trade fill.</p></div></div>
        <span className="qn-badge self-start" style={{ background: "var(--qn-gold-dim)", border: "1px solid rgba(217, 119, 6, 0.18)", color: "var(--qn-gold)" }}>CUMULATIVE CAPITAL</span>
      </div>
      {!chartData.length ? <div className="flex h-72 items-center justify-center text-sm" style={{ color: "var(--qn-text-3)" }}>No trading telemetry recorded to generate an equity curve.</div> : <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 15, right: 20, left: 15, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(79, 70, 229, 0.12)" vertical={false} /><XAxis dataKey="trade" tickLine={false} axisLine={{ stroke: "rgba(79, 70, 229, 0.14)" }} tick={{ fill: "#9ba5c2", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} /><YAxis domain={yDomain} width={80} tickLine={false} axisLine={{ stroke: "rgba(79, 70, 229, 0.14)" }} tick={{ fill: "#9ba5c2", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} /><Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(79, 70, 229, 0.16)", borderRadius: "12px", color: "#1a1f3c", fontFamily: "JetBrains Mono, monospace", fontSize: "12px", boxShadow: "0 8px 24px rgba(79, 70, 229, 0.10)" }} formatter={(value) => [`₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Portfolio balance"]} labelFormatter={(label) => `Trade #${label}`} /><Line type="monotone" dataKey="equity" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3.5, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 1.5 }} activeDot={{ r: 5.5, fill: "#0891b2", stroke: "#ffffff", strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div>}
    </section>
  );
}
