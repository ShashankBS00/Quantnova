import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export async function runBacktest({
  symbol,
  strategyType = "SMA_CROSSOVER",
  fastPeriod,
  slowPeriod,
  initialCash = 100000,
}) {
  const response = await axios.post(
    `${API_URL}/backtest/run`,
    {
      symbol,
      strategy_type: strategyType,
      fast_period: Number(fastPeriod),
      slow_period: Number(slowPeriod),
      initial_cash: Number(initialCash),
    }
  );

  return response.data;
}