import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Clock,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import { getCurrentMarketData } from "@/services/portfolioService";
import { getMarketHistory } from "@/services/marketService";
import { getTradingAccount } from "@/services/tradingService";
import { getTradingAnalytics } from "@/services/tradingAnalyticsService";

const BENCHMARK_SYMBOL = "RELIANCE.NS";
const RANGE_PERIODS = { "1W": "5d", "1M": "1mo", "3M": "3mo" };

const money = (value) => `\u20B9${Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

function linePath(values, width = 500, height = 150) {
  if (values.length < 2) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.max(Math.abs(max) * 0.02, 1);
  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * width,
    y: height - 12 - ((value - min) / range) * (height - 28),
  }));

  return points.reduce(
    (path, point, index) => `${path}${index ? " L" : "M"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    "",
  );
}

function areaPath(path, width = 500, height = 150) {
  return path ? `${path} L ${width} ${height} L 0 ${height} Z` : "";
}

function calculateSharpe(values) {
  if (values.length < 3) return null;

  const returns = values
    .slice(1)
    .map((value, index) => (values[index] ? (value - values[index]) / values[index] : 0));
  const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / returns.length;
  const deviation = Math.sqrt(variance);

  return deviation ? (average / deviation) * Math.sqrt(returns.length) : null;
}

function ChartLoadingState() {
  return (
    <div className="flex h-full w-full flex-col justify-end gap-4" aria-label="Loading portfolio performance">
      <div className="h-3 w-32 animate-pulse rounded-full bg-indigo-100/80" />
      <div className="qn-chart-skeleton h-24 animate-pulse rounded-xl" />
    </div>
  );
}

export default function Dashboard() {
  const [activeRange, setActiveRange] = useState("1M");
  const [account, setAccount] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [equityHistory, setEquityHistory] = useState([]);
  const [benchmarkHistory, setBenchmarkHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const currentAccount = await getTradingAccount();
      const holdingSymbols = Object.keys(currentAccount.holdings || {});
      const [quoteResults, analyticsResult, benchmarkResult] = await Promise.all([
        Promise.allSettled(holdingSymbols.map((symbol) => getCurrentMarketData(symbol))),
        getTradingAnalytics().catch((error) => {
          console.error("Failed to load equity history:", error);
          return { equityHistory: [] };
        }),
        getMarketHistory(BENCHMARK_SYMBOL, RANGE_PERIODS[activeRange]).catch((error) => {
          console.error("Failed to load benchmark history:", error);
          return { data: [] };
        }),
      ]);

      const quoteMap = {};
      quoteResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          quoteMap[holdingSymbols[index]] = result.value;
        }
      });

      setAccount(currentAccount);
      setQuotes(quoteMap);
      setEquityHistory(analyticsResult.equityHistory || []);
      setBenchmarkHistory(benchmarkResult?.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeRange]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadDashboard(), 0);
    const interval = setInterval(() => loadDashboard({ quiet: true }), 30000);

    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadDashboard]);

  const overview = useMemo(() => {
    const holdings = Object.entries(account?.holdings || {});
    const currentHoldingsValue = holdings.reduce(
      (sum, [symbol, holding]) => sum + holding.quantity * (quotes[symbol]?.currentPrice ?? holding.average_price),
      0,
    );
    const previousHoldingsValue = holdings.reduce(
      (sum, [symbol, holding]) => sum + holding.quantity * (quotes[symbol]?.previousClose ?? holding.average_price),
      0,
    );
    const portfolioValue = Number(account?.cash || 0) + currentHoldingsValue;
    const previousValue = Number(account?.cash || 0) + previousHoldingsValue;
    const todayPnl = portfolioValue - previousValue;
    const todayPnlPercent = previousValue ? (todayPnl / previousValue) * 100 : 0;
    const totalTrades = (account?.winning_trades || 0) + (account?.losing_trades || 0);
    const winRate = totalTrades ? (account.winning_trades / totalTrades) * 100 : 0;
    const equityValues = equityHistory.map((point) => Number(point.equity)).filter(Number.isFinite);
    const initialCash = Number(account?.initial_cash || 100000);
    const totalReturn = portfolioValue - initialCash;

    return {
      portfolioValue,
      todayPnl,
      todayPnlPercent,
      totalTrades,
      winRate,
      sharpe: calculateSharpe(equityValues),
      totalReturn,
      totalReturnPercent: initialCash ? (totalReturn / initialCash) * 100 : 0,
      equityValues,
    };
  }, [account, quotes, equityHistory]);

  const curve = useMemo(() => {
    const portfolioValues = overview.equityValues.length ? overview.equityValues : [overview.portfolioValue];
    const benchmarkValues = benchmarkHistory.map((item) => Number(item.close)).filter(Number.isFinite);
    const portfolioPath = linePath(portfolioValues);

    return {
      portfolioPath,
      benchmarkPath: linePath(benchmarkValues),
      portfolioArea: areaPath(portfolioPath),
      hasData: portfolioValues.length > 1 || benchmarkValues.length > 1,
    };
  }, [overview, benchmarkHistory]);

  const indiaParts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const indiaPart = (type) => indiaParts.find((part) => part.type === type)?.value || "";
  const indiaHour = Number(indiaPart("hour"));
  const indiaMinute = Number(indiaPart("minute"));
  const indiaWeekday = indiaPart("weekday");
  const todayStr = `${indiaWeekday}, ${indiaPart("day")} ${indiaPart("month")} ${indiaPart("year")}`;
  const greeting = indiaHour < 12 ? "Good morning" : indiaHour < 17 ? "Good afternoon" : "Good evening";
  const marketMinutes = indiaHour * 60 + indiaMinute;
  const isMarketOpen = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(indiaWeekday)
    && marketMinutes >= 555
    && marketMinutes <= 930;

  const holdingsList = useMemo(() => Object.entries(account?.holdings || {}), [account]);
  const investedCash = useMemo(() => {
    return holdingsList.reduce(
      (sum, [symbol, holding]) => sum + holding.quantity * (quotes[symbol]?.currentPrice ?? holding.average_price),
      0,
    );
  }, [holdingsList, quotes]);
  const availableCash = Number(account?.cash || 0);
  const totalEquity = availableCash + investedCash;
  const cashPercent = totalEquity > 0 ? (availableCash / totalEquity) * 100 : 100;
  const investedPercent = totalEquity > 0 ? (investedCash / totalEquity) * 100 : 0;

  const kpiCards = [
    {
      label: "Portfolio Value",
      value: loading ? "—" : money(overview.portfolioValue),
      sub: `${overview.totalReturn >= 0 ? "+" : "-"}${money(Math.abs(overview.totalReturn))} · ${overview.totalReturnPercent >= 0 ? "+" : ""}${overview.totalReturnPercent.toFixed(2)}%`,
      badge: `${overview.totalReturn >= 0 ? "+" : ""}${overview.totalReturnPercent.toFixed(2)}% Return`,
      badgePositive: overview.totalReturn >= 0,
      color: "#4f46e5",
      icon: Wallet,
      iconGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
      accent: "qn-card-indigo",
    },
    {
      label: "Today's P&L",
      value: loading ? "—" : `${overview.todayPnl >= 0 ? "+" : "-"}${money(Math.abs(overview.todayPnl))}`,
      sub: `${overview.todayPnlPercent >= 0 ? "+" : ""}${overview.todayPnlPercent.toFixed(2)}% today`,
      badge: overview.todayPnl >= 0 ? "Bullish Day" : "Bearish Day",
      badgePositive: overview.todayPnl >= 0,
      color: overview.todayPnl >= 0 ? "#059669" : "#dc2626",
      icon: overview.todayPnl >= 0 ? TrendingUp : TrendingDown,
      iconGradient: overview.todayPnl >= 0 ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      accent: overview.todayPnl >= 0 ? "qn-card-bull" : "qn-card-bear",
    },
    {
      label: "Win Rate",
      value: loading ? "—" : `${overview.winRate.toFixed(1)}%`,
      sub: `${overview.totalTrades} closed trade${overview.totalTrades === 1 ? "" : "s"}`,
      badge: `${overview.totalTrades} Executed`,
      badgePositive: overview.winRate >= 50,
      color: "#0284c7",
      icon: BarChart3,
      iconGradient: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
      accent: "qn-card-cyan",
      progress: Math.min(Math.max(overview.winRate, 5), 100),
    },
    {
      label: "Sharpe Ratio",
      value: loading ? "—" : overview.sharpe === null ? "—" : overview.sharpe.toFixed(2),
      sub: overview.sharpe === null ? "Requires 3+ trade records" : "Risk-adjusted performance",
      badge: overview.sharpe === null ? "Need Data" : overview.sharpe >= 1.5 ? "Exceptional" : overview.sharpe >= 1.0 ? "Strong Alpha" : "Moderate",
      badgePositive: overview.sharpe !== null && overview.sharpe >= 1.0,
      color: "#7c3aed",
      icon: Activity,
      iconGradient: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
      accent: "qn-card-violet",
    },
  ];

  const quickActions = [
    {
      title: "Strategy Builder",
      tag: "QUANTITATIVE BACKTEST",
      description: "Create, configure and backtest algorithmic trading strategies against historical NSE market ticks.",
      action: "Build Strategy",
      to: "/strategy",
      icon: BarChart3,
      tone: "strategy",
      iconBg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      btnBg: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
      tagColor: "#6d28d9",
      tagBg: "rgba(109, 40, 217, 0.12)",
    },
    {
      title: "Portfolio & Positions",
      tag: "LIVE POSITIONS & P&L",
      description: "Monitor active equities, cash reserves, asset allocation, and mark-to-market trading performance.",
      action: "View Portfolio",
      to: "/portfolio",
      icon: Wallet,
      tone: "portfolio",
      iconBg: "linear-gradient(135deg, #0d9488 0%, #10b981 100%)",
      btnBg: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
      tagColor: "#0f766e",
      tagBg: "rgba(13, 148, 136, 0.12)",
    },
    {
      title: "AI Market Analytics",
      tag: "XGBOOST ML SIGNALS",
      description: "Generate high-conviction directional price predictions using trained machine learning models.",
      action: "Open AI Prediction",
      to: "/prediction",
      icon: BrainCircuit,
      tone: "prediction",
      iconBg: "linear-gradient(135deg, #a855f7 0%, #d946ef 100%)",
      btnBg: "linear-gradient(135deg, #9333ea 0%, #c026d3 100%)",
      tagColor: "#9333ea",
      tagBg: "rgba(147, 51, 234, 0.12)",
    },
  ];

  return (
    <div className="qn-dashboard mx-auto w-full max-w-[1580px] space-y-6 pb-10">

      {/* ── 1. Top Hero Banner (Rich Cosmic Gradient matching Prediction) ── */}
      <header
        className="qn-dashboard-header qn-dashboard-enter qn-dashboard-delay-1 relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white"
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
                <Sparkles size={22} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {greeting}, Shashank <span aria-hidden="true">👋</span>
                  </h1>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold text-violet-200 tracking-widest uppercase shadow-sm"
                    style={{ background: "rgba(139,92,246,0.30)", border: "1px solid rgba(139,92,246,0.45)" }}
                  >
                    <Zap size={11} className="text-violet-300" /> Paper Trading Live
                  </span>
                </div>
                <p className="mt-1 text-sm text-indigo-100/90 font-normal">
                  Live portfolio overview, algorithmic analytics, and AI predictive insights.
                </p>
              </div>
            </div>

            {/* Badges strip */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm"
                style={{
                  background: isMarketOpen ? "rgba(16, 185, 129, 0.22)" : "rgba(245, 158, 11, 0.22)",
                  border: isMarketOpen ? "1px solid rgba(16, 185, 129, 0.45)" : "1px solid rgba(245, 158, 11, 0.45)",
                  color: isMarketOpen ? "#34d399" : "#fbbf24",
                }}
              >
                <span className={`h-2 w-2 rounded-full ${isMarketOpen ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                {isMarketOpen ? "NSE Live Market Open" : "NSE Market Closed"}
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-200 backdrop-blur-md"
                style={{ background: "rgba(255, 255, 255, 0.10)", border: "1px solid rgba(255, 255, 255, 0.16)" }}
              >
                <Clock size={12} className="text-slate-300" />
                {todayStr}
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-200 backdrop-blur-md"
                style={{ background: "rgba(255, 255, 255, 0.10)", border: "1px solid rgba(255, 255, 255, 0.16)" }}
              >
                <Wallet size={12} className="text-indigo-300" />
                Capital: ₹1,00,000
              </span>

              {lastUpdated && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-300 backdrop-blur-md"
                  style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.12)" }}
                >
                  <Activity size={12} className="text-cyan-300" />
                  Synced {lastUpdated.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadDashboard({ quiet: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all backdrop-blur-md hover:bg-white/20 active:scale-95 disabled:opacity-50"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
              }}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-cyan-300" : "text-slate-200"} />
              {refreshing ? "Refreshing..." : "Refresh"}
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
              to="/backtest"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 18px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Zap size={14} /> Run Backtest
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Colorful KPI Cards ── */}
      <section aria-label="Portfolio performance summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className={`qn-card ${card.accent} qn-kpi-card qn-dashboard-enter qn-dashboard-delay-${index + 2} p-5 flex flex-col justify-between`}
              style={{ "--metric-accent": card.color }}
            >
              <div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {card.label}
                  </p>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md shrink-0"
                    style={{ background: card.iconGradient, color: "#ffffff" }}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <h2
                    className="text-2xl sm:text-3xl font-black tracking-tight"
                    style={{ color: card.color, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {card.value}
                  </h2>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight"
                  style={{
                    background: card.badgePositive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                    color: card.badgePositive ? "#059669" : "#dc2626",
                    border: card.badgePositive ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(239, 68, 68, 0.25)",
                  }}
                >
                  {card.badge}
                </span>
                <span className="text-[11px] font-medium text-slate-500 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {card.sub}
                </span>
              </div>

              {card.progress !== undefined && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${card.progress}%`, background: "linear-gradient(90deg, #06b6d4, #0284c7)" }}
                  />
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* ── 3. Portfolio Performance Chart (Vibrant Gradient SVG) ── */}
      <section aria-labelledby="portfolio-performance-title" className="qn-card qn-performance-card qn-dashboard-enter qn-dashboard-delay-6 flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 0 10px rgba(79,70,229,0.5)" }} />
              <h2 id="portfolio-performance-title" className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Portfolio Performance & Equity Curve
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span>Account equity vs <strong className="text-cyan-700">{BENCHMARK_SYMBOL.replace(".NS", "")}</strong> benchmark</span>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-600 font-semibold">Alpha tracking</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex w-fit gap-1 rounded-xl p-1 shadow-sm" style={{ background: "var(--qn-surface-2)", border: "1px solid var(--qn-border)" }}>
              {Object.keys(RANGE_PERIODS).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setActiveRange(range)}
                  className="qn-focus-ring rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                  aria-pressed={activeRange === range}
                  style={{
                    background: activeRange === range ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "transparent",
                    boxShadow: activeRange === range ? "0 2px 10px rgba(79,70,229,0.35)" : "none",
                    color: activeRange === range ? "#fff" : "var(--qn-text-2)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex h-60 w-full items-end sm:h-72">
          {loading ? (
            <ChartLoadingState />
          ) : curve.hasData ? (
            <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none" role="img" aria-label="Portfolio equity and benchmark performance chart">
              <defs>
                <linearGradient id="dashboardPortfolioArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.40" />
                  <stop offset="65%" stopColor="#8b5cf6" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="portfolioStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4f46e5" floodOpacity="0.3" />
                </filter>
              </defs>
              <g key={activeRange}>
                {[40, 80, 120].map((y) => (
                  <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(99,102,241,0.12)" strokeDasharray="4 6" />
                ))}
                {curve.benchmarkPath && (
                  <path className="qn-benchmark-line" d={curve.benchmarkPath} fill="none" stroke="#0891b2" strokeWidth="1.8" strokeDasharray="6 4" />
                )}
                {curve.portfolioArea && (
                  <path className="qn-performance-area" d={curve.portfolioArea} fill="url(#dashboardPortfolioArea)" />
                )}
                {curve.portfolioPath && (
                  <path
                    className="qn-performance-line"
                    d={curve.portfolioPath}
                    fill="none"
                    stroke="url(#portfolioStrokeGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glowEffect)"
                  />
                )}
              </g>
            </svg>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center" style={{ borderColor: "rgba(99,102,241,0.2)", background: "rgba(245,247,255,0.5)", color: "var(--qn-text-3)" }}>
              <Activity size={24} className="mb-2 text-indigo-400" aria-hidden="true" />
              <p className="text-xs font-semibold text-slate-600">Complete more paper trades to build your live equity history.</p>
            </div>
          )}

          {!loading && curve.hasData && (
            <div className="qn-chart-legend absolute right-0 top-0 flex items-center gap-4 rounded-xl px-3 py-1.5 shadow-sm" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(99,102,241,0.15)", backdropFilter: "blur(10px)" }}>
              <span className="flex items-center gap-2 text-[11px] font-semibold text-indigo-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span className="h-2 w-2 rounded-full bg-indigo-600 shadow-sm" /> Portfolio Equity
              </span>
              <span className="flex items-center gap-2 text-[11px] font-semibold text-cyan-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span className="h-2 w-2 rounded-full bg-cyan-600 shadow-sm" /> RELIANCE Benchmark
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Capital Allocation & Liquidity Status Bar ── */}
      <section
        className="rounded-2xl p-5 border shadow-sm transition-all"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
          borderColor: "rgba(99, 102, 241, 0.16)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600" style={{ background: "rgba(16, 185, 129, 0.12)" }}>
                <Wallet size={15} />
              </span>
              <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Account Capital Allocation & Reserves
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time cash availability vs deployed equity positions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Available Cash: <strong>{money(availableCash)}</strong> ({cashPercent.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>Invested: <strong>{money(investedCash)}</strong> ({investedPercent.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Dual-color allocation bar */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${cashPercent}%`,
              background: "linear-gradient(90deg, #10b981, #059669)",
            }}
            title={`Available Cash: ${cashPercent.toFixed(1)}%`}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${investedPercent}%`,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            }}
            title={`Invested Equity: ${investedPercent.toFixed(1)}%`}
          />
        </div>
      </section>

      {/* ── 5. Quick Actions (Vibrant, High-Contrast Color Cards) ── */}
      <section aria-labelledby="quick-actions-title" className="qn-dashboard-enter qn-dashboard-delay-7 pt-2">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#4f46e5", fontFamily: "'JetBrains Mono', monospace" }}>
              QuantNova Workspace
            </p>
            <h2 id="quick-actions-title" className="mt-1 text-2xl font-black tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Quick Actions & Modules
            </h2>
          </div>
          <p className="text-sm text-slate-500 font-medium">Accelerate from real-time analysis to automated execution.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className={`qn-card qn-action-card qn-action-card-${item.tone} qn-dashboard-enter qn-dashboard-delay-${index + 8} flex min-h-64 flex-col justify-between p-6 sm:p-7 relative`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-md shrink-0"
                      style={{ background: item.iconBg, color: "#ffffff" }}
                    >
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-xs"
                      style={{ background: item.tagBg, color: item.tagColor }}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Link
                    to={item.to}
                    className="qn-focus-ring inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-98"
                    style={{ background: item.btnBg }}
                  >
                    <span>{item.action}</span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
