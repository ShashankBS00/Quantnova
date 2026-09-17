import { ChartPie } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#7c3aed", "#dc2626"];
const money = (value) => `₹${Number(value).toFixed(2)}`;

export default function PortfolioAllocation({ holdings, marketData, loading }) {
  const data = holdings
    .map((stock) => {
      const price = marketData[stock.symbol]?.currentPrice;
      return typeof price === "number" ? { name: stock.symbol, value: stock.quantity * price } : null;
    })
    .filter(Boolean);
  const total = data.reduce((sum, stock) => sum + stock.value, 0);

  return (
    <section className="qn-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(8, 145, 178, 0.09)", color: "var(--qn-cyan)" }}
        >
          <ChartPie size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Portfolio allocation</h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--qn-text-3)" }}>Distribution of your current market value</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[280px] items-center justify-center text-sm" style={{ color: "var(--qn-text-3)" }}>Updating allocation…</div>
      ) : data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm" style={{ color: "var(--qn-text-3)" }}>No portfolio data available</div>
      ) : (
        <div className="mt-5 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="relative h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={72} outerRadius={105} paddingAngle={3} stroke="none">
                  {data.map((stock, index) => <Cell key={stock.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(value) => money(value)}
                  contentStyle={{ background: "#ffffff", border: "1px solid rgba(79, 70, 229, 0.16)", borderRadius: "12px", boxShadow: "0 8px 24px rgba(79, 70, 229, 0.10)", color: "#1a1f3c", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>Portfolio</span>
              <span className="mt-1 text-lg font-extrabold" style={{ color: "var(--qn-text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{money(total)}</span>
            </div>
          </div>

          <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {data.map((stock, index) => {
              const percentage = total > 0 ? (stock.value / total) * 100 : 0;
              return (
                <div key={stock.name} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "var(--qn-surface-2)" }}>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{stock.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{money(stock.value)}</p>
                    <p className="mt-0.5 text-[10px] font-medium" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{percentage.toFixed(1)}%</p>
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
