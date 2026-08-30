import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { runPaperTrade } from "@/services/paperTradingService";

import {
  getStrategies,
  createStrategy,
  deleteStrategy,
} from "@/services/strategyService";

import {
  strategyTypes,
  assetTypes,
  tradingStyles,
  timeframes,
  stopLossOptions,
  riskRewardOptions,
} from "@/config/strategies";


export default function Strategy() {
  const navigate = useNavigate();

  // ==========================================
  // Basic Information
  // ==========================================

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("TCS.NS");

  const [assetType, setAssetType] =
    useState("STOCK");

  const [tradingStyle, setTradingStyle] =
    useState("INTRADAY");

  const [timeframe, setTimeframe] =
    useState("15m");

  // ==========================================
  // Strategy
  // ==========================================

  const [strategyType, setStrategyType] =
    useState("SMA_CROSSOVER");

  const [parameters, setParameters] = useState({
    fast_period: 20,
    slow_period: 50,
  });

  // ==========================================
  // Risk Management
  // ==========================================

  const [stopLoss, setStopLoss] =
    useState(2);

  const [riskReward, setRiskReward] =
    useState(2);

  // ==========================================
  // Saved Strategies
  // ==========================================

  const [strategies, setStrategies] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // ==========================================
  // Messages
  // ==========================================

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ==========================================
  // Paper Trading
  // ==========================================

  const [paperTradingId, setPaperTradingId] =
    useState(null);

  const [paperTradeResult, setPaperTradeResult] =
    useState(null);

  // ==========================================
  // Selected Strategy
  // ==========================================

  const selectedStrategy = useMemo(
    () =>
      strategyTypes.find(
        (strategy) =>
          strategy.value === strategyType
      ),
    [strategyType]
  );

  // ==========================================
  // Available Timeframes
  // ==========================================

  const availableTimeframes = useMemo(
    () =>
      timeframes.filter((item) =>
        item.styles.includes(tradingStyle)
      ),
    [tradingStyle]
  );

  // ==========================================
  // Load Strategies
  // ==========================================

  async function loadStrategies() {
    try {
      setLoading(true);
      setError("");

      const data = await getStrategies();

      setStrategies(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to load strategies:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to load strategies."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStrategies();
  }, []);

  // ==========================================
  // Change Strategy Type
  // ==========================================

  function handleStrategyTypeChange(type) {
    setStrategyType(type);

    const strategy = strategyTypes.find(
      (item) => item.value === type
    );

    if (!strategy) {
      setParameters({});
      return;
    }

    const defaults = {};

    strategy.fields.forEach((field) => {
      defaults[field.name] =
        field.defaultValue;
    });

    setParameters(defaults);
  }

  // ==========================================
  // Change Strategy Parameter
  // ==========================================

  function handleParameterChange(
    fieldName,
    value
  ) {
    setParameters((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  // ==========================================
  // Change Trading Style
  // ==========================================

  function handleTradingStyleChange(style) {
    setTradingStyle(style);

    const validTimeframes =
      timeframes.filter((item) =>
        item.styles.includes(style)
      );

    if (
      validTimeframes.length > 0 &&
      !validTimeframes.some(
        (item) =>
          item.value === timeframe
      )
    ) {
      setTimeframe(
        validTimeframes[0].value
      );
    }
  }

  // ==========================================
  // Validate Strategy Parameters
  // ==========================================

  function validateParameters() {
    if (!selectedStrategy) {
      return "Select a strategy type.";
    }

    for (const field of selectedStrategy.fields) {
      const value = Number(
        parameters[field.name]
      );

      if (!Number.isFinite(value)) {
        return `${field.label} is required.`;
      }

      if (
        field.min !== undefined &&
        value < field.min
      ) {
        return `${field.label} must be at least ${field.min}.`;
      }

      if (
        field.max !== undefined &&
        value > field.max
      ) {
        return `${field.label} cannot be greater than ${field.max}.`;
      }
    }

    // SMA / EMA / Trend validation

    if (
      strategyType === "SMA_CROSSOVER" ||
      strategyType === "EMA_CROSSOVER" ||
      strategyType === "SMA_EMA_TREND"
    ) {
      const fast = Number(
        parameters.fast_period
      );

      const slow = Number(
        parameters.slow_period
      );

      if (fast >= slow) {
        return "Fast period must be smaller than slow period.";
      }
    }

    // RSI validation

    if (strategyType === "RSI") {
      const oversold = Number(
        parameters.oversold
      );

      const overbought = Number(
        parameters.overbought
      );

      if (oversold >= overbought) {
        return "Oversold must be smaller than overbought.";
      }
    }

    // MACD validation

    if (strategyType === "MACD") {
      const fast = Number(
        parameters.fast_period
      );

      const slow = Number(
        parameters.slow_period
      );

      if (fast >= slow) {
        return "MACD fast period must be smaller than slow period.";
      }
    }

    return null;
  }

  // ==========================================
  // Save Strategy
  // ==========================================

  async function handleSave() {
    setMessage("");
    setError("");
    setPaperTradeResult(null);

    if (!name.trim()) {
      setError(
        "Enter a strategy name."
      );
      return;
    }

    if (!symbol.trim()) {
      setError(
        "Enter a stock or index symbol."
      );
      return;
    }

    const parameterError =
      validateParameters();

    if (parameterError) {
      setError(parameterError);
      return;
    }

    if (
      !Number.isFinite(
        Number(stopLoss)
      ) ||
      Number(stopLoss) <= 0
    ) {
      setError(
        "Stop loss must be greater than 0."
      );
      return;
    }

    if (
      !Number.isFinite(
        Number(riskReward)
      ) ||
      Number(riskReward) <= 0
    ) {
      setError(
        "Risk/reward must be greater than 0."
      );
      return;
    }

    try {
      setSaving(true);

      const cleanParameters = {};

      selectedStrategy.fields.forEach(
        (field) => {
          const value =
            Number(
              parameters[field.name]
            );

          cleanParameters[
            field.name
          ] = value;
        }
      );

      const strategy =
        await createStrategy({
          name: name.trim(),

          symbol:
            symbol.trim().toUpperCase(),

          asset_type: assetType,

          trading_style:
            tradingStyle,

          timeframe,

          strategy_type:
            strategyType,

          parameters:
            cleanParameters,

          stop_loss_percent:
            Number(stopLoss),

          risk_reward_ratio:
            Number(riskReward),
        });

      setStrategies((current) => [
        strategy,
        ...current,
      ]);

      setName("");

      setMessage(
        "Strategy created successfully."
      );

    } catch (error) {
      console.error(
        "Failed to create strategy:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to create strategy."
      );

    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // Paper Trade
  // ==========================================

  async function handlePaperTrade(
    strategyId
  ) {
    setError("");
    setMessage("");
    setPaperTradeResult(null);

    try {
      setPaperTradingId(strategyId);

      const result =
        await runPaperTrade(strategyId);

      setPaperTradeResult(result);

      setMessage(
        `Paper trade completed. Signal: ${result.signal}`
      );

    } catch (error) {
      console.error(
        "Paper trade failed:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Paper trade failed."
      );

    } finally {
      setPaperTradingId(null);
    }
  }

  // ==========================================
  // Delete Strategy
  // ==========================================

  async function handleDelete(id) {
    setError("");
    setMessage("");
    setPaperTradeResult(null);

    try {
      await deleteStrategy(id);

      setStrategies((current) =>
        current.filter(
          (strategy) =>
            strategy.id !== id
        )
      );

      setMessage(
        "Strategy deleted successfully."
      );

    } catch (error) {
      console.error(
        "Failed to delete strategy:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to delete strategy."
      );
    }
  }

  // ==========================================
  // Strategy Label
  // ==========================================

  function getStrategyLabel(type) {
    const strategy =
      strategyTypes.find(
        (item) =>
          item.value === type
      );

    return strategy
      ? strategy.label
      : type;
  }

  // ==========================================
  // Get Timeframe Label
  // ==========================================

  function getTimeframeLabel(value) {
    const item =
      timeframes.find(
        (timeframe) =>
          timeframe.value === value
      );

    return item
      ? item.label
      : value;
  }

  // ==========================================
  // Get Trading Style Label
  // ==========================================

  function getTradingStyleLabel(value) {
    const item =
      tradingStyles.find(
        (style) =>
          style.value === value
      );

    return item
      ? item.label
      : value;
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-8">

      {/* ====================================== */}
      {/* Header */}
      {/* ====================================== */}

      <div>
        <h1 className="text-3xl font-bold text-white">
          Strategy Builder
        </h1>

        <p className="text-slate-400 mt-2">
          Create and customize your algorithmic
          trading strategy
        </p>
      </div>


      {/* ====================================== */}
      {/* Create Strategy */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ==================================== */}
        {/* LEFT SIDE */}
        {/* ==================================== */}

        <div className="xl:col-span-2 space-y-6">

          {/* ================================== */}
          {/* Basic Information */}
          {/* ================================== */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                ① Basic Information
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Define what you want to trade.
              </p>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Strategy Name */}

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Strategy Name
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="TCS SMA Strategy"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>


              {/* Asset Type */}

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Asset Type
                </label>

                <select
                  value={assetType}
                  onChange={(e) =>
                    setAssetType(
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  {assetTypes.map(
                    (asset) => (
                      <option
                        key={
                          asset.value
                        }
                        value={
                          asset.value
                        }
                      >
                        {asset.label}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* Symbol */}

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Symbol / Stock
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


              {/* Trading Style */}

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Trading Style
                </label>

                <select
                  value={tradingStyle}
                  onChange={(e) =>
                    handleTradingStyleChange(
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  {tradingStyles.map(
                    (style) => (
                      <option
                        key={
                          style.value
                        }
                        value={
                          style.value
                        }
                      >
                        {style.label}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* Timeframe */}

              <div className="md:col-span-2">

                <label className="block text-sm text-slate-400 mb-2">
                  Time Frame
                </label>

                <select
                  value={timeframe}
                  onChange={(e) =>
                    setTimeframe(
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  {availableTimeframes.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>

              </div>

            </div>

          </div>


          {/* ================================== */}
          {/* Strategy Settings */}
          {/* ================================== */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                ② Strategy Type & Settings
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Configure the indicators used by
                your strategy.
              </p>
            </div>


            {/* Strategy Type */}

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Strategy Type
              </label>

              <select
                value={strategyType}
                onChange={(e) =>
                  handleStrategyTypeChange(
                    e.target.value
                  )
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                {strategyTypes.map(
                  (strategy) => (
                    <option
                      key={
                        strategy.value
                      }
                      value={
                        strategy.value
                      }
                    >
                      {strategy.label}
                    </option>
                  )
                )}
              </select>
            </div>


            {/* Description */}

            {selectedStrategy && (
              <div className="mt-4 bg-slate-800/60 border border-slate-700 rounded-xl p-4">

                <p className="text-sm text-slate-300">
                  {selectedStrategy.description}
                </p>

              </div>
            )}


            {/* Dynamic Fields */}

            {selectedStrategy && (
              <div className="mt-6">

                <h3 className="text-sm font-semibold text-slate-300 mb-4">
                  {selectedStrategy.label} Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {selectedStrategy.fields.map(
                    (field) => (

                      <div
                        key={
                          field.name
                        }
                      >

                        <label className="block text-sm text-slate-400 mb-2">
                          {field.label}
                        </label>

                        <input
                          type={
                            field.type
                          }
                          min={
                            field.min
                          }
                          max={
                            field.max
                          }
                          step={
                            field.step ||
                            1
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

                </div>

              </div>
            )}

          </div>


          {/* ================================== */}
          {/* Risk Management */}
          {/* ================================== */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                ③ Risk Management
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Define your stop loss and target.
              </p>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Stop Loss */}

              <div>

                <label className="block text-sm text-slate-400 mb-2">
                  Stop Loss
                </label>

                <select
                  value={stopLoss}
                  onChange={(e) =>
                    setStopLoss(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  {stopLossOptions.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>

              </div>


              {/* Risk Reward */}

              <div>

                <label className="block text-sm text-slate-400 mb-2">
                  Target / Risk : Reward
                </label>

                <select
                  value={riskReward}
                  onChange={(e) =>
                    setRiskReward(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  {riskRewardOptions.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>

              </div>

            </div>


            {/* Risk Calculation */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

              <div className="bg-slate-800/70 rounded-xl p-4">

                <p className="text-xs text-slate-500">
                  Stop Loss
                </p>

                <p className="text-lg font-semibold text-red-400 mt-1">
                  {Number(stopLoss).toFixed(2)}%
                </p>

              </div>


              <div className="bg-slate-800/70 rounded-xl p-4">

                <p className="text-xs text-slate-500">
                  Risk : Reward
                </p>

                <p className="text-lg font-semibold text-blue-400 mt-1">
                  1 : {Number(riskReward)}
                </p>

              </div>


              <div className="bg-slate-800/70 rounded-xl p-4">

                <p className="text-xs text-slate-500">
                  Potential Reward
                </p>

                <p className="text-lg font-semibold text-green-400 mt-1">
                  {(
                    Number(stopLoss) *
                    Number(riskReward)
                  ).toFixed(2)}
                  %
                </p>

              </div>

            </div>

          </div>


          {/* ================================== */}
          {/* Messages */}
          {/* ================================== */}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">

              <p className="text-sm text-red-400">
                {error}
              </p>

            </div>
          )}


          {message && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">

              <p className="text-sm text-green-400">
                {message}
              </p>

            </div>
          )}


          {/* ================================== */}
          {/* Save Button */}
          {/* ================================== */}

          <div className="flex justify-end">

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving
                ? "Saving..."
                : "Save Strategy"}
            </button>

          </div>

        </div>


        {/* ==================================== */}
        {/* RIGHT SIDE */}
        {/* ==================================== */}

        <div className="space-y-6">

          {/* ================================== */}
          {/* Live Summary */}
          {/* ================================== */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-6">

            <h2 className="text-xl font-semibold text-white">
              Strategy Summary
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Live preview
            </p>


            <div className="border-t border-slate-800 my-5" />


            {/* Name */}

            <h3 className="text-lg font-semibold text-white">

              {name.trim()
                ? name
                : "Your Strategy"}

            </h3>


            {/* Symbol */}

            <p className="text-sm text-slate-400 mt-1">
              {symbol || "SYMBOL"}
              {" • "}
              {assetTypes.find(
                (item) =>
                  item.value ===
                  assetType
              )?.label ||
                assetType}
            </p>


            {/* Trading */}

            <p className="text-sm text-slate-500 mt-1">

              {getTradingStyleLabel(
                tradingStyle
              )}

              {" • "}

              {getTimeframeLabel(
                timeframe
              )}

            </p>


            <div className="border-t border-slate-800 my-5" />


            {/* Strategy */}

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Strategy
            </p>

            <p className="text-lg font-semibold text-blue-400 mt-1">
              {selectedStrategy?.label}
            </p>


            {/* Parameters */}

            <div className="mt-4 space-y-2">

              {selectedStrategy?.fields.map(
                (field) => (

                  <div
                    key={
                      field.name
                    }
                    className="flex justify-between gap-4"
                  >

                    <span className="text-sm text-slate-400">
                      {field.label}
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {
                        parameters[
                          field.name
                        ]
                      }
                    </span>

                  </div>

                )
              )}

            </div>


            <div className="border-t border-slate-800 my-5" />


            {/* Risk */}

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Risk Management
            </p>


            <div className="mt-4 space-y-3">

              <div className="flex justify-between">

                <span className="text-sm text-slate-400">
                  Stop Loss
                </span>

                <span className="text-sm font-semibold text-red-400">
                  {Number(
                    stopLoss
                  ).toFixed(2)}
                  %
                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-sm text-slate-400">
                  Risk : Reward
                </span>

                <span className="text-sm font-semibold text-blue-400">
                  1 :{" "}
                  {Number(
                    riskReward
                  )}
                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-sm text-slate-400">
                  Potential Reward
                </span>

                <span className="text-sm font-semibold text-green-400">
                  {(
                    Number(stopLoss) *
                    Number(riskReward)
                  ).toFixed(2)}
                  %
                </span>

              </div>

            </div>


            {/* Logic */}

            {strategyType ===
              "SMA_CROSSOVER" && (
              <div className="mt-6 bg-slate-800/60 rounded-xl p-4">

                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Strategy Logic
                </p>

                <p className="text-sm text-slate-300 mt-2 leading-6">
                  BUY when SMA{" "}
                  {parameters.fast_period}
                  {" "}crosses above SMA{" "}
                  {parameters.slow_period}.
                  <br />
                  SELL when SMA{" "}
                  {parameters.fast_period}
                  {" "}crosses below SMA{" "}
                  {parameters.slow_period}.
                </p>

              </div>
            )}


            {strategyType ===
              "EMA_CROSSOVER" && (
              <div className="mt-6 bg-slate-800/60 rounded-xl p-4">

                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Strategy Logic
                </p>

                <p className="text-sm text-slate-300 mt-2 leading-6">
                  BUY when EMA{" "}
                  {parameters.fast_period}
                  {" "}crosses above EMA{" "}
                  {parameters.slow_period}.
                  <br />
                  SELL when EMA{" "}
                  {parameters.fast_period}
                  {" "}crosses below EMA{" "}
                  {parameters.slow_period}.
                </p>

              </div>
            )}

          </div>

        </div>

      </div>


      {/* ====================================== */}
      {/* Paper Trading Result */}
      {/* ====================================== */}

      {paperTradeResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <h2 className="text-xl font-semibold text-white">
            Paper Trading Result
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">

            <div>
              <p className="text-sm text-slate-500">
                Signal
              </p>

              <p
                className={`text-xl font-bold mt-1 ${
                  paperTradeResult.signal ===
                  "BUY"
                    ? "text-green-400"
                    : paperTradeResult.signal ===
                      "SELL"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {paperTradeResult.signal}
              </p>
            </div>


            <div>
              <p className="text-sm text-slate-500">
                Action
              </p>

              <p className="text-xl font-bold text-white mt-1">
                {paperTradeResult.action}
              </p>
            </div>


            <div>
              <p className="text-sm text-slate-500">
                Price
              </p>

              <p className="text-xl font-bold text-white mt-1">
                ₹
                {Number(
                  paperTradeResult.price
                ).toFixed(2)}
              </p>
            </div>


            <div>
              <p className="text-sm text-slate-500">
                Symbol
              </p>

              <p className="text-xl font-bold text-white mt-1">
                {paperTradeResult.symbol}
              </p>
            </div>

          </div>


          {paperTradeResult.message && (
            <p className="mt-5 text-sm text-yellow-400">
              {paperTradeResult.message}
            </p>
          )}

        </div>
      )}


      {/* ====================================== */}
      {/* Saved Strategies */}
      {/* ====================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-xl font-semibold text-white">
              My Strategies
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Your saved trading strategies
            </p>

          </div>


          <button
            onClick={loadStrategies}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>


        {loading ? (

          <p className="text-slate-500 text-center py-8">
            Loading strategies...
          </p>

        ) : strategies.length === 0 ? (

          <div className="text-center py-10">

            <p className="text-slate-500">
              No strategies created yet.
            </p>

            <p className="text-sm text-slate-600 mt-2">
              Create your first strategy above.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {strategies.map(
              (strategy) => {

                const savedParameters =
                  strategy.parameters ||
                  {};

                return (

                  <div
                    key={
                      strategy.id
                    }
                    className="bg-slate-800/60 border border-slate-700 rounded-xl p-5"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      {/* Details */}

                      <div>

                        <h3 className="text-lg font-semibold text-white">
                          {strategy.name}
                        </h3>

                        <p className="text-sm text-slate-400 mt-1">
                          {strategy.symbol}
                          {" • "}
                          {getStrategyLabel(
                            strategy.strategy_type
                          )}
                        </p>


                        <p className="text-sm text-slate-500 mt-2">

                          {strategy.asset_type ||
                            "STOCK"}

                          {" • "}

                          {getTradingStyleLabel(
                            strategy.trading_style ||
                              "INTRADAY"
                          )}

                          {" • "}

                          {getTimeframeLabel(
                            strategy.timeframe ||
                              "1d"
                          )}

                        </p>


                        {/* Parameters */}

                        <div className="flex flex-wrap gap-2 mt-3">

                          {Object.entries(
                            savedParameters
                          ).map(
                            ([key, value]) => (

                              <span
                                key={
                                  key
                                }
                                className="px-3 py-1 rounded-full bg-slate-700 text-xs text-slate-300"
                              >
                                {key.replace(
                                  /_/g,
                                  " "
                                )}
                                :{" "}
                                {value}
                              </span>

                            )
                          )}

                        </div>


                        {/* Risk */}

                        <p className="text-sm text-slate-500 mt-3">

                          Stop Loss:{" "}

                          {strategy.stop_loss_percent ??
                            "-"}
                          %

                          {" • "}

                          Risk : Reward: 1:

                          {strategy.risk_reward_ratio ??
                            "-"}

                        </p>

                      </div>


                      {/* Actions */}

                      <div className="flex flex-wrap gap-3">

                        <button
                          onClick={() =>
                            handlePaperTrade(
                              strategy.id
                            )
                          }
                          disabled={
                            paperTradingId ===
                            strategy.id
                          }
                          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {paperTradingId ===
                          strategy.id
                            ? "Running..."
                            : "Paper Trade"}
                        </button>


                        <button
                          onClick={() =>
                            navigate(
                              "/backtest",
                              {
                                state: {
                                  strategy:
                                    strategy,
                                },
                              }
                            )
                          }
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                          Backtest
                        </button>


                        <button
                          onClick={() =>
                            handleDelete(
                              strategy.id
                            )
                          }
                          className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

    </div>
  );
}