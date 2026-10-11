import { useState } from "react";
import {
  Activity,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Eye,
  EyeOff,
  Key,
  Layers,
  RefreshCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  User,
  Wallet,
  Zap,
} from "lucide-react";

const labelStyle = { color: "#64748b", fontFamily: "'JetBrains Mono', monospace" };

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500" style={labelStyle}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange, children, iconBg = "rgba(79, 70, 229, 0.10)", iconColor = "#4f46e5" }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl p-4 transition-all"
      style={{ background: "#ffffff", border: "1px solid rgba(99, 102, 241, 0.14)" }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon size={17} />
        </span>
        <div>
          <h4 className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {title}
          </h4>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <div className="self-end sm:self-auto">
        {children || (
          <button
            type="button"
            onClick={() => onChange(!checked)}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none"
            style={{
              background: checked ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#cbd5e1",
            }}
            aria-pressed={checked}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform"
              style={{
                left: "2px",
                transform: checked ? "translateX(20px)" : "translateX(0)",
              }}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile"); // profile | algo | risk | api | system
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Profile state
  const [profile, setProfile] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    return {
      username: savedUser?.username || "ram",
      email: savedUser?.email || "ram@gmail.com",
      role: "Quantitative Trader / MCA Student",
      experience: "Intermediate (Systematic Backtesting)",
      workspace: "QuantNova Alpha Lab",
    };
  });

  // Algo settings state (for existing algorithms)
  const [algoSettings, setAlgoSettings] = useState(() => {
    return (
      JSON.parse(localStorage.getItem("quantnova_algo_settings") || "null") || {
        defaultStrategy: "SMA_CROSSOVER",
        autoExecute: false,
        minConfidence: 65,
        defaultTimeframe: "15m",
        maxConcurrentAlgos: 3,
        capitalPerAlgo: 25000,
        riskRewardRatio: "1:2",
        rebalanceFrequency: "Hourly",
        xgboostThreshold: 0.62,
        enableSlippageModel: true,
      }
    );
  });

  // Risk settings state
  const [riskSettings, setRiskSettings] = useState(() => {
    return (
      JSON.parse(localStorage.getItem("quantnova_risk_settings") || "null") || {
        defaultSlippage: 0.05,
        maxPositionSize: 25000,
        maxDrawdownLimit: 5,
        defaultStopLoss: 1.5,
        autoTrailingStop: true,
        executionMode: "paper",
        dailyLossHalt: 10000,
      }
    );
  });

  // Broker API state
  const [apiKeys, setApiKeys] = useState(() => {
    return (
      JSON.parse(localStorage.getItem("quantnova_api_keys") || "null") || {
        broker: "Zerodha Kite",
        apiKey: "••••••••••••••••",
        apiSecret: "••••••••••••••••",
        fastApiUrl: "http://127.0.0.1:8000",
        environment: "Sandbox (Simulated Paper)",
      }
    );
  });

  // System preferences state
  const [preferences, setPreferences] = useState({
    audioAlerts: true,
    pollingInterval: "10s",
    compactTables: false,
    emailDailyReport: true,
    highContrastBadges: true,
  });

  const tabs = [
    { id: "profile", label: "Profile & Identity", icon: User, badge: "Account" },
    { id: "algo", label: "Algo & Strategy Engine", icon: Bot, badge: "Algos" },
    { id: "risk", label: "Risk & Execution Guardrails", icon: ShieldCheck, badge: "Safety" },
    { id: "api", label: "Broker Connections", icon: Key, badge: "API" },
    { id: "system", label: "System Preferences", icon: Sliders, badge: "Engine" },
  ];

  const inputClass =
    "w-full rounded-xl px-4 py-2.5 text-sm transition-all text-slate-800 bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10";

  function handleSaveAll() {
    localStorage.setItem("user", JSON.stringify(profile));
    localStorage.setItem("quantnova_algo_settings", JSON.stringify(algoSettings));
    localStorage.setItem("quantnova_risk_settings", JSON.stringify(riskSettings));
    localStorage.setItem("quantnova_api_keys", JSON.stringify(apiKeys));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function handleResetPaperData() {
    if (
      window.confirm(
        "Are you sure you want to reset all virtual paper trading history, filled orders, and restore virtual cash balance to ₹1,00,000?"
      )
    ) {
      localStorage.removeItem("quantnova_paper_portfolio");
      localStorage.removeItem("quantnova_orders");
      alert("Paper trading account telemetry reset to ₹1,00,000 virtual balance.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-12 animate-fade-up">

      {/* ── 1. Top Hero Banner (Rich Cosmic Gradient) ── */}
      <header
        className="qn-dashboard-header relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 32%, #312e81 68%, #1e3a8a 100%)",
          boxShadow: "0 12px 36px -8px rgba(30, 27, 75, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Decorative Glowing Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)", opacity: 0.35 }}
          />
          <div
            className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.5) 0%, transparent 70%)", opacity: 0.25 }}
          />
          <div
            className="absolute top-2 right-1/4 w-40 h-40 rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.35) 0%, transparent 70%)", opacity: 0.2 }}
          />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  boxShadow: "0 8px 24px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
              >
                <SettingsIcon size={22} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Make the platform yours.
                  </h1>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-violet-200 tracking-widest uppercase shadow-sm"
                    style={{ background: "rgba(139,92,246,0.30)", border: "1px solid rgba(139,92,246,0.45)" }}
                  >
                    <Sparkles size={11} className="text-violet-300" /> Platform Settings
                  </span>
                </div>
                <p className="mt-1 text-sm text-indigo-100/90 font-normal">
                  Manage your profile, algorithm defaults, trading guardrails, and broker connections.
                </p>
              </div>
            </div>

            {/* Badges strip */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm"
                style={{ background: "rgba(16, 185, 129, 0.22)", border: "1px solid rgba(16, 185, 129, 0.45)", color: "#34d399" }}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Paper Sandbox Active
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-200 backdrop-blur-md"
                style={{ background: "rgba(255, 255, 255, 0.10)", border: "1px solid rgba(255, 255, 255, 0.16)" }}
              >
                <Bot size={12} className="text-violet-300" />
                Default Algo: {algoSettings.defaultStrategy.replace("_", " ")}
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-200 backdrop-blur-md"
                style={{ background: "rgba(255, 255, 255, 0.10)", border: "1px solid rgba(255, 255, 255, 0.16)" }}
              >
                <ShieldCheck size={12} className="text-cyan-300" />
                Max Risk: ₹{riskSettings.maxPositionSize.toLocaleString()} / trade
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-200 backdrop-blur-md"
                style={{ background: "rgba(255, 255, 255, 0.10)", border: "1px solid rgba(255, 255, 255, 0.16)" }}
              >
                <Key size={12} className="text-amber-300" />
                Broker: {apiKeys.broker}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40 animate-fade-up">
                <CheckCircle2 size={15} /> Settings Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                boxShadow: "0 4px 18px rgba(99, 102, 241, 0.45)",
              }}
            >
              <Save size={15} /> Save Changes
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Settings Grid (Navigation + Content) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

        {/* Left Nav Menu */}
        <nav
          className="qn-card h-fit p-3.5 border lg:sticky lg:top-6"
          style={{ background: "#ffffff", borderColor: "rgba(99, 102, 241, 0.16)" }}
        >
          <div className="px-3 pb-2.5 pt-1.5 flex items-center justify-between border-b border-slate-100 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Configuration Hub
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              5 Modules
            </span>
          </div>

          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-xs border border-indigo-200/80"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                        active ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    <span>{tab.label}</span>
                  </div>
                  {active && <ChevronRight size={15} className="text-indigo-600" />}
                </button>
              );
            })}
          </div>

          {/* Mini Sandbox Account Status Card */}
          <div
            className="mt-6 rounded-xl p-3.5 border"
            style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)", borderColor: "rgba(99, 102, 241, 0.18)" }}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Wallet size={13} className="text-indigo-600" /> Paper Balance
              </span>
              <span className="text-emerald-600 font-extrabold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ₹1,00,000.00
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Virtual capital ready for algorithmic routing.</p>
          </div>
        </nav>

        {/* Right Content Panel */}
        <main className="min-w-0 lg:col-span-3">

          {/* TAB 1: Profile & Identity */}
          {activeTab === "profile" && (
            <section
              className="qn-card p-6 sm:p-7 border"
              style={{ background: "#ffffff", borderColor: "rgba(99, 102, 241, 0.16)" }}
            >
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                    <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      Profile & Identity
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Manage your personal identity, trader credentials, and workspace permissions.
                  </p>
                </div>

                {/* Avatar Badge */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white font-extrabold text-base shadow-md"
                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                  >
                    {profile.username ? profile.username.charAt(0).toUpperCase() : "Q"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{profile.username}</p>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active Session
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Username">
                  <input
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className={inputClass}
                    placeholder="Enter username"
                  />
                </Field>

                <Field label="Email Address">
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className={inputClass}
                    placeholder="name@domain.com"
                  />
                </Field>

                <Field label="Trading Experience Level">
                  <select
                    value={profile.experience}
                    onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Beginner (Learning Systematic Concepts)">Beginner (Learning Systematic Concepts)</option>
                    <option value="Intermediate (Systematic Backtesting)">Intermediate (Systematic Backtesting)</option>
                    <option value="Advanced (Algorithmic & Machine Learning Trader)">Advanced (Algorithmic & ML Trader)</option>
                  </select>
                </Field>

                <Field label="Workspace Name">
                  <input
                    value={profile.workspace}
                    onChange={(e) => setProfile({ ...profile, workspace: e.target.value })}
                    className={inputClass}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="User Role & Workspace Type"
                    hint="Your role governs permission sets and multi-broker routing authorization."
                  >
                    <input
                      value={profile.role}
                      disabled
                      className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
                    />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: Algo & Strategy Engine (NEW!) */}
          {activeTab === "algo" && (
            <section
              className="qn-card p-6 sm:p-7 border space-y-6"
              style={{ background: "#ffffff", borderColor: "rgba(99, 102, 241, 0.16)" }}
            >
              <div className="border-b pb-5 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Bot size={16} />
                  </span>
                  <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Algorithmic Trading & Strategy Defaults
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Global parameters and automated trigger configurations for your existing quantitative algorithms.
                </p>
              </div>

              {/* Algo Settings Grid */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field
                  label="Default Trading Strategy"
                  hint="The baseline algorithm selected when initializing new backtests or automated runs."
                >
                  <select
                    value={algoSettings.defaultStrategy}
                    onChange={(e) => setAlgoSettings({ ...algoSettings, defaultStrategy: e.target.value })}
                    className={inputClass}
                  >
                    <option value="SMA_CROSSOVER">SMA Crossover (Fast/Slow Average)</option>
                    <option value="EMA_CROSSOVER">EMA Crossover (Exponential Average)</option>
                    <option value="SMA_EMA_TREND">SMA + EMA Trend Filter</option>
                    <option value="RSI">RSI Momentum (Overbought / Oversold)</option>
                    <option value="MACD">MACD Convergence / Divergence</option>
                    <option value="BOLLINGER">Bollinger Bands Volatility Breakout</option>
                    <option value="XGBOOST_ML">XGBoost Machine Learning Classifier</option>
                  </select>
                </Field>

                <Field
                  label="Default Timeframe Cadence"
                  hint="Bar frequency used for calculating algorithmic indicator signals."
                >
                  <select
                    value={algoSettings.defaultTimeframe}
                    onChange={(e) => setAlgoSettings({ ...algoSettings, defaultTimeframe: e.target.value })}
                    className={inputClass}
                  >
                    <option value="5m">5 Minutes (High-Frequency Intraday)</option>
                    <option value="15m">15 Minutes (Standard Intraday)</option>
                    <option value="1h">1 Hour (Swing Momentum)</option>
                    <option value="1d">1 Day (Positional Daily Trend)</option>
                  </select>
                </Field>

                <Field
                  label="Capital Allocation Per Algo (₹)"
                  hint="Rupee allotment ceiling deployed per strategy trigger."
                >
                  <input
                    type="number"
                    value={algoSettings.capitalPerAlgo}
                    onChange={(e) => setAlgoSettings({ ...algoSettings, capitalPerAlgo: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="AI Prediction Trigger Threshold (%)"
                  hint="Minimum machine learning conviction score needed before order execution."
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="50"
                      max="95"
                      value={algoSettings.minConfidence}
                      onChange={(e) => setAlgoSettings({ ...algoSettings, minConfidence: Number(e.target.value) })}
                      className={inputClass}
                    />
                    <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-2 rounded-xl border border-violet-200 shrink-0">
                      {algoSettings.minConfidence}% Conviction
                    </span>
                  </div>
                </Field>

                <Field label="Target Risk-to-Reward Ratio">
                  <select
                    value={algoSettings.riskRewardRatio}
                    onChange={(e) => setAlgoSettings({ ...algoSettings, riskRewardRatio: e.target.value })}
                    className={inputClass}
                  >
                    <option value="1:1.5">1 : 1.5 (Conservative Target)</option>
                    <option value="1:2">1 : 2.0 (Standard Asymmetric)</option>
                    <option value="1:3">1 : 3.0 (Aggressive Runner)</option>
                  </select>
                </Field>

                <Field label="Max Concurrent Active Algos">
                  <select
                    value={algoSettings.maxConcurrentAlgos}
                    onChange={(e) => setAlgoSettings({ ...algoSettings, maxConcurrentAlgos: Number(e.target.value) })}
                    className={inputClass}
                  >
                    <option value="1">1 Strategy at a time</option>
                    <option value="3">Up to 3 concurrent strategies</option>
                    <option value="5">Up to 5 concurrent strategies</option>
                    <option value="10">Unrestricted multi-strategy basket</option>
                  </select>
                </Field>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <ToggleRow
                  icon={Zap}
                  title="Automated Signal Execution (Auto-Paper-Trade)"
                  description="Automatically route simulated paper orders when an active algorithm emits a BUY or SELL signal without requiring manual confirmation."
                  checked={algoSettings.autoExecute}
                  onChange={(val) => setAlgoSettings({ ...algoSettings, autoExecute: val })}
                  iconBg="rgba(245, 158, 11, 0.12)"
                  iconColor="#d97706"
                />

                <ToggleRow
                  icon={ShieldCheck}
                  title="Realistic Slippage & Fee Simulation"
                  description="Incorporate brokerage, STT, and exchange turnover charges into algorithmic backtest results for institutional realism."
                  checked={algoSettings.enableSlippageModel}
                  onChange={(val) => setAlgoSettings({ ...algoSettings, enableSlippageModel: val })}
                  iconBg="rgba(16, 185, 129, 0.12)"
                  iconColor="#059669"
                />
              </div>
            </section>
          )}

          {/* TAB 3: Risk & Execution */}
          {activeTab === "risk" && (
            <section
              className="qn-card p-6 sm:p-7 border space-y-6"
              style={{ background: "#ffffff", borderColor: "rgba(99, 102, 241, 0.16)" }}
            >
              <div className="border-b pb-5 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={16} />
                  </span>
                  <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Risk & Execution Guardrails
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Defensive safety mechanisms and exposure controls for automated and paper orders.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field
                  label="Max Capital Per Trade (₹)"
                  hint="Maximum rupee allocation allowed in any single automated position."
                >
                  <input
                    type="number"
                    value={riskSettings.maxPositionSize}
                    onChange={(e) => setRiskSettings({ ...riskSettings, maxPositionSize: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Slippage Tolerance (%)"
                  hint="Simulated market impact buffer on immediate order fills."
                >
                  <input
                    type="number"
                    step="0.01"
                    value={riskSettings.defaultSlippage}
                    onChange={(e) => setRiskSettings({ ...riskSettings, defaultSlippage: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Max Daily Drawdown Halt (%)"
                  hint="Automatically suspends algorithm triggers if portfolio drawdown reaches this limit."
                >
                  <input
                    type="number"
                    step="0.1"
                    value={riskSettings.maxDrawdownLimit}
                    onChange={(e) => setRiskSettings({ ...riskSettings, maxDrawdownLimit: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Default Stop-Loss (%)"
                  hint="Attached automatically to all generated algorithm BUY signals."
                >
                  <input
                    type="number"
                    step="0.1"
                    value={riskSettings.defaultStopLoss}
                    onChange={(e) => setRiskSettings({ ...riskSettings, defaultStopLoss: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="pt-2">
                <ToggleRow
                  icon={ShieldCheck}
                  title="Dynamic Trailing Stop-Loss"
                  description="Automatically ratchets protective stop-loss upward as market price advances in your favour."
                  checked={riskSettings.autoTrailingStop}
                  onChange={(val) => setRiskSettings({ ...riskSettings, autoTrailingStop: val })}
                />
              </div>

              {/* Danger Zone: Reset Paper Data */}
              <div
                className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl p-5 border"
                style={{ background: "#fff5f5", borderColor: "rgba(239, 68, 68, 0.25)" }}
              >
                <div>
                  <h4 className="text-sm font-bold text-rose-700" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Reset Paper-Trading Telemetry
                  </h4>
                  <p className="mt-1 text-xs text-rose-600">
                    Purge all virtual paper trades, order history, and restore account balance to ₹1,00,000.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetPaperData}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white border border-rose-300 px-4 py-2.5 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-50 active:scale-95 transition-all"
                >
                  <RefreshCcw size={14} /> Reset Virtual Data
                </button>
              </div>
            </section>
          )}

          {/* TAB 4: Broker Connections */}
          {activeTab === "api" && (
            <section
              className="qn-card p-6 sm:p-7 border space-y-6"
              style={{ background: "#ffffff", borderColor: "rgba(99, 102, 241, 0.16)" }}
            >
              <div className="border-b pb-5 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Key size={16} />
                  </span>
                  <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Broker Connections & API Credentials
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Configure Indian broker integrations and local quantitative market data endpoints.
                </p>
              </div>

              <div className="space-y-5">
                <Field label="Execution Broker Provider">
                  <select
                    value={apiKeys.broker}
                    onChange={(e) => setApiKeys({ ...apiKeys, broker: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Zerodha Kite">Zerodha Kite Connect (NSE / BSE)</option>
                    <option value="Upstox">Upstox API v2</option>
                    <option value="Dhan">Dhan HQ Connect</option>
                    <option value="Paper Sim">Simulated Paper Sandbox Engine</option>
                  </select>
                </Field>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="API Key / Client ID">
                    <input
                      type="text"
                      value={apiKeys.apiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, apiKey: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. YOUR_API_KEY"
                    />
                  </Field>

                  <Field label="API Secret Token">
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={apiKeys.apiSecret}
                        onChange={(e) => setApiKeys({ ...apiKeys, apiSecret: e.target.value })}
                        className={`${inputClass} pr-10`}
                        placeholder="e.g. YOUR_API_SECRET"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                </div>

                <Field
                  label="FastAPI Market Engine Endpoint"
                  hint="Local high-performance Python FastAPI engine providing real-time quotes and XGBoost inference."
                >
                  <input
                    value={apiKeys.fastApiUrl}
                    onChange={(e) => setApiKeys({ ...apiKeys, fastApiUrl: e.target.value })}
                    className={inputClass}
                  />
                </Field>

                <div className="rounded-xl p-4 bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Connection Status: Operational</p>
                      <p className="text-[11px] text-slate-400">FastAPI backend replying on port 8000</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    LATENCY: 12ms
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: System Preferences */}
          {activeTab === "system" && (
            <section
              className="qn-card p-6 sm:p-7 border space-y-6"
              style={{ background: "#ffffff", borderColor: "rgba(99, 102, 241, 0.16)" }}
            >
              <div className="border-b pb-5 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Sliders size={16} />
                  </span>
                  <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    System & Engine Preferences
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Tune audible triggers, data polling rates, and automated end-of-day reports.
                </p>
              </div>

              <div className="space-y-3.5">
                <ToggleRow
                  icon={Bell}
                  title="Audible Signal Chimes"
                  description="Emit distinct sound triggers when an algorithm outputs BUY or SELL events."
                  checked={preferences.audioAlerts}
                  onChange={(val) => setPreferences({ ...preferences, audioAlerts: val })}
                />

                <ToggleRow
                  icon={Cpu}
                  title="Market Data Polling Rate"
                  description="Frequency of price telemetry updates retrieved from backend simulator."
                >
                  <select
                    value={preferences.pollingInterval}
                    onChange={(e) => setPreferences({ ...preferences, pollingInterval: e.target.value })}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  >
                    <option value="5s">Every 5 Seconds (Ultra-Fast)</option>
                    <option value="10s">Every 10 Seconds (Optimal)</option>
                    <option value="30s">Every 30 Seconds (Low Bandwidth)</option>
                  </select>
                </ToggleRow>

                <ToggleRow
                  icon={Activity}
                  title="Daily End-Of-Day Strategy Summaries"
                  description="Automatically compile daily P&L, Sharpe ratio, and hit-rate analytics upon market close."
                  checked={preferences.emailDailyReport}
                  onChange={(val) => setPreferences({ ...preferences, emailDailyReport: val })}
                />
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
