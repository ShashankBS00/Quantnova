// ==========================================
// Strategy Types
// ==========================================

export const strategyTypes = [
  {
    value: "SMA_CROSSOVER",
    label: "SMA Crossover",
    description:
      "Uses two user-defined SMA periods. BUY when the fast SMA crosses above the slow SMA and SELL when it crosses below.",
    fields: [
      {
        name: "fast_period",
        label: "Fast SMA Period",
        type: "number",
        defaultValue: 20,
        min: 1,
      },
      {
        name: "slow_period",
        label: "Slow SMA Period",
        type: "number",
        defaultValue: 50,
        min: 2,
      },
    ],
  },

  {
    value: "EMA_CROSSOVER",
    label: "EMA Crossover",
    description:
      "Uses two user-defined EMA periods. BUY when the fast EMA crosses above the slow EMA and SELL when it crosses below.",
    fields: [
      {
        name: "fast_period",
        label: "Fast EMA Period",
        type: "number",
        defaultValue: 20,
        min: 1,
      },
      {
        name: "slow_period",
        label: "Slow EMA Period",
        type: "number",
        defaultValue: 50,
        min: 2,
      },
    ],
  },

  {
    value: "SMA_EMA_TREND",
    label: "SMA + EMA Trend",
    description:
      "Uses a fast EMA, slow SMA, and current price to determine the market trend.",
    fields: [
      {
        name: "fast_period",
        label: "Fast EMA Period",
        type: "number",
        defaultValue: 20,
        min: 1,
      },
      {
        name: "slow_period",
        label: "Slow SMA Period",
        type: "number",
        defaultValue: 50,
        min: 2,
      },
    ],
  },

  // ==========================================
  // RSI
  // ==========================================

  {
    value: "RSI",
    label: "RSI",
    description:
      "Uses Relative Strength Index to identify overbought and oversold market conditions.",
    fields: [
      {
        name: "period",
        label: "RSI Period",
        type: "number",
        defaultValue: 14,
        min: 2,
      },
      {
        name: "oversold",
        label: "Oversold",
        type: "number",
        defaultValue: 30,
        min: 1,
        max: 99,
      },
      {
        name: "overbought",
        label: "Overbought",
        type: "number",
        defaultValue: 70,
        min: 1,
        max: 99,
      },
    ],
  },

  // ==========================================
  // MACD
  // ==========================================

  {
    value: "MACD",
    label: "MACD",
    description:
      "Uses MACD and signal line crossover to generate trading signals.",
    fields: [
      {
        name: "fast_period",
        label: "Fast Period",
        type: "number",
        defaultValue: 12,
        min: 1,
      },
      {
        name: "slow_period",
        label: "Slow Period",
        type: "number",
        defaultValue: 26,
        min: 2,
      },
      {
        name: "signal_period",
        label: "Signal Period",
        type: "number",
        defaultValue: 9,
        min: 1,
      },
    ],
  },

  // ==========================================
  // Bollinger Bands
  // ==========================================

  {
    value: "BOLLINGER_BANDS",
    label: "Bollinger Bands",
    description:
      "Uses Bollinger Bands to identify price movement around the moving average.",
    fields: [
      {
        name: "period",
        label: "Period",
        type: "number",
        defaultValue: 20,
        min: 2,
      },
      {
        name: "std_deviation",
        label: "Standard Deviation",
        type: "number",
        defaultValue: 2,
        min: 0.1,
        step: 0.1,
      },
    ],
  },

  // ==========================================
  // VWAP + EMA
  // ==========================================

  {
    value: "VWAP_EMA",
    label: "VWAP + EMA",
    description:
      "Uses VWAP crossover confirmed by EMA trend. BUY when price crosses above VWAP and is above EMA; SELL when price crosses below VWAP and is below EMA.",
    fields: [
      {
        name: "ema_period",
        label: "EMA Period",
        type: "number",
        defaultValue: 20,
        min: 2,
      },
    ],
  },

  // ==========================================
  // Supertrend
  // ==========================================

  {
    value: "SUPERTREND",
    label: "Supertrend",
    description:
      "Uses ATR-based Supertrend indicator. BUY when price crosses above the Supertrend line; SELL when price crosses below it.",
    fields: [
      {
        name: "period",
        label: "ATR Period",
        type: "number",
        defaultValue: 10,
        min: 2,
      },
      {
        name: "multiplier",
        label: "Multiplier",
        type: "number",
        defaultValue: 3,
        min: 0.1,
        step: 0.1,
      },
    ],
  },

  // ==========================================
  // ADX + EMA
  // ==========================================

  {
    value: "ADX_EMA",
    label: "ADX + EMA",
    description:
      "Uses ADX to confirm trend strength and EMA for direction. BUY when ADX > threshold and price crosses above EMA; SELL when ADX > threshold and price crosses below EMA.",
    fields: [
      {
        name: "adx_period",
        label: "ADX Period",
        type: "number",
        defaultValue: 14,
        min: 2,
      },
      {
        name: "ema_period",
        label: "EMA Period",
        type: "number",
        defaultValue: 20,
        min: 2,
      },
      {
        name: "adx_threshold",
        label: "ADX Threshold",
        type: "number",
        defaultValue: 25,
        min: 1,
        max: 100,
      },
    ],
  },
  {
  value: "CAMARILLA_EMA20",
  label: "Camarilla Pivot + EMA 20",
  description:
    "Camarilla Pivot levels with EMA 20 confirmation. Price touches S2-S5 for BUY or R2-R5 for SELL, followed by an EMA 20 cross within the confirmation window.",
  fields: [
    {
      name: "confirmation_bars",
      label: "Confirmation Window",
      type: "number",
      defaultValue: 3,
      min: 1,
      max: 3,
    },
  ],
}
];



// ==========================================
// Asset Types
// ==========================================

export const assetTypes = [
  {
    value: "STOCK",
    label: "Stock",
  },

  {
    value: "INDEX",
    label: "Index",
  },

  {
    value: "ETF",
    label: "ETF",
  },
];


// ==========================================
// Trading Styles
// ==========================================

export const tradingStyles = [
  {
    value: "INTRADAY",
    label: "Intraday",
  },

  {
    value: "SWING",
    label: "Swing",
  },

  {
    value: "POSITION",
    label: "Position",
  },
];


// ==========================================
// Timeframes
// ==========================================

export const timeframes = [
  {
    value: "1m",
    label: "1 Minute",
    styles: ["INTRADAY"],
  },

  {
    value: "3m",
    label: "3 Minutes",
    styles: ["INTRADAY"],
  },

  {
    value: "5m",
    label: "5 Minutes",
    styles: ["INTRADAY"],
  },

  {
    value: "10m",
    label: "10 Minutes",
    styles: ["INTRADAY"],
  },

  {
    value: "15m",
    label: "15 Minutes",
    styles: ["INTRADAY"],
  },

  {
    value: "30m",
    label: "30 Minutes",
    styles: ["INTRADAY"],
  },

  {
    value: "1h",
    label: "1 Hour",
    styles: [
      "INTRADAY",
      "SWING",
    ],
  },

  {
    value: "2h",
    label: "2 Hours",
    styles: ["SWING"],
  },

  {
    value: "4h",
    label: "4 Hours",
    styles: ["SWING"],
  },

  {
    value: "1d",
    label: "1 Day",
    styles: [
      "INTRADAY",
      "SWING",
      "POSITION",
    ],
  },

  {
    value: "1wk",
    label: "1 Week",
    styles: ["POSITION"],
  },

  {
    value: "1mo",
    label: "1 Month",
    styles: ["POSITION"],
  },
];


// ==========================================
// Stop Loss Options
// ==========================================

export const stopLossOptions = [
  {
    value: 0.5,
    label: "0.5%",
  },

  {
    value: 1,
    label: "1%",
  },

  {
    value: 1.5,
    label: "1.5%",
  },

  {
    value: 2,
    label: "2%",
  },

  {
    value: 3,
    label: "3%",
  },

  {
    value: 5,
    label: "5%",
  },

  {
    value: 10,
    label: "10%",
  },
];


// ==========================================
// Risk / Reward Options
// ==========================================

export const riskRewardOptions = [
  {
    value: 1,
    label: "1 : 1",
  },

  {
    value: 1.5,
    label: "1 : 1.5",
  },

  {
    value: 2,
    label: "1 : 2",
  },

  {
    value: 3,
    label: "1 : 3",
  },

  {
    value: 4,
    label: "1 : 4",
  },

  {
    value: 5,
    label: "1 : 5",
  },
];