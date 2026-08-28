import { Routes, Route } from "react-router-dom";

import Layout from "@/components/layout/Layout";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
      {/* PUBLIC ROUTES */}
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
      {/* PROTECTED ROUTES */}
      {/* ========================= */}

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/market"
        element={
          <ProtectedRoute>
            <Layout>
              <Market />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <Layout>
              <Watchlist />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <Layout>
              <Portfolio />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/prediction"
        element={
          <ProtectedRoute>
            <Layout>
              <Prediction />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/strategy"
        element={
          <ProtectedRoute>
            <Layout>
              <Strategy />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/backtest"
        element={
          <ProtectedRoute>
            <Layout>
              <Backtest />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trading"
        element={
          <ProtectedRoute>
            <Layout>
              <Trading />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trading-analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <TradingAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}