import React from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Star,
  Wallet,
  Zap,
  FlaskConical,
  ArrowLeftRight,
  Brain,
  BarChart3,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

// Categorized navigation groups
const navGroups = [
  {
    title: "MAIN",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Market", path: "/market", icon: TrendingUp },
      { name: "Watchlist", path: "/watchlist", icon: Star },
      { name: "Portfolio", path: "/portfolio", icon: Wallet },
    ],
  },
  {
    title: "TRADING",
    items: [
      { name: "Strategy Builder", path: "/strategy", icon: Zap },
      { name: "Backtesting", path: "/backtest", icon: FlaskConical },
      { name: "Paper Trading", path: "/trading", icon: ArrowLeftRight },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      { name: "AI Prediction", path: "/prediction", icon: Brain },
      { name: "Performance Lab", path: "/trading-analytics", icon: BarChart3 },
      { name: "Reports", path: "/reports", icon: FileText },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <aside className="w-64 h-full flex flex-col justify-between select-none shrink-0 border-r"
      style={{
        background: 'linear-gradient(180deg, #090c18 0%, #070a14 100%)',
        borderColor: 'rgba(99, 102, 241, 0.12)',
      }}>
      {/* 1. Categorized Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[9px] font-bold tracking-widest mb-2"
              style={{
                color: 'var(--qn-text-3)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === "/dashboard"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? "text-white border"
                          : "border border-transparent hover:border-[rgba(99,102,241,0.12)]"
                      }`
                    }
                    style={({ isActive }) => isActive ? {
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(124,58,237,0.12) 100%)',
                      borderColor: 'rgba(99,102,241,0.30)',
                      boxShadow: '0 0 12px rgba(99,102,241,0.10)',
                      color: '#a5b4fc',
                    } : {
                      color: 'var(--qn-text-2)',
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} className="shrink-0" style={{ color: isActive ? '#a5b4fc' : 'var(--qn-text-3)' }} />
                        <span className="truncate">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 2. User Card & Logout Dock */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(99,102,241,0.12)', background: 'rgba(6,8,16,0.6)' }}>
        {user && (
          <div className="mb-2 px-3 py-2 rounded-xl flex flex-col gap-0.5"
            style={{
              background: 'rgba(99,102,241,0.07)',
              border: '1px solid rgba(99,102,241,0.14)',
            }}>
            <span className="text-xs font-semibold truncate" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
              {user.username || "Shashank"}
            </span>
            <span className="text-[10px] truncate" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
              {user.email || "ram@gmail.com"}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
          style={{ color: 'var(--qn-bear)', fontFamily: "'Inter', sans-serif" }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.color = '#fb7185'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--qn-bear)'; }}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>

        <div className="text-center mt-2" style={{ fontSize: '9px', color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
          QuantNova Pro v1.0.0
        </div>
      </div>
    </aside>
  );
}
