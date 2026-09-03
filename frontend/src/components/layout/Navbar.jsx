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
    <header className="w-full bg-[#070b16] border-b border-[#141e38] z-40 shrink-0">
      {/* 1. Main Navigation Bar */}
      <div className="h-16 flex items-center justify-between px-6 gap-4">
        
        {/* Brand & Logo (w-64 matches the sidebar width for vertical alignment) */}
        <div className="flex items-center space-x-3 w-64 shrink-0">
          <img
            src={logo}
            alt="QuantNova"
            className="w-8 h-8 rounded-lg object-contain shadow-sm"
          />
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Quant<span className="text-blue-500">Nova</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-mono font-semibold">
              Live Lab
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-[480px]">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search stocks (e.g. RELIANCE, NIFTY50)..."
            className="w-full bg-[#0c1328] border border-[#1b2649] rounded-full py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
          />
        </div>

        {/* Right Section: Status, Alerts & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center space-x-1.5 bg-[#081b1a] border border-[#0d4239] text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live</span>
          </div>

          <button
            aria-label="Notifications"
            className="relative p-2 rounded-lg bg-[#0c1328] border border-[#19264c] hover:bg-[#131d3d] text-slate-300 hover:text-white transition"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
          </button>

          <button
            aria-label="Theme Toggle"
            className="p-2 rounded-lg bg-[#0c1328] border border-[#19264c] hover:bg-[#131d3d] text-slate-300 hover:text-white transition hidden md:block"
          >
            <Moon size={16} />
          </button>

          <div className="flex items-center gap-2.5 bg-[#0c1328] border border-[#19264c] px-3 py-1.5 rounded-full cursor-pointer hover:border-blue-500/50 transition">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300 font-mono">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <h4 className="text-xs text-white font-semibold leading-tight">
                {username}
              </h4>
              <p className="text-[10px] text-slate-400 leading-tight">
                Quantitative Workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 100% Full-Width Infinite Scrolling Ticker Tape */}
      <div className="h-8 bg-[#050811] border-t border-[#12192e] overflow-hidden flex items-center relative group w-full">
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes marqueeLoop {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .ticker-tape-scroll {
              display: flex;
              width: max-content;
              animation: marqueeLoop 26s linear infinite;
            }
            .ticker-tape-scroll:hover {
              animation-play-state: paused;
            }
          `,
          }}
        />

        <div className="ticker-tape-scroll space-x-8 px-4 cursor-pointer">
          {[...TICKERS, ...TICKERS].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-1.5 text-xs font-medium whitespace-nowrap"
            >
              <span className="text-slate-400 font-semibold tracking-wide">
                {item.symbol}
              </span>
              <span className="text-white font-bold font-mono">
                {item.price}
              </span>
              <span
                className={`font-semibold text-[11px] font-mono ${
                  item.isPos ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}