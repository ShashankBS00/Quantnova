import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getMarketHistory = async (
  symbol = "RELIANCE.NS",
  period = "1mo"
) => {
  const response = await API.get("/market/history", {
    params: {
      symbol,
      period,
    },
  });

  return response.data;
};