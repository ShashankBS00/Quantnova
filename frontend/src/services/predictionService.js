import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const predictionApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const getPrediction = async (
  symbol,
  timeframe = "1d"
) => {
  try {
    const response = await predictionApi.get(
      "/prediction/predict",
      {
        params: {
          symbol,
          timeframe,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Prediction API Error:",
      error
    );

    if (error.response) {
      throw new Error(
        error.response.data?.detail ||
          "Prediction request failed."
      );
    }

    if (error.request) {
      throw new Error(
        "Cannot connect to QuantNova backend."
      );
    }

    throw new Error(
      error.message ||
        "Something went wrong."
    );
  }
};

export default predictionApi;