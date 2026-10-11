import React from "react";
import {
  Wallet,
  CircleDollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
} from "lucide-react";
import { formatINR, formatPnlINR, formatPercent } from "@/utils/stockUtils";

export default function PortfolioSummaryCards({
  holdings = [],
  marketData = {},
  cash = 100000,
  loading = false,
}) {
  // 1. Total Investment = Sum of quantity × average purchase price
  const totalInvestment = holdings.reduce(
    (total, stock) => total + (Number(stock.quantity) || 0) * (Number(stock.averagePrice) || 0),
    0
  );

  // 2. Current Value = Sum of quantity × latest available market price
  let missingQuoteCount = 0;
  const currentValue = holdings.reduce((total, stock) => {
    const data = marketData[stock.symbol];
    const price = data?.price ?? data?.currentPrice;
    if (typeof price !== "number" || Number.isNaN(price)) {
      missingQuoteCount++;
      // If price is temporarily missing, fall back to average price for total valuation rather than treating as 0
      return total + (Number(stock.quantity) || 0) * (Number(stock.averagePrice) || 0);
    }
    return total + (Number(stock.quantity) || 0) * price;
  }, 0);

  // 3. Yesterday's Value for Today's P&L:
  // Today's P&L = Current Value − Previous-Close Portfolio Value
  const previousCloseValue = holdings.reduce((total, stock) => {
    const data = marketData[stock.symbol];
    const prevClose = data?.prev_close ?? data?.previousClose ?? data?.price ?? data?.currentPrice ?? stock.averagePrice;
    return total + (Number(stock.quantity) || 0) * (Number(prevClose) || Number(stock.averagePrice) || 0);
  }, 0);

  const todayPnl = currentValue - previousCloseValue;
  const todayPnlPercent = previousCloseValue > 0 ? (todayPnl / previousCloseValue) * 100 : 0;

  // 4. Overall P&L = Current Value − Total Investment
  const overallPnl = currentValue - totalInvestment;
  const overallReturnPercent = totalInvestment > 0 ? (overallPnl / totalInvestment) * 100 : 0;

  // Position count
  const activePositions = holdings.length;
  const positionCountText = `${activePositions} active position${activePositions === 1 ? "" : "s"}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {/* ── 1. Total Investment ── */}
      <article
        className="qn-card p-5 border flex flex-col justify-between transition-all"
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
          borderColor: "rgba(99, 102, 241, 0.20)",
        }}
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <span
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Total Investment
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md shrink-0"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
            >
              <Wallet size={17} />
            </span>
          </div>

          <p
            className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {loading ? "—" : formatINR(totalInvestment)}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers size={11} /> {positionCountText}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Cost basis</span>
        </div>
      </article>

      {/* ── 2. Current Value ── */}
      <article
        className="qn-card p-5 border flex flex-col justify-between transition-all"
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)",
          borderColor: "rgba(139, 92, 246, 0.20)",
        }}
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <span
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Current Value
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}
            >
              <CircleDollarSign size={17} />
            </span>
          </div>

          <p
            className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {loading ? "—" : formatINR(currentValue)}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Activity size={11} /> Live Valuation
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {missingQuoteCount > 0 ? "Some quotes delayed" : "Real-time quotes"}
          </span>
        </div>
      </article>

      {/* ── 3. Today's P&L (Current Value − Previous Close Value) ── */}
      <article
        className="qn-card p-5 border flex flex-col justify-between transition-all"
        style={{
          background:
            todayPnl > 0
              ? "linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)"
              : todayPnl < 0
              ? "linear-gradient(145deg, #ffffff 0%, #fff1f2 100%)"
              : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          borderColor:
            todayPnl > 0
              ? "rgba(16, 185, 129, 0.25)"
              : todayPnl < 0
              ? "rgba(239, 68, 68, 0.25)"
              : "rgba(148, 163, 184, 0.20)",
        }}
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <span
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Today&apos;s P&L
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md shrink-0"
              style={{
                background:
                  todayPnl > 0
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : todayPnl < 0
                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
              }}
            >
              {todayPnl >= 0 ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
            </span>
          </div>

          <p
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              todayPnl > 0
                ? "text-emerald-600"
                : todayPnl < 0
                ? "text-rose-600"
                : "text-slate-800"
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {loading ? "—" : formatPnlINR(todayPnl)}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background:
                todayPnl > 0
                  ? "rgba(16, 185, 129, 0.12)"
                  : todayPnl < 0
                  ? "rgba(239, 68, 68, 0.12)"
                  : "rgba(100, 116, 139, 0.12)",
              color: todayPnl > 0 ? "#059669" : todayPnl < 0 ? "#dc2626" : "#475569",
              border:
                todayPnl > 0
                  ? "1px solid rgba(16, 185, 129, 0.25)"
                  : todayPnl < 0
                  ? "1px solid rgba(239, 68, 68, 0.25)"
                  : "1px solid rgba(100, 116, 139, 0.25)",
            }}
          >
            {loading ? "—" : formatPercent(todayPnlPercent)} today
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Daily return</span>
        </div>
      </article>

      {/* ── 4. Overall P&L (Current Value − Total Investment) ── */}
      <article
        className="qn-card p-5 border flex flex-col justify-between transition-all"
        style={{
          background:
            overallPnl > 0
              ? "linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)"
              : overallPnl < 0
              ? "linear-gradient(145deg, #ffffff 0%, #fff1f2 100%)"
              : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          borderColor:
            overallPnl > 0
              ? "rgba(16, 185, 129, 0.25)"
              : overallPnl < 0
              ? "rgba(239, 68, 68, 0.25)"
              : "rgba(148, 163, 184, 0.20)",
        }}
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <span
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Overall P&L
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md shrink-0"
              style={{
                background:
                  overallPnl > 0
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : overallPnl < 0
                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
              }}
            >
              {overallPnl >= 0 ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
            </span>
          </div>

          <p
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              overallPnl > 0
                ? "text-emerald-600"
                : overallPnl < 0
                ? "text-rose-600"
                : "text-slate-800"
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {loading ? "—" : formatPnlINR(overallPnl)}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background:
                overallPnl > 0
                  ? "rgba(16, 185, 129, 0.12)"
                  : overallPnl < 0
                  ? "rgba(239, 68, 68, 0.12)"
                  : "rgba(100, 116, 139, 0.12)",
              color: overallPnl > 0 ? "#059669" : overallPnl < 0 ? "#dc2626" : "#475569",
              border:
                overallPnl > 0
                  ? "1px solid rgba(16, 185, 129, 0.25)"
                  : overallPnl < 0
                  ? "1px solid rgba(239, 68, 68, 0.25)"
                  : "1px solid rgba(100, 116, 139, 0.25)",
            }}
          >
            {loading ? "—" : formatPercent(overallReturnPercent)} Total Return
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Unrealized P&L</span>
        </div>
      </article>
    </div>
  );
}
