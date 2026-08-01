import { Routes, Route } from "react-router-dom";

import Layout from "@/components/layout/Layout";

import Dashboard from "@/Pages/Dashboard/Dashboard";
import Market from "@/Pages/Market/Market";
import Watchlist from "@/Pages/Watchlist/Watchlist";
import Portfolio from "@/Pages/Portfolio/Portfolio";
import Prediction from "@/Pages/Prediction/Prediction";
import Strategy from "@/Pages/Strategy/Strategy";
import Backtest from "@/Pages/Backtest/Backtest";
import Reports from "@/Pages/Reports/Reports";
import Settings from "@/Pages/Settings/Settings";

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