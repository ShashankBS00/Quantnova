import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export async function placeOrder(order) {
  const response = await axios.post(
    `${API_URL}/trading/order`,
    order
  );

  return response.data;
}

export async function getTradingAccount() {
  const response = await axios.get(
    `${API_URL}/trading/account`
  );

  return response.data;
}