import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export async function runPaperTrade(strategyId) {
  const response = await axios.post(
    `${API_URL}/paper-trading/run/${strategyId}`
  );

  return response.data;
}