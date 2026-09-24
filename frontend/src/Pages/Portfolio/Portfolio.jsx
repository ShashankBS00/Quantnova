import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, WalletCards, ArrowUpRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import PortfolioSummary from "./PortfolioSummary";
import HoldingsTable from "./HoldingsTable";
import PortfolioAllocation from "./PortfolioAllocation";
import PageHeader from "@/components/common/PageHeader";

import { getPortfolioHoldings } from "@/services/portfolioAccountService";
import { getCurrentMarketData } from "@/services/portfolioService";

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshPortfolio = useCallback(async () => {
    setLoading(true);

    try {
      const portfolioHoldings = await getPortfolioHoldings();
      setHoldings(portfolioHoldings);

      const results = await Promise.allSettled(
        portfolioHoldings.map((stock) => getCurrentMarketData(stock.symbol))
      );

      const dataMap = {};
      results.forEach((item) => {
        if (item.status === "fulfilled" && item.value) {
          dataMap[item.value.symbol] = item.value;
        }
      });
      setMarketData(dataMap);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to refresh portfolio:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPortfolio();
    const interval = setInterval(refreshPortfolio, 30000);
    return () => clearInterval(interval);
  }, [refreshPortfolio]);

  return (
    <div className="space-y-6 pb-12 animate-fade-up">
      {/* Header */}
      <PageHeader
        badge="PAPER PORTFOLIO"
        badgeIcon={WalletCards}
        title="Portfolio Overview"
        description="Track your positions, performance and allocation using live market data."
        actions={
          <>
            {lastUpdated && (
              <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={refreshPortfolio}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold bg-white border border-slate-200/80 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin text-indigo-600" : "text-slate-500"}
              />
              <span>{loading ? "Refreshing..." : "Refresh data"}</span>
            </button>
            <Link
              to="/trading"
              className="qn-btn-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold"
            >
              <TrendingUp size={14} />
              <span>New Trade</span>
            </Link>
          </>
        }
      />

      {/* KPI Cards */}
      <PortfolioSummary
        holdings={holdings}
        marketData={marketData}
        loading={loading}
      />

      {/* Holdings Table */}
      <HoldingsTable
        holdings={holdings}
        marketData={marketData}
        loading={loading}
      />

      {/* Portfolio Allocation */}
      <PortfolioAllocation
        holdings={holdings}
        marketData={marketData}
        loading={loading}
      />
    </div>
  );
}
