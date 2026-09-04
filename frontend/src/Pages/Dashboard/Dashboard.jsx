import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Activity,
  Sparkles,
  Clock,
  ArrowUpRight,
  Zap,
  Plus,
  Wallet,
  BarChart3,
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

  const kpiCards = [
    {
      label: "PORTFOLIO VALUE",
      value: "₹1,18,420",
      sub: "+₹18,420 · +18.4%",
      subColor: 'var(--qn-bull)',
      icon: Wallet,
      iconColor: '#818cf8',
      accentClass: 'qn-card-violet',
    },
    {
      label: "TODAY'S P&L",
      value: "+₹1,240",
      sub: "+1.1% today",
      subColor: 'var(--qn-bull)',
      icon: TrendingUp,
      iconColor: 'var(--qn-bull)',
      accentClass: 'qn-card-bull',
    },
    {
      label: "WIN RATE",
      value: "63%",
      sub: "42 trades total",
      subColor: 'var(--qn-text-3)',
      icon: BarChart3,
      iconColor: 'var(--qn-cyan)',
      accentClass: 'qn-card-cyan',
    },
    {
      label: "SHARPE RATIO",
      value: "1.84",
      sub: "Risk-adjusted",
      subColor: 'var(--qn-text-3)',
      icon: Activity,
      iconColor: '#a78bfa',
      accentClass: 'qn-card-violet',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-5 pb-12 select-none animate-fade-up">

      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
            Good morning, Shashank <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="mt-1 text-xs font-medium flex items-center gap-1.5"
            style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
            <Clock size={12} style={{ color: 'var(--qn-text-3)' }} />
            <span>{todayStr}</span>
            <span style={{ color: 'var(--qn-text-3)', margin: '0 2px' }}>·</span>
            <span style={{ color: isMarketOpen ? 'var(--qn-bull)' : 'var(--qn-text-2)', fontWeight: 700 }}>
              {isMarketOpen ? "● NSE Open" : "○ NSE Closed"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/trading"
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all qn-btn-ghost"
          >
            <Plus size={14} style={{ color: '#a5b4fc' }} /> Buy
          </Link>
          <Link
            to="/backtest"
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all qn-btn-primary"
          >
            <Zap size={14} /> Run Backtest
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`qn-card ${card.accentClass} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {card.label}
                </p>
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)' }}>
                  <Icon size={14} style={{ color: card.iconColor }} />
                </div>
              </div>
              <h2 className="text-2xl font-black mb-1.5"
                style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>
                {card.value}
              </h2>
              <p className="text-xs font-semibold" style={{ color: card.subColor, fontFamily: "'JetBrains Mono', monospace" }}>
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. Performance Chart & AI Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Portfolio Performance Curve */}
        <div className="lg:col-span-2 qn-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
                Portfolio Performance
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                Equity curve vs benchmark
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: 'rgba(6,8,16,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
              {["1W", "1M", "3M"].map((range) => {
                const isActive = activeRange === range;
                return (
                  <button
                    key={range}
                    onClick={() => setActiveRange(range)}
                    className="px-3 py-1 text-xs font-bold rounded-lg transition-all"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--qn-text-2)',
                      boxShadow: isActive ? '0 2px 8px rgba(99,102,241,0.30)' : 'none',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative mt-6 h-48 w-full flex items-end">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveGradMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="curveGradBenchmark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines */}
              {[50, 100].map((y) => (
                <line key={y} x1="0" y1={y} x2="500" y2={y}
                  stroke="rgba(99,102,241,0.08)" strokeDasharray="4 6" strokeWidth="1" />
              ))}

              {/* Benchmark area */}
              <path
                d="M 0 120 Q 250 105 500 70 L 500 150 L 0 150 Z"
                fill="url(#curveGradBenchmark)"
              />
              <path
                d="M 0 120 Q 250 105 500 70"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                opacity="0.5"
              />

              {/* Main portfolio area */}
              <path
                d="M 0 115 Q 125 95 250 72 Q 375 48 500 18 L 500 150 L 0 150 Z"
                fill="url(#curveGradMain)"
              />
              {/* Main line */}
              <path
                d="M 0 115 Q 125 95 250 72 Q 375 48 500 18"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
              />

              {/* Pulsing endpoint */}
              <circle cx="500" cy="18" r="5" fill="#6366f1" opacity="0.25" className="animate-ping" />
              <circle cx="500" cy="18" r="3" fill="#6366f1" />
            </svg>

            {/* Legend */}
            <div className="absolute top-0 right-0 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded" style={{ background: '#6366f1' }} />
                <span className="text-[10px]" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>Portfolio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded opacity-50" style={{ background: '#06b6d4', borderTop: '1px dashed #06b6d4' }} />
                <span className="text-[10px]" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>Benchmark</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Signals */}
        <div className="qn-card qn-card-violet p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: 'var(--qn-gold)' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
                AI Signals
              </h3>
            </div>
            <span className="qn-badge" style={{
              background: 'rgba(16,217,134,0.08)',
              color: 'var(--qn-bull)',
              border: '1px solid rgba(16,217,134,0.20)',
            }}>
              Real-time
            </span>
          </div>

          <div className="space-y-2.5 flex-1 flex flex-col justify-around">
            {aiSignals.map((item) => {
              const isBuy = item.action === "BUY";
              return (
                <div
                  key={item.symbol}
                  onClick={() => setSelectedSymbol(item.ticker)}
                  className="p-3.5 rounded-xl cursor-pointer transition-all group"
                  style={{
                    background: 'rgba(6,8,16,0.8)',
                    border: '1px solid rgba(99,102,241,0.10)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)';
                    e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.10)';
                    e.currentTarget.style.background = 'rgba(6,8,16,0.8)';
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold mb-0.5"
                        style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {item.symbol}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {item.price}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            color: 'var(--qn-gold)',
                            background: 'var(--qn-gold-dim)',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                          {item.conf}
                        </span>
                      </div>
                    </div>

                    <span
                      className="px-3 py-1 rounded-full text-xs font-black tracking-wider"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: isBuy ? 'var(--qn-bull)' : 'var(--qn-bear)',
                        background: isBuy ? 'var(--qn-bull-dim)' : 'var(--qn-bear-dim)',
                        border: `1px solid ${isBuy ? 'rgba(16,217,134,0.25)' : 'rgba(244,63,94,0.25)'}`,
                      }}
                    >
                      {item.action}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Market Status */}
      <section>
        <MarketStatus />
      </section>

      {/* 5. Interactive Chart */}
      <section>
        <MarketChart symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
      </section>

      {/* 6. Watchlist & Prediction */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Watchlist selectedSymbol={selectedSymbol} onSelectStock={setSelectedSymbol} />
        <PredictionCard />
      </section>

    </div>
  );
}
