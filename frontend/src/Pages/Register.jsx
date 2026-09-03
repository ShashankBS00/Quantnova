import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "@/services/authService";
import { motion, AnimatePresence } from "framer-motion";

// Floating particles data (stable across renders)
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 17) % 100,
  size: (i % 3) + 1.2,
  duration: 7 + (i % 5),
  delay: (i * 0.4) % 4,
}));

// Password strength helper
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score, label: "Fair", color: "#f59e0b" };
  if (score <= 3) return { score, label: "Good", color: "#3b82f6" };
  return { score, label: "Strong", color: "#22c55e" };
}

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(null);

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!username.trim()) { setError("Enter a username."); return; }
    if (!email.trim())    { setError("Enter your email."); return; }
    if (!password)        { setError("Enter a password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    try {
      setLoading(true);
      const data = await registerUser({ username: username.trim(), email: email.trim(), password });
      console.log("Registration successful:", data);
      setMessage("Registration successful! Redirecting to login...");

      // Clear form
      setUsername(""); setEmail(""); setPassword(""); setConfirmPassword("");

      // Go to login
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      console.error("Registration failed:", error);
      setError(error.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.48, ease: [0.23, 1, 0.32, 1] } },
  };

  const inputStyle = (field) => ({
    width: "100%",
    background: "rgba(30, 41, 59, 0.85)",
    border: `1px solid ${focused === field ? "rgba(99,102,241,0.5)" : "rgba(71,85,105,0.5)"}`,
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    color: "#f1f5f9",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  });

  const focusStyle = (field) => ({
    boxShadow: focused === field
      ? "0 0 0 2px rgba(99,102,241,0.5), 0 0 20px rgba(99,102,241,0.1)"
      : "0 0 0 0 transparent",
    borderRadius: "0.75rem",
    transition: "box-shadow 0.2s",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 80% 20%, #0f172a 0%, #020617 55%, #0a0a1a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', 'Geist Variable', system-ui, sans-serif",
      }}
    >
      {/* Ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "-5%", right: "-10%",
          width: "550px", height: "550px",
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        style={{
          position: "absolute", bottom: "-10%", left: "-15%",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        style={{
          position: "absolute", top: "40%", left: "30%",
          width: "250px", height: "250px",
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          animate={{ y: [-15, 15, -15], opacity: [0.12, 0.5, 0.12] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            background: "rgba(139,92,246,0.7)",
            borderRadius: "50%", pointerEvents: "none",
          }}
        />
      ))}

      {/* Main card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 10 }}
      >
        {/* Logo */}
        <motion.div variants={itemVariants} style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <motion.h1
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 400 }}
            style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0, display: "inline-block" }}
          >
            Quant<span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Nova</span>
          </motion.h1>
          <p style={{ color: "#475569", marginTop: "0.4rem", fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            AI Trading Platform
          </p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          variants={itemVariants}
          style={{
            background: "rgba(15, 23, 42, 0.78)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: "1.5rem",
            padding: "2.25rem",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px -12px rgba(0,0,0,0.7), 0 0 80px -20px rgba(139,92,246,0.12)",
          }}
        >
          <motion.h2 variants={itemVariants} style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Create Account
          </motion.h2>
          <motion.p variants={itemVariants} style={{ color: "#64748b", marginTop: "0.3rem", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Join QuantNova and start trading smarter
          </motion.p>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>

            {/* Username */}
            <motion.div variants={itemVariants}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.4rem", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Username
              </label>
              <div style={focusStyle("username")}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused("username")}
                  onBlur={() => setFocused(null)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  style={inputStyle("username")}
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.4rem", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Email
              </label>
              <div style={focusStyle("email")}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle("email")}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.4rem", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Password
              </label>
              <div style={focusStyle("password")}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  style={inputStyle("password")}
                />
              </div>
              {/* Strength meter */}
              <AnimatePresence>
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: "0.5rem", overflow: "hidden" }}
                  >
                    <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ backgroundColor: pwStrength.score >= i ? pwStrength.color : "rgba(71,85,105,0.4)" }}
                          transition={{ duration: 0.3 }}
                          style={{ flex: 1, height: "3px", borderRadius: "99px" }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: "0.72rem", color: pwStrength.color, margin: 0, fontWeight: 500 }}>
                      {pwStrength.label}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={itemVariants}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.4rem", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Confirm Password
              </label>
              <div style={focusStyle("confirm")}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocused("confirm")}
                  onBlur={() => setFocused(null)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  style={{
                    ...inputStyle("confirm"),
                    borderColor: confirmPassword && confirmPassword !== password
                      ? "rgba(239,68,68,0.5)"
                      : confirmPassword && confirmPassword === password
                      ? "rgba(34,197,94,0.5)"
                      : inputStyle("confirm").border,
                  }}
                />
              </div>
              {/* Match indicator */}
              <AnimatePresence>
                {confirmPassword && (
                  <motion.p
                    key={confirmPassword === password ? "match" : "no-match"}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontSize: "0.72rem",
                      margin: "4px 0 0 0",
                      color: confirmPassword === password ? "#22c55e" : "#ef4444",
                      fontWeight: 500,
                    }}
                  >
                    {confirmPassword === password ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </motion.p>
                )}
              </AnimatePresence>
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

            {/* Success */}
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    borderRadius: "0.65rem",
                    padding: "0.65rem 1rem",
                  }}
                >
                  <p style={{ color: "#4ade80", fontSize: "0.85rem", margin: 0 }}>✓ {message}</p>
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
                  background: loading ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg, #6d28d9 0%, #4f46e5 50%, #3b82f6 100%)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 24px -4px rgba(139,92,246,0.5)",
                  position: "relative",
                  overflow: "hidden",
                  letterSpacing: "0.01em",
                  fontFamily: "inherit",
                }}
              >
                {/* Shimmer */}
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
                    Creating Account...
                  </span>
                ) : "Create Account"}
              </motion.button>
            </motion.div>
          </form>

          {/* Login link */}
          <motion.div variants={itemVariants} style={{ textAlign: "center", marginTop: "1.35rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{ color: "#818cf8", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={(e) => (e.target.style.color = "#a5b4fc")}
                onMouseLeave={(e) => (e.target.style.color = "#818cf8")}
              >
                Sign In →
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Trust badge */}
        <motion.p
          variants={itemVariants}
          style={{ textAlign: "center", marginTop: "1.35rem", fontSize: "0.75rem", color: "#1e293b", letterSpacing: "0.04em" }}
        >
          🔒 Your data is always secure with us
        </motion.p>
      </motion.div>
    </div>
  );
}