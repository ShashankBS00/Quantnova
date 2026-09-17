import { useEffect, useState } from "react";
import { RefreshCw, WalletCards } from "lucide-react";

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
      const portfolioHoldings = await getPortfolioHoldings();
      setHoldings(portfolioHoldings);

      const results = await Promise.all(
        portfolioHoldings.map((stock) => getCurrentMarketData(stock.symbol))
      );

      const dataMap = {};
      results.forEach((item) => {
        dataMap[item.symbol] = item;
      });
      setMarketData(dataMap);
    } catch (error) {
      console.error("Failed to refresh portfolio:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshPortfolio();
    const interval = setInterval(refreshPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-10 animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em]"
            style={{
              background: "rgba(79, 70, 229, 0.08)",
              border: "1px solid rgba(79, 70, 229, 0.16)",
              color: "var(--qn-indigo)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <WalletCards size={12} strokeWidth={2.2} />
            PAPER PORTFOLIO
          </div>
          <h1
            className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{
              color: "var(--qn-text-1)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Your portfolio, at a glance.
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--qn-text-2)" }}>
            Monitor positions, performance, and allocation using live market data.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshPortfolio}
          disabled={loading}
          className="qn-btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-55"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing" : "Refresh data"}
        </button>
      </header>

      <PortfolioSummary holdings={holdings} marketData={marketData} loading={loading} />
      <HoldingsTable holdings={holdings} marketData={marketData} loading={loading} />
      <PortfolioAllocation holdings={holdings} marketData={marketData} loading={loading} />
    </div>
  );
}
