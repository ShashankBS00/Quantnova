import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export async function getStrategies() {
  const response = await axios.get(
    `${API_URL}/strategy/`
  );

  return response.data;
}

export async function createStrategy(strategy) {
  const response = await axios.post(
    `${API_URL}/strategy/`,
    strategy
  );

  return response.data;
}

export async function deleteStrategy(id) {
  const response = await axios.delete(
    `${API_URL}/strategy/${id}`
  );

  return response.data;
}