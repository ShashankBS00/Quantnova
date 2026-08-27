import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "@/services/authService";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    // Username validation
    if (!username.trim()) {
      setError("Enter a username.");
      return;
    }

    // Email validation
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }

    // Password validation
    if (!password) {
      setError("Enter a password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const data = await registerUser({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      console.log(
        "Registration successful:",
        data
      );

      setMessage(
        "Registration successful! Redirecting to login..."
      );

      // Clear form
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Go to login
      setTimeout(() => {
        navigate("/login");
      }, 1000);

    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Registration failed. Please try again."
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


        {/* Registration Card */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">

          <h2 className="text-2xl font-bold text-white">
            Create Account
          </h2>

          <p className="text-slate-400 mt-2 mb-6">
            Create your QuantNova account
          </p>


          <form
            onSubmit={handleRegister}
            className="space-y-5"
          >

            {/* Username */}

            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Enter username"
                autoComplete="username"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              />

            </div>


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
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              />

            </div>


            {/* Confirm Password */}

            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Re-enter password"
                autoComplete="new-password"
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


            {/* Success */}

            {message && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">

                <p className="text-sm text-green-400">
                  {message}
                </p>

              </div>
            )}


            {/* Register Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>


          {/* Login Link */}

          <div className="text-center mt-6">

            <p className="text-sm text-slate-400">

              Already have an account?{" "}

              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign In
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}