export const strategyTypes = [
  {
    value: "SMA_CROSSOVER",
    label: "SMA Crossover",
    description:
      "Buy when the fast SMA is above the slow SMA and sell when the fast SMA is below the slow SMA.",
  },

  {
    value: "EMA_CROSSOVER",
    label: "EMA Crossover",
    description:
      "Buy when the fast EMA is above the slow EMA and sell when the fast EMA is below the slow EMA.",
  },

  {
    value: "SMA_EMA_TREND",
    label: "SMA + EMA Trend",
    description:
      "Uses the fast EMA, slow SMA, and current price to generate BUY, SELL, or HOLD signals.",
  },
];

export const assetTypes = [
  {
    value: "STOCK",
    label: "Stocks",
  },
];

export const timeframes = [
  {
    value: "1d",
    label: "1 Day",
  },
];