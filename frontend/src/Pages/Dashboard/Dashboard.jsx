import StatsCard from "@/components/dashboard/StatsCard";
import MarketChart from "@/components/dashboard/MarketChart";
import { stats } from "@/data/dashboardData";
import MarketStatus from "@/components/market/MarketStatus";
import Watchlist from "@/components/market/Watchlist";
import PredictionCard from "@/components/prediction/PredictionCard";

export default function Dashboard() {
return (
  <div>
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white">
        Dashboard
      </h1>

      <p className="text-slate-400 mt-2">
        Welcome back 👋
      </p>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((item) => (
        <StatsCard key={item.title} {...item} />
      ))}
    </div>

    {/* Market Status */}
    <div className="mt-8">
      <MarketStatus />
    </div>

    {/* Candlestick Chart */}
    <div className="mt-8">
      <MarketChart />
    </div>

    {/* Watchlist + AI */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <Watchlist />
      <PredictionCard />
    </div>
  </div>
);
}