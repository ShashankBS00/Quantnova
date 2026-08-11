import { useState } from "react";
import CandlestickChart from "@/components/charts/CandlestickChart";
import StockSearch from "@/components/market/StockSearch";

const timeframes = [
  { label: "1D", period: "1d" },
  { label: "5D", period: "5d" },
  { label: "1M", period: "1mo" },
  { label: "3M", period: "3mo" },
  { label: "6M", period: "6mo" },
  { label: "1Y", period: "1y" },
  { label: "5Y", period: "5y" },
];
export default function MarketChart({
  symbol,
  onSymbolChange,
}) { 
  const [period, setPeriod] = useState("1mo");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex flex-col gap-5">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Market Overview
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              {symbol} • Market Data
            </p>
          </div>

          <div className="w-full lg:w-[420px]">
         <StockSearch onSearch={onSymbolChange} />
          </div>
        </div>

        {/* Timeframes */}
        <div className="flex flex-wrap gap-2">
          {timeframes.map((item) => (
            <button
              key={item.period}
              onClick={() => setPeriod(item.period)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                period === item.period
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <CandlestickChart
          symbol={symbol}
          period={period}
        />

      </div>
    </div>
  );
}