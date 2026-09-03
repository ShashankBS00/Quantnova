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
    <aside className="w-64 h-full bg-[#070b16] border-r border-[#141e38] flex flex-col justify-between select-none shrink-0">
      {/* 1. Categorized Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono mb-1.5">
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
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-[#142352] text-blue-400 border border-[#2b489a] shadow-sm shadow-blue-950/40"
                          : "text-slate-400 hover:text-slate-200 hover:bg-[#0c1328] border border-transparent"
                      }`
                    }
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 2. User Card & Logout Dock */}
      <div className="p-3 border-t border-[#141e38] bg-[#050811]/60">
        {user && (
          <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-[#0c1328] border border-[#162346] flex flex-col">
            <span className="text-xs font-semibold text-white truncate">
              {user.username || "Shashank"}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {user.email || "ram@gmail.com"}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>

        <div className="text-[10px] text-slate-600 text-center mt-2 font-mono">
          QuantNova Pro v1.0.0
        </div>
      </div>
    </aside>
  );
}