import axios from "axios";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


const predictionApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});


// ============================================================
// AI PREDICTION
// ============================================================

export const getPrediction = async (
  symbol,
  timeframe = "1d"
) => {

  try {

    const response =
      await predictionApi.get(
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


// ============================================================
// STOCK SEARCH
// ============================================================

export const searchStocks = async (
  query,
  limit = 10
) => {

  try {

    const response =
      await predictionApi.get(
        "/market/search",
        {
          params: {
            q: query,
            limit,
          },
        }
      );

    return response.data;

  } catch (error) {

    console.error(
      "Stock Search API Error:",
      error
    );

    if (error.response) {

      throw new Error(
        error.response.data?.detail ||
        "Stock search failed."
      );

    }

    if (error.request) {

      throw new Error(
        "Cannot connect to QuantNova backend."
      );

    }

    throw new Error(
      error.message ||
      "Stock search failed."
    );
  }
};

// ============================================================
// PREDICTION HISTORY
// ============================================================

export const getPredictionHistory = async (
  symbol,
  timeframe = "1d",
  limit = 50
) => {

  try {

    const response =
      await predictionApi.get(
        "/prediction/history",
        {
          params: {
            symbol,
            timeframe,
            limit,
          },
        }
      );

    return response.data;

  } catch (error) {

    console.error(
      "Prediction History API Error:",
      error
    );

    if (error.response) {

      throw new Error(
        error.response.data?.detail ||
        "Failed to load prediction history."
      );

    }

    if (error.request) {

      throw new Error(
        "Cannot connect to QuantNova backend."
      );

    }

    throw new Error(
      error.message ||
      "Failed to load prediction history."
    );
  }
};


// ============================================================
// PREDICTION PERFORMANCE
// ============================================================

export const getPredictionPerformance = async (
  symbol,
  timeframe = "1d"
) => {

  try {

    const response =
      await predictionApi.get(
        "/prediction/performance",
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
      "Prediction Performance API Error:",
      error
    );

    if (error.response) {

      throw new Error(
        error.response.data?.detail ||
        "Failed to load prediction performance."
      );

    }

    if (error.request) {

      throw new Error(
        "Cannot connect to QuantNova backend."
      );

    }

    throw new Error(
      error.message ||
      "Failed to load prediction performance."
    );
  }
};


// ============================================================
// MANUAL VERIFICATION
// ============================================================

export const verifyPredictionHistory = async (
  symbol,
  timeframe = "1d"
) => {

  try {

    const response =
      await predictionApi.post(
        "/prediction/history/verify",
        null,
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
      "Prediction Verification API Error:",
      error
    );

    if (error.response) {

      throw new Error(
        error.response.data?.detail ||
        "Failed to verify predictions."
      );

    }

    if (error.request) {

      throw new Error(
        "Cannot connect to QuantNova backend."
      );

    }

    throw new Error(
      error.message ||
      "Failed to verify predictions."
    );
  }
};


export default predictionApi;