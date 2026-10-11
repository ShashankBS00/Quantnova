import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  RefreshCw,
  WalletCards,
  TrendingUp,
  Download,
  AlertCircle,
  Plus,
  Clock,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import PortfolioSummaryCards from "./PortfolioSummaryCards";
import HoldingsTable from "./HoldingsTable";
import PortfolioAllocation from "./PortfolioAllocation";
import RecentTransactions from "./RecentTransactions";
import HoldingDetailsDrawer from "./HoldingDetailsDrawer";
import PaperTradeModal from "./PaperTradeModal";

import { getPortfolioAccountData } from "@/services/portfolioAccountService";
import { getBatchQuotes } from "@/services/marketService";
import { getCurrentMarketData } from "@/services/portfolioService";

export default function Portfolio() {
  const [account, setAccount] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cash, setCash] = useState(100000);
  const [initialCash, setInitialCash] = useState(100000);

  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Modal / Drawer state
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradePrefill, setTradePrefill] = useState(null);

  // Fetch portfolio data and batch market quotes
  const loadPortfolioData = useCallback(async ({ isBackground = false } = {}) => {
    if (isBackground) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Fetch account, holdings, and orders from backend
      const accountData = await getPortfolioAccountData();
      setAccount(accountData.account);
      setHoldings(accountData.holdings || []);
      setOrders(accountData.orders || []);
      setCash(accountData.cash || 100000);
      setInitialCash(accountData.initialCash || 100000);

      const symbols = (accountData.holdings || []).map((h) => h.symbol);

      // 2. If holdings exist, fetch market quotes
      if (symbols.length > 0) {
        try {
          const quotesResponse = await getBatchQuotes(symbols);
          const quotesMap = {};

          if (quotesResponse && quotesResponse.quotes) {
            Object.entries(quotesResponse.quotes).forEach(([sym, q]) => {
              if (q) {
                quotesMap[sym] = q;
              }
            });
          }

          // Check if any symbols are missing from batch response, fetch fallback
          const missingSymbols = symbols.filter((s) => !quotesMap[s]);
          if (missingSymbols.length > 0) {
            const fallbackResults = await Promise.allSettled(
              missingSymbols.map((sym) => getCurrentMarketData(sym))
            );
            fallbackResults.forEach((res) => {
              if (res.status === "fulfilled" && res.value) {
                quotesMap[res.value.symbol] = {
                  symbol: res.value.symbol,
                  price: res.value.currentPrice,
                  prev_close: res.value.previousClose,
                };
              }
            });
          }

          setMarketData(quotesMap);
          // Only update timestamp when quote request succeeded
          setLastUpdated(new Date());
        } catch (quoteErr) {
          console.warn("Failed to fetch latest market quotes:", quoteErr);
          setError("Market quote update temporarily delayed. Displaying last recorded valuations.");
          // Do not update lastUpdated timestamp when quote refresh fails
        }
      } else {
        // No holdings, timestamp is valid
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to load portfolio:", err);
      setError("Unable to connect to trading account service. Please check your network connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolioData();
    const interval = setInterval(() => loadPortfolioData({ isBackground: true }), 30000);
    return () => clearInterval(interval);
  }, [loadPortfolioData]);

  // Total current valuation for drawer allocation
  const currentTotalValuation = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const q = marketData[h.symbol];
      const p = q?.price ?? q?.currentPrice ?? h.averagePrice;
      return sum + (h.quantity || 0) * (Number(p) || 0);
    }, 0);
  }, [holdings, marketData]);

  // Open drawer for holding
  const handleSelectHolding = useCallback((stock) => {
    setSelectedHolding(stock);
    setIsDrawerOpen(true);
  }, []);

  // Open trade modal with prefilled data
  const handleQuickTrade = useCallback((prefillData) => {
    setTradePrefill(prefillData);
    setTradeModalOpen(true);
  }, []);

  // CSV Export handler
  const handleExportCSV = useCallback(() => {
    if (!holdings.length) {
      alert("No active holdings to export.");
      return;
    }

    const headers = [
      "Symbol",
      "Quantity",
      "Average Price",
      "Current Price",
      "Invested Value",
      "Current Value",
      "Unrealized P&L",
      "P&L Percent",
    ];

    const rows = holdings.map((h) => {
      const q = marketData[h.symbol];
      const currentPrice = q?.price ?? q?.currentPrice ?? h.averagePrice;
      const invested = h.quantity * h.averagePrice;
      const currentValue = h.quantity * currentPrice;
      const pnl = currentValue - invested;
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

      return [
        `"${h.symbol}"`,
        h.quantity,
        h.averagePrice.toFixed(2),
        currentPrice.toFixed(2),
        invested.toFixed(2),
        currentValue.toFixed(2),
        pnl.toFixed(2),
        `${pnlPct.toFixed(2)}%`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QuantNova_Portfolio_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [holdings, marketData]);

  return (
    <div className="space-y-6 pb-14 animate-fade-up">

      {/* ── 1. Portfolio Header ── */}
      <header
        className="rounded-2xl p-6 sm:p-7 border bg-white shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
        style={{ borderColor: "rgba(99, 102, 241, 0.16)" }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
            >
              <WalletCards size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Portfolio Overview
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Paper Terminal
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Track your positions, performance and allocation using market data.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {lastUpdated && (
            <span
              className="text-xs text-slate-500 font-medium px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <Clock size={13} className="text-slate-400" />
              <span>
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </span>
            </span>
          )}

          {/* Refresh Data Button */}
          <button
            type="button"
            onClick={() => loadPortfolioData()}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 transition-all active:scale-95"
          >
            <RefreshCw
              size={14}
              className={refreshing || loading ? "animate-spin text-indigo-600" : "text-slate-500"}
            />
            <span>{refreshing ? "Refreshing…" : "Refresh Data"}</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={holdings.length === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Export portfolio as CSV"
          >
            <Download size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* New Trade Button */}
          <button
            type="button"
            onClick={() => handleQuickTrade({ side: "BUY" })}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
            }}
          >
            <Plus size={15} />
            <span>New Trade</span>
          </button>
        </div>
      </header>

      {/* Error Alert Banner (if quote refresh failed without clearing holdings) */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-amber-700 hover:text-amber-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── 2. Four Summary Cards ── */}
      <PortfolioSummaryCards
        holdings={holdings}
        marketData={marketData}
        cash={cash}
        loading={loading}
      />

      {/* ── 3. Holdings Table (with Search, Filter, Sort & Actions) ── */}
      <HoldingsTable
        holdings={holdings}
        marketData={marketData}
        loading={loading}
        onSelectHolding={handleSelectHolding}
        onQuickTrade={handleQuickTrade}
      />

      {/* ── 4. Portfolio Allocation (Donut Chart & Macro Split) ── */}
      <PortfolioAllocation
        holdings={holdings}
        marketData={marketData}
        cash={cash}
        loading={loading}
      />
      {/* ── 5. Recent Transactions (Verified Backend Order History) ── */}
      <RecentTransactions orders={orders} loading={loading} />

      {/* ── Slide-Over Holding Details Drawer ── */}
      <HoldingDetailsDrawer
        holding={selectedHolding}
        quote={selectedHolding ? marketData[selectedHolding.symbol] : null}
        totalPortfolioValue={currentTotalValuation}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenTrade={handleQuickTrade}
      />

      {/* ── Paper Trade Order Modal ── */}
      <PaperTradeModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        onTradeSuccess={() => {
          loadPortfolioData();
        }}
        prefill={tradePrefill}
        availableCash={cash}
        holdings={holdings}
      />
    </div>
  );
}
