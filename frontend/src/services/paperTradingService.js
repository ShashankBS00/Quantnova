import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

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