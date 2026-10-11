import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, Check, Plus, AlertCircle, Building2 } from "lucide-react";
import { searchMarketStocks } from "@/services/marketService";

export default function AddStockDialog({
  isOpen,
  onClose,
  onAddStock,
  existingSymbols = [],
  watchlistName = "Watchlist",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addedMap, setAddedMap] = useState({}); // symbol -> true

  const inputRef = useRef(null);
  const abortCtrlRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) return;

    if (abortCtrlRef.current) abortCtrlRef.current.abort();
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchMarketStocks(trimmed, ctrl.signal)
        .then((data) => {
          if (!ctrl.signal.aborted) {
            setResults(data.results || []);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (err?.name === "CanceledError" || err?.name === "AbortError") return;
          setLoading(false);
          setError("Failed to search securities. Please try again.");
        });
    }, 280);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, isOpen]);

  const handleClose = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
    onClose();
  }, [onClose]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleAdd = (item) => {
    onAddStock(item);
    setAddedMap((prev) => ({ ...prev, [item.symbol]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0c1326] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Add Stocks to {watchlistName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Search by company name or NSE/BSE symbol
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Reliance, TCS, HDFC, SBIN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all shadow-xs"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 min-h-[260px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 size={24} className="animate-spin text-indigo-500 mb-2" />
              <span className="text-xs font-mono">Searching Indian exchanges…</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 m-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-4">
              <Building2 size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                No matching Indian securities found
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Try searching by exact ticker symbol (e.g. INFY, SBIN, TATAMOTORS)
              </p>
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-4">
              <Search size={28} className="text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Type a company name or ticker to begin searching
              </p>
            </div>
          )}

          {!loading &&
            results.map((item) => {
              const cleanSym = item.symbol.toUpperCase();
              const isAlreadyInList = existingSymbols.some(
                (s) => (typeof s === "string" ? s : s.symbol).toUpperCase() === cleanSym
              );
              const isJustAdded = addedMap[cleanSym];

              return (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-all group"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {item.symbol.replace(/\.(NS|BO)$/i, "")}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                        {item.exchange_display || "NSE"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs truncate">
                      {item.name || item.short_name || item.symbol}
                    </span>
                  </div>

                  <div>
                    {isAlreadyInList || isJustAdded ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/50">
                        <Check size={12} />
                        <span>Added</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(item)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Real-time NSE/BSE Securities</span>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
