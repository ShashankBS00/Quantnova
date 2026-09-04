import { useState } from "react";
import CandlestickChart from "@/components/charts/CandlestickChart";
import StockSearch from "@/components/market/StockSearch";
import { BarChart2 } from "lucide-react";

const timeframes = [
  { label: "1D", period: "1d" },
  { label: "5D", period: "5d" },
  { label: "1M", period: "1mo" },
  { label: "3M", period: "3mo" },
  { label: "6M", period: "6mo" },
  { label: "1Y", period: "1y" },
  { label: "5Y", period: "5y" },
];

export default function MarketChart({ symbol, onSymbolChange }) {
  const [period, setPeriod] = useState("1mo");

  return (
    <div className="qn-card qn-card-cyan p-5">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} style={{ color: 'var(--qn-cyan)' }} />
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
                Market Overview
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                {symbol} · Live Data
              </p>
            </div>
          </div>

          <div className="w-full lg:w-[420px]">
            <StockSearch onSearch={onSymbolChange} />
          </div>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {timeframes.map((item) => {
            const isActive = period === item.period;
            return (
              <button
                key={item.period}
                onClick={() => setPeriod(item.period)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: isActive ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'rgba(12,15,26,0.8)',
                  border: isActive ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(99,102,241,0.12)',
                  color: isActive ? '#fff' : 'var(--qn-text-2)',
                  boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.25)' : 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.28)'; e.currentTarget.style.color = 'var(--qn-text-1)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = 'var(--qn-text-2)'; }}}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <CandlestickChart symbol={symbol} period={period} />
      </div>
    </div>
  );
}
