import React, { useState } from "react";
import CandlestickChart from "@/components/charts/CandlestickChart";
import StockSearch from "@/components/market/StockSearch";
import { BarChart3, Activity, Layers } from "lucide-react";

const timeframes = [
  { label: "1D", period: "1d" },
  { label: "5D", period: "5d" },
  { label: "1M", period: "1mo" },
  { label: "3M", period: "3mo" },
  { label: "6M", period: "6mo" },
  { label: "1Y", period: "1y" },
  { label: "5Y", period: "5y" },
];

export default function MarketChart({ symbol = "RELIANCE.NS", onSymbolChange }) {
  const [period, setPeriod] = useState("1mo");

  const cleanSymbol = symbol.replace(".NS", "");

  return (
    <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-5 shadow-xl select-none">
      <div className="flex flex-col gap-4">
        
        {/* Top Header & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#162444]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1">
                <Activity size={13} /> Interactive Chart
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                NSE Real-Time
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-white font-mono tracking-tight">
                {cleanSymbol}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                ({symbol})
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full lg:w-[380px]">
            <StockSearch onSearch={onSymbolChange} />
          </div>
        </div>

        {/* Timeframe Selector Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#070b16] p-1 rounded-xl border border-[#162444]">
            {timeframes.map((item) => {
              const isActive = period === item.period;
              return (
                <button
                  key={item.period}
                  onClick={() => setPeriod(item.period)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-[#0c1328]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Layers size={13} className="text-slate-400" />
              Interval: Auto
            </span>
          </div>
        </div>

        {/* Candlestick Canvas / Chart Viewport */}
        <div className="w-full min-h-[380px] bg-[#070b16] border border-[#162444] rounded-xl overflow-hidden p-2">
          <CandlestickChart symbol={symbol} period={period} />
        </div>

      </div>
    </div>
  );
}