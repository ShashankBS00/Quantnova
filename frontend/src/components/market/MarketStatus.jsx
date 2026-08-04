import { TrendingUp, Clock } from "lucide-react";
import { marketData } from "@/mock/marketData";

export default function MarketStatus() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-green-400 font-semibold">
              Market {marketData.status}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white">
            {marketData.index}
          </h2>

          <p className="text-3xl font-bold text-white mt-2">
            ₹{marketData.price}
          </p>

          <p className="flex items-center gap-2 mt-2 text-green-400 font-medium">
            <TrendingUp size={18} />
            {marketData.change} ({marketData.changePercent})
          </p>
        </div>

        <div className="text-right">
          <Clock className="ml-auto text-slate-400" size={20} />
          <p className="text-sm text-slate-400 mt-2">Last Updated</p>
          <p className="text-white font-medium">
            {marketData.lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
}