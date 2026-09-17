import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Key,
  RefreshCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
} from "lucide-react";

const labelStyle = { color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" };

function Field({ label, hint, children }) {
  return <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em]" style={labelStyle}>{label}</label>{children}{hint && <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: "var(--qn-text-3)" }}>{hint}</p>}</div>;
}

function ToggleRow({ icon: Icon, title, description, checked, onChange, children }) {
  return <div className="flex items-center justify-between gap-5 rounded-xl p-4" style={{ background: "var(--qn-surface-2)", border: "1px solid var(--qn-border)" }}><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(79, 70, 229, 0.09)", color: "var(--qn-indigo)" }}><Icon size={16} /></span><div><h4 className="text-sm font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h4><p className="mt-0.5 text-xs" style={{ color: "var(--qn-text-3)" }}>{description}</p></div></div>{children || <button type="button" onClick={() => onChange(!checked)} className="relative h-6 w-11 shrink-0 rounded-full transition-colors" style={{ background: checked ? "var(--qn-indigo)" : "var(--qn-surface-3)", border: checked ? "1px solid var(--qn-indigo)" : "1px solid var(--qn-border)" }} aria-pressed={checked}><span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform" style={{ left: "3px", transform: checked ? "translateX(19px)" : "translateX(0)" }} /></button>}</div>;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    return { username: savedUser?.username || "Shashank", email: savedUser?.email || "ram@gmail.com", role: "Quantitative Trader / MCA Student" };
  });
  const [riskSettings, setRiskSettings] = useState(() => JSON.parse(localStorage.getItem("quantnova_risk_settings") || "null") || ({ defaultSlippage: 0.05, maxPositionSize: 25000, maxDrawdownLimit: 5, defaultStopLoss: 1.5, autoTrailingStop: true, executionMode: "paper" }));
  const [apiKeys, setApiKeys] = useState(() => JSON.parse(localStorage.getItem("quantnova_api_keys") || "null") || ({ broker: "Zerodha Kite", apiKey: "••••••••••••••••", apiSecret: "••••••••••••••••", fastApiUrl: "http://127.0.0.1:8000" }));
  const [preferences, setPreferences] = useState({ audioAlerts: true, pollingInterval: "10s", compactTables: false, emailDailyReport: true });

  const tabs = [{ id: "profile", label: "Profile & identity", icon: User }, { id: "risk", label: "Risk & execution", icon: ShieldCheck }, { id: "api", label: "Broker connections", icon: Key }, { id: "system", label: "System preferences", icon: Cpu }];
  const inputClass = "qn-input w-full rounded-xl px-3.5 py-3 text-sm";

  function handleSaveAll() {
    localStorage.setItem("user", JSON.stringify(profile));
    localStorage.setItem("quantnova_risk_settings", JSON.stringify(riskSettings));
    localStorage.setItem("quantnova_api_keys", JSON.stringify(apiKeys));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function handleResetPaperData() {
    if (window.confirm("Are you sure you want to reset all virtual paper trading trades and balance to ₹1,00,000?")) {
      localStorage.removeItem("quantnova_paper_portfolio");
      localStorage.removeItem("quantnova_orders");
      alert("Paper trading account reset successfully.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-8 pb-12 animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em]" style={{ background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.16)", color: "var(--qn-indigo)", fontFamily: "'JetBrains Mono', monospace" }}><SettingsIcon size={12} /> PLATFORM SETTINGS</div><h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Make the platform yours.</h1><p className="mt-2 text-sm" style={{ color: "var(--qn-text-2)" }}>Manage your profile, trading guardrails, and platform preferences.</p></div>
        <div className="flex items-center gap-3">{saveSuccess && <span className="hidden items-center gap-1.5 text-xs font-semibold sm:flex animate-fade-up" style={{ color: "var(--qn-bull)" }}><CheckCircle2 size={16} /> Saved</span>}<button type="button" onClick={handleSaveAll} className="qn-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5"><Save size={15} /> Save changes</button></div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <nav className="qn-card h-fit p-3 lg:sticky lg:top-6">
          <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={labelStyle}>Settings</p>
          <div className="space-y-1">{tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all" style={{ background: active ? "rgba(79, 70, 229, 0.09)" : "transparent", color: active ? "var(--qn-indigo)" : "var(--qn-text-2)", border: active ? "1px solid rgba(79, 70, 229, 0.16)" : "1px solid transparent" }}><Icon size={16} /><span className="flex-1">{tab.label}</span>{active && <ChevronRight size={14} />}</button>; })}</div>
        </nav>

        <main className="min-w-0 lg:col-span-3">
          {activeTab === "profile" && <section className="qn-card p-5 sm:p-6"><div className="mb-6"><h2 className="text-xl font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Profile & identity</h2><p className="mt-1 text-sm" style={{ color: "var(--qn-text-3)" }}>Manage your personal identity and workspace details.</p></div><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Field label="Username"><input value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value })} className={inputClass} /></Field><Field label="Email address"><input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className={inputClass} /></Field><div className="md:col-span-2"><Field label="User role & workspace type" hint="Your access level is managed by your workspace administrator."><input value={profile.role} disabled className={`${inputClass} cursor-not-allowed opacity-70`} /></Field></div></div></section>}

          {activeTab === "risk" && <section className="qn-card p-5 sm:p-6"><div className="mb-6"><h2 className="text-xl font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Risk & execution</h2><p className="mt-1 text-sm" style={{ color: "var(--qn-text-3)" }}>Guardrails for your simulated and algorithmic order routing.</p></div><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Field label="Max capital per trade" hint="Maximum rupee value allowed in a single automated order."><input type="number" value={riskSettings.maxPositionSize} onChange={(event) => setRiskSettings({ ...riskSettings, maxPositionSize: Number(event.target.value) })} className={inputClass} /></Field><Field label="Slippage tolerance (%)" hint="Simulated price impact upon an order fill."><input type="number" step="0.01" value={riskSettings.defaultSlippage} onChange={(event) => setRiskSettings({ ...riskSettings, defaultSlippage: Number(event.target.value) })} className={inputClass} /></Field><Field label="Max daily drawdown (%)" hint="Halts algorithmic orders after this threshold."><input type="number" step="0.1" value={riskSettings.maxDrawdownLimit} onChange={(event) => setRiskSettings({ ...riskSettings, maxDrawdownLimit: Number(event.target.value) })} className={inputClass} /></Field><Field label="Default stop-loss (%)" hint="Attached automatically to generated buy signals."><input type="number" step="0.1" value={riskSettings.defaultStopLoss} onChange={(event) => setRiskSettings({ ...riskSettings, defaultStopLoss: Number(event.target.value) })} className={inputClass} /></Field></div><div className="mt-6 border-t pt-6" style={{ borderColor: "var(--qn-border)" }}><ToggleRow icon={ShieldCheck} title="Auto trailing stop" description="Dynamically update stops as a position moves in your favour." checked={riskSettings.autoTrailingStop} onChange={(value) => setRiskSettings({ ...riskSettings, autoTrailingStop: value })} /></div><div className="mt-6 flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--qn-bear-dim)", border: "1px solid rgba(220, 38, 38, 0.18)" }}><div><p className="text-sm font-bold" style={{ color: "var(--qn-bear)", fontFamily: "'Space Grotesk', sans-serif" }}>Reset paper-trading data</p><p className="mt-0.5 text-xs" style={{ color: "var(--qn-text-2)" }}>Clear local paper-trading history and restore the virtual balance to ₹1,00,000.</p></div><button type="button" onClick={handleResetPaperData} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold" style={{ borderColor: "rgba(220, 38, 38, 0.28)", background: "#fff", color: "var(--qn-bear)" }}><RefreshCcw size={14} /> Reset data</button></div></section>}

          {activeTab === "api" && <section className="qn-card p-5 sm:p-6"><div className="mb-6"><h2 className="text-xl font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Broker connections</h2><p className="mt-1 text-sm" style={{ color: "var(--qn-text-3)" }}>Configure broker credentials and local market-data endpoints.</p></div><div className="space-y-5"><Field label="Execution broker"><select value={apiKeys.broker} onChange={(event) => setApiKeys({ ...apiKeys, broker: event.target.value })} className={inputClass}><option value="Zerodha Kite">Zerodha Kite Connect</option><option value="Upstox">Upstox API v2</option><option value="Dhan">Dhan HQ</option><option value="Paper Sim">Simulated Sandbox Engine</option></select></Field><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Field label="API key / app client ID"><input type="password" value={apiKeys.apiKey} onChange={(event) => setApiKeys({ ...apiKeys, apiKey: event.target.value })} className={inputClass} /></Field><Field label="API secret token"><input type="password" value={apiKeys.apiSecret} onChange={(event) => setApiKeys({ ...apiKeys, apiSecret: event.target.value })} className={inputClass} /></Field></div><Field label="FastAPI market engine endpoint" hint="Default local address: http://127.0.0.1:8000"><input value={apiKeys.fastApiUrl} onChange={(event) => setApiKeys({ ...apiKeys, fastApiUrl: event.target.value })} className={inputClass} /></Field></div></section>}

          {activeTab === "system" && <section className="qn-card p-5 sm:p-6"><div className="mb-6"><h2 className="text-xl font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>System preferences</h2><p className="mt-1 text-sm" style={{ color: "var(--qn-text-3)" }}>Customize alert behaviour, update cadence, and daily summaries.</p></div><div className="space-y-3"><ToggleRow icon={Bell} title="Audio signals & alerts" description="Play a chime when an algorithm triggers a BUY or SELL signal." checked={preferences.audioAlerts} onChange={(value) => setPreferences({ ...preferences, audioAlerts: value })} /><ToggleRow icon={Cpu} title="Data polling cadence" description="Rate at which market data is requested from the backend."><select value={preferences.pollingInterval} onChange={(event) => setPreferences({ ...preferences, pollingInterval: event.target.value })} className="qn-input rounded-lg px-2.5 py-2 text-xs"><option value="5s">Every 5 seconds</option><option value="10s">Every 10 seconds</option><option value="30s">Every 30 seconds</option></select></ToggleRow><ToggleRow icon={Bell} title="End-of-day strategy reports" description="Generate daily P&L and risk-breakdown summaries." checked={preferences.emailDailyReport} onChange={(value) => setPreferences({ ...preferences, emailDailyReport: value })} /></div></section>}
        </main>
      </div>
    </div>
  );
}
