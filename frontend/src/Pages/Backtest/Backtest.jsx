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
    <div className="space-y-8 pb-10 animate-fade-up">

      {/* ============================== */}
      {/* Header */}
      {/* ============================== */}

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest"
            style={{
              background: 'rgba(79,70,229,0.08)',
              color: 'var(--qn-indigo)',
              border: '1px solid rgba(79,70,229,0.18)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
            STRATEGY LAB
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
            Backtesting
          </h1>
          <p className="text-sm mt-1.5"
            style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>
            Test your trading strategy against historical market data.
          </p>
        </div>

        {result && (
          <div className="text-sm px-4 py-2 rounded-xl"
            style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.14)', fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: 'var(--qn-text-3)' }}>Instrument: </span>
            <span className="font-bold" style={{ color: 'var(--qn-text-1)' }}>{symbol}</span>
            <span style={{ color: 'var(--qn-text-3)', margin: '0 8px' }}>·</span>
            <span className="font-bold" style={{ color: 'var(--qn-indigo)' }}>{timeframe}</span>
          </div>
        )}
      </div>

      {/* Saved strategy banner */}
      {selectedStrategy && (
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.18)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--qn-indigo)', fontFamily: "'JetBrains Mono', monospace" }}>
            Loaded from Saved Strategy
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
            {selectedStrategy.name}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--qn-text-2)', fontFamily: "'JetBrains Mono', monospace" }}>
            {selectedStrategy.symbol || symbol} · {selectedStrategy.strategy_type || strategyType} · {selectedStrategy.timeframe || timeframe}
          </p>
        </div>
      )}

      {/* ============================== */}
      {/* Configuration Card */}
      {/* ============================== */}

      <div className="qn-card p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--qn-indigo)' }} />
          <h2 className="text-base font-bold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
            Backtest Configuration
          </h2>
        </div>
        <p className="text-xs mb-6 ml-4.5"
          style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
          Configure market, timeframe, strategy and risk parameters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <Field label="Stock / Index Symbol">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="TCS.NS"
              className={inputClass}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em' }}
            />
          </Field>

          <Field label="Strategy Type">
            <select value={strategyType} onChange={handleStrategyChange} className={inputClass} style={inputStyle}>
              {Object.entries(STRATEGIES).map(([value, strategy]) => (
                <option key={value} value={value}>{strategy.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Timeframe">
            <select
              value={timeframe}
              onChange={(e) => { setTimeframe(e.target.value); setResult(null); }}
              className={inputClass}
              style={inputStyle}
            >
              {TIMEFRAMES.map(([value, label]) => (
                <option key={value} value={value}>{label} ({value})</option>
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
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
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
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
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
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
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
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </Field>
        </div>

        {/* Strategy description */}
        {currentStrategy && (
          <div className="mt-5 rounded-xl p-4"
            style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.12)' }}>
            <p className="text-sm leading-6" style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>
              <span className="font-bold" style={{ color: 'var(--qn-text-1)' }}>{currentStrategy.label}:</span>{" "}
              {currentStrategy.description}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)' }}>
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-medium" style={{ color: 'var(--qn-bear)', fontFamily: "'Inter', sans-serif" }}>
              {error}
            </p>
          </div>
        )}

        {/* Run button */}
        <button
          onClick={handleBacktest}
          disabled={loading}
          className="mt-6 inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: loading ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg, #4f46e5, #6d28d9)',
            color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '14px',
            boxShadow: '0 6px 20px rgba(79,70,229,0.30)',
            border: 'none',
          }}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Running Backtest…
            </>
          ) : (
            <>▶ Run Backtest</>
          )}
        </button>
      </div>

      {/* ============================== */}
      {/* Results */}
      {/* ============================== */}

      {result && (
        <>
          {/* Section title */}
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
                Backtest Results
              </h2>
              <p className="text-sm mt-1"
                style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>
                Performance summary for <span className="font-semibold" style={{ color: 'var(--qn-indigo)', fontFamily: "'JetBrains Mono', monospace" }}>{symbol}</span> on the{" "}
                <span className="font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{timeframe}</span> timeframe.
              </p>
            </div>
          </div>

          {/* Primary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <ResultCard title="Initial Capital" value={money(result.initial_cash)} subtitle="Starting balance" />
            <ResultCard
              title="Final Capital"
              value={money(result.final_cash)}
              subtitle="Ending balance"
              positive={Number(result.final_cash) >= Number(result.initial_cash)}
              colored
            />
            <ResultCard
              title="Total Return"
              value={percent(result.total_return)}
              subtitle="Net portfolio return"
              positive={Number(result.total_return) >= 0}
              colored
            />
            <ResultCard title="Total Trades" value={result.total_trades ?? 0} subtitle="Executed trades" />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            <ResultCard title="Winning Trades" value={result.winning_trades ?? 0} positive colored />
            <ResultCard title="Losing Trades" value={result.losing_trades ?? 0} positive={false} colored />
            <ResultCard title="Win Rate" value={`${Number(result.win_rate ?? 0).toFixed(2)}%`} />
            <ResultCard
              title="Profit Factor"
              value={
                result.profit_factor === null || result.profit_factor === undefined
                  ? "∞"
                  : Number(result.profit_factor).toFixed(2)
              }
            />
            <ResultCard title="Max Drawdown" value={drawdown(result.max_drawdown)} positive={false} colored />
          </div>

          {/* Config summary pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryItem label="Symbol" value={symbol} />
            <SummaryItem label="Strategy" value={currentStrategy?.label || strategyType} />
            <SummaryItem label="Timeframe" value={timeframe} />
            <SummaryItem label="Risk / Reward" value={`1 : ${Number(riskReward).toFixed(1)}`} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard title="Equity Curve" description="Portfolio value throughout the backtest.">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.equity_curve || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,70,229,0.08)" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b', fontFamily: "'JetBrains Mono', monospace" }} minTickGap={30} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b', fontFamily: "'JetBrains Mono', monospace" }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [money(value), "Equity"]} />
                  <Line type="monotone" dataKey="equity" stroke="#059669" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Drawdown Curve" description="Percentage decline from the previous portfolio peak.">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.equity_curve || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,70,229,0.08)" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b', fontFamily: "'JetBrains Mono', monospace" }} minTickGap={30} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b', fontFamily: "'JetBrains Mono', monospace" }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, "Drawdown"]} />
                  <Line type="monotone" dataKey="drawdown" stroke="#dc2626" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Trade History */}
          <div className="qn-card p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
                  Trade History
                </h2>
                <p className="text-xs mt-0.5"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
                  Orders generated by the selected strategy.
                </p>
              </div>
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(79,70,229,0.07)',
                  color: 'var(--qn-indigo)',
                  border: '1px solid rgba(79,70,229,0.15)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                {result.trades?.length || 0} records
              </span>
            </div>

            {!result.trades || result.trades.length === 0 ? (
              <div className="py-14 text-center rounded-xl"
                style={{ border: '1px dashed rgba(79,70,229,0.20)', background: 'rgba(79,70,229,0.02)' }}>
                <div className="text-3xl mb-3">📊</div>
                <p className="text-sm font-semibold" style={{ color: 'var(--qn-text-2)', fontFamily: "'Space Grotesk', sans-serif" }}>
                  No trades generated
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
                  Try another timeframe or strategy configuration.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--qn-border)' }}>
                      {["Date", "Side", "Quantity", "Price", "P&L", "Reason"].map(h => (
                        <th key={h} className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((trade, index) => (
                      <tr key={index} className="transition-all"
                        style={{ borderBottom: '1px solid rgba(79,70,229,0.06)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="py-3.5 pr-4 text-xs whitespace-nowrap"
                          style={{ color: 'var(--qn-text-2)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {trade.date}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black"
                            style={{
                              background: trade.side === "BUY" ? 'rgba(5,150,105,0.09)' : 'rgba(220,38,38,0.09)',
                              color: trade.side === "BUY" ? 'var(--qn-bull)' : 'var(--qn-bear)',
                              border: `1px solid ${trade.side === "BUY" ? 'rgba(5,150,105,0.25)' : 'rgba(220,38,38,0.25)'}`,
                              fontFamily: "'JetBrains Mono', monospace",
                              letterSpacing: '0.05em',
                            }}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-xs font-semibold"
                          style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {trade.quantity}
                        </td>
                        <td className="py-3.5 pr-4 text-xs font-bold"
                          style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {money(trade.price)}
                        </td>
                        <td className="py-3.5 pr-4 text-xs font-bold"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {trade.pnl !== undefined && trade.pnl !== null ? (
                            <span style={{ color: Number(trade.pnl) >= 0 ? 'var(--qn-bull)' : 'var(--qn-bear)' }}>
                              {money(trade.pnl)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--qn-text-3)' }}>—</span>
                          )}
                        </td>
                        <td className="py-3.5 text-xs max-w-xs"
                          style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
                          {trade.reason || "—"}
                        </td>
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
  "w-full rounded-xl px-4 py-2.5 text-sm transition-all outline-none appearance-none cursor-pointer";

const inputStyle = {
  background: '#f5f7ff',
  border: '1px solid rgba(79,70,229,0.16)',
  color: 'var(--qn-text-1)',
  fontFamily: "'Inter', sans-serif",
};

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(79,70,229,0.16)",
  borderRadius: "12px",
  color: "#1a1f3c",
  boxShadow: "0 4px 20px rgba(79,70,229,0.10)",
  fontFamily: "'Inter', sans-serif",
  fontSize: "12px",
};

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider"
        style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <div className="qn-card p-6">
      <h2 className="text-base font-bold"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
        {title}
      </h2>
      <p className="text-xs mt-1 mb-5"
        style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
        {description}
      </p>
      <div className="h-80">{children}</div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl px-4 py-4"
      style={{ background: '#f5f7ff', border: '1px solid rgba(79,70,229,0.10)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </p>
      <p className="text-sm font-bold mt-1.5 truncate"
        style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </p>
    </div>
  );
}

function ResultCard({ title, value, subtitle, colored = false, positive }) {
  const color = colored
    ? positive
      ? 'var(--qn-bull)'
      : 'var(--qn-bear)'
    : 'var(--qn-text-1)';

  const bg = colored
    ? positive
      ? 'rgba(5,150,105,0.04)'
      : 'rgba(220,38,38,0.04)'
    : '#ffffff';

  const border = colored
    ? positive
      ? '1px solid rgba(5,150,105,0.14)'
      : '1px solid rgba(220,38,38,0.14)'
    : '1px solid var(--qn-border)';

  return (
    <div className="rounded-2xl p-5 transition-all"
      style={{ background: bg, border }}>
      <p className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
        {title}
      </p>
      <h2 className="text-2xl font-black mt-3" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </h2>
      {subtitle && (
        <p className="text-[10px] mt-2" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
