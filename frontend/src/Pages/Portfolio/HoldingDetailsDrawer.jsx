import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ExternalLink,
  Plus,
  Minus,
  Layers,
  PieChart,
} from "lucide-react";
import {
  formatINR,
  formatPnlINR,
  formatPercent,
  getCompanyName,
  getExchange,
  getCleanSymbol,
} from "@/utils/stockUtils";

export default function HoldingDetailsDrawer({
  holding,
  quote,
  totalPortfolioValue = 0,
  isOpen = false,
  onClose,
  onOpenTrade,
}) {
  if (!isOpen || !holding) return null;

  const symbol = holding.symbol;
  const cleanSymbol = getCleanSymbol(symbol);
  const companyName = getCompanyName(symbol);
  const exchange = getExchange(symbol);

  const quantity = Number(holding.quantity) || 0;
  const averagePrice = Number(holding.averagePrice) || 0;
  const investedAmount = quantity * averagePrice;

  const currentPrice = quote?.price ?? quote?.currentPrice ?? averagePrice;
  const previousClose = quote?.prev_close ?? quote?.previousClose ?? currentPrice;
  const dayChange = currentPrice - previousClose;
  const dayChangePercent = previousClose > 0 ? (dayChange / previousClose) * 100 : 0;

  const currentValue = quantity * currentPrice;
  const pnl = currentValue - investedAmount;
  const pnlPercent = investedAmount > 0 ? (pnl / investedAmount) * 100 : 0;

  const allocationPercent =
    totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

  const sparkline = quote?.sparkline || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-lg font-black text-slate-900 tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {cleanSymbol}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {exchange}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{companyName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Market Price Banner */}
          <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Latest Market Price
            </span>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <span className="text-2xl font-black text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatINR(currentPrice)}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
                  dayChange >= 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {dayChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {formatPnlINR(dayChange)} ({formatPercent(dayChangePercent)})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Prev Close: {formatINR(previousClose)}
            </p>
          </div>

          {/* Position Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Quantity
              </span>
              <p className="text-base font-bold text-slate-900 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {quantity} Shares
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Average Buy Price
              </span>
              <p className="text-base font-bold text-slate-900 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatINR(averagePrice)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Invested Capital
              </span>
              <p className="text-base font-bold text-slate-900 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatINR(investedAmount)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Current Valuation
              </span>
              <p className="text-base font-bold text-indigo-700 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatINR(currentValue)}
              </p>
            </div>
          </div>

          {/* Unrealized P&L Card */}
          <div
            className="p-4 rounded-2xl border"
            style={{
              background:
                pnl >= 0 ? "linear-gradient(145deg, #ffffff, #f0fdf4)" : "linear-gradient(145deg, #ffffff, #fff1f2)",
              borderColor: pnl >= 0 ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Total Unrealized P&L
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  pnl >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {formatPercent(pnlPercent)} Return
              </span>
            </div>
            <p
              className={`text-2xl font-black mt-2 ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {formatPnlINR(pnl)}
            </p>
          </div>

          {/* Portfolio Weight */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900 mb-2">
              <span className="flex items-center gap-1.5">
                <PieChart size={14} className="text-indigo-600" /> Portfolio Weight
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {allocationPercent.toFixed(1)}% of total equity
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-indigo-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, allocationPercent))}%` }}
              />
            </div>
          </div>

          {/* Sparkline Visual (if available) */}
          {sparkline.length > 1 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  5-Day Price Trend
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {sparkline.length} ticks
                </span>
              </div>
              <div className="h-14 flex items-end gap-1 pt-2">
                {sparkline.map((val, idx) => {
                  const min = Math.min(...sparkline);
                  const max = Math.max(...sparkline);
                  const range = max - min || 1;
                  const hPct = Math.max(15, Math.min(100, ((val - min) / range) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-indigo-400/60 rounded-t hover:bg-indigo-600 transition-all"
                      style={{ height: `${hPct}%` }}
                      title={`₹${val}`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/90 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTrade({ symbol, side: "BUY", price: currentPrice });
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
            >
              <Plus size={15} /> Buy More
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTrade({ symbol, side: "SELL", price: currentPrice, maxQuantity: quantity });
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
            >
              <Minus size={15} /> Sell Position
            </button>
          </div>

          <Link
            to={`/market?symbol=${encodeURIComponent(symbol)}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <span>Open Advanced Market Chart</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
