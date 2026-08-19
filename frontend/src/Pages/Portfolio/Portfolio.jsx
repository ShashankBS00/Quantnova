import { useEffect, useState } from "react";

import PortfolioSummary from "./PortfolioSummary";
import HoldingsTable from "./HoldingsTable";
import PortfolioAllocation from "./PortfolioAllocation";

import { getPortfolioHoldings } from "@/services/portfolioAccountService";
import { getCurrentMarketData } from "@/services/portfolioService";

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);

  async function refreshPortfolio() {
    setLoading(true);

    try {
      // Get holdings from paper trading account
      const portfolioHoldings =
        await getPortfolioHoldings();

      setHoldings(portfolioHoldings);

      // Get current market prices
      const results = await Promise.all(
        portfolioHoldings.map((stock) =>
          getCurrentMarketData(stock.symbol)
        )
      );

      const dataMap = {};

      results.forEach((item) => {
        dataMap[item.symbol] = item;
      });

      setMarketData(dataMap);
    } catch (error) {
      console.error(
        "Failed to refresh portfolio:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // Load portfolio when page opens
useEffect(() => {
  refreshPortfolio();

  const interval = setInterval(() => {
    refreshPortfolio();
  }, 30000);

  return () => {
    clearInterval(interval);
  };
}, []);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Portfolio
          </h1>

          <p className="text-slate-400 mt-2">
            Track your paper-trading investments
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={refreshPortfolio}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* Summary */}
      <PortfolioSummary
        holdings={holdings}
        marketData={marketData}
        loading={loading}
      />

      {/* Holdings */}
      <HoldingsTable
        holdings={holdings}
        marketData={marketData}
        loading={loading}
      />

      {/* Allocation */}
      <PortfolioAllocation
        holdings={holdings}
        marketData={marketData}
        loading={loading}
      />

    </div>
  );
}