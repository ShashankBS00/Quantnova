import { TrendingUp } from "lucide-react";

export default function StatsCard({
  title,
  value,
  change,
  positive = true,
  icon: Icon = TrendingUp,
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500 transition-all duration-300">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-white mt-2">
            {value}
          </h2>

          <span
            className={`inline-block mt-3 text-sm font-semibold ${
              positive ? "text-green-400" : "text-red-400"
            }`}
          >
            {change}
          </span>

        </div>

        <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center">

          <Icon className="text-white" size={28} />

        </div>

      </div>

    </div>
  );
}