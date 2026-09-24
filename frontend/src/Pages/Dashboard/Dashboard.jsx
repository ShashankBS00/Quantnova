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

  const kpiCards = [
    {
      label: "Portfolio value",
      value: loading ? "\u2014" : money(overview.portfolioValue),
      sub: `${overview.totalReturn >= 0 ? "+" : "-"}${money(Math.abs(overview.totalReturn))} \u00B7 ${overview.totalReturnPercent >= 0 ? "+" : ""}${overview.totalReturnPercent.toFixed(2)}%`,
      color: "var(--qn-indigo)",
      icon: Wallet,
      accent: "qn-card-violet",
      subColor: overview.totalReturn >= 0 ? "var(--qn-bull)" : "var(--qn-bear)",
    },
    {
      label: "Today's P&L",
      value: loading ? "\u2014" : `${overview.todayPnl >= 0 ? "+" : "-"}${money(Math.abs(overview.todayPnl))}`,
      sub: `${overview.todayPnlPercent >= 0 ? "+" : ""}${overview.todayPnlPercent.toFixed(2)}% today`,
      color: overview.todayPnl >= 0 ? "var(--qn-bull)" : "var(--qn-bear)",
      icon: overview.todayPnl >= 0 ? TrendingUp : TrendingDown,
      accent: overview.todayPnl >= 0 ? "qn-card-bull" : "qn-card-bear",
      subColor: overview.todayPnl >= 0 ? "var(--qn-bull)" : "var(--qn-bear)",
    },
    {
      label: "Win rate",
      value: loading ? "\u2014" : `${overview.winRate.toFixed(2)}%`,
      sub: `${overview.totalTrades} closed trade${overview.totalTrades === 1 ? "" : "s"}`,
      color: "var(--qn-cyan)",
      icon: BarChart3,
      accent: "qn-card-cyan",
      subColor: "var(--qn-text-3)",
    },
    {
      label: "Sharpe ratio",
      value: loading ? "\u2014" : overview.sharpe === null ? "\u2014" : overview.sharpe.toFixed(2),
      sub: overview.sharpe === null ? "Need 3+ account points" : "Risk-adjusted return",
      color: "var(--qn-violet)",
      icon: Activity,
      accent: "qn-card-violet",
      subColor: "var(--qn-text-3)",
    },
  ];

  const quickActions = [
    {
      title: "Strategy Builder",
      description: "Create, configure and backtest your trading strategies.",
      action: "Build Strategy",
      to: "/strategy",
      icon: BarChart3,
      tone: "strategy",
    },
    {
      title: "Portfolio",
      description: "Monitor holdings, allocation and trading performance.",
      action: "View Portfolio",
      to: "/portfolio",
      icon: Wallet,
      tone: "portfolio",
    },
    {
      title: "AI Prediction",
      description: "Generate market direction predictions using the XGBoost model.",
      action: "Open AI Prediction",
      to: "/prediction",
      icon: BrainCircuit,
      tone: "prediction",
    },
  ];

  return (
    <div className="qn-dashboard mx-auto w-full max-w-[1580px] space-y-5 pb-8">
      <header
        className="qn-dashboard-header qn-dashboard-enter qn-dashboard-delay-1 flex flex-col gap-5 rounded-2xl border px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(238,240,251,0.80))",
          borderColor: "var(--qn-border)",
        }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(79, 70, 229, 0.09)" }}>
              <Sparkles size={17} style={{ color: "var(--qn-indigo)" }} aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--qn-text-1)" }}>
              {greeting}, Shashank <span aria-hidden="true">{"\u{1F44B}"}</span>
            </h1>
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--qn-text-2)" }}>Here&apos;s your live paper-trading overview.</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
            <Clock size={12} aria-hidden="true" />
            <span>{todayStr}</span>
            <span aria-hidden="true">{"\u00B7"}</span>
            <span className="qn-market-status" data-open={isMarketOpen} style={{ color: isMarketOpen ? "var(--qn-bull)" : "var(--qn-text-2)" }}>{isMarketOpen ? "\u25CF NSE Open" : "\u25CB NSE Closed"}</span>
            {lastUpdated && <><span aria-hidden="true">{"\u00B7"}</span><span>Updated {lastUpdated.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}</span></>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={() => loadDashboard({ quiet: true })} disabled={refreshing} className="qn-btn-ghost qn-focus-ring inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
          <Link to="/trading" className="qn-btn-ghost qn-focus-ring inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold">
            <Plus size={14} aria-hidden="true" /> Buy
          </Link>
          <Link to="/backtest" className="qn-btn-primary qn-focus-ring inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold">
            <Zap size={14} aria-hidden="true" /> Run Backtest
          </Link>
        </div>
      </header>

      <section aria-label="Portfolio performance summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className={`qn-card ${card.accent} qn-kpi-card qn-dashboard-enter qn-dashboard-delay-${index + 2} p-5`} style={{ "--metric-accent": card.color }}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{card.label}</p>
                <span className="rounded-lg p-1.5" style={{ background: "rgba(79,70,229,0.07)" }}><Icon size={15} style={{ color: card.color }} aria-hidden="true" /></span>
              </div>
              <h2 className="mb-1.5 text-2xl font-black" style={{ color: card.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{card.value}</h2>
              <p className="text-xs font-semibold" style={{ color: card.subColor, fontFamily: "'JetBrains Mono', monospace" }}>{card.sub}</p>
            </article>
          );
        })}
      </section>

      <section aria-labelledby="portfolio-performance-title" className="qn-card qn-performance-card qn-dashboard-enter qn-dashboard-delay-6 flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "var(--qn-indigo)", boxShadow: "0 0 0 4px rgba(79,70,229,0.08)" }} /><h2 id="portfolio-performance-title" className="text-base font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Portfolio performance</h2></div>
            <p className="mt-1.5 text-[11px]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>Account equity vs {BENCHMARK_SYMBOL.replace(".NS", "")} benchmark</p>
          </div>
          <div className="flex w-fit gap-1 rounded-xl p-1" style={{ background: "var(--qn-surface-2)", border: "1px solid var(--qn-border)" }}>
            {Object.keys(RANGE_PERIODS).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setActiveRange(range)}
                className="qn-focus-ring rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                aria-pressed={activeRange === range}
                style={{
                  background: activeRange === range ? "linear-gradient(135deg, #4f46e5, #6d28d9)" : "transparent",
                  boxShadow: activeRange === range ? "0 2px 8px rgba(79,70,229,0.22)" : "none",
                  color: activeRange === range ? "#fff" : "var(--qn-text-2)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-6 flex h-56 w-full items-end sm:h-64">
          {loading ? <ChartLoadingState /> : curve.hasData ? (
            <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none" role="img" aria-label="Portfolio equity and benchmark performance chart">
              <defs>
                <linearGradient id="dashboardPortfolioArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g key={activeRange}>
                {[50, 100].map((y) => <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(99,102,241,0.10)" strokeDasharray="4 6" />)}
                {curve.benchmarkPath && <path className="qn-benchmark-line" d={curve.benchmarkPath} fill="none" stroke="#0891b2" strokeWidth="1.5" strokeDasharray="6 4" />}
                {curve.portfolioArea && <path className="qn-performance-area" d={curve.portfolioArea} fill="url(#dashboardPortfolioArea)" />}
                {curve.portfolioPath && <path className="qn-performance-line" d={curve.portfolioPath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
              </g>
            </svg>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center" style={{ borderColor: "var(--qn-border)", color: "var(--qn-text-3)" }}>
              <Activity size={20} className="mb-2" aria-hidden="true" />
              <p className="text-xs font-semibold">Complete more trades to build your equity history.</p>
            </div>
          )}
          {!loading && curve.hasData && <div className="qn-chart-legend absolute right-0 top-0 flex items-center gap-4 rounded-lg px-2 py-1"><span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}><i className="h-0.5 w-4 rounded" style={{ background: "#6366f1" }} /> Portfolio</span><span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}><i className="h-0.5 w-4 rounded" style={{ background: "#0891b2" }} /> Benchmark</span></div>}
        </div>
      </section>

      <section aria-labelledby="quick-actions-title" className="qn-dashboard-enter qn-dashboard-delay-7 pt-1">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--qn-indigo)", fontFamily: "'JetBrains Mono', monospace" }}>QuantNova workspace</p>
            <h2 id="quick-actions-title" className="mt-1 text-xl font-bold tracking-tight" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Quick Actions</h2>
          </div>
          <p className="text-sm" style={{ color: "var(--qn-text-2)" }}>Move from analysis to action.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((item, index) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className={`qn-card qn-action-card qn-action-card-${item.tone} qn-dashboard-enter qn-dashboard-delay-${index + 8} flex min-h-60 flex-col p-5 sm:p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <span className="qn-action-icon flex h-11 w-11 items-center justify-center rounded-xl"><Icon size={21} aria-hidden="true" /></span>
                  <ArrowUpRight size={18} className="qn-action-arrow" aria-hidden="true" />
                </div>
                <div className="mt-7">
                  <h3 className="text-lg font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>{item.title}</h3>
                  <p className="mt-2 max-w-[30ch] text-sm leading-6" style={{ color: "var(--qn-text-2)" }}>{item.description}</p>
                </div>
                <Link to={item.to} className="qn-action-link qn-focus-ring mt-auto inline-flex w-fit items-center gap-1.5 pt-6 text-sm font-bold" style={{ color: "var(--qn-indigo)" }}>
                  {item.action} <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
