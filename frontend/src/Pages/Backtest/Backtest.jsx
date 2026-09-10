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


// ======================================================
// STRATEGY CONFIGURATION
// ======================================================

const STRATEGIES = {

  SMA_CROSSOVER: {
    label: "SMA Crossover",
    description:
      "Buy when the fast SMA crosses above the slow SMA. Sell when the fast SMA crosses below the slow SMA.",

    fields: [
      {
        name: "fast_period",
        label: "Fast SMA Period",
        defaultValue: 20,
        min: 2,
        max: 200,
      },
      {
        name: "slow_period",
        label: "Slow SMA Period",
        defaultValue: 50,
        min: 3,
        max: 500,
      },
    ],
  },


  EMA_CROSSOVER: {
    label: "EMA Crossover",
    description:
      "Buy when the fast EMA crosses above the slow EMA. Sell when the fast EMA crosses below the slow EMA.",

    fields: [
      {
        name: "fast_period",
        label: "Fast EMA Period",
        defaultValue: 20,
        min: 2,
        max: 200,
      },
      {
        name: "slow_period",
        label: "Slow EMA Period",
        defaultValue: 50,
        min: 3,
        max: 500,
      },
    ],
  },


  SMA_EMA_TREND: {
    label: "SMA + EMA Trend",
    description:
      "Buy when price is above the fast EMA and fast EMA is above the slow SMA. Sell when the trend turns bearish.",

    fields: [
      {
        name: "fast_period",
        label: "Fast EMA Period",
        defaultValue: 20,
        min: 2,
        max: 200,
      },
      {
        name: "slow_period",
        label: "Slow SMA Period",
        defaultValue: 50,
        min: 3,
        max: 500,
      },
    ],
  },


  RSI: {
    label: "RSI",
    description:
      "Buy when RSI reaches the oversold level and sell when RSI reaches the overbought level.",

    fields: [
      {
        name: "period",
        label: "RSI Period",
        defaultValue: 14,
        min: 2,
        max: 100,
      },
      {
        name: "oversold",
        label: "Oversold",
        defaultValue: 30,
        min: 1,
        max: 49,
      },
      {
        name: "overbought",
        label: "Overbought",
        defaultValue: 70,
        min: 51,
        max: 99,
      },
    ],
  },


  MACD: {
    label: "MACD",
    description:
      "Buy when MACD crosses above the signal line and sell when MACD crosses below the signal line.",

    fields: [
      {
        name: "fast_period",
        label: "Fast EMA",
        defaultValue: 12,
        min: 2,
        max: 100,
      },
      {
        name: "slow_period",
        label: "Slow EMA",
        defaultValue: 26,
        min: 3,
        max: 200,
      },
      {
        name: "signal_period",
        label: "Signal Period",
        defaultValue: 9,
        min: 2,
        max: 100,
      },
    ],
  },


  BOLLINGER_BANDS: {
    label: "Bollinger Bands",
    description:
      "Buy near the lower Bollinger Band and sell near the upper Bollinger Band.",

    fields: [
      {
        name: "period",
        label: "Period",
        defaultValue: 20,
        min: 2,
        max: 200,
      },
      {
        name: "std_deviation",
        label: "Standard Deviation",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.5,
      },
    ],
  },


  VWAP_EMA: {
    label: "VWAP + EMA",
    description:
      "Buy when price crosses above VWAP and is above EMA. Sell when price crosses below VWAP and is below EMA.",

    fields: [
      {
        name: "ema_period",
        label: "EMA Period",
        defaultValue: 20,
        min: 2,
        max: 200,
      },
    ],
  },


  SUPERTREND: {
    label: "Supertrend",
    description:
      "Buy when price crosses above the Supertrend line (trend turns bullish). Sell when price crosses below the Supertrend line (trend turns bearish).",

    fields: [
      {
        name: "period",
        label: "ATR Period",
        defaultValue: 10,
        min: 2,
        max: 100,
      },
      {
        name: "multiplier",
        label: "Multiplier",
        defaultValue: 3,
        min: 0.5,
        max: 10,
        step: 0.5,
      },
    ],
  },

};


// ======================================================
// BACKTEST PAGE
// ======================================================

