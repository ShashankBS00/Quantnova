import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

// --------------------------------
// Get Strategies
// --------------------------------

export async function getStrategies() {
  const response = await axios.get(
    `${API_URL}/strategy/`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
}

// --------------------------------
// Create Strategy
// --------------------------------

export async function createStrategy(strategy) {
  const response = await axios.post(
    `${API_URL}/strategy/`,
    strategy,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
}

// --------------------------------
// Delete Strategy
// --------------------------------

export async function deleteStrategy(id) {
  const response = await axios.delete(
    `${API_URL}/strategy/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
}