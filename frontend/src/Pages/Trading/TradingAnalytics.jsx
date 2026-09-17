import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleAlert,
  Layers,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { getTradingAnalytics } from "@/services/tradingAnalyticsService";
import EquityCurve from "./EquityCurve";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const labelStyle = { color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" };
const monoStyle = { color: "var(--qn-text-1)", fontFamily: "'JetBrains Mono', monospace" };

function MetricCard({ icon: Icon, label, value, description, color, tint }) {
  return (
    <article className="qn-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={labelStyle}>{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: tint, color }}><Icon size={17} /></span>
      </div>
      <p className="mt-5 text-2xl font-extrabold tracking-tight" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
      <p className="mt-2 text-xs" style={{ color: "var(--qn-text-2)" }}>{description}</p>
    </article>
  );
}

export default function TradingAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setAnalytics(await getTradingAnalytics());
    } catch (error) {
      console.error("Failed to load trading analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !analytics) {
    return <div className="flex min-h-[400px] items-center justify-center gap-2 text-xs" style={labelStyle}><RefreshCw size={16} className="animate-spin" style={{ color: "var(--qn-indigo)" }} /> Loading performance analytics…</div>;
  }

  const pnl = Number(analytics?.realizedPnl ?? 0);
  const pnlColor = pnl >= 0 ? "var(--qn-bull)" : "var(--qn-bear)";
  const pnlTint = pnl >= 0 ? "var(--qn-bull-dim)" : "var(--qn-bear-dim)";
  const metrics = [
    { label: "Total trades", value: analytics?.totalTrades ?? 0, description: "All routed paper orders", icon: Layers, color: "var(--qn-indigo)", tint: "rgba(79, 70, 229, 0.09)" },
    { label: "Win rate", value: `${Number(analytics?.winRate ?? 0).toFixed(2)}%`, description: "Completed sell trades", icon: Target, color: "var(--qn-cyan)", tint: "rgba(8, 145, 178, 0.09)" },
    { label: "Realized P&L", value: `${pnl >= 0 ? "+" : "-"}${money(Math.abs(pnl))}`, description: "Closed-position return", icon: pnl >= 0 ? TrendingUp : TrendingDown, color: pnlColor, tint: pnlTint },
    { label: "Winning trades", value: analytics?.winningTrades ?? 0, description: "Profitable closed orders", icon: ArrowUpRight, color: "var(--qn-bull)", tint: "var(--qn-bull-dim)" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-8 pb-12 animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em]" style={{ background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.16)", color: "var(--qn-indigo)", fontFamily: "'JetBrains Mono', monospace" }}><BarChart3 size={12} /> EXECUTION ANALYTICS</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Performance, in focus.</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--qn-text-2)" }}>Review execution quality, returns, and paper-trading activity in one place.</p>
        </div>
        <button type="button" onClick={loadAnalytics} disabled={loading} className="qn-btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> {loading ? "Refreshing" : "Refresh data"}</button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard icon={TrendingDown} label="Losing trades" value={analytics?.losingTrades ?? 0} description="Unprofitable closed orders" color="var(--qn-bear)" tint="var(--qn-bear-dim)" />
        <MetricCard icon={Sparkles} label="Best trade" value={analytics?.bestTrade !== null && analytics?.bestTrade !== undefined ? `+${money(Math.abs(analytics.bestTrade))}` : "—"} description="Highest realized profit" color="var(--qn-bull)" tint="var(--qn-bull-dim)" />
        <MetricCard icon={ArrowDownRight} label="Worst trade" value={analytics?.worstTrade !== null && analytics?.worstTrade !== undefined ? `${analytics.worstTrade >= 0 ? "+" : "-"}${money(Math.abs(analytics.worstTrade))}` : "—"} description="Lowest realized result" color="var(--qn-bear)" tint="var(--qn-bear-dim)" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[{ side: "BUY", count: analytics?.buyOrders ?? 0, color: "var(--qn-bull)", tint: "var(--qn-bull-dim)", text: "Buy orders dispatched", icon: ArrowUpRight }, { side: "SELL", count: analytics?.sellOrders ?? 0, color: "var(--qn-bear)", tint: "var(--qn-bear-dim)", text: "Sell orders dispatched", icon: ArrowDownRight }].map(({ side, count, color, tint, text, icon: Icon }) => <article key={side} className="qn-card flex items-center justify-between p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={labelStyle}>{text}</p><p className="mt-3 text-3xl font-extrabold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{count}</p></div><span className="flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold tracking-[0.1em]" style={{ background: tint, color, fontFamily: "'JetBrains Mono', monospace" }}><Icon size={14} /> {side} SIDE</span></article>)}
      </section>

      <EquityCurve data={analytics?.equityHistory || []} />

      <section className="qn-card overflow-hidden">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div><h2 className="text-lg font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Order activity</h2><p className="mt-0.5 text-xs" style={{ color: "var(--qn-text-3)" }}>Recent paper-trading fills with simulated exchange routing.</p></div>
          <span className="qn-badge self-start sm:self-auto" style={{ background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.15)", color: "var(--qn-indigo)" }}>NSE SIMULATOR</span>
        </div>
        {!analytics?.orders?.length ? <div className="border-t px-6 py-12 text-center text-sm" style={{ borderColor: "var(--qn-border)", color: "var(--qn-text-3)" }}>No executed orders recorded in this session.</div> : <div className="border-t" style={{ borderColor: "var(--qn-border)" }}>{analytics.orders.map((order, index) => {
          const isBuy = order.side === "BUY";
          const orderPnl = Number(order.realized_pnl ?? 0);
          const sideColor = isBuy ? "var(--qn-bull)" : "var(--qn-bear)";
          return <article key={`${order.symbol}-${index}`} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[rgba(79,70,229,0.025)] sm:flex-row sm:items-center sm:justify-between sm:px-6" style={{ borderTop: index ? "1px solid var(--qn-border)" : undefined }}><div className="flex items-center gap-3"><span className="text-sm font-bold" style={monoStyle}>{order.symbol}</span><span className="qn-badge" style={{ background: isBuy ? "var(--qn-bull-dim)" : "var(--qn-bear-dim)", color: sideColor }}>{order.side}</span><span className="text-xs" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{order.quantity} × {money(order.price)}</span></div><div className="flex items-center justify-between gap-5 sm:justify-end"><span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={labelStyle}>{order.status || "FILLED"}</span>{order.side === "SELL" && order.realized_pnl !== undefined && <span className="text-sm font-bold" style={{ color: orderPnl >= 0 ? "var(--qn-bull)" : "var(--qn-bear)", fontFamily: "'JetBrains Mono', monospace" }}>P&L {orderPnl >= 0 ? "+" : "-"}{money(Math.abs(orderPnl))}</span>}</div></article>;
        })}</div>}
      </section>
    </div>
  );
}
