import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export async function registerUser({
  username,
  email,
  password,
}) {
  const response = await axios.post(
    `${API_URL}/auth/register`,
    {
      username,
      email,
      password,
    }
  );

  return response.data;
}


export async function loginUser({
  email,
  password,
}) {
  const response = await axios.post(
    `${API_URL}/auth/login`,
    {
      email,
      password,
    }
  );

  return response.data;
}