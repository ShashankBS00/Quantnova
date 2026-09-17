import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowUpRight, BarChart3, Clock, Plus, RefreshCw, Sparkles, TrendingDown, TrendingUp, Wallet, Zap } from "lucide-react";

import MarketStatus from "@/components/market/MarketStatus";
import MarketChart from "@/components/dashboard/MarketChart";
import Watchlist from "@/components/market/Watchlist";
import PredictionCard from "@/components/prediction/PredictionCard";
import { getCurrentMarketData } from "@/services/portfolioService";
import { getMarketHistory } from "@/services/marketService";
import { getTradingAccount } from "@/services/tradingService";
import { getTradingAnalytics } from "@/services/tradingAnalyticsService";

const DEFAULT_SYMBOLS = ["RELIANCE.NS", "TCS.NS", "INFY.NS"];
const RANGE_PERIODS = { "1W": "5d", "1M": "1mo", "3M": "3mo" };
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function linePath(values, width = 500, height = 150) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.max(Math.abs(max) * 0.02, 1);
  const points = values.map((value, index) => ({ x: (index / (values.length - 1)) * width, y: height - 12 - ((value - min) / range) * (height - 28) }));
  return points.reduce((path, point, index) => `${path}${index ? " L" : "M"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`, "");
}

function areaPath(path, width = 500, height = 150) {
  return path ? `${path} L ${width} ${height} L 0 ${height} Z` : "";
}

function calculateSharpe(values) {
  if (values.length < 3) return null;
  const returns = values.slice(1).map((value, index) => (values[index] ? (value - values[index]) / values[index] : 0));
  const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / returns.length;
  const deviation = Math.sqrt(variance);
  return deviation ? (average / deviation) * Math.sqrt(returns.length) : null;
}

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE.NS");
  const [activeRange, setActiveRange] = useState("1M");
  const [account, setAccount] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [equityHistory, setEquityHistory] = useState([]);
  const [benchmarkHistory, setBenchmarkHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadDashboard({ quiet = false } = {}) {
    if (quiet) setRefreshing(true); else setLoading(true);
    try {
      const currentAccount = await getTradingAccount();
      const holdingSymbols = Object.keys(currentAccount.holdings || {});
      const signalSymbols = Array.from(new Set([...holdingSymbols, ...DEFAULT_SYMBOLS])).slice(0, 3);
      const [quoteResults, analyticsResult, benchmarkResult] = await Promise.all([
        Promise.allSettled(signalSymbols.map((symbol) => getCurrentMarketData(symbol))),
        getTradingAnalytics().catch((error) => {
          console.error("Failed to load equity history:", error);
          return { equityHistory: [] };
        }),
        getMarketHistory(selectedSymbol, RANGE_PERIODS[activeRange]).catch((error) => {
          console.error("Failed to load benchmark history:", error);
          return { data: [] };
        }),
      ]);

      const quoteMap = {};
      quoteResults.forEach((result, index) => { if (result.status === "fulfilled") quoteMap[signalSymbols[index]] = result.value; });
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
  }

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => loadDashboard({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [selectedSymbol, activeRange]);

  const overview = useMemo(() => {
    const holdings = Object.entries(account?.holdings || {});
    const currentHoldingsValue = holdings.reduce((sum, [symbol, holding]) => sum + holding.quantity * (quotes[symbol]?.currentPrice ?? holding.average_price), 0);
    const previousHoldingsValue = holdings.reduce((sum, [symbol, holding]) => sum + holding.quantity * (quotes[symbol]?.previousClose ?? holding.average_price), 0);
    const portfolioValue = Number(account?.cash || 0) + currentHoldingsValue;
    const previousValue = Number(account?.cash || 0) + previousHoldingsValue;
    const todayPnl = portfolioValue - previousValue;
    const todayPnlPercent = previousValue ? (todayPnl / previousValue) * 100 : 0;
    const totalTrades = (account?.winning_trades || 0) + (account?.losing_trades || 0);
    const winRate = totalTrades ? ((account.winning_trades / totalTrades) * 100) : 0;
    const equityValues = equityHistory.map((point) => Number(point.equity)).filter(Number.isFinite);
    const sharpe = calculateSharpe(equityValues);
    const initialCash = Number(account?.initial_cash || 100000);
    return { portfolioValue, todayPnl, todayPnlPercent, totalTrades, winRate, sharpe, totalReturn: portfolioValue - initialCash, totalReturnPercent: initialCash ? ((portfolioValue - initialCash) / initialCash) * 100 : 0, equityValues };
  }, [account, quotes, equityHistory]);

  const curve = useMemo(() => {
    const portfolioValues = overview.equityValues.length ? overview.equityValues : [overview.portfolioValue];
    const benchmarkValues = benchmarkHistory.map((item) => Number(item.close)).filter(Number.isFinite);
    return { portfolioPath: linePath(portfolioValues), benchmarkPath: linePath(benchmarkValues), portfolioArea: areaPath(linePath(portfolioValues)), benchmarkArea: areaPath(linePath(benchmarkValues)), hasData: portfolioValues.length > 1 || benchmarkValues.length > 1 };
  }, [overview, benchmarkHistory]);

  const signalSymbols = Array.from(new Set([...Object.keys(account?.holdings || {}), ...DEFAULT_SYMBOLS])).slice(0, 3);
  const signals = signalSymbols.map((ticker) => {
    const quote = quotes[ticker];
    const change = quote?.currentPrice && quote?.previousClose ? ((quote.currentPrice - quote.previousClose) / quote.previousClose) * 100 : null;
    const action = change === null ? "HOLD" : change >= 0 ? "BUY" : "SELL";
    return { ticker, symbol: ticker.replace(".NS", ""), price: quote?.currentPrice, change, action, confidence: change === null ? null : Math.min(99, 55 + Math.abs(change) * 12) };
  });

  const now = new Date();
  const indiaParts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const indiaPart = (type) => indiaParts.find((part) => part.type === type)?.value || "";
  const indiaHour = Number(indiaPart("hour"));
  const indiaMinute = Number(indiaPart("minute"));
  const indiaWeekday = indiaPart("weekday");
  const todayStr = `${indiaWeekday}, ${indiaPart("day")} ${indiaPart("month")} ${indiaPart("year")}`;
  const greeting = indiaHour < 12 ? "Good morning" : indiaHour < 17 ? "Good afternoon" : "Good evening";
  const greetingIcon = indiaHour < 12 ? "☀️" : indiaHour < 17 ? "🌤️" : "🌙";
  const marketMinutes = indiaHour * 60 + indiaMinute;
  const isMarketOpen = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(indiaWeekday) && marketMinutes >= 555 && marketMinutes <= 930;
  const kpiCards = [
    { label: "Portfolio value", value: loading ? "—" : money(overview.portfolioValue), sub: `${overview.totalReturn >= 0 ? "+" : "-"}${money(Math.abs(overview.totalReturn))} · ${overview.totalReturnPercent >= 0 ? "+" : ""}${overview.totalReturnPercent.toFixed(2)}%`, color: "var(--qn-indigo)", icon: Wallet, accent: "qn-card-violet" },
    { label: "Today's P&L", value: loading ? "—" : `${overview.todayPnl >= 0 ? "+" : "-"}${money(Math.abs(overview.todayPnl))}`, sub: `${overview.todayPnlPercent >= 0 ? "+" : ""}${overview.todayPnlPercent.toFixed(2)}% today`, color: overview.todayPnl >= 0 ? "var(--qn-bull)" : "var(--qn-bear)", icon: overview.todayPnl >= 0 ? TrendingUp : TrendingDown, accent: "qn-card-bull" },
    { label: "Win rate", value: loading ? "—" : `${overview.winRate.toFixed(2)}%`, sub: `${overview.totalTrades} closed trades`, color: "var(--qn-cyan)", icon: BarChart3, accent: "qn-card-cyan" },
    { label: "Sharpe ratio", value: loading ? "—" : overview.sharpe === null ? "—" : overview.sharpe.toFixed(2), sub: overview.sharpe === null ? "Need 3+ closed trades" : "Risk-adjusted return", color: "var(--qn-violet)", icon: Activity, accent: "qn-card-violet" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-5 pb-12 select-none animate-fade-up">
      <header className="flex flex-col gap-4 rounded-2xl border px-5 py-4 md:flex-row md:items-center md:justify-between" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(238,240,251,0.78))", borderColor: "var(--qn-border)" }}><div><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl text-base" style={{ background: "rgba(79, 70, 229, 0.08)" }}>{greetingIcon}</span><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--qn-text-1)" }}>{greeting}, Shashank</h1></div><p className="mt-2 text-sm" style={{ color: "var(--qn-text-2)" }}>Here’s your live paper-trading overview.</p><p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}><Clock size={12} /> {todayStr} <span>·</span><span style={{ color: isMarketOpen ? "var(--qn-bull)" : "var(--qn-text-2)" }}>{isMarketOpen ? "● NSE Open" : "○ NSE Closed"}</span>{lastUpdated && <span>· Updated {lastUpdated.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}</span>}</p></div><div className="flex flex-wrap items-center gap-2.5"><button type="button" onClick={() => loadDashboard({ quiet: true })} disabled={refreshing} className="qn-btn-ghost inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh</button><Link to="/trading" className="qn-btn-ghost flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold"><Plus size={14} /> Buy</Link><Link to="/backtest" className="qn-btn-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold"><Zap size={14} /> Run Backtest</Link></div></header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{kpiCards.map((card) => { const Icon = card.icon; return <article key={card.label} className={`qn-card ${card.accent} p-5`}><div className="mb-3 flex items-start justify-between"><p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{card.label}</p><span className="rounded-lg p-1.5" style={{ background: "rgba(79,70,229,0.07)" }}><Icon size={14} style={{ color: card.color }} /></span></div><h2 className="mb-1.5 text-2xl font-black" style={{ color: card.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{card.value}</h2><p className="text-xs font-semibold" style={{ color: card.color === "var(--qn-bear)" ? "var(--qn-bear)" : "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{card.sub}</p></article>; })}</section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3"><article className="qn-card flex min-w-0 flex-col p-5 lg:col-span-2"><div className="mb-1 flex items-center justify-between"><div><h3 className="text-sm font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Portfolio performance</h3><p className="text-[11px]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>Account equity vs {selectedSymbol.replace(".NS", "")} benchmark</p></div><div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--qn-surface-2)", border: "1px solid var(--qn-border)" }}>{Object.keys(RANGE_PERIODS).map((range) => <button key={range} type="button" onClick={() => setActiveRange(range)} className="rounded-lg px-3 py-1 text-xs font-bold transition-all" style={{ background: activeRange === range ? "linear-gradient(135deg, #4f46e5, #6d28d9)" : "transparent", color: activeRange === range ? "#fff" : "var(--qn-text-2)", fontFamily: "'JetBrains Mono', monospace" }}>{range}</button>)}</div></div><div className="relative mt-6 flex h-48 w-full items-end">{curve.hasData ? <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none"><defs><linearGradient id="dashboardPortfolioArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.30" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>{[50, 100].map((y) => <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(99,102,241,0.10)" strokeDasharray="4 6" />)}{curve.benchmarkPath && <path d={curve.benchmarkPath} fill="none" stroke="#0891b2" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />}{curve.portfolioArea && <path d={curve.portfolioArea} fill="url(#dashboardPortfolioArea)" />}{curve.portfolioPath && <path d={curve.portfolioPath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />}</svg> : <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: "var(--qn-text-3)" }}>Complete more trades to build your equity history.</div>}<div className="absolute right-0 top-0 flex items-center gap-4"><span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}><i className="h-0.5 w-4 rounded" style={{ background: "#6366f1" }} /> Portfolio</span><span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}><i className="h-0.5 w-4 rounded" style={{ background: "#0891b2" }} /> Benchmark</span></div></div></article>
        <article className="qn-card qn-card-violet p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles size={14} style={{ color: "var(--qn-gold)" }} /><h3 className="text-sm font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Market signals</h3></div><span className="qn-badge" style={{ background: "rgba(5,150,105,0.08)", color: "var(--qn-bull)", border: "1px solid rgba(5,150,105,0.20)" }}>LIVE</span></div><div className="space-y-2.5">{signals.map((signal) => { const isBuy = signal.action === "BUY"; const isSell = signal.action === "SELL"; const color = isBuy ? "var(--qn-bull)" : isSell ? "var(--qn-bear)" : "var(--qn-gold)"; return <button key={signal.ticker} type="button" onClick={() => setSelectedSymbol(signal.ticker)} className="w-full rounded-xl p-3.5 text-left transition-all hover:-translate-y-0.5" style={{ background: "var(--qn-surface-2)", border: `1px solid ${selectedSymbol === signal.ticker ? "rgba(79,70,229,0.28)" : "var(--qn-border)"}` }}><div className="flex items-center justify-between"><div><h4 className="mb-0.5 text-sm font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{signal.symbol}</h4><div className="flex items-center gap-2"><span className="text-sm font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{signal.price ? money(signal.price) : "—"}</span><span className="text-[10px] font-bold" style={{ color }}>{signal.change === null ? "Awaiting quote" : `${signal.change >= 0 ? "+" : ""}${signal.change.toFixed(2)}%`}</span></div></div><span className="rounded-full px-3 py-1 text-xs font-black tracking-wider" style={{ color, background: isBuy ? "var(--qn-bull-dim)" : isSell ? "var(--qn-bear-dim)" : "var(--qn-gold-dim)", fontFamily: "'JetBrains Mono', monospace" }}>{signal.action}</span></div>{signal.confidence !== null && <p className="mt-2 text-[10px]" style={{ color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" }}>Momentum confidence {signal.confidence.toFixed(0)}%</p>}</button>; })}</div></article></section>

      <MarketStatus />
      <MarketChart symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2"><Watchlist selectedSymbol={selectedSymbol} onSelectStock={setSelectedSymbol} /><PredictionCard /></section>
    </div>
  );
}
