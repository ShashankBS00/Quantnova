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
} from "lucide-react";
import { NavLink } from "react-router-dom";

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

      <nav className="flex-1 p-4 space-y-2">

        {menuItems.map((item) => {

          const Icon = item.icon;

          return (

            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
                ${
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

      {/* Footer */}

      <div className="p-5 border-t border-slate-800">

        <p className="text-xs text-slate-500 text-center">
          QuantNova v1.0.0
        </p>

      </div>

    </aside>
  );
}