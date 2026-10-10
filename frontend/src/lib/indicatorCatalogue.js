// ─── Indicator catalogue (constants only) ─────────────────────────────────────
// Kept in a separate file so IndicatorsMenu.jsx only exports React components
// (required by react-refresh/only-export-components).

export const INDICATOR_CATALOGUE = [
  // Trend
  {
    id: "sma",
    label: "SMA",
    fullName: "Simple Moving Average",
    category: "Trend",
    defaultParams: { period: 20 },
    paramDefs: [{ key: "period", label: "Period", min: 1, max: 500, type: "number" }],
    pane: "price",
  },
  {
    id: "ema",
    label: "EMA",
    fullName: "Exponential Moving Average",
    category: "Trend",
    defaultParams: { period: 20 },
    paramDefs: [{ key: "period", label: "Period", min: 1, max: 500, type: "number" }],
    pane: "price",
  },
  {
    id: "vwap",
    label: "VWAP",
    fullName: "Volume Weighted Average Price",
    category: "Trend",
    defaultParams: {},
    paramDefs: [],
    pane: "price",
  },
  {
    id: "supertrend",
    label: "Supertrend",
    fullName: "Supertrend",
    category: "Trend",
    defaultParams: { atrPeriod: 10, multiplier: 3 },
    paramDefs: [
      { key: "atrPeriod", label: "ATR Period", min: 1, max: 100, type: "number" },
      { key: "multiplier", label: "Multiplier", min: 0.1, max: 20, step: 0.1, type: "number" },
    ],
    pane: "price",
  },
  // Momentum
  {
    id: "rsi",
    label: "RSI",
    fullName: "Relative Strength Index",
    category: "Momentum",
    defaultParams: { period: 14, overbought: 70, oversold: 30 },
    paramDefs: [
      { key: "period", label: "Period", min: 2, max: 200, type: "number" },
      { key: "overbought", label: "Overbought", min: 50, max: 100, type: "number" },
      { key: "oversold", label: "Oversold", min: 0, max: 50, type: "number" },
    ],
    pane: "oscillator",
  },
  {
    id: "macd",
    label: "MACD",
    fullName: "MACD",
    category: "Momentum",
    defaultParams: { fast: 12, slow: 26, signal: 9 },
    paramDefs: [
      { key: "fast", label: "Fast", min: 1, max: 100, type: "number" },
      { key: "slow", label: "Slow", min: 1, max: 200, type: "number" },
      { key: "signal", label: "Signal", min: 1, max: 50, type: "number" },
    ],
    pane: "oscillator",
  },
  {
    id: "adx",
    label: "ADX",
    fullName: "Average Directional Index",
    category: "Momentum",
    defaultParams: { period: 14 },
    paramDefs: [{ key: "period", label: "Period", min: 2, max: 100, type: "number" }],
    pane: "oscillator",
  },
  // Volatility
  {
    id: "bb",
    label: "BB",
    fullName: "Bollinger Bands",
    category: "Volatility",
    defaultParams: { period: 20, stdDev: 2 },
    paramDefs: [
      { key: "period", label: "Period", min: 2, max: 500, type: "number" },
      { key: "stdDev", label: "Std Dev", min: 0.1, max: 10, step: 0.1, type: "number" },
    ],
    pane: "price",
  },
  {
    id: "atr",
    label: "ATR",
    fullName: "Average True Range",
    category: "Volatility",
    defaultParams: { period: 14 },
    paramDefs: [{ key: "period", label: "Period", min: 1, max: 200, type: "number" }],
    pane: "oscillator",
  },
  // Volume
  {
    id: "volume",
    label: "Volume",
    fullName: "Volume",
    category: "Volume",
    defaultParams: {},
    paramDefs: [],
    pane: "volume",
  },
  // Pivot
  {
    id: "pivot_standard",
    label: "Pivot",
    fullName: "Standard Pivot Points",
    category: "Pivot",
    defaultParams: {},
    paramDefs: [],
    pane: "price",
  },
  {
    id: "pivot_camarilla",
    label: "Camarilla",
    fullName: "Camarilla Pivot Points",
    category: "Pivot",
    defaultParams: {},
    paramDefs: [],
    pane: "price",
  },
];

export const INDICATOR_CATEGORIES = ["Trend", "Momentum", "Volatility", "Volume", "Pivot"];