export default function Backtest() {

  const location = useLocation();

  const selectedStrategy =
    location.state?.strategy;


  // ====================================================
  // STATE
  // ====================================================

  const [symbol, setSymbol] =
    useState("TCS.NS");

  const [strategyType, setStrategyType] =
    useState("SMA_CROSSOVER");

  const [parameters, setParameters] =
    useState({
      fast_period: 20,
      slow_period: 50,
    });

  const [initialCash, setInitialCash] =
    useState(100000);

  const [stopLoss, setStopLoss] =
    useState(2);

  const [riskReward, setRiskReward] =
    useState(2);

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ====================================================
  // LOAD SAVED STRATEGY
  // ====================================================

  useEffect(() => {

    if (!selectedStrategy) {
      return;
    }


    // Symbol

    setSymbol(
      selectedStrategy.symbol ||
      "TCS.NS"
    );


    // Strategy Type

    const type =
      selectedStrategy.strategy_type ||
      "SMA_CROSSOVER";

    setStrategyType(type);


    // Parameters

    if (
      selectedStrategy.parameters
    ) {

      setParameters(
        selectedStrategy.parameters
      );

    } else {

      setDefaultParameters(type);

    }


    // Risk Management

    setStopLoss(
      selectedStrategy.stop_loss_percent ??
      2
    );

    setRiskReward(
      selectedStrategy.risk_reward_ratio ??
      2
    );

  }, [selectedStrategy]);


  // ====================================================
  // DEFAULT PARAMETERS
  // ====================================================

  function setDefaultParameters(
    type
  ) {

    const strategy =
      STRATEGIES[type];

    if (!strategy) {
      return;
    }


    const defaults = {};

    strategy.fields.forEach(
      (field) => {

        defaults[
          field.name
        ] =
          field.defaultValue;

      }
    );


    setParameters(defaults);
  }


  // ====================================================
  // STRATEGY CHANGE
  // ====================================================

  function handleStrategyChange(
    event
  ) {

    const type =
      event.target.value;

    setStrategyType(type);

    setDefaultParameters(type);

    setResult(null);

    setError("");
  }


  // ====================================================
  // PARAMETER CHANGE
  // ====================================================

  function handleParameterChange(
    name,
    value
  ) {

    setParameters(
      (current) => ({
        ...current,

        [name]:
          value,
      })
    );
  }


  // ====================================================
  // RUN BACKTEST
  // ====================================================

  async function handleBacktest() {

    setError("");
    setResult(null);


    // --------------------------------------------
    // Symbol validation
    // --------------------------------------------

    if (!symbol.trim()) {

      setError(
        "Enter a stock symbol."
      );

      return;
    }


    // --------------------------------------------
    // Convert parameters to numbers
    // --------------------------------------------

    const numericParameters =
      Object.fromEntries(
        Object.entries(
          parameters
        ).map(
          ([key, value]) => [
            key,
            Number(value),
          ]
        )
      );


    // --------------------------------------------
    // SMA / EMA validation
    // --------------------------------------------

    if (
      numericParameters.fast_period !==
        undefined
      &&
      numericParameters.slow_period !==
        undefined
    ) {

      if (
        numericParameters.fast_period >=
        numericParameters.slow_period
      ) {

        setError(
          "Fast period must be smaller than slow period."
        );

        return;
      }
    }


    // --------------------------------------------
    // RSI validation
    // --------------------------------------------

    if (
      strategyType === "RSI"
    ) {

      if (
        numericParameters.oversold >=
        numericParameters.overbought
      ) {

        setError(
          "Oversold level must be smaller than overbought level."
        );

        return;
      }
    }


    // --------------------------------------------
    // MACD validation
    // --------------------------------------------

    if (
      strategyType === "MACD"
    ) {

      if (
        numericParameters.fast_period >=
        numericParameters.slow_period
      ) {

        setError(
          "MACD fast period must be smaller than slow period."
        );

        return;
      }
    }


    // --------------------------------------------
    // Capital
    // --------------------------------------------

    if (
      Number(initialCash) <= 0
    ) {

      setError(
        "Initial capital must be greater than 0."
      );

      return;
    }


    try {

      setLoading(true);


      const data =
        await runBacktest({

          symbol:
            symbol
              .trim()
              .toUpperCase(),

          strategyType:
            strategyType,

          parameters:
            numericParameters,

          initialCash:
            Number(initialCash),

          stopLossPercent:
            Number(stopLoss),

          riskRewardRatio:
            Number(riskReward),

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


  // ====================================================
  // CURRENT STRATEGY
  // ====================================================

  const currentStrategy =
    STRATEGIES[
      strategyType
    ];


  // ====================================================
  // UI
  // ====================================================

  return (

    <div className="space-y-8">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div>

        <h1 className="text-3xl font-bold text-white">
          Backtesting
        </h1>

        <p className="text-slate-400 mt-2">
          Test your trading strategy against historical
          market data
        </p>

      </div>


      {/* ================================================= */}
      {/* SAVED STRATEGY */}
      {/* ================================================= */}

      {selectedStrategy && (

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">

          <p className="text-sm text-slate-400">
            Running saved strategy
          </p>

          <p className="text-white font-semibold mt-1">

            {selectedStrategy.name}

          </p>

          <p className="text-sm text-slate-400 mt-1">

            {selectedStrategy.symbol}

            {" • "}

            {selectedStrategy.strategy_type}

          </p>

        </div>

      )}


      {/* ================================================= */}
      {/* CONFIGURATION */}
      {/* ================================================= */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold text-white mb-6">
          Backtest Configuration
        </h2>


        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">


          {/* SYMBOL */}

          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Stock / Index Symbol
            </label>

            <input
              value={symbol}
              onChange={(e) =>
                setSymbol(
                  e.target.value
                    .toUpperCase()
                )
              }
              placeholder="TCS.NS"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />

          </div>


          {/* STRATEGY */}

          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Strategy Type
            </label>

            <select
              value={strategyType}
              onChange={
                handleStrategyChange
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            >

              {Object.entries(
                STRATEGIES
              ).map(
                ([
                  value,
                  strategy,
                ]) => (

                  <option
                    key={value}
                    value={value}
                  >
                    {strategy.label}
                  </option>

                )
              )}

            </select>

          </div>


          {/* INITIAL CAPITAL */}

          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Initial Capital
            </label>

            <input
              type="number"
              min="1000"
              value={initialCash}
              onChange={(e) =>
                setInitialCash(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />

          </div>


          {/* ================================================= */}
          {/* DYNAMIC PARAMETERS */}
          {/* ================================================= */}

          {currentStrategy?.fields.map(
            (field) => (

              <div
                key={field.name}
              >

                <label className="block text-sm text-slate-400 mb-2">

                  {field.label}

                </label>

                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={
                    field.step || 1
                  }
                  value={
                    parameters[
                      field.name
                    ] ?? ""
                  }
                  onChange={(e) =>
                    handleParameterChange(
                      field.name,
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

            )
          )}


          {/* STOP LOSS */}

          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Stop Loss %
            </label>

            <input
              type="number"
              min="0"
              step="0.5"
              value={stopLoss}
              onChange={(e) =>
                setStopLoss(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />

          </div>


          {/* RISK REWARD */}

          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Risk : Reward
            </label>

            <input
              type="number"
              min="0.5"
              step="0.5"
              value={riskReward}
              onChange={(e) =>
                setRiskReward(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />

          </div>


        </div>


        {/* ================================================= */}
        {/* STRATEGY DESCRIPTION */}
        {/* ================================================= */}

        {currentStrategy && (

          <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4">

            <p className="text-sm text-slate-300">

              <span className="font-semibold text-white">

                {currentStrategy.label}:

              </span>

              {" "}

              {currentStrategy.description}

            </p>

          </div>

        )}


        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (

          <div className="mt-5 bg-red-500/10 border border-red-500/20 rounded-lg p-4">

            <p className="text-sm text-red-400">
              {error}
            </p>

          </div>

        )}


        {/* ================================================= */}
        {/* RUN BUTTON */}
        {/* ================================================= */}

        <button
          onClick={
            handleBacktest
          }
          disabled={loading}
          className="mt-6 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >

          {loading
            ? "Running Backtest..."
            : "▶ Run Backtest"}

        </button>


      </div>


      {/* ================================================= */}
      {/* RESULTS */}
      {/* ================================================= */}

      {result && (

        <>

          {/* RESULT CARDS */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            <ResultCard
              title="Initial Capital"
              value={`₹${Number(
                result.initial_cash
              ).toFixed(2)}`}
            />

            <ResultCard
              title="Final Capital"
              value={`₹${Number(
                result.final_cash
              ).toFixed(2)}`}
            />

            <ResultCard
              title="Total Return"
              value={`${
                result.total_return >=
                0
                  ? "+"
                  : ""
              }${Number(
                result.total_return
              ).toFixed(2)}%`}
              valueClass={
                result.total_return >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }
            />

            <ResultCard
              title="Total Trades"
              value={
                result.total_trades
              }
            />

          </div>


          {/* PERFORMANCE */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">

            <ResultCard
              title="Winning Trades"
              value={
                result.winning_trades
              }
              valueClass="text-green-400"
            />

            <ResultCard
              title="Losing Trades"
              value={
                result.losing_trades
              }
              valueClass="text-red-400"
            />

            <ResultCard
              title="Win Rate"
              value={`${Number(
                result.win_rate
              ).toFixed(2)}%`}
            />

            <ResultCard
              title="Profit Factor"
              value={
                result.profit_factor ===
                null
                  ? "∞"
                  : Number(
                      result.profit_factor
                    ).toFixed(2)
              }
            />

            <ResultCard
              title="Max Drawdown"
              value={`-${Number(
                result.max_drawdown
              ).toFixed(2)}%`}
              valueClass="text-red-400"
            />

          </div>


          {/* ================================================= */}
          {/* EQUITY CURVE */}
          {/* ================================================= */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold text-white">
              Equity Curve
            </h2>

            <p className="text-sm text-slate-400 mt-1 mb-6">
              Portfolio value throughout the backtest
            </p>

            <div className="h-80">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    result.equity_curve
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
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
                      borderRadius:
                        "10px",
                      color: "#fff",
                    }}
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


          {/* ================================================= */}
          {/* DRAWDOWN */}
          {/* ================================================= */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold text-white">
              Drawdown Curve
            </h2>

            <p className="text-sm text-slate-400 mt-1 mb-6">
              Percentage decline from the previous portfolio peak
            </p>

            <div className="h-80">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    result.equity_curve
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                  />

                  <YAxis
                    stroke="#64748b"
                    tickFormatter={
                      (value) =>
                        `${value}%`
                    }
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        "#0f172a",
                      border:
                        "1px solid #1e293b",
                      borderRadius:
                        "10px",
                      color: "#fff",
                    }}
                    formatter={
                      (value) =>
                        `${Number(
                          value
                        ).toFixed(2)}%`
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


          {/* ================================================= */}
          {/* TRADE HISTORY */}
          {/* ================================================= */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold text-white mb-6">
              Trade History
            </h2>


            {!result.trades ||
            result.trades.length === 0 ? (

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

                      <th className="pb-3">
                        P&L
                      </th>

                      <th className="pb-3">
                        Reason
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {result.trades.map(
                      (
                        trade,
                        index
                      ) => (

                        <tr
                          key={index}
                          className="border-b border-slate-800/60 text-sm"
                        >

                          <td className="py-4 text-slate-300">
                            {trade.date}
                          </td>

                          <td
                            className={`py-4 font-semibold ${
                              trade.side ===
                              "BUY"
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

                          <td className="py-4">

                            {trade.pnl !==
                            undefined ? (

                              <span
                                className={
                                  trade.pnl >=
                                  0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                ₹
                                {Number(
                                  trade.pnl
                                ).toFixed(
                                  2
                                )}
                              </span>

                            ) : (

                              "-"

                            )}

                          </td>

                          <td className="py-4 text-slate-400">
                            {trade.reason ||
                              "-"}
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


// ======================================================
// RESULT CARD
// ======================================================

function ResultCard({
  title,
  value,
  valueClass = "text-white",
}) {

  return (

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <h2
        className={`text-2xl font-bold mt-3 ${valueClass}`}
      >
        {value}
      </h2>

    </div>

  );
}