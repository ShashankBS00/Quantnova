import { useState } from "react";
import { ArrowUpRight, CalendarDays, Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import StatsCard from "@/components/dashboard/StatsCard";
import MarketChart from "@/components/dashboard/MarketChart";
import { stats } from "@/data/dashboardData";
import MarketStatus from "@/components/market/MarketStatus";
import Watchlist from "@/components/market/Watchlist";
import PredictionCard from "@/components/prediction/PredictionCard";


export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE.NS");
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/70 px-6 py-7 shadow-2xl shadow-slate-950/20 sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-80 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15">
                <Sparkles size={15} />
              </span>
              Your trading workspace
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Good to see you, Shashank.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Monitor your portfolio, explore market momentum, and act on your latest AI insights.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-300">
              <CalendarDays size={16} className="text-slate-500" />
              {today}
            </div>
            <Link
              to="/market"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <Plus size={17} />
              Explore market
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Performance</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Portfolio snapshot</h2>
          </div>
          <Link to="/portfolio" className="group hidden items-center gap-1 text-sm font-medium text-slate-400 transition hover:text-white sm:flex">
            View portfolio
            <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatsCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section>
        <MarketStatus />
      </section>

      <section>
        <MarketChart symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Watchlist selectedSymbol={selectedSymbol} onSelectStock={setSelectedSymbol} />
        <PredictionCard />
      </section>
    </div>
  );
}
