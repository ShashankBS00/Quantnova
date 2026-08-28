import {
  LayoutDashboard,
  ChartCandlestick,
  Star,
  Wallet,
  BrainCircuit,
  Bot,
  BarChart3,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import logo from "@/assets/logo.svg";

const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Market",
    path: "/market",
    icon: ChartCandlestick,
  },
  {
    name: "Watchlist",
    path: "/watchlist",
    icon: Star,
  },
  {
    name: "Portfolio",
    path: "/portfolio",
    icon: Wallet,
  },
  {
    name: "AI Prediction",
    path: "/prediction",
    icon: BrainCircuit,
  },
  {
    name: "Strategy Builder",
    path: "/strategy",
    icon: Bot,
  },
  {
    name: "Backtesting",
    path: "/backtest",
    icon: BarChart3,
  },
  {
    name: "Paper Trading",
    path: "/trading",
    icon: ChartCandlestick,
  },
  {
    name: "Performance Lab",
    path: "/trading-analytics",
    icon: BarChart3,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <aside className="w-72 h-screen bg-slate-950 border-r border-slate-800 flex flex-col">

      {/* Logo */}

      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">

        <img
          src={logo}
          alt="QuantNova"
          className="w-11 h-11 rounded-lg"
        />

        <div>
          <h1 className="text-xl font-bold text-white">
            QuantNova
          </h1>

          <p className="text-xs text-slate-400">
            AI Trading Platform
          </p>
        </div>

      </div>

      {/* Menu */}

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={20} />

              <span className="font-medium">
                {item.name}
              </span>
            </NavLink>
          );
        })}

      </nav>

      {/* User + Logout */}

      <div className="p-4 border-t border-slate-800">

        {user && (
          <div className="mb-3 px-3">

            <p className="text-sm font-semibold text-white truncate">
              {user.username || "User"}
            </p>

            <p className="text-xs text-slate-500 truncate">
              {user.email || ""}
            </p>

          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          <LogOut size={20} />

          <span className="font-medium">
            Logout
          </span>
        </button>

        <p className="text-xs text-slate-500 text-center mt-4">
          QuantNova v1.0.0
        </p>

      </div>

    </aside>
  );
}