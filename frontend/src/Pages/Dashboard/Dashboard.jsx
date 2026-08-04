import StatsCard from "@/components/dashboard/StatsCard";
import MarketChart from "@/components/dashboard/MarketChart";
import { stats } from "@/data/dashboardData";
import MarketStatus from "@/components/market/MarketStatus";

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Dashboard
        </h1>

        <p className="text-slate-400 mt-2">
          Welcome back 👋
        </p>
      </div>
      <div className="mt-8">
  <MarketStatus />
</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => (
          <StatsCard key={item.title} {...item} />
        ))}
      </div>
      <div className="mt-8">
  <MarketChart />
</div>
    </div>
  );
}