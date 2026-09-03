import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  Target, 
  Activity, 
  Sparkles, 
  Clock, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck,
  Plus
} from "lucide-react";
import MarketStatus from "@/components/market/MarketStatus";
import MarketChart from "@/components/dashboard/MarketChart";
import Watchlist from "@/components/market/Watchlist";
import PredictionCard from "@/components/prediction/PredictionCard";

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE.NS");
  const [activeRange, setActiveRange] = useState("1M");

  const todayStr = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  // Check if NSE is open (Mon-Fri, 9:15 AM - 3:30 PM IST)
  const now = new Date();
  const day = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isMarketOpen = day >= 1 && day <= 5 && currentMinutes >= 555 && currentMinutes <= 930;

  // AI Signals dataset
  const aiSignals = [
    { symbol: "RELIANCE", ticker: "RELIANCE.NS", price: "₹2,942", change: "+1.8%", conf: "74%", action: "BUY" },
    { symbol: "TCS", ticker: "TCS.NS", price: "₹3,814", change: "-0.4%", conf: "68%", action: "SELL" },
    { symbol: "INFY", ticker: "INFY.NS", price: "₹1,623", change: "+2.1%", conf: "81%", action: "BUY" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-12 select-none">
      
      {/* 1. Header with Greeting & Action Triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Good morning, Shashank <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Clock size={13} className="text-slate-500" />
            <span>{todayStr}</span>
            <span className="text-slate-600">·</span>
            <span className={isMarketOpen ? "text-emerald-400 font-semibold" : "text-slate-400"}>
              {isMarketOpen ? "NSE Open" : "NSE Closed"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/trading"
            className="px-4 py-2 rounded-xl bg-[#0c1328] border border-[#1b2649] text-xs font-semibold text-white hover:bg-[#121c3b] hover:border-blue-500 transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus size={15} className="text-blue-400" /> + Buy
          </Link>
          <Link
            to="/backtest"
            className="px-4 py-2 rounded-xl bg-[#0c1328] border border-[#1b2649] text-xs font-semibold text-white hover:bg-[#121c3b] hover:border-blue-500 transition-all shadow-sm flex items-center gap-1.5"
          >
            <Zap size={14} className="text-amber-400" /> Run Backtest
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Row (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Portfolio Value */}
        <div className="p-5 rounded-2xl bg-[#0c1328] border border-[#172346] shadow-md hover:border-blue-500/40 transition-colors">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            PORTFOLIO VALUE
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white font-mono">₹1,18,420</h2>
          <p className="mt-1 text-xs font-medium text-emerald-400 font-mono">
            +₹18,420 · +18.4%
          </p>
        </div>

        {/* Card 2: Today's P&L */}
        <div className="p-5 rounded-2xl bg-[#0c1328] border border-[#172346] shadow-md hover:border-emerald-500/40 transition-colors">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            TODAY'S P&L
          </p>
          <h2 className="mt-2 text-2xl font-bold text-emerald-400 font-mono">+₹1,240</h2>
          <p className="mt-1 text-xs font-medium text-emerald-400 font-mono">
            +1.1% today
          </p>
        </div>

        {/* Card 3: Win Rate */}
        <div className="p-5 rounded-2xl bg-[#0c1328] border border-[#172346] shadow-md hover:border-purple-500/40 transition-colors">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            WIN RATE
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white font-mono">63%</h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            42 trades total
          </p>
        </div>

        {/* Card 4: Sharpe Ratio */}
        <div className="p-5 rounded-2xl bg-[#0c1328] border border-[#172346] shadow-md hover:border-blue-500/40 transition-colors">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            SHARPE RATIO
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white font-mono">1.84</h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Risk-adjusted
          </p>
        </div>
      </div>

      {/* 3. Performance Area Chart & AI Signals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Portfolio Performance Curve */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0c1328] border border-[#172346] flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Portfolio performance</h3>
              <p className="text-[11px] text-slate-400">Equity curve trajectory vs benchmark</p>
            </div>
            <div className="flex items-center gap-1 bg-[#070b16] p-1 rounded-xl border border-[#172346]">
              {["1W", "1M", "3M"].map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    activeRange === range
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Upward Line Curve SVG */}
          <div className="relative mt-8 h-48 w-full flex items-end">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="dashboardCurveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Subtle Grid line */}
              <line
                x1="0"
                y1="100"
                x2="500"
                y2="100"
                stroke="#172346"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              {/* Area Fill */}
              <path
                d="M 0 115 Q 250 85 500 25 L 500 150 L 0 150 Z"
                fill="url(#dashboardCurveGrad)"
              />
              {/* Stroke Line */}
              <path
                d="M 0 115 Q 250 85 500 25"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Pulsing Endpoint */}
              <circle cx="500" cy="25" r="4.5" fill="#3b82f6" className="animate-pulse" />
            </svg>
          </div>
        </div>

        {/* Right: AI Quant Signals */}
        <div className="p-5 rounded-2xl bg-[#0c1328] border border-[#172346] flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide">AI signals</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-[#070b16] px-2 py-0.5 rounded border border-[#172346]">
              Real-time
            </span>
          </div>

          <div className="space-y-2.5 flex-1 flex flex-col justify-around">
            {aiSignals.map((item) => (
              <div
                key={item.symbol}
                onClick={() => setSelectedSymbol(item.ticker)}
                className="p-3.5 rounded-xl bg-[#070b16] border border-[#172346] hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide font-mono group-hover:text-blue-400 transition-colors">
                    {item.symbol}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {item.price}
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono font-medium">
                      Conf: {item.conf}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${
                    item.action === "BUY"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                      : "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                  }`}
                >
                  {item.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Real-time Market Status Bar */}
      <section>
        <MarketStatus />
      </section>

      {/* 5. Interactive Chart (Switches ticker when AI signal or Watchlist is clicked) */}
      <section>
        <MarketChart symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
      </section>

      {/* 6. Modular Watchlist and In-depth Prediction Card */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Watchlist selectedSymbol={selectedSymbol} onSelectStock={setSelectedSymbol} />
        <PredictionCard />
      </section>

    </div>
  );
}