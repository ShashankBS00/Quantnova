import React from "react";
import { Search, Bell, Moon } from "lucide-react";
import logo from "@/assets/logo.svg";

const TICKERS = [
  { symbol: "RELIANCE", price: "₹2,942", change: "+1.8%", isPos: true },
  { symbol: "TCS", price: "₹3,814", change: "-0.4%", isPos: false },
  { symbol: "NIFTY50", price: "₹23,516", change: "+0.9%", isPos: true },
  { symbol: "INFY", price: "₹1,623", change: "+2.1%", isPos: true },
  { symbol: "HDFC", price: "₹1,648", change: "-0.7%", isPos: false },
  { symbol: "ICICIBANK", price: "₹1,180", change: "+0.6%", isPos: true },
  { symbol: "TATAMOTORS", price: "₹985", change: "+1.4%", isPos: true },
];

export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const username = user?.username || "Shashank";

  return (
    <header className="w-full z-40 shrink-0" style={{
      background: 'linear-gradient(180deg, #090c18 0%, #070a14 100%)',
      borderBottom: '1px solid rgba(99, 102, 241, 0.12)',
    }}>
      {/* 1. Main Navigation Bar */}
      <div className="h-16 flex items-center justify-between px-6 gap-4">

        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 w-64 shrink-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-md opacity-40"
              style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }} />
            <img
              src={logo}
              alt="QuantNova"
              className="relative w-8 h-8 rounded-xl object-contain shadow-lg"
            />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#e2e8f0' }}>
              Quant<span style={{ color: '#818cf8' }}>Nova</span>
            </span>
            <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-md font-bold"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: '#a5b4fc',
                border: '1px solid rgba(99,102,241,0.25)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
              Live Lab
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-[480px]">
          <Search
            size={14}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--qn-text-3)' }}
          />
          <input
            type="text"
            placeholder="Search stocks (e.g. RELIANCE, NIFTY50)..."
            className="w-full rounded-full py-2.5 pl-10 pr-4 text-[13px] transition-all"
            style={{
              background: 'rgba(12,15,26,0.8)',
              border: '1px solid rgba(99,102,241,0.18)',
              color: 'var(--qn-text-1)',
              fontFamily: "'Inter', sans-serif",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.50)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.10)';
              e.currentTarget.style.outline = 'none';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.18)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(16,217,134,0.08)',
              border: '1px solid rgba(16,217,134,0.20)',
              color: 'var(--qn-bull)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--qn-bull)' }} />
            <span>Live</span>
          </div>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-xl transition-all"
            style={{
              background: 'rgba(12,15,26,0.8)',
              border: '1px solid rgba(99,102,241,0.15)',
              color: 'var(--qn-text-2)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.color = 'var(--qn-text-1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = 'var(--qn-text-2)'; }}
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--qn-bear)' }} />
          </button>

          {/* Theme toggle */}
          <button
            aria-label="Theme Toggle"
            className="p-2 rounded-xl transition-all hidden md:block"
            style={{
              background: 'rgba(12,15,26,0.8)',
              border: '1px solid rgba(99,102,241,0.15)',
              color: 'var(--qn-text-2)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.color = 'var(--qn-text-1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = 'var(--qn-text-2)'; }}
          >
            <Moon size={16} />
          </button>

          {/* User avatar pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full cursor-pointer transition-all"
            style={{
              background: 'rgba(12,15,26,0.8)',
              border: '1px solid rgba(99,102,241,0.18)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.40)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.18)'}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(124,58,237,0.20))',
                border: '1px solid rgba(99,102,241,0.35)',
                color: '#a5b4fc',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <h4 className="text-xs font-semibold leading-tight" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
                {username}
              </h4>
              <p className="text-[10px] leading-tight" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                Quant Workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Infinite Scrolling Ticker Tape */}
      <div className="h-8 overflow-hidden flex items-center relative w-full"
        style={{
          background: 'rgba(6,8,16,0.7)',
          borderTop: '1px solid rgba(99,102,241,0.08)',
        }}>
        <div className="ticker-tape-scroll space-x-8 px-4 cursor-pointer">
          {[...TICKERS, ...TICKERS].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-1.5 text-xs font-medium whitespace-nowrap"
            >
              <span className="font-bold tracking-wide"
                style={{ color: 'var(--qn-text-2)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                {item.symbol}
              </span>
              <span className="font-bold"
                style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                {item.price}
              </span>
              <span
                className="font-semibold"
                style={{
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: item.isPos ? 'var(--qn-bull)' : 'var(--qn-bear)',
                }}
              >
                {item.change}
              </span>
              <span style={{ color: 'var(--qn-text-3)', fontSize: '10px' }}>·</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
