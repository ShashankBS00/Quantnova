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


  ADX_EMA: {
    label: "ADX + EMA",
    description:
      "Buy when ADX exceeds the threshold (strong trend) and price crosses above EMA. Sell when ADX exceeds the threshold and price crosses below EMA.",

    fields: [
      {
        name: "adx_period",
        label: "ADX Period",
        defaultValue: 14,
        min: 2,
        max: 100,
      },
      {
        name: "ema_period",
        label: "EMA Period",
        defaultValue: 20,
        min: 2,
        max: 200,
      },
      {
        name: "adx_threshold",
        label: "ADX Threshold",
        defaultValue: 25,
        min: 1,
        max: 100,
      },
    ],
  },

};


// ======================================================
// BACKTEST PAGE
// ======================================================

const TIMEFRAMES = [
  ["1m", "1 Minute"],
  ["3m", "3 Minutes"],
  ["5m", "5 Minutes"],
  ["10m", "10 Minutes"],
  ["15m", "15 Minutes"],
  ["30m", "30 Minutes"],
  ["1h", "1 Hour"],
  ["2h", "2 Hours"],
  ["4h", "4 Hours"],
  ["1d", "1 Day"],
  ["1wk", "1 Week"],
  ["1mo", "1 Month"],
];

export default function Backtest() {
  const location = useLocation();
  const selectedStrategy = location.state?.strategy;

  const [symbol, setSymbol] = useState("TCS.NS");
  const [strategyType, setStrategyType] = useState("SMA_CROSSOVER");
  const [timeframe, setTimeframe] = useState("1d");
  const [parameters, setParameters] = useState({
    fast_period: 20,
    slow_period: 50,
  });
  const [initialCash, setInitialCash] = useState(100000);
  const [stopLoss, setStopLoss] = useState(2);
  const [riskReward, setRiskReward] = useState(2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedStrategy) return;

    setSymbol(selectedStrategy.symbol || "TCS.NS");

    const type = selectedStrategy.strategy_type || "SMA_CROSSOVER";
    setStrategyType(type);

    if (selectedStrategy.parameters) {
      setParameters(selectedStrategy.parameters);
    } else {
      setDefaultParameters(type);
    }

    setTimeframe(selectedStrategy.timeframe || "1d");
    setStopLoss(selectedStrategy.stop_loss_percent ?? 2);
    setRiskReward(selectedStrategy.risk_reward_ratio ?? 2);
  }, [selectedStrategy]);

  function setDefaultParameters(type) {
    const strategy = STRATEGIES[type];
    if (!strategy) return;

    const defaults = {};
    strategy.fields.forEach((field) => {
      defaults[field.name] = field.defaultValue;
    });
    setParameters(defaults);
  }

  function handleStrategyChange(event) {
    const type = event.target.value;
    setStrategyType(type);
    setDefaultParameters(type);
    setResult(null);
    setError("");
  }

  function handleParameterChange(name, value) {
    setParameters((current) => ({ ...current, [name]: value }));
  }

  async function handleBacktest() {
    setError("");
    setResult(null);

    if (!symbol.trim()) {
      setError("Enter a stock symbol.");
      return;
    }

    const numericParameters = Object.fromEntries(
      Object.entries(parameters).map(([key, value]) => [key, Number(value)])
    );

    if (
      numericParameters.fast_period !== undefined &&
      numericParameters.slow_period !== undefined &&
      numericParameters.fast_period >= numericParameters.slow_period
    ) {
      setError("Fast period must be smaller than slow period.");
      return;
    }

    if (
      strategyType === "RSI" &&
      numericParameters.oversold >= numericParameters.overbought
    ) {
      setError("Oversold level must be smaller than overbought level.");
      return;
    }

    if (
      strategyType === "MACD" &&
      numericParameters.fast_period >= numericParameters.slow_period
    ) {
      setError("MACD fast period must be smaller than slow period.");
      return;
    }

    if (Number(initialCash) <= 0) {
      setError("Initial capital must be greater than 0.");
      return;
    }

    try {
      setLoading(true);

      const data = await runBacktest({
        symbol: symbol.trim().toUpperCase(),
        strategyType,
        timeframe,
        parameters: numericParameters,
        initialCash: Number(initialCash),
        stopLossPercent: Number(stopLoss),
        riskRewardRatio: Number(riskReward),
      });

      setResult(data);
    } catch (err) {
      console.error("Backtest failed:", err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Failed to run backtest."
      );
    } finally {
      setLoading(false);
    }
  }

  const currentStrategy = STRATEGIES[strategyType];

  const money = (value) =>
    `₹${Number(value ?? 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const percent = (value) =>
    `${Number(value ?? 0) >= 0 ? "+" : ""}${Number(value ?? 0).toFixed(2)}%`;

  const drawdown = (value) =>
    `-${Math.abs(Number(value ?? 0)).toFixed(2)}%`;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            STRATEGY LAB
          </span>
          <h1 className="text-3xl font-bold text-white mt-3">Backtesting</h1>
          <p className="text-slate-400 mt-2">
            Test your trading strategy against historical market data.
          </p>
        </div>

        {result && (
          <div className="text-sm">
            <span className="text-slate-500">Instrument: </span>
            <span className="font-semibold text-white">{symbol}</span>
            <span className="text-slate-600 mx-2">•</span>
            <span className="font-semibold text-blue-400">{timeframe}</span>
          </div>
        )}
      </div>

      {selectedStrategy && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-blue-400 font-semibold">
            Saved strategy
          </p>
          <p className="text-white font-semibold mt-2">{selectedStrategy.name}</p>
          <p className="text-sm text-slate-400 mt-1">
            {selectedStrategy.symbol || symbol} •{" "}
            {selectedStrategy.strategy_type || strategyType} •{" "}
            {selectedStrategy.timeframe || timeframe}
          </p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-white">Backtest Configuration</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Configure market, timeframe, strategy and risk parameters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <Field label="Stock / Index Symbol">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="TCS.NS"
              className={inputClass}
            />
          </Field>

          <Field label="Strategy Type">
            <select value={strategyType} onChange={handleStrategyChange} className={inputClass}>
              {Object.entries(STRATEGIES).map(([value, strategy]) => (
                <option key={value} value={value}>{strategy.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Timeframe">
            <select
              value={timeframe}
              onChange={(e) => {
                setTimeframe(e.target.value);
                setResult(null);
              }}
              className={inputClass}
            >
              {TIMEFRAMES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label} ({value})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Initial Capital">
            <input
              type="number"
              min="1000"
              value={initialCash}
              onChange={(e) => setInitialCash(e.target.value)}
              className={inputClass}
            />
          </Field>

          {currentStrategy?.fields.map((field) => (
            <Field key={field.name} label={field.label}>
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step || 1}
                value={parameters[field.name] ?? ""}
                onChange={(e) => handleParameterChange(field.name, e.target.value)}
                className={inputClass}
              />
            </Field>
          ))}

          <Field label="Stop Loss %">
            <input
              type="number"
              min="0"
              step="0.5"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Risk : Reward">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={riskReward}
              onChange={(e) => setRiskReward(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {currentStrategy && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm leading-6 text-slate-400">
              <span className="font-semibold text-white">{currentStrategy.label}:</span>{" "}
              {currentStrategy.description}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">⚠ {error}</p>
          </div>
        )}

        <button
          onClick={handleBacktest}
          disabled={loading}
          className="mt-6 inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-600/20"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Running Backtest...
            </>
          ) : (
            <>▶ Run Backtest</>
          )}
        </button>
      </div>

      {result && (
        <>
          <div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Backtest Results</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Performance summary for {symbol} on the {timeframe} timeframe.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <ResultCard title="Initial Capital" value={money(result.initial_cash)} subtitle="Starting balance" />
              <ResultCard
                title="Final Capital"
                value={money(result.final_cash)}
                subtitle="Ending balance"
                valueClass={Number(result.final_cash) >= Number(result.initial_cash) ? "text-emerald-400" : "text-red-400"}
              />
              <ResultCard
                title="Total Return"
                value={percent(result.total_return)}
                subtitle="Net portfolio return"
                valueClass={Number(result.total_return) >= 0 ? "text-emerald-400" : "text-red-400"}
              />
              <ResultCard title="Total Trades" value={result.total_trades ?? 0} subtitle="Executed trades" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            <ResultCard title="Winning Trades" value={result.winning_trades ?? 0} valueClass="text-emerald-400" />
            <ResultCard title="Losing Trades" value={result.losing_trades ?? 0} valueClass="text-red-400" />
            <ResultCard title="Win Rate" value={`${Number(result.win_rate ?? 0).toFixed(2)}%`} />
            <ResultCard
              title="Profit Factor"
              value={
                result.profit_factor === null || result.profit_factor === undefined
                  ? "∞"
                  : Number(result.profit_factor).toFixed(2)
              }
            />
            <ResultCard title="Max Drawdown" value={drawdown(result.max_drawdown)} valueClass="text-red-400" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryItem label="Symbol" value={symbol} />
            <SummaryItem label="Strategy" value={currentStrategy?.label || strategyType} />
            <SummaryItem label="Timeframe" value={timeframe} />
            <SummaryItem label="Risk / Reward" value={`1 : ${Number(riskReward).toFixed(1)}`} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard title="Equity Curve" description="Portfolio value throughout the backtest.">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.equity_curve || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={30} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [money(value), "Equity"]} />
                  <Line type="monotone" dataKey="equity" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Drawdown Curve" description="Percentage decline from the previous portfolio peak.">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.equity_curve || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={30} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, "Drawdown"]}
                  />
                  <Line type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Trade History</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Orders generated by the selected strategy.
                </p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-slate-400">
                {result.trades?.length || 0} records
              </span>
            </div>

            {!result.trades || result.trades.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-400">No trades generated.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Try another timeframe or strategy configuration.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Side</th>
                      <th className="pb-3 pr-4">Quantity</th>
                      <th className="pb-3 pr-4">Price</th>
                      <th className="pb-3 pr-4">P&L</th>
                      <th className="pb-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((trade, index) => (
                      <tr key={index} className="border-b border-slate-800/60 text-sm hover:bg-slate-800/30 transition">
                        <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">{trade.date}</td>
                        <td className="py-4 pr-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                            trade.side === "BUY"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-slate-300">{trade.quantity}</td>
                        <td className="py-4 pr-4 text-white">{money(trade.price)}</td>
                        <td className="py-4 pr-4">
                          {trade.pnl !== undefined && trade.pnl !== null ? (
                            <span className={Number(trade.pnl) >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                              {money(trade.pnl)}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-4 text-slate-400 max-w-xs">{trade.reason || "—"}</td>
                      </tr>
                    ))}
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

const inputClass =
  "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition";

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "10px",
  color: "#fff",
};

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>
      {children}
    </div>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-slate-500 mt-1 mb-5">{description}</p>
      <div className="h-80">{children}</div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-white mt-1 truncate">{value}</p>
    </div>
  );
}

function ResultCard({ title, value, subtitle, valueClass = "text-white" }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className={`text-2xl font-bold mt-3 ${valueClass}`}>{value}</h2>
      {subtitle && <p className="text-xs text-slate-600 mt-2">{subtitle}</p>}
    </div>
  );
}
