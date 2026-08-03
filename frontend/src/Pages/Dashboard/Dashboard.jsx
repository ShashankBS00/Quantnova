import StatsCard from "@/components/dashboard/StatsCard";

import {
  Wallet,
  IndianRupee,
  Target,
  Briefcase,
} from "lucide-react";

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatsCard
          title="Portfolio Value"
          value="₹1,20,450"
          change="+2.45%"
          icon={Wallet}
        />

        <StatsCard
          title="Today's Profit"
          value="₹2,340"
          change="+1.85%"
          icon={IndianRupee}
        />

        <StatsCard
          title="Win Rate"
          value="72%"
          change="+4%"
          icon={Target}
        />

        <StatsCard
          title="Holdings"
          value="12"
          change="+3 Stocks"
          icon={Briefcase}
        />

      </div>

    </div>
  );
}