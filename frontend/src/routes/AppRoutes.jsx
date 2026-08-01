import { Routes, Route } from "react-router-dom";

import Layout from "@/components/layout/Layout";

import Dashboard from "@/pages/Dashboard/Dashboard";
import Market from "@/pages/Market/Market";
import Watchlist from "@/pages/Watchlist/Watchlist";
import Portfolio from "@/pages/Portfolio/Portfolio";
import Prediction from "@/pages/Prediction/Prediction";
import Strategy from "@/pages/Strategy/Strategy";
import Backtest from "@/pages/Backtest/Backtest";
import Reports from "@/pages/Reports/Reports";
import Settings from "@/pages/Settings/Settings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />

      <Route
        path="/market"
        element={
          <Layout>
            <Market />
          </Layout>
        }
      />

      <Route
        path="/watchlist"
        element={
          <Layout>
            <Watchlist />
          </Layout>
        }
      />

      <Route
        path="/portfolio"
        element={
          <Layout>
            <Portfolio />
          </Layout>
        }
      />

      <Route
        path="/prediction"
        element={
          <Layout>
            <Prediction />
          </Layout>
        }
      />

      <Route
        path="/strategy"
        element={
          <Layout>
            <Strategy />
          </Layout>
        }
      />

      <Route
        path="/backtest"
        element={
          <Layout>
            <Backtest />
          </Layout>
        }
      />

      <Route
        path="/reports"
        element={
          <Layout>
            <Reports />
          </Layout>
        }
      />

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