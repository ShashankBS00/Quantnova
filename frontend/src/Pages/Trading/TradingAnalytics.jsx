import { useEffect, useState } from "react";
import { getTradingAnalytics } from "@/services/tradingAnalyticsService";
import EquityCurve from "./EquityCurve";

export default function TradingAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    try {
      setLoading(true);

      const data = await getTradingAnalytics(); 

      setAnalytics(data);
    } catch (error) {
      console.error(
        "Failed to load trading analytics:",
        error
      );
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
      <div className="text-slate-400">
        Loading trading analytics...
      </div>
    );
  }

  const pnl = analytics?.realizedPnl ?? 0;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Trading Analytics
        </h1>

        <p className="text-slate-400 mt-2">
          Analyze your paper-trading performance
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Total Trades */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            Total Trades
          </p>

          <h2 className="text-3xl font-bold text-white mt-3">
            {analytics?.totalTrades ?? 0}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            All orders
          </p>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            Win Rate
          </p>

          <h2 className="text-3xl font-bold text-blue-400 mt-3">
            {(analytics?.winRate ?? 0).toFixed(2)}%
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Completed sell trades
          </p>
        </div>

        {/* Realized P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            Realized P&L
          </p>

          <h2
            className={`text-3xl font-bold mt-3 ${
              pnl >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {pnl >= 0 ? "+" : "-"}₹
            {Math.abs(pnl).toFixed(2)}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Closed trades
          </p>
        </div>

        {/* Winning Trades */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            Winning Trades
          </p>

          <h2 className="text-3xl font-bold text-green-400 mt-3">
            {analytics?.winningTrades ?? 0}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Profitable trades
          </p>
        </div>

      </div>

      {/* Trade Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Losing Trades */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            Losing Trades
          </p>

          <h2 className="text-3xl font-bold text-red-400 mt-3">
            {analytics?.losingTrades ?? 0}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Unprofitable trades
          </p>
        </div>

        {/* Best Trade */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            Best Trade
          </p>

          <h2 className="text-3xl font-bold text-green-400 mt-3">
            {analytics?.bestTrade !== null &&
            analytics?.bestTrade !== undefined
              ? `+₹${Math.abs(
                  analytics.bestTrade
                ).toFixed(2)}`
              : "--"}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Highest realized profit
          </p>
        </div>

        {/* Worst Trade */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            Worst Trade
          </p>

          <h2 className="text-3xl font-bold text-red-400 mt-3">
            {analytics?.worstTrade !== null &&
            analytics?.worstTrade !== undefined
              ? `${analytics.worstTrade >= 0 ? "+" : "-"}₹${Math.abs(
                  analytics.worstTrade
                ).toFixed(2)}`
              : "--"}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Lowest realized result
          </p>
        </div>

      </div>

      {/* Buy / Sell Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Buy Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            Buy Orders
          </p>

          <h2 className="text-3xl font-bold text-green-400 mt-3">
            {analytics?.buyOrders ?? 0}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Total BUY orders
          </p>
        </div>

        {/* Sell Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            Sell Orders
          </p>

          <h2 className="text-3xl font-bold text-red-400 mt-3">
            {analytics?.sellOrders ?? 0}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Total SELL orders
          </p>
        </div>

      </div>
      {/* Equity Curve */}
<EquityCurve
  data={analytics?.equityHistory || []}
/>

      {/* Order Activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-xl font-semibold text-white">
              Order Activity
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Your recent paper-trading orders
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
          >
            {loading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>

        {analytics?.orders?.length === 0 ? (
          <p className="text-slate-500 py-6 text-center">
            No trades yet.
          </p>
        ) : (
          <div className="space-y-3">

            {analytics?.orders?.map(
              (order, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-4"
                >

                  <div>
                    <p className="text-white font-medium">
                      {order.symbol}
                    </p>

                    <p className="text-sm text-slate-400">
                      {order.quantity} × ₹
                      {Number(order.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right">

                    <p
                      className={
                        order.side === "BUY"
                          ? "text-green-400 font-semibold"
                          : "text-red-400 font-semibold"
                      }
                    >
                      {order.side}
                    </p>

                    <p className="text-xs text-slate-400">
                      {order.status}
                    </p>

                    {order.side === "SELL" && (
                      <p
                        className={`text-xs mt-1 ${
                          Number(
                            order.realized_pnl
                          ) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        P&L:{" "}
                        {Number(
                          order.realized_pnl
                        ) >= 0
                          ? "+"
                          : "-"}
                        ₹
                        {Math.abs(
                          Number(
                            order.realized_pnl
                          )
                        ).toFixed(2)}
                      </p>
                    )}

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}