import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


// ==========================================
// Get Trading Account
// ==========================================

export async function getTradingAccount() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await axios.get(
    `${API_URL}/trading/account`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}


// ==========================================
// Run Paper Trade
// ==========================================

export async function runPaperTrade(strategyId) {
  const token = localStorage.getItem("access_token");

  console.log(
    "Paper Trade Token:",
    token
  );

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await axios.post(
    `${API_URL}/paper-trading/run/${strategyId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}