import { useEffect, useState } from "react";
import { getTradingAnalytics } from "@/services/tradingAnalyticsService";
import EquityCurve from "./EquityCurve";
import { 
  BarChart3, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";

export default function TradingAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const data = await getTradingAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load trading analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();

    const interval = setInterval(() => {
      loadAnalytics();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs">
        <RefreshCw size={16} className="animate-spin mr-2 text-amber-500" />
        Loading telemetry and performance analytics...
      </div>
    );
  }

  const pnl = analytics?.realizedPnl ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-12 select-none">
      
      {/* Header */}
      <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1 text-amber-500 font-mono text-xs font-semibold uppercase tracking-wider">
            <BarChart3 size={14} /> Telemetry & Execution
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Trading Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time fill diagnostics, win-rate ratios, and paper account drawdowns.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#0a0b0e] border border-[#1f232d] hover:border-amber-500/50 text-slate-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-amber-500" : "text-amber-500"} />
          <span>{loading ? "Refreshing..." : "Refresh Feed"}</span>
        </button>
      </div>

      {/* Main Stats (4 KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Total Trades */}
        <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Trades
            </span>
            <Layers size={14} className="text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold font-mono text-white mt-2">
            {analytics?.totalTrades ?? 0}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            All routed orders
          </p>
        </div>

        {/* Win Rate */}
        <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Win Rate
            </span>
            <Target size={14} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold font-mono text-amber-500 mt-2">
            {(analytics?.winRate ?? 0).toFixed(2)}%
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Completed sell trades
          </p>
        </div>

        {/* Realized P&L */}
        <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Realized P&L
            </span>
            {pnl >= 0 ? (
              <TrendingUp size={14} className="text-emerald-400" />
            ) : (
              <TrendingDown size={14} className="text-rose-400" />
            )}
          </div>
          <h2
            className={`text-2xl font-bold font-mono mt-2 ${
              pnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {pnl >= 0 ? "+" : "-"}₹{Math.abs(pnl).toFixed(2)}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Closed positions return
          </p>
        </div>

        {/* Winning Trades */}
        <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Winning Trades
            </span>
            <ArrowUpRight size={14} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {analytics?.winningTrades ?? 0}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Profitable closed orders
          </p>
        </div>

      </div>

      {/* Trade Performance Secondary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Losing Trades */}
        <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Losing Trades
          </span>
          <h2 className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {analytics?.losingTrades ?? 0}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Unprofitable trades
          </p>
        </div>

        {/* Best Trade */}
        <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Best Trade Fill
          </span>
          <h2 className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {analytics?.bestTrade !== null && analytics?.bestTrade !== undefined
              ? `+₹${Math.abs(analytics.bestTrade).toFixed(2)}`
              : "--"}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Highest realized profit
          </p>
        </div>

        {/* Worst Trade */}
        <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Worst Trade Drawdown
          </span>
          <h2 className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {analytics?.worstTrade !== null && analytics?.worstTrade !== undefined
              ? `${analytics.worstTrade >= 0 ? "+" : "-"}₹${Math.abs(analytics.worstTrade).toFixed(2)}`
              : "--"}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Lowest realized result
          </p>
        </div>

      </div>

      {/* Buy / Sell Order Balance Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Buy Orders */}
        <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Buy Orders Dispatched
            </span>
            <h2 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {analytics?.buyOrders ?? 0}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#0b1a13] text-emerald-400 border border-[#143828]">
            BUY SIDE
          </span>
        </div>

        {/* Sell Orders */}
        <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Sell Orders Dispatched
            </span>
            <h2 className="text-2xl font-bold font-mono text-rose-400 mt-1">
              {analytics?.sellOrders ?? 0}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#240e14] text-rose-400 border border-[#4d1b28]">
            SELL SIDE
          </span>
        </div>

      </div>

      {/* Equity Curve Component */}
      <EquityCurve data={analytics?.equityHistory || []} />

      {/* Order Activity Section */}
      <div className="bg-[#12141a] border border-[#1f232d] rounded-2xl p-5 shadow-xl">
        
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1f232d]">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Order Activity & Executions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Recent paper-trading fills with simulated exchange routing
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-[#0a0b0e] px-2.5 py-1 rounded border border-[#1f232d]">
            NSE Simulator
          </span>
        </div>

        {analytics?.orders?.length === 0 ? (
          <div className="text-slate-500 py-10 text-center font-mono text-xs">
            No executed orders recorded in this session.
          </div>
        ) : (
          <div className="space-y-2.5">
            {analytics?.orders?.map((order, index) => {
              const isBuy = order.side === "BUY";
              const realizedPnl = Number(order.realized_pnl ?? 0);
              const isPnlPositive = realizedPnl >= 0;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-[#0a0b0e] border border-[#1f232d] hover:border-amber-500/30 rounded-xl px-4 py-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">
                        {order.symbol}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isBuy
                            ? "bg-[#0b1a13] text-emerald-400 border border-[#143828]"
                            : "bg-[#240e14] text-rose-400 border border-[#4d1b28]"
                        }`}
                      >
                        {order.side}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {order.quantity} qty × ₹{Number(order.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                      {order.status || "FILLED"}
                    </span>

                    {order.side === "SELL" && order.realized_pnl !== undefined && (
                      <span
                        className={`text-xs font-bold block mt-0.5 ${
                          isPnlPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        P&L: {isPnlPositive ? "+" : "-"}₹{Math.abs(realizedPnl).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}