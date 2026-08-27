import { Routes, Route } from "react-router-dom";

import Layout from "@/components/layout/Layout";

import Login from "@/pages/Login";
import Register from "@/pages/Register";

import Dashboard from "@/pages/Dashboard/Dashboard";
import Market from "@/pages/Market/Market";
import Watchlist from "@/pages/Watchlist/Watchlist";
import Portfolio from "@/pages/Portfolio/Portfolio";
import Prediction from "@/pages/Prediction/Prediction";
import Strategy from "@/pages/Strategy/Strategy";
import Backtest from "@/pages/Backtest/Backtest";
import Reports from "@/pages/Reports/Reports";
import Settings from "@/pages/Settings/Settings";
import Trading from "@/pages/Trading/Trading";
import TradingAnalytics from "@/pages/Trading/TradingAnalytics";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ========================= */}
      {/* Authentication */}
      {/* ========================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* ========================= */}
      {/* Dashboard */}
      {/* ========================= */}

      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* Market */}
      {/* ========================= */}

      <Route
        path="/market"
        element={
          <Layout>
            <Market />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* Watchlist */}
      {/* ========================= */}

      <Route
        path="/watchlist"
        element={
          <Layout>
            <Watchlist />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* Portfolio */}
      {/* ========================= */}

      <Route
        path="/portfolio"
        element={
          <Layout>
            <Portfolio />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* AI Prediction */}
      {/* ========================= */}

      <Route
        path="/prediction"
        element={
          <Layout>
            <Prediction />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* Strategy */}
      {/* ========================= */}

      <Route
        path="/strategy"
        element={
          <Layout>
            <Strategy />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* Backtesting */}
      {/* ========================= */}

      <Route
        path="/backtest"
        element={
          <Layout>
            <Backtest />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* Paper Trading */}
      {/* ========================= */}

      <Route
        path="/trading"
        element={
          <Layout>
            <Trading />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* Trading Analytics */}
      {/* ========================= */}

      <Route
        path="/trading-analytics"
        element={
          <Layout>
            <TradingAnalytics />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* Reports */}
      {/* ========================= */}

      <Route
        path="/reports"
        element={
          <Layout>
            <Reports />
          </Layout>
        }
      />


      {/* ========================= */}
      {/* Settings */}
      {/* ========================= */}

      <Route
        path="/settings"
        element={
          <Layout>
            <Settings />
          </Layout>
        }
      />

    </Routes>
  );
}