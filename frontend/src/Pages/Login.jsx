import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "@/services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser({
        email: email.trim(),
        password,
      });

      // Save authentication information
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Go to dashboard
      navigate("/");

    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Invalid email or password."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Logo / Title */}

        <div className="text-center mb-8">

          <h1 className="text-4xl font-bold text-white">
            QuantNova
          </h1>

          <p className="text-slate-400 mt-2">
            AI Trading Platform
          </p>

        </div>


        {/* Login Card */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">

          <h2 className="text-2xl font-bold text-white">
            Welcome Back
          </h2>

          <p className="text-slate-400 mt-2 mb-6">
            Sign in to your QuantNova account
          </p>


          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email */}

            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              />

            </div>


            {/* Password */}

            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              />

            </div>


            {/* Error */}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">

                <p className="text-sm text-red-400">
                  {error}
                </p>

              </div>
            )}


            {/* Login Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>


          {/* Register */}

          <div className="text-center mt-6">

            <p className="text-sm text-slate-400">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Create Account
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}