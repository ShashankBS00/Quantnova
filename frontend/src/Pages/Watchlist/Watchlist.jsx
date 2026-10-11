import { useState, useEffect, useRef, useCallback } from "react";
import {
  RotateCw,
  Plus,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  fetchWatchlists,
  createWatchlist,
  renameWatchlist,
  deleteWatchlist,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
} from "@/services/watchlistService";
import { getBatchQuotes } from "@/services/marketService";
import { getNSEMarketStatus } from "@/lib/marketHours";

import WatchlistTabs from "@/components/watchlist/WatchlistTabs";
import WatchlistTable from "@/components/watchlist/WatchlistTable";
import AddStockDialog from "@/components/watchlist/AddStockDialog";
import StockDetailsDrawer from "@/components/watchlist/StockDetailsDrawer";

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Price change flash state: symbol -> 'up' | 'down'
  const [priceFlashMap, setPriceFlashMap] = useState({});

  // UI state for Dialogs and Drawer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Market status (computed in IST)
  const [marketStatus, setMarketStatus] = useState(getNSEMarketStatus());

  // Ref to previous quotes to compute price flash highlights
  const prevQuotesRef = useRef({});

  // Show transient toast
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // ── 1. Load watchlists on initial mount ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const lists = await fetchWatchlists();
        if (cancelled) return;
        setWatchlists(lists);
        if (lists.length > 0) {
          setActiveWatchlistId((prev) => prev || lists[0].id);
        }
      } catch (err) {
        console.error("Watchlist initialization failed:", err);
      }
    }
    init();

    // Periodic market status update every 30s
    const statusTimer = setInterval(() => {
      setMarketStatus(getNSEMarketStatus());
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(statusTimer);
    };
  }, []);

  // Selected watchlist
  const activeWatchlist =
    watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0] || null;

  // ── 2. Fetch batch quotes whenever activeWatchlist symbols change ─────────
  const fetchQuotesData = useCallback(
    async (showSpinner = false) => {
      if (!activeWatchlist || !activeWatchlist.symbols || activeWatchlist.symbols.length === 0) {
        return;
      }
      if (showSpinner) setRefreshing(true);

      const symbols = activeWatchlist.symbols.map((s) =>
        typeof s === "string" ? s : s.symbol
      );

      try {
        const data = await getBatchQuotes(symbols);
        if (data.success && data.quotes) {
          const flash = {};
          const prevMap = prevQuotesRef.current;

          Object.entries(data.quotes).forEach(([sym, newQ]) => {
            if (!newQ) return;
            const oldQ = prevMap[sym];
            if (oldQ && oldQ.price != null && newQ.price != null) {
              if (newQ.price > oldQ.price) flash[sym] = "up";
              else if (newQ.price < oldQ.price) flash[sym] = "down";
            }
          });

          setPriceFlashMap(flash);
          setTimeout(() => setPriceFlashMap({}), 1200);

          prevQuotesRef.current = data.quotes;
          setQuotes((prev) => ({ ...prev, ...data.quotes }));
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (err) {
        console.error("Failed to load quotes:", err);
        setError("Unable to update live quotes. Reconnecting in next cycle.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeWatchlist]
  );

  // Load when active list changes
  useEffect(() => {
    let cancelled = false;
    if (!activeWatchlist || !activeWatchlist.symbols || activeWatchlist.symbols.length === 0) {
      queueMicrotask(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
      return;
    }

    const symbols = activeWatchlist.symbols.map((s) =>
      typeof s === "string" ? s : s.symbol
    );

    getBatchQuotes(symbols)
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.quotes) {
          const flash = {};
          const prevMap = prevQuotesRef.current;

          Object.entries(data.quotes).forEach(([sym, newQ]) => {
            if (!newQ) return;
            const oldQ = prevMap[sym];
            if (oldQ && oldQ.price != null && newQ.price != null) {
              if (newQ.price > oldQ.price) flash[sym] = "up";
              else if (newQ.price < oldQ.price) flash[sym] = "down";
            }
          });

          setPriceFlashMap(flash);
          setTimeout(() => setPriceFlashMap({}), 1200);

          prevQuotesRef.current = data.quotes;
          setQuotes((prev) => ({ ...prev, ...data.quotes }));
          setLastUpdated(new Date());
          setError(null);
        }
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load quotes:", err);
        setError("Unable to update live quotes. Reconnecting in next cycle.");
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeWatchlist]);

  // Periodic polling every 30 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchQuotesData(false);
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchQuotesData]);

  // ── Watchlist Management Handlers ─────────────────────────────────────────

  const handleCreateWatchlist = async (name) => {
    try {
      const res = await createWatchlist(name, []);
      setWatchlists(res.watchlists);
      if (res.newId) setActiveWatchlistId(res.newId);
      showToast(`Created watchlist "${name}"`);
    } catch (err) {
      alert(err.message || "Failed to create watchlist");
    }
  };

  const handleRenameWatchlist = async (id, newName) => {
    try {
      const updated = await renameWatchlist(id, newName);
      setWatchlists(updated);
      showToast(`Renamed to "${newName}"`);
    } catch (err) {
      alert(err.message || "Failed to rename watchlist");
    }
  };

  const handleDeleteWatchlist = async (id) => {
    try {
      const deletedName = watchlists.find((w) => w.id === id)?.name;
      const updated = await deleteWatchlist(id);
      setWatchlists(updated);
      if (activeWatchlistId === id && updated.length > 0) {
        setActiveWatchlistId(updated[0].id);
      }
      showToast(`Deleted watchlist "${deletedName}"`);
    } catch (err) {
      alert(err.message || "Failed to delete watchlist");
    }
  };

  const handleAddStock = async (stockItem) => {
    if (!activeWatchlist) return;
    try {
      const updated = await addSymbolToWatchlist(activeWatchlist.id, stockItem);
      setWatchlists(updated);
      showToast(`Added ${stockItem.symbol} to ${activeWatchlist.name}`);
      // Refresh quotes to fetch new stock immediately
      fetchQuotesData();
    } catch (err) {
      showToast(err.message || "Failed to add stock");
    }
  };

  const handleRemoveStock = async (symbol) => {
    if (!activeWatchlist) return;
    try {
      const updated = await removeSymbolFromWatchlist(activeWatchlist.id, symbol);
      setWatchlists(updated);
      showToast(`Removed ${symbol}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStockToSpecificList = async (targetListId, stockItem) => {
    try {
      const updated = await addSymbolToWatchlist(targetListId, stockItem);
      setWatchlists(updated);
      const targetName = watchlists.find((w) => w.id === targetListId)?.name;
      showToast(`Copied ${stockItem.symbol} to ${targetName}`);
    } catch (err) {
      showToast(err.message || "Failed to copy stock");
    }
  };

  const symbolsCount = activeWatchlist?.symbols?.length || 0;

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans text-slate-800 dark:text-slate-100">
      {/* ── Toast Notification ─────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Watchlist Header (Section 3) ──────────────────────────────────── */}
      <div className="bg-white dark:bg-[#090e1c] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title, Subtitle, Status Badge */}
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
              Watchlist
            </h1>
            <span className="text-slate-300 dark:text-slate-700">·</span>

            {/* Reliable Market Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                marketStatus.isTrading
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
              title={marketStatus.detail}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  marketStatus.isTrading ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span>{marketStatus.label}</span>
            </div>

            {/* Total symbols count badge */}
            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
              {symbolsCount} {symbolsCount === 1 ? "Symbol" : "Symbols"}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
            <span>Track your favorite stocks and market movements</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              {marketStatus.detail}
            </span>
          </p>
        </div>

        {/* Right Tools: Refresh & Add Stock Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Last updated timestamp */}
          {lastUpdated && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <Clock size={12} className="text-slate-400" />
              <span>
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchQuotesData(true)}
            disabled={refreshing}
            title="Refresh Quotes"
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RotateCw size={13} className={refreshing ? "animate-spin text-indigo-500" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Add Stock Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* ── Multiple Watchlists Tab Strip (Section 4) ────────────────────── */}
      <WatchlistTabs
        watchlists={watchlists}
        activeId={activeWatchlistId}
        onSelect={(id) => setActiveWatchlistId(id)}
        onCreate={handleCreateWatchlist}
        onRename={handleRenameWatchlist}
        onDelete={handleDeleteWatchlist}
      />

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="underline hover:text-rose-700 cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Market Watch Table (Section 6, 7, 8, 9) ───────────────────────── */}
      <WatchlistTable
        stocks={activeWatchlist?.symbols || []}
        quotes={quotes}
        loading={loading}
        priceFlashMap={priceFlashMap}
        onSelectStock={(stock) => setSelectedStock(stock)}
        onRemoveStock={handleRemoveStock}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        selectedSymbol={selectedStock?.symbol}
      />

      {/* ── Add Stock Search Modal (Section 5) ────────────────────────────── */}
      <AddStockDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStock={handleAddStock}
        existingSymbols={activeWatchlist?.symbols || []}
        watchlistName={activeWatchlist?.name}
      />

      {/* ── Stock Details Slide-in Drawer (Section 10 & 11) ───────────────── */}
      <StockDetailsDrawer
        stock={selectedStock}
        quote={selectedStock ? quotes[selectedStock.symbol] : null}
        isOpen={Boolean(selectedStock)}
        onClose={() => setSelectedStock(null)}
        allWatchlists={watchlists}
        currentWatchlistId={activeWatchlistId}
        onAddToWatchlist={handleAddStockToSpecificList}
        onRemoveFromWatchlist={handleRemoveStock}
      />
    </div>
  );
}