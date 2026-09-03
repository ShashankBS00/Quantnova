import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  ShieldCheck, 
  Cpu, 
  Key, 
  Bell, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Profile State
  const [profile, setProfile] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    return {
      username: savedUser?.username || "Shashank",
      email: savedUser?.email || "ram@gmail.com",
      role: "Quantitative Trader / MCA Student",
    };
  });

  // 2. Risk & Algo Trading Controls State
  const [riskSettings, setRiskSettings] = useState(() => {
    const saved = localStorage.getItem("quantnova_risk_settings");
    return saved
      ? JSON.parse(saved)
      : {
          defaultSlippage: 0.05, // 5 bps
          maxPositionSize: 25000, // ₹25,000 per order
          maxDrawdownLimit: 5.0, // 5% max drawdown circuit breaker
          defaultStopLoss: 1.5, // 1.5%
          autoTrailingStop: true,
          executionMode: "paper", // "paper" or "live"
        };
  });

  // 3. Broker & Data API Keys State
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem("quantnova_api_keys");
    return saved
      ? JSON.parse(saved)
      : {
          broker: "Zerodha Kite",
          apiKey: "••••••••••••••••",
          apiSecret: "••••••••••••••••",
          fastApiUrl: "http://127.0.0.1:8000",
        };
  });

  // 4. Notifications & UI Preferences
  const [preferences, setPreferences] = useState({
    audioAlerts: true,
    pollingInterval: "10s",
    compactTables: false,
    emailDailyReport: true,
  });

  // Handle saving configurations
  const handleSaveAll = (e) => {
    e.preventDefault();
    localStorage.setItem("user", JSON.stringify({ ...profile }));
    localStorage.setItem("quantnova_risk_settings", JSON.stringify(riskSettings));
    localStorage.setItem("quantnova_api_keys", JSON.stringify(apiKeys));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reset Paper Trading Simulation
  const handleResetPaperData = () => {
    if (window.confirm("Are you sure you want to reset all virtual paper trading trades and balance to ₹1,00,000?")) {
      localStorage.removeItem("quantnova_paper_portfolio");
      localStorage.removeItem("quantnova_orders");
      alert("Paper trading account reset successfully.");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile & Identity", icon: User },
    { id: "risk", label: "Risk & Execution Rules", icon: ShieldCheck },
    { id: "api", label: "API & Broker Connectors", icon: Key },
    { id: "system", label: "System Preferences", icon: Cpu },
  ];

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div>
          <div className="flex items-center gap-2 mb-1 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <SettingsIcon size={14} /> System Configuration
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Platform Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure risk parameters, brokerage APIs, algorithm constraints, and user identity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono animate-fade-in">
              <CheckCircle2 size={15} /> Saved successfully
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
          >
            <Save size={15} /> Save Changes
          </button>
        </div>
      </div>

      {/* 2. Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Tab Navigation */}
        <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-3 space-y-1 h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#142352] text-blue-400 border border-[#2b489a] shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-[#0c1328] border border-transparent"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Content Cards */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: Profile & Identity */}
          {activeTab === "profile" && (
            <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">User Profile</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage your user identity and authorization credentials.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                    User Role & Workspace Type
                  </label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full bg-[#070b16]/60 border border-[#162444] text-slate-400 rounded-xl px-3.5 py-2 text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Risk & Execution Rules */}
          {activeTab === "risk" && (
            <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Institutional Risk Guardrails</h3>
                <p className="text-xs text-slate-400 mt-0.5">Parameters to safeguard simulated and algorithmic order routing.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1">
                    Max Capital Per Trade (₹)
                  </label>
                  <input
                    type="number"
                    value={riskSettings.maxPositionSize}
                    onChange={(e) => setRiskSettings({ ...riskSettings, maxPositionSize: Number(e.target.value) })}
                    className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Maximum rupee value allowed in any single automated order.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1">
                    Slippage Tolerance (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={riskSettings.defaultSlippage}
                    onChange={(e) => setRiskSettings({ ...riskSettings, defaultSlippage: Number(e.target.value) })}
                    className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Simulated price impact upon order fill (default: 0.05% or 5 bps).</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1">
                    Max Daily Drawdown Circuit Breaker (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={riskSettings.maxDrawdownLimit}
                    onChange={(e) => setRiskSettings({ ...riskSettings, maxDrawdownLimit: Number(e.target.value) })}
                    className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Halts all algorithmic orders if portfolio drops beyond this threshold.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1">
                    Default Auto Stop-Loss (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={riskSettings.defaultStopLoss}
                    onChange={(e) => setRiskSettings({ ...riskSettings, defaultStopLoss: Number(e.target.value) })}
                    className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Attached automatically to every generated buy signal.</span>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-[#162444] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase font-mono">Reset Simulation Environment</h4>
                  <p className="text-[11px] text-slate-400">Clear all paper trade history and reset virtual balance to ₹1,00,000.</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetPaperData}
                  className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition"
                >
                  <RotateCcw size={13} /> Reset Paper Data
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: API & Broker Connectors */}
          {activeTab === "api" && (
            <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Broker & Data Gateways</h3>
                <p className="text-xs text-slate-400 mt-0.5">Connect to Indian stock broker APIs or local FastAPI market services.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                    Execution Broker
                  </label>
                  <select
                    value={apiKeys.broker}
                    onChange={(e) => setApiKeys({ ...apiKeys, broker: e.target.value })}
                    className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="Zerodha Kite">Zerodha Kite Connect</option>
                    <option value="Upstox">Upstox API v2</option>
                    <option value="Dhan">Dhan HQ</option>
                    <option value="Paper Sim">Simulated Sandbox Engine</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                      API Key / App Client ID
                    </label>
                    <input
                      type="password"
                      value={apiKeys.apiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, apiKey: e.target.value })}
                      className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                      API Secret Token
                    </label>
                    <input
                      type="password"
                      value={apiKeys.apiSecret}
                      onChange={(e) => setApiKeys({ ...apiKeys, apiSecret: e.target.value })}
                      className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                    FastAPI Market Engine Endpoint
                  </label>
                  <input
                    type="text"
                    value={apiKeys.fastApiUrl}
                    onChange={(e) => setApiKeys({ ...apiKeys, fastApiUrl: e.target.value })}
                    className="w-full bg-[#070b16] border border-[#162444] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default local address: http://127.0.0.1:8000</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: System Preferences */}
          {activeTab === "system" && (
            <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Telemetry & Preferences</h3>
                <p className="text-xs text-slate-400 mt-0.5">Customize real-time polling cadence and terminal alert triggers.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#070b16] border border-[#162444]">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Audio Signals & Alerts</h4>
                    <p className="text-[11px] text-slate-400">Play chime when an algorithm triggers a BUY/SELL signal.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.audioAlerts}
                    onChange={(e) => setPreferences({ ...preferences, audioAlerts: e.target.checked })}
                    className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#070b16] border border-[#162444]">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Data Polling Cadence</h4>
                    <p className="text-[11px] text-slate-400">Rate of quote updates fetched from the backend server.</p>
                  </div>
                  <select
                    value={preferences.pollingInterval}
                    onChange={(e) => setPreferences({ ...preferences, pollingInterval: e.target.value })}
                    className="bg-[#0b1222] border border-[#162444] text-xs text-white rounded-lg px-2.5 py-1 font-mono focus:outline-none"
                  >
                    <option value="5s">Every 5 seconds</option>
                    <option value="10s">Every 10 seconds</option>
                    <option value="30s">Every 30 seconds</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#070b16] border border-[#162444]">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">EOD Strategy Reports</h4>
                    <p className="text-[11px] text-slate-400">Generate end-of-day P&L and risk breakdown summaries.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailDailyReport}
                    onChange={(e) => setPreferences({ ...preferences, emailDailyReport: e.target.checked })}
                    className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}