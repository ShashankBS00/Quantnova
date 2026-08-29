import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


// ==========================================
// Get Token
// ==========================================

function getToken() {
  const token = localStorage.getItem("access_token");

  console.log("Access Token:", token);

  if (!token) {
    throw new Error("Not authenticated");
  }

  return token;
}


// ==========================================
// Get Trading Account
// ==========================================

export async function getTradingAccount() {
  const token = getToken();

  const response = await axios.get(
    `${API_URL}/trading/account`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log(
    "Trading Account:",
    response.data
  );

  return response.data;
}


// ==========================================
// Place Paper Trading Order
// ==========================================

export async function placeOrder(order) {
  const token = getToken();

  const response = await axios.post(
    `${API_URL}/trading/order`,
    order,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log(
    "Order Response:",
    response.data
  );

  return response.data;
}