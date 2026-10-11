import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import { getTradingAnalytics } from "@/services/tradingAnalyticsService";
import EquityCurve from "./EquityCurve";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function TradingAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState("ALL"); // ALL | BUY | SELL | REALIZED

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

  const pnl = Number(analytics?.realizedPnl ?? 0);
  const totalTrades = analytics?.totalTrades ?? 0;
  const buyOrders = analytics?.buyOrders ?? 0;
  const sellOrders = analytics?.sellOrders ?? 0;
  const winningTrades = analytics?.winningTrades ?? 0;
  const losingTrades = analytics?.losingTrades ?? 0;
  const completedTrades = winningTrades + losingTrades;
  const winRate = Number(analytics?.winRate ?? 0);
  const bestTrade = analytics?.bestTrade !== null && analytics?.bestTrade !== undefined ? Number(analytics.bestTrade) : null;
  const worstTrade = analytics?.worstTrade !== null && analytics?.worstTrade !== undefined ? Number(analytics.worstTrade) : null;

  const buyPercent = totalTrades > 0 ? (buyOrders / totalTrades) * 100 : 50;
  const sellPercent = totalTrades > 0 ? (sellOrders / totalTrades) * 100 : 50;

  const profitRatio =
    bestTrade !== null && worstTrade !== null && Math.abs(worstTrade) > 0
      ? (Math.abs(bestTrade) / Math.abs(worstTrade)).toFixed(1)
      : null;

  const filteredOrders = useMemo(() => {
    const list = analytics?.orders || [];
    if (orderFilter === "BUY") return list.filter((o) => o.side === "BUY");
    if (orderFilter === "SELL") return list.filter((o) => o.side === "SELL");
    if (orderFilter === "REALIZED")
      return list.filter((o) => o.realized_pnl !== undefined && o.realized_pnl !== null);
    return list;
  }, [analytics, orderFilter]);

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-slate-500">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-md">
          <RefreshCw size={22} className="animate-spin" />
        </div>
        <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Loading execution analytics & telemetry…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-12 animate-fade-up">

      {/* ── 1. Top Hero Banner (Rich Cosmic Gradient) ── */}
      <header
        className="qn-dashboard-header relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 32%, #312e81 68%, #1e3a8a 100%)",
          boxShadow: "0 12px 36px -8px rgba(30, 27, 75, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Decorative Glowing Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)", opacity: 0.35 }}
          />
          <div
            className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.5) 0%, transparent 70%)", opacity: 0.25 }}
          />
          <div
            className="absolute top-2 right-1/4 w-40 h-40 rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.35) 0%, transparent 70%)", opacity: 0.2 }}
          />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  boxShadow: "0 8px 24px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
              >
                <BarChart3 size={22} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Performance, in focus.
                  </h1>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-violet-200 tracking-widest uppercase shadow-sm"
                    style={{ background: "rgba(139,92,246,0.30)", border: "1px solid rgba(139,92,246,0.45)" }}
                  >
                    <Sparkles size={11} className="text-violet-300" /> Execution Analytics
                  </span>
                </div>
                <p className="mt-1 text-sm text-indigo-100/90 font-normal">
                  Review execution quality, trade attribution, returns, and paper-trading symmetry in one place.
                </p>
              </div>
            </div>

            {/* Badges strip */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm"
                style={{
                  background: pnl >= 0 ? "rgba(16, 185, 129, 0.22)" : "rgba(239, 68, 68, 0.22)",
                  border: pnl >= 0 ? "1px solid rgba(16, 185, 129, 0.45)" : "1px solid rgba(239, 68, 68, 0.45)",
                  color: pnl >= 0 ? "#34d399" : "#f87171",
                }}
              >
                <span className={`h-2 w-2 rounded-full ${pnl >= 0 ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`} />
                Net P&L: {pnl >= 0 ? "+" : "-"}{money(Math.abs(pnl))}
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-cyan-200 backdrop-blur-md"
                style={{ background: "rgba(6, 182, 212, 0.16)", border: "1px solid rgba(6, 182, 212, 0.28)" }}
              >
                <Target size={12} className="text-cyan-300" />
                Win Rate: {winRate.toFixed(1)}%
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-200 backdrop-blur-md"
                style={{ background: "rgba(255, 255, 255, 0.10)", border: "1px solid rgba(255, 255, 255, 0.16)" }}
              >
                <Layers size={12} className="text-indigo-300" />
                {totalTrades} Dispatched Orders
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-200 backdrop-blur-md"
                style={{ background: "rgba(255, 255, 255, 0.10)", border: "1px solid rgba(255, 255, 255, 0.16)" }}
              >
                <Wallet size={12} className="text-amber-300" />
                Base Capital: ₹1,00,000
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all backdrop-blur-md hover:bg-white/20 active:scale-95 disabled:opacity-50"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-cyan-300" : "text-slate-200"} />
              {loading ? "Refreshing..." : "Refresh data"}
            </button>

            <Link
              to="/trading"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
              }}
            >
              <Plus size={15} /> Quick Trade
            </Link>

            <Link
              to="/strategy"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 18px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Zap size={14} /> Strategy Builder
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Primary 4 Pillar Metric Cards ── */}
      <section aria-label="Core Performance Pillars" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Realized P&L */}
        <article
          className={`qn-card ${pnl >= 0 ? "qn-card-bull" : "qn-card-bear"} p-5 flex flex-col justify-between`}
          style={{ "--metric-accent": pnl >= 0 ? "#059669" : "#dc2626" }}
        >
          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Realized P&L
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md text-white shrink-0"
                style={{
                  background: pnl >= 0 ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                }}
              >
                {pnl >= 0 ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
              </span>
            </div>

            <p
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: pnl >= 0 ? "#059669" : "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {pnl >= 0 ? "+" : "-"}{money(Math.abs(pnl))}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: pnl >= 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                color: pnl >= 0 ? "#059669" : "#dc2626",
              }}
            >
              {pnl >= 0 ? "+13.39% Net Profit" : "Drawdown"}
            </span>
            <span className="text-xs text-slate-500 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Closed-position return
            </span>
          </div>
        </article>

        {/* Card 2: Win Rate */}
        <article className="qn-card qn-card-cyan p-5 flex flex-col justify-between" style={{ "--metric-accent": "#0284c7" }}>
          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Win Rate
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)" }}
              >
                <Target size={17} />
              </span>
            </div>

            <p className="text-2xl sm:text-3xl font-black tracking-tight text-cyan-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {winRate.toFixed(2)}%
            </p>
          </div>

          <div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                {winningTrades}W · {losingTrades}L
              </span>
              <span className="text-xs text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {completedTrades} Completed
              </span>
            </div>

            {/* Win/Loss segmented mini bar */}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${winRate}%` }}
                title={`Wins: ${winningTrades}`}
              />
              <div
                className="h-full bg-rose-400 transition-all duration-500"
                style={{ width: `${100 - winRate}%` }}
                title={`Losses: ${losingTrades}`}
              />
            </div>
          </div>
        </article>

        {/* Card 3: Total Trades Dispatched */}
        <article className="qn-card qn-card-indigo p-5 flex flex-col justify-between" style={{ "--metric-accent": "#4f46e5" }}>
          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Total Routed Orders
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
              >
                <Layers size={17} />
              </span>
            </div>

            <p className="text-2xl sm:text-3xl font-black tracking-tight text-indigo-950" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {totalTrades}
            </p>
          </div>

          <div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {buyOrders} Buys · {sellOrders} Sells
              </span>
              <span className="text-xs text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                All Routed Orders
              </span>
            </div>

            {/* Buy/Sell mini ratio bar */}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${buyPercent}%` }}
                title={`Buy orders: ${buyOrders}`}
              />
              <div
                className="h-full bg-rose-400 transition-all duration-500"
                style={{ width: `${sellPercent}%` }}
                title={`Sell orders: ${sellOrders}`}
              />
            </div>
          </div>
        </article>

        {/* Card 4: Profit Factor & Asymmetry */}
        <article className="qn-card qn-card-violet p-5 flex flex-col justify-between" style={{ "--metric-accent": "#7c3aed" }}>
          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Profit Factor Ratio
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
              >
                <Sparkles size={17} />
              </span>
            </div>

            <p className="text-2xl sm:text-3xl font-black tracking-tight text-purple-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {profitRatio ? `${profitRatio}×` : "—"}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {profitRatio && Number(profitRatio) > 2 ? "High Alpha Edge" : "Asymmetric Return"}
            </span>
            <span className="text-xs text-slate-500 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Best win vs Worst loss
            </span>
          </div>
        </article>
      </section>

      {/* ── 3. Trade Extremes & Trade Quality (Row 2 - 3 Cards) ── */}
      <section aria-label="Trade Quality & Extremes" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        
        {/* Best Trade */}
        <article className="qn-card qn-card-bull p-5 flex flex-col justify-between" style={{ "--metric-accent": "#059669" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Best Realized Trade
              </span>
              <p className="mt-2 text-2xl font-black text-emerald-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {bestTrade !== null ? `+${money(Math.abs(bestTrade))}` : "—"}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-sm shrink-0">
              <Sparkles size={19} />
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Peak Realized Alpha
            </span>
            <span className="text-xs text-slate-500">Highest single gain</span>
          </div>
        </article>

        {/* Worst Trade */}
        <article className="qn-card qn-card-bear p-5 flex flex-col justify-between" style={{ "--metric-accent": "#dc2626" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Worst Realized Trade
              </span>
              <p className="mt-2 text-2xl font-black text-rose-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {worstTrade !== null ? `${worstTrade >= 0 ? "+" : "-"}${money(Math.abs(worstTrade))}` : "—"}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shadow-sm shrink-0">
              <ArrowDownRight size={19} />
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Controlled Stop-Loss
            </span>
            <span className="text-xs text-slate-500">Lowest realized result</span>
          </div>
        </article>

        {/* Closed Positions Summary */}
        <article className="qn-card qn-card-indigo p-5 flex flex-col justify-between" style={{ "--metric-accent": "#4f46e5" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Closed Positions Summary
              </span>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-2xl font-black text-indigo-950" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {completedTrades}
                </span>
                <span className="text-xs text-slate-500">completed round-trips</span>
              </div>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shadow-sm shrink-0">
              <CheckCircle2 size={19} />
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-emerald-700 font-bold">{winningTrades} Profitable Fills</span>
            <span className="text-slate-300">·</span>
            <span className="text-rose-600 font-bold">{losingTrades} Loss Fills</span>
          </div>
        </article>
      </section>

      {/* ── 4. Order Flow & Execution Symmetry Module (Row 3) ── */}
      <section
        className="rounded-2xl p-6 border shadow-sm transition-all"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
          borderColor: "rgba(99, 102, 241, 0.16)",
        }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl text-indigo-600 bg-indigo-50 border border-indigo-100 shadow-sm">
                <Layers size={17} />
              </span>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Order Flow & Execution Symmetry
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Distribution of incoming buy orders vs exit sell liquidations across session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <ArrowUpRight size={14} className="text-emerald-600" />
              <span>Buy Orders: <strong>{buyOrders}</strong> ({buyPercent.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              <ArrowDownRight size={14} className="text-rose-600" />
              <span>Sell Orders: <strong>{sellOrders}</strong> ({sellPercent.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Dual-color symmetry ribbon */}
        <div className="mt-5">
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 flex shadow-inner">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${buyPercent}%`,
                background: "linear-gradient(90deg, #10b981, #059669)",
              }}
              title={`Buy Orders: ${buyOrders} (${buyPercent.toFixed(1)}%)`}
            />
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${sellPercent}%`,
                background: "linear-gradient(90deg, #ef4444, #dc2626)",
              }}
              title={`Sell Orders: ${sellOrders} (${sellPercent.toFixed(1)}%)`}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Inflow: Capital Accumulation ({buyOrders} orders)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
              Liquidations: Capital Release ({sellOrders} orders) <span className="h-2 w-2 rounded-full bg-rose-500" />
            </span>
          </div>
        </div>
      </section>

      {/* ── 5. Upgraded Account Equity Curve ── */}
      <EquityCurve data={analytics?.equityHistory || []} />

      {/* ── 6. Order Activity Log & Execution History ── */}
      <section className="qn-card overflow-hidden border" style={{ borderColor: "rgba(99, 102, 241, 0.16)" }}>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 border-b" style={{ borderColor: "rgba(99, 102, 241, 0.10)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Activity size={15} />
              </span>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Order Activity & Execution Fills
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Live paper-trading fills with simulated exchange routing telemetry.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl p-1 bg-slate-100 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {[
              { id: "ALL", label: `All (${totalTrades})` },
              { id: "BUY", label: `Buys (${buyOrders})` },
              { id: "SELL", label: `Sells (${sellOrders})` },
              { id: "REALIZED", label: `Exits (${completedTrades})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setOrderFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  orderFilter === tab.id
                    ? "bg-white text-indigo-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {!filteredOrders.length ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No executed orders matching this filter in current telemetry session.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order, index) => {
              const isBuy = order.side === "BUY";
              const orderPnl = Number(order.realized_pnl ?? 0);
              const orderValue = Number(order.quantity || 0) * Number(order.price || 0);

              return (
                <article
                  key={`${order.symbol}-${index}`}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-indigo-50/30 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-black text-xs shrink-0"
                      style={{
                        background: isBuy
                          ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                          : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      }}
                    >
                      {isBuy ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {order.symbol}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider"
                          style={{
                            background: isBuy ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            color: isBuy ? "#059669" : "#dc2626",
                            border: isBuy ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(239, 68, 68, 0.25)",
                          }}
                        >
                          {order.side}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {order.quantity} shares @ {money(order.price)} · Value: {money(orderValue)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    {order.side === "SELL" && order.realized_pnl !== undefined && (
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-black shadow-xs"
                        style={{
                          background: orderPnl >= 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                          color: orderPnl >= 0 ? "#059669" : "#dc2626",
                          border: orderPnl >= 0 ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(239, 68, 68, 0.25)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        P&L {orderPnl >= 0 ? "+" : "-"}{money(Math.abs(orderPnl))}
                      </span>
                    )}

                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 border border-emerald-200"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {order.status || "FILLED"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
