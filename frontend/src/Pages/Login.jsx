import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "@/services/authService";
import { motion, AnimatePresence } from "framer-motion";

// Floating particles data
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 1,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 4,
}));

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Enter your email."); return; }
    if (!password)     { setError("Enter your password."); return; }

    try {
      setLoading(true);
      const data = await loginUser({ email: email.trim(), password });
      console.log("LOGIN RESPONSE:", data);

      // Save authentication information
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.15 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(30, 41, 59, 0.85)",
    border: "1px solid rgba(71,85,105,0.5)",
    borderRadius: "0.75rem",
    padding: "0.8rem 1rem",
    color: "#f1f5f9",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 20% 50%, #0f172a 0%, #020617 60%, #0a0a1a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', 'Geist Variable', system-ui, sans-serif",
      }}
    >
      {/* Ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.14, 0.24, 0.14] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "-10%", left: "-15%",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.22, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute", bottom: "-15%", right: "-10%",
          width: "500px", height: "500px",
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        style={{
          position: "absolute", top: "50%", right: "20%",
          width: "300px", height: "300px",
          background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          animate={{ y: [-18, 18, -18], opacity: [0.15, 0.55, 0.15] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            background: "rgba(99,102,241,0.65)",
            borderRadius: "50%", pointerEvents: "none",
          }}
        />
      ))}

      {/* Main card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 10 }}
      >
        {/* Logo */}
        <motion.div variants={itemVariants} style={{ textAlign: "center", marginBottom: "2rem" }}>
          <motion.h1
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
            style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0, display: "inline-block" }}
          >
            Quant<span style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Nova</span>
          </motion.h1>
          <p style={{ color: "#475569", marginTop: "0.4rem", fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            AI Trading Platform
          </p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          variants={itemVariants}
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: "1.5rem",
            padding: "2.5rem",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px -12px rgba(0,0,0,0.7), 0 0 80px -20px rgba(99,102,241,0.15)",
          }}
        >
          <motion.h2 variants={itemVariants} style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Welcome Back
          </motion.h2>
          <motion.p variants={itemVariants} style={{ color: "#64748b", marginTop: "0.35rem", marginBottom: "1.75rem", fontSize: "0.9rem" }}>
            Sign in to your QuantNova account
          </motion.p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

            {/* Email */}
            <motion.div variants={itemVariants}>
              <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: "0.45rem", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Email
              </label>
              <motion.div
                animate={{ boxShadow: focused === "email" ? "0 0 0 2px rgba(99,102,241,0.55), 0 0 20px rgba(99,102,241,0.12)" : "0 0 0 0 transparent" }}
                transition={{ duration: 0.2 }}
                style={{ borderRadius: "0.75rem" }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle}
                />
              </motion.div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants}>
              <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: "0.45rem", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Password
              </label>
              <motion.div
                animate={{ boxShadow: focused === "password" ? "0 0 0 2px rgba(99,102,241,0.55), 0 0 20px rgba(99,102,241,0.12)" : "0 0 0 0 transparent" }}
                transition={{ duration: 0.2 }}
                style={{ borderRadius: "0.75rem" }}
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={inputStyle}
                />
              </motion.div>
            </motion.div>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "0.65rem",
                    padding: "0.65rem 1rem",
                  }}
                >
                  <p style={{ color: "#f87171", fontSize: "0.85rem", margin: 0 }}>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  borderRadius: "0.75rem",
                  background: loading ? "rgba(79,70,229,0.5)" : "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 24px -4px rgba(99,102,241,0.55)",
                  position: "relative",
                  overflow: "hidden",
                  letterSpacing: "0.01em",
                  fontFamily: "inherit",
                }}
              >
                {/* Shimmer sweep */}
                {!loading && (
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                    style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)",
                      pointerEvents: "none",
                    }}
                  />
                )}
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                      style={{
                        display: "inline-block", width: "14px", height: "14px",
                        border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%",
                      }}
                    />
                    Signing in...
                  </span>
                ) : "Sign In"}
              </motion.button>
            </motion.div>
          </form>

          {/* Register link */}
          <motion.div variants={itemVariants} style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                style={{ color: "#818cf8", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={(e) => (e.target.style.color = "#a5b4fc")}
                onMouseLeave={(e) => (e.target.style.color = "#818cf8")}
              >
                Create Account →
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Security badge */}
        <motion.p
          variants={itemVariants}
          style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.75rem", color: "#1e293b", letterSpacing: "0.04em" }}
        >
          🔒 Secured with 256-bit encryption
        </motion.p>
      </motion.div>
    </div>
  );
}