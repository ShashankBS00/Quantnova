import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
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
  const [symbol, setSymbol] = useState("");

  // ==========================================
  // Stock Search
  // ==========================================

  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState([]);
  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  const [stockSearchLoading, setStockSearchLoading] = useState(false);
  const stockSearchRef = useRef(null);
  const stockDebounceRef = useRef(null);

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
  // Stock Search Logic
  // ==========================================

  async function fetchStockResults(q) {
    if (!q || q.trim().length === 0) {
      setStockResults([]);
      return;
    }
    try {
      setStockSearchLoading(true);
      const res = await fetch(
        `http://127.0.0.1:8000/market/search?q=${encodeURIComponent(q)}&limit=6`
      );
      const data = await res.json();
      setStockResults(data.results || []);
    } catch {
      setStockResults([]);
    } finally {
      setStockSearchLoading(false);
    }
  }

  function handleStockQueryChange(e) {
    const val = e.target.value;
    setStockQuery(val);
    setStockSearchOpen(true);
    clearTimeout(stockDebounceRef.current);
    stockDebounceRef.current = setTimeout(() => {
      fetchStockResults(val);
    }, 280);
  }

  function handleStockSelect(result) {
    setSymbol(result.symbol.toUpperCase());
    setStockQuery(result.symbol.toUpperCase());
    setStockSearchOpen(false);
    setStockResults([]);
  }

  function handleStockClear() {
    setStockQuery("");
    setSymbol("");
    setStockResults([]);
    setStockSearchOpen(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (stockSearchRef.current && !stockSearchRef.current.contains(e.target)) {
        setStockSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <div className="space-y-8 animate-fade-up">

      {/* ====================================== */}
      {/* Header */}
      {/* ====================================== */}

      <div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}
        >
          Strategy Builder
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>
          Create and configure your algorithmic trading strategy
        </p>
      </div>


      {/* ====================================== */}
      {/* Create Strategy */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ==================================== */}
        {/* LEFT SIDE */}
        {/* ==================================== */}

        <div className="xl:col-span-2 space-y-5">

          {/* ================================== */}
          {/* Basic Information */}
          {/* ================================== */}

          <div className="qn-card p-6">

            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)', color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
                  1
                </span>
                <h2 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
                  Basic Information
                </h2>
              </div>
              <p className="text-xs ml-8.5" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
                Define what you want to trade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Strategy Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Strategy Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="TCS SMA Strategy"
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all"
                  style={{
                    background: '#f5f7ff',
                    border: '1px solid rgba(79,70,229,0.16)',
                    color: 'var(--qn-text-1)',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.16)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Asset Type
                </label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all appearance-none cursor-pointer"
                  style={{
                    background: '#f5f7ff',
                    border: '1px solid rgba(79,70,229,0.16)',
                    color: 'var(--qn-text-1)',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.16)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {assetTypes.map((asset) => (
                    <option key={asset.value} value={asset.value}>{asset.label}</option>
                  ))}
                </select>
              </div>

              {/* Symbol / Stock Search */}
              <div ref={stockSearchRef} style={{ position: 'relative' }}>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Symbol / Stock
                </label>

                {/* Input wrapper */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f5f7ff',
                    border: stockSearchOpen
                      ? '1.5px solid rgba(79,70,229,0.55)'
                      : '1px solid rgba(79,70,229,0.16)',
                    borderRadius: '14px',
                    padding: '0 12px',
                    gap: '8px',
                    boxShadow: stockSearchOpen ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                >
                  <Search size={14} style={{ color: 'rgba(79,70,229,0.55)', flexShrink: 0 }} />
                  <input
                    value={stockQuery}
                    onChange={handleStockQueryChange}
                    onFocus={() => {
                      setStockSearchOpen(true);
                      if (stockQuery.trim().length > 0) fetchStockResults(stockQuery);
                    }}
                    placeholder="Search by company name or symbol"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--qn-text-1)',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13.5px',
                      padding: '9px 0',
                      minWidth: 0,
                    }}
                  />
                  {stockQuery && (
                    <button
                      type="button"
                      onClick={handleStockClear}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: 'rgba(79,70,229,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                  <ChevronDown
                    size={13}
                    style={{
                      color: 'rgba(79,70,229,0.40)',
                      flexShrink: 0,
                      transform: stockSearchOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.18s',
                    }}
                  />
                </div>

                {/* Dropdown */}
                {stockSearchOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid rgba(79,70,229,0.14)',
                      borderRadius: '14px',
                      boxShadow: '0 8px 32px rgba(79,70,229,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                      zIndex: 9999,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Placeholder hint */}
                    {stockResults.length === 0 && !stockSearchLoading && (
                      <div style={{
                        padding: '14px 16px',
                        fontSize: '12.5px',
                        color: 'rgba(79,70,229,0.45)',
                        fontFamily: "'Inter', sans-serif",
                        fontStyle: 'italic',
                      }}>
                        {stockQuery.trim()
                          ? 'No Indian stocks found'
                          : 'Search by company name or symbol'}
                      </div>
                    )}

                    {/* Loading */}
                    {stockSearchLoading && (
                      <div style={{
                        padding: '14px 16px',
                        fontSize: '12.5px',
                        color: 'rgba(79,70,229,0.45)',
                        fontFamily: "'Inter', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span style={{
                          width: 12, height: 12,
                          borderRadius: '50%',
                          border: '2px solid rgba(79,70,229,0.25)',
                          borderTopColor: '#4f46e5',
                          display: 'inline-block',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                        Searching...
                      </div>
                    )}

                    {/* Results */}
                    {stockResults.map((result, idx) => (
                      <button
                        key={result.symbol + idx}
                        type="button"
                        onMouseDown={() => handleStockSelect(result)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '11px 16px',
                          background: 'none',
                          border: 'none',
                          borderTop: idx === 0 ? 'none' : '1px solid rgba(79,70,229,0.06)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        {/* Left: name + symbol */}
                        <div style={{ minWidth: 0 }}>
                          <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 700,
                            fontSize: '13px',
                            color: '#1a1a2e',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '210px',
                          }}>
                            {(result.short_name || result.name || result.symbol).toUpperCase()}
                          </p>
                          <p style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                            color: 'rgba(79,70,229,0.55)',
                            margin: '2px 0 0',
                          }}>
                            {result.symbol.toUpperCase()}
                          </p>
                        </div>

                        {/* Right: exchange + type */}
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                          <p style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#6b7280',
                            margin: 0,
                          }}>
                            {result.exchange_display || 'NSE'}
                          </p>
                          <p style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                            color: '#9ca3af',
                            margin: '2px 0 0',
                            textTransform: 'uppercase',
                          }}>
                            {result.quote_type || 'EQUITY'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Trading Style */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Trading Style
                </label>
                <select
                  value={tradingStyle}
                  onChange={(e) => handleTradingStyleChange(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all appearance-none cursor-pointer"
                  style={{
                    background: '#f5f7ff',
                    border: '1px solid rgba(79,70,229,0.16)',
                    color: 'var(--qn-text-1)',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.16)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {tradingStyles.map((style) => (
                    <option key={style.value} value={style.value}>{style.label}</option>
                  ))}
                </select>
              </div>

              {/* Timeframe */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Time Frame
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all appearance-none cursor-pointer"
                  style={{
                    background: '#f5f7ff',
                    border: '1px solid rgba(79,70,229,0.16)',
                    color: 'var(--qn-text-1)',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.16)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {availableTimeframes.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>


          {/* ================================== */}
          {/* Strategy Settings */}
          {/* ================================== */}

          <div className="qn-card p-6">

            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)', color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
                  2
                </span>
                <h2 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
                  Strategy Type &amp; Settings
                </h2>
              </div>
              <p className="text-xs ml-8.5" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
                Configure the indicators used by your strategy.
              </p>
            </div>

            {/* Strategy Type */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                Strategy Type
              </label>
              <select
                value={strategyType}
                onChange={(e) => handleStrategyTypeChange(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm transition-all appearance-none cursor-pointer"
                style={{
                  background: '#f5f7ff',
                  border: '1px solid rgba(79,70,229,0.16)',
                  color: 'var(--qn-text-1)',
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.16)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {strategyTypes.map((strategy) => (
                  <option key={strategy.value} value={strategy.value}>{strategy.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            {selectedStrategy && (
              <div className="mt-4 rounded-xl p-4"
                style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.12)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>
                  {selectedStrategy.description}
                </p>
              </div>
            )}

            {/* Dynamic Fields */}
            {selectedStrategy && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedStrategy.label} Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedStrategy.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                        style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        min={field.min}
                        max={field.max}
                        step={field.step || 1}
                        value={parameters[field.name] ?? ""}
                        onChange={(e) => handleParameterChange(field.name, e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm transition-all"
                        style={{
                          background: '#f5f7ff',
                          border: '1px solid rgba(79,70,229,0.16)',
                          color: 'var(--qn-text-1)',
                          fontFamily: "'JetBrains Mono', monospace",
                          outline: 'none',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.16)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>


          {/* ================================== */}
          {/* Risk Management */}
          {/* ================================== */}

          <div className="qn-card p-6">

            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)', color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
                  3
                </span>
                <h2 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
                  Risk Management
                </h2>
              </div>
              <p className="text-xs ml-8.5" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
                Define your stop loss and target.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Stop Loss */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Stop Loss
                </label>
                <select
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all appearance-none cursor-pointer"
                  style={{
                    background: '#f5f7ff',
                    border: '1px solid rgba(79,70,229,0.16)',
                    color: 'var(--qn-text-1)',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.16)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {stopLossOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Risk Reward */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Target / Risk : Reward
                </label>
                <select
                  value={riskReward}
                  onChange={(e) => setRiskReward(Number(e.target.value))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all appearance-none cursor-pointer"
                  style={{
                    background: '#f5f7ff',
                    border: '1px solid rgba(79,70,229,0.16)',
                    color: 'var(--qn-text-1)',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.16)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {riskRewardOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Risk Calculation Pills */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

              <div className="rounded-xl p-4"
                style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.14)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Stop Loss
                </p>
                <p className="text-xl font-black" style={{ color: 'var(--qn-bear)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {Number(stopLoss).toFixed(2)}%
                </p>
              </div>

              <div className="rounded-xl p-4"
                style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.14)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Risk : Reward
                </p>
                <p className="text-xl font-black" style={{ color: 'var(--qn-indigo)', fontFamily: "'JetBrains Mono', monospace" }}>
                  1 : {Number(riskReward)}
                </p>
              </div>

              <div className="rounded-xl p-4"
                style={{ background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.14)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Potential Reward
                </p>
                <p className="text-xl font-black" style={{ color: 'var(--qn-bull)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {(Number(stopLoss) * Number(riskReward)).toFixed(2)}%
                </p>
              </div>

            </div>
          </div>


          {/* ================================== */}
          {/* Messages */}
          {/* ================================== */}

          {error && (
            <div className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)' }}>
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-medium" style={{ color: 'var(--qn-bear)', fontFamily: "'Inter', sans-serif" }}>
                {error}
              </p>
            </div>
          )}

          {message && (
            <div className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.18)' }}>
              <span className="text-lg">✅</span>
              <p className="text-sm font-medium" style={{ color: 'var(--qn-bull)', fontFamily: "'Inter', sans-serif" }}>
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
              className="qn-btn-primary px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px' }}
            >
              {saving ? "Saving…" : "Save Strategy"}
            </button>
          </div>

        </div>


        {/* ==================================== */}
        {/* RIGHT SIDE — Live Summary */}
        {/* ==================================== */}

        <div className="space-y-5">

          <div className="qn-card p-6 sticky top-6">

            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--qn-indigo)' }} />
              <h2 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
                Strategy Summary
              </h2>
            </div>
            <p className="text-xs mb-5" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
              Live preview of your configuration
            </p>

            <div style={{ borderTop: '1px solid var(--qn-border)', marginBottom: '1.25rem' }} />

            {/* Name */}
            <h3 className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
              {name.trim() ? name : "Your Strategy"}
            </h3>

            {/* Symbol + type */}
            <p className="text-sm mt-1 font-medium" style={{ color: 'var(--qn-text-2)', fontFamily: "'JetBrains Mono', monospace" }}>
              {symbol || "SYMBOL"}
              {" · "}
              {assetTypes.find((item) => item.value === assetType)?.label || assetType}
            </p>

            <p className="text-xs mt-1" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
              {getTradingStyleLabel(tradingStyle)} · {getTimeframeLabel(timeframe)}
            </p>

            <div style={{ borderTop: '1px solid var(--qn-border)', marginTop: '1.25rem', marginBottom: '1.25rem' }} />

            {/* Strategy */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
              Strategy
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--qn-indigo)', fontFamily: "'Space Grotesk', sans-serif" }}>
              {selectedStrategy?.label}
            </p>

            {/* Parameters */}
            <div className="mt-3 space-y-2">
              {selectedStrategy?.fields.map((field) => (
                <div key={field.name} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>
                    {field.label}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{ color: 'var(--qn-text-1)', background: 'rgba(79,70,229,0.07)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {parameters[field.name]}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--qn-border)', marginTop: '1.25rem', marginBottom: '1.25rem' }} />

            {/* Risk */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
              Risk Management
            </p>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>Stop Loss</span>
                <span className="text-xs font-black" style={{ color: 'var(--qn-bear)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {Number(stopLoss).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>Risk : Reward</span>
                <span className="text-xs font-black" style={{ color: 'var(--qn-indigo)', fontFamily: "'JetBrains Mono', monospace" }}>
                  1 : {Number(riskReward)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>Potential Reward</span>
                <span className="text-xs font-black" style={{ color: 'var(--qn-bull)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {(Number(stopLoss) * Number(riskReward)).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Strategy Logic */}
            {(strategyType === "SMA_CROSSOVER" || strategyType === "EMA_CROSSOVER") && (
              <div className="mt-5 rounded-xl p-4"
                style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.12)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Strategy Logic
                </p>
                <p className="text-xs leading-6" style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>
                  <span className="font-semibold" style={{ color: 'var(--qn-bull)' }}>BUY</span> when {strategyType === "SMA_CROSSOVER" ? "SMA" : "EMA"} {parameters.fast_period} crosses above {strategyType === "SMA_CROSSOVER" ? "SMA" : "EMA"} {parameters.slow_period}.<br />
                  <span className="font-semibold" style={{ color: 'var(--qn-bear)' }}>SELL</span> when {strategyType === "SMA_CROSSOVER" ? "SMA" : "EMA"} {parameters.fast_period} crosses below {strategyType === "SMA_CROSSOVER" ? "SMA" : "EMA"} {parameters.slow_period}.
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
        <div className="qn-card p-6 animate-fade-up">

          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--qn-bull)' }} />
            <h2 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
              Paper Trading Result
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="rounded-xl p-4" style={{ background: '#f5f7ff', border: '1px solid var(--qn-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>Signal</p>
              <p className="text-2xl font-black" style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: paperTradeResult.signal === "BUY" ? 'var(--qn-bull)' : paperTradeResult.signal === "SELL" ? 'var(--qn-bear)' : 'var(--qn-gold)',
              }}>
                {paperTradeResult.signal}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#f5f7ff', border: '1px solid var(--qn-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>Action</p>
              <p className="text-xl font-black" style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
                {paperTradeResult.action}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#f5f7ff', border: '1px solid var(--qn-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>Price</p>
              <p className="text-xl font-black" style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{Number(paperTradeResult.price).toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#f5f7ff', border: '1px solid var(--qn-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>Symbol</p>
              <p className="text-xl font-black" style={{ color: 'var(--qn-indigo)', fontFamily: "'JetBrains Mono', monospace" }}>
                {paperTradeResult.symbol}
              </p>
            </div>

          </div>

          {paperTradeResult.message && (
            <p className="mt-5 text-sm font-medium" style={{ color: 'var(--qn-gold)', fontFamily: "'Inter', sans-serif" }}>
              {paperTradeResult.message}
            </p>
          )}

        </div>
      )}


      {/* ====================================== */}
      {/* Saved Strategies */}
      {/* ====================================== */}

      <div className="qn-card p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--qn-text-1)' }}>
              My Strategies
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
              Your saved trading strategies
            </p>
          </div>

          <button
            onClick={loadStrategies}
            disabled={loading}
            className="qn-btn-ghost px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 rounded-xl animate-pulse"
                style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.08)' }} />
            ))}
          </div>

        ) : strategies.length === 0 ? (

          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.12)' }}>
              📋
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--qn-text-2)', fontFamily: "'Space Grotesk', sans-serif" }}>
              No strategies yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
              Create your first strategy using the form above.
            </p>
          </div>

        ) : (

          <div className="space-y-4">
            {strategies.map((strategy) => {
              const savedParameters = strategy.parameters || {};
              return (
                <div
                  key={strategy.id}
                  className="rounded-xl p-5 transition-all"
                  style={{ background: '#f5f7ff', border: '1px solid rgba(79,70,229,0.10)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.22)'; e.currentTarget.style.background = 'rgba(79,70,229,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.10)'; e.currentTarget.style.background = '#f5f7ff'; }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    {/* Details */}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold truncate" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {strategy.name}
                      </h3>
                      <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--qn-text-2)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {strategy.symbol} · {getStrategyLabel(strategy.strategy_type)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
                        {strategy.asset_type || "STOCK"} · {getTradingStyleLabel(strategy.trading_style || "INTRADAY")} · {getTimeframeLabel(strategy.timeframe || "1d")}
                      </p>

                      {/* Parameters */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {Object.entries(savedParameters).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                            style={{
                              background: 'rgba(79,70,229,0.07)',
                              color: 'var(--qn-indigo)',
                              border: '1px solid rgba(79,70,229,0.15)',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {key.replace(/_/g, " ")}: {value}
                          </span>
                        ))}
                      </div>

                      {/* Risk info */}
                      <p className="text-xs mt-3" style={{ color: 'var(--qn-text-3)', fontFamily: "'Inter', sans-serif" }}>
                        <span style={{ color: 'var(--qn-bear)', fontWeight: 600 }}>
                          SL: {strategy.stop_loss_percent ?? "-"}%
                        </span>
                        {" · "}
                        <span style={{ color: 'var(--qn-indigo)', fontWeight: 600 }}>
                          R:R 1:{strategy.risk_reward_ratio ?? "-"}
                        </span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => handlePaperTrade(strategy.id)}
                        disabled={paperTradingId === strategy.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, #059669, #0d9488)',
                          color: '#fff',
                          border: 'none',
                          fontFamily: "'Space Grotesk', sans-serif",
                          boxShadow: '0 4px 12px rgba(5,150,105,0.20)',
                        }}
                      >
                        {paperTradingId === strategy.id ? "Running…" : "Paper Trade"}
                      </button>

                      <button
                        onClick={() => navigate("/backtest", { state: { strategy } })}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                          color: '#fff',
                          border: 'none',
                          fontFamily: "'Space Grotesk', sans-serif",
                          boxShadow: '0 4px 12px rgba(79,70,229,0.20)',
                        }}
                      >
                        Backtest
                      </button>

                      <button
                        onClick={() => handleDelete(strategy.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: 'rgba(220,38,38,0.07)',
                          color: 'var(--qn-bear)',
                          border: '1px solid rgba(220,38,38,0.18)',
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.07)'; }}
                      >
                        Delete
                      </button>
                    </div>

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
