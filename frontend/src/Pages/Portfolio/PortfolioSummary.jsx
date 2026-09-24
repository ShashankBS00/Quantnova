import React from "react";
import { Wallet, CircleDollarSign, Clock, TrendingUp, TrendingDown } from "lucide-react";
import StatCard from "@/components/common/StatCard";
import PnlBadge, { formatINR, formatPnlINR } from "@/components/common/PnlBadge";

export default function PortfolioSummary({
  holdings = [],
  marketData = {},
  loading = false,
}) {
  // Total amount invested
  const totalInvestment = holdings.reduce(
    (total, stock) => total + (stock.quantity || 0) * (stock.averagePrice || 0),
    0
  );

  // Current market value
  const currentValue = holdings.reduce((total, stock) => {
    const data = marketData[stock.symbol];
    if (!data || typeof data.currentPrice !== "number") {
      return total;
    }
    return total + (stock.quantity || 0) * data.currentPrice;
  }, 0);

  // Overall P&L
  const overallPnl = currentValue - totalInvestment;
  const overallPnlPercent =
    totalInvestment > 0 ? (overallPnl / totalInvestment) * 100 : 0;

  // Yesterday's market value
  const yesterdayValue = holdings.reduce((total, stock) => {
    const data = marketData[stock.symbol];
    if (!data || typeof data.previousClose !== "number") {
      return total;
    }
    return total + data.previousClose * (stock.quantity || 0);
  }, 0);

  // Today's P&L
  const todayPnl = holdings.reduce((total, stock) => {
    const data = marketData[stock.symbol];
    if (
      !data ||
      typeof data.currentPrice !== "number" ||
      typeof data.previousClose !== "number"
    ) {
      return total;
    }
    return (
      total + (data.currentPrice - data.previousClose) * (stock.quantity || 0)
    );
  }, 0);

  // Today's P&L %
  const todayPnlPercent =
    yesterdayValue > 0 ? (todayPnl / yesterdayValue) * 100 : 0;

  const positionCountText = `${holdings.length} active ${
    holdings.length === 1 ? "position" : "positions"
  }`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {/* 1. Total Investment */}
      <StatCard
        title="Total Investment"
        value={loading ? "--" : formatINR(totalInvestment)}
        subtitle={positionCountText}
        icon={Wallet}
        iconBg="rgba(79, 70, 229, 0.08)"
        iconColor="#4f46e5"
        loading={loading}
      />

      {/* 2. Current Value */}
      <StatCard
        title="Current Value"
        value={loading ? "--" : formatINR(currentValue)}
        subtitle="Live market value"
        icon={CircleDollarSign}
        iconBg="rgba(109, 40, 217, 0.08)"
        iconColor="#6d28d9"
        loading={loading}
      />

      {/* 3. Today's P&L */}
      <StatCard
        title="Today's P&L"
        value={
          loading ? (
            "--"
          ) : (
            <span
              className={
                todayPnl > 0
                  ? "text-emerald-600"
                  : todayPnl < 0
                  ? "text-rose-600"
                  : "text-slate-900"
              }
            >
              {formatPnlINR(todayPnl)}
            </span>
          )
        }
        subtitle="Daily change"
        badge={
          !loading && (
            <PnlBadge
              value={todayPnl}
              percent={todayPnlPercent}
              isPercentOnly
              size="sm"
            />
          )
        }
        icon={Clock}
        iconBg={
          todayPnl >= 0 ? "rgba(5, 150, 105, 0.08)" : "rgba(225, 29, 72, 0.08)"
        }
        iconColor={todayPnl >= 0 ? "#059669" : "#e11d48"}
        loading={loading}
      />

      {/* 4. Overall P&L */}
      <StatCard
        title="Overall P&L"
        value={
          loading ? (
            "--"
          ) : (
            <span
              className={
                overallPnl > 0
                  ? "text-emerald-600"
                  : overallPnl < 0
                  ? "text-rose-600"
                  : "text-slate-900"
              }
            >
              {formatPnlINR(overallPnl)}
            </span>
          )
        }
        subtitle="Total return"
        badge={
          !loading && (
            <PnlBadge
              value={overallPnl}
              percent={overallPnlPercent}
              isPercentOnly
              size="sm"
            />
          )
        }
        icon={overallPnl >= 0 ? TrendingUp : TrendingDown}
        iconBg={
          overallPnl >= 0
            ? "rgba(5, 150, 105, 0.08)"
            : "rgba(225, 29, 72, 0.08)"
        }
        iconColor={overallPnl >= 0 ? "#059669" : "#e11d48"}
        loading={loading}
      />
    </div>
  );
}