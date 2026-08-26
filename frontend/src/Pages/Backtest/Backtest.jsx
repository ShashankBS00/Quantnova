import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { runBacktest } from "@/services/backtestService";

export default function Backtest() {
  const [symbol, setSymbol] = useState("TCS.NS");
  const [fastPeriod, setFastPeriod] = useState(20);
  const [slowPeriod, setSlowPeriod] = useState(50);
  const [initialCash, setInitialCash] = useState(100000);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();

const selectedStrategy =
  location.state?.strategy;
  

  useEffect(() => {
  if (!selectedStrategy) {
    return;
  }

  setSymbol(selectedStrategy.symbol);

  setFastPeriod(
    selectedStrategy.fast_period
  );

  setSlowPeriod(
    selectedStrategy.slow_period
  );
}, [selectedStrategy]);






  async function handleBacktest() {
    setError("");
    setResult(null);

    if (!symbol.trim()) {
      setError("Enter a stock symbol.");
      return;
    }

    if (Number(fastPeriod) >= Number(slowPeriod)) {
      setError(
        "Fast period must be smaller than slow period."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await runBacktest({
  symbol: symbol.toUpperCase(),
  strategyType:
    selectedStrategy?.strategy_type ||
    "SMA_CROSSOVER",
  fastPeriod,
  slowPeriod,
  initialCash,
});

      setResult(data);
    } catch (error) {
      console.error(
        "Backtest failed:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to run backtest."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Backtesting
        </h1>

        <p className="text-slate-400 mt-2">
          Test your trading strategy against historical
          market data
        </p>
      </div>
      

      {selectedStrategy && (
  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
    <p className="text-sm text-slate-400">
      Running strategy
    </p>

    <p className="text-white font-semibold mt-1">
      {selectedStrategy.name}
    </p>

    <p className="text-sm text-slate-400 mt-1">
      {selectedStrategy.symbol} •{" "}
      {selectedStrategy.strategy_type}
    </p>
  </div>
)}

      {/* Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold text-white mb-6">
          Backtest Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* Symbol */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Stock Symbol
            </label>

            <input
              value={symbol}
              onChange={(e) =>
                setSymbol(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="TCS.NS"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Fast */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Fast SMA
            </label>

            <input
              type="number"
              min="2"
              value={fastPeriod}
              onChange={(e) =>
                setFastPeriod(e.target.value)
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Slow */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Slow SMA
            </label>

            <input
              type="number"
              min="3"
              value={slowPeriod}
              onChange={(e) =>
                setSlowPeriod(e.target.value)
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Capital */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Initial Capital
            </label>

            <input
              type="number"
              min="1000"
              value={initialCash}
              onChange={(e) =>
                setInitialCash(e.target.value)
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

        </div>

        {/* Strategy info */}
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-white">
              SMA Crossover:
            </span>{" "}
            Buy when the fast SMA moves above the slow
            SMA and sell when it moves below.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Run */}
        <button
          onClick={handleBacktest}
          disabled={loading}
          className="mt-6 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading
            ? "Running Backtest..."
            : "▶ Run Backtest"}
        </button>

      </div>

      {/* Results */}
      {result && (
        <>
          {/* Result Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-sm text-slate-400">
                Initial Capital
              </p>

              <h2 className="text-2xl font-bold text-white mt-3">
                ₹{Number(
                  result.initial_cash
                ).toFixed(2)}
              </h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-sm text-slate-400">
                Final Capital
              </p>

              <h2 className="text-2xl font-bold text-white mt-3">
                ₹{Number(
                  result.final_cash
                ).toFixed(2)}
              </h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-sm text-slate-400">
                Total Return
              </p>

              <h2
                className={`text-2xl font-bold mt-3 ${
                  result.total_return >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {result.total_return >= 0
                  ? "+"
                  : ""}
                {Number(
                  result.total_return
                ).toFixed(2)}
                %
              </h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-sm text-slate-400">
                Total Trades
              </p>

              <h2 className="text-2xl font-bold text-white mt-3">
                {result.total_trades}
              </h2>
            </div>

          </div>

         {/* Performance Statistics */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">

  {/* Winning Trades */}
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
    <p className="text-sm text-slate-400">
      Winning Trades
    </p>

    <h2 className="text-2xl font-bold text-green-400 mt-3">
      {result.winning_trades}
    </h2>
  </div>

  {/* Losing Trades */}
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
    <p className="text-sm text-slate-400">
      Losing Trades
    </p>

    <h2 className="text-2xl font-bold text-red-400 mt-3">
      {result.losing_trades}
    </h2>
  </div>

  {/* Win Rate */}
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
    <p className="text-sm text-slate-400">
      Win Rate
    </p>

    <h2 className="text-2xl font-bold text-white mt-3">
      {Number(result.win_rate).toFixed(2)}%
    </h2>
  </div>

  {/* Profit Factor */}
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
    <p className="text-sm text-slate-400">
      Profit Factor
    </p>

    <h2 className="text-2xl font-bold text-white mt-3">
      {result.profit_factor === null
        ? "∞"
        : Number(result.profit_factor).toFixed(2)}
    </h2>
  </div>

  {/* Max Drawdown */}
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
    <p className="text-sm text-slate-400">
      Max Drawdown
    </p>

    <h2 className="text-2xl font-bold text-red-400 mt-3">
      -{Number(result.max_drawdown).toFixed(2)}%
    </h2>
  </div>

</div>

          {/* Equity Curve */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                Equity Curve
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Portfolio value throughout the backtest
              </p>
            </div>

            <div className="h-80">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={result.equity_curve}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    stroke="#64748b"
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        "#0f172a",
                      border:
                        "1px solid #1e293b",
                      borderRadius: "10px",
                      color: "#fff",
                    }}
                    formatter={(value) =>
                      `₹${Number(
                        value
                      ).toFixed(2)}`
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>

            </div>
          </div>
          

          {/* Drawdown Curve */}
<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

  <div className="mb-6">
    <h2 className="text-xl font-semibold text-white">
      Drawdown Curve
    </h2>

    <p className="text-sm text-slate-400 mt-1">
      Percentage decline from the previous portfolio peak
    </p>
  </div>

  <div className="h-80">

    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <LineChart
        data={result.equity_curve}
      >

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1e293b"
        />

        <XAxis
          dataKey="date"
          stroke="#64748b"
          tick={{ fontSize: 11 }}
        />

        <YAxis
          stroke="#64748b"
          tickFormatter={(value) =>
            `${value}%`
          }
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "10px",
            color: "#fff",
          }}
          formatter={(value) =>
            `${Number(value).toFixed(2)}%`
          }
        />

        <Line
          type="monotone"
          dataKey="drawdown"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
        />

      </LineChart>
    </ResponsiveContainer>

  </div>

</div>

          


          {/* Trade History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                Trade History
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Trades generated by the strategy
              </p>
            </div>

            {result.trades.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No trades generated.
              </p>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead>
                    <tr className="border-b border-slate-800 text-sm text-slate-400">

                      <th className="pb-3">
                        Date
                      </th>

                      <th className="pb-3">
                        Side
                      </th>

                      <th className="pb-3">
                        Quantity
                      </th>

                      <th className="pb-3">
                        Price
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {result.trades.map(
                      (trade, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-800/60 text-sm"
                        >

                          <td className="py-4 text-slate-300">
                            {trade.date}
                          </td>

                          <td
                            className={`py-4 font-semibold ${
                              trade.side === "BUY"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {trade.side}
                          </td>

                          <td className="py-4 text-slate-300">
                            {trade.quantity}
                          </td>

                          <td className="py-4 text-white">
                            ₹
                            {Number(
                              trade.price
                            ).toFixed(2)}
                          </td>

                        </tr>
                      )
                    )}
                  </tbody>

                </table>

              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}