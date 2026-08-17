import { useEffect, useState } from "react";
import PortfolioSummary from "./PortfolioSummary";
import HoldingsTable from "./HoldingsTable";
import { holdings } from "@/data/portfolioData";
import { getCurrentMarketData } from "@/services/portfolioService";
import PortfolioAllocation from "./PortfolioAllocation";

export default function Portfolio() {
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolioData() {
      try {
        const results = await Promise.all(
          holdings.map((stock) =>
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
          "Failed to load portfolio data:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadPortfolioData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Portfolio
        </h1>

        <p className="text-slate-400 mt-2">
          Track your investments and performance
        </p>
      </div>

      <PortfolioSummary
        marketData={marketData}
        loading={loading}
      />

      <HoldingsTable
        marketData={marketData}
        loading={loading}
      />
      <PortfolioAllocation
  marketData={marketData}
  loading={loading}
/>
    </div>
  );
}