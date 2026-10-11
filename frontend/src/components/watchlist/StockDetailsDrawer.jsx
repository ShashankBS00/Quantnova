import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Check,
  TrendingUp,
  Trash2,
  FolderPlus,
  BarChart2,
} from "lucide-react";
import WatchlistSparkline from "./WatchlistSparkline";

// ─── Format volume numbers ────────────────────────────────────────────────────
function fmtVol(n) {
  if (!n) return "—";
  if (n >= 1e7) return (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return (n / 1e5).toFixed(2) + " L";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " K";
  return String(n);
}

export default function StockDetailsDrawer({
  stock,
  quote,
  isOpen,
  onClose,
  allWatchlists = [],
  currentWatchlistId,
  onAddToWatchlist,
  onRemoveFromWatchlist,
}) {
  const [copied, setCopied] = useState(false);
  const [selectedTargetList, setSelectedTargetList] = useState("");
  const [addedToListMessage, setAddedToListMessage] = useState(null);

  if (!isOpen || !stock) return null;

  const symbol = stock.symbol;
  const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, "");
  const exchange = stock.exchange || (symbol.endsWith(".BO") ? "BSE" : "NSE");
  const name = stock.name || `${cleanSymbol} Limited`;

  const price = quote?.price;
  const change = quote?.change ?? 0;
  const changePercent = quote?.change_percent ?? 0;
  const isPositive = change >= 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(symbol);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToList = () => {
    if (!selectedTargetList) return;
    onAddToWatchlist(selectedTargetList, stock);
    const targetName = allWatchlists.find((w) => w.id === selectedTargetList)?.name || "list";
    setAddedToListMessage(`Added to ${targetName}`);
    setSelectedTargetList("");
    setTimeout(() => setAddedToListMessage(null), 2500);
  };

  // Other lists available to add to
  const otherLists = allWatchlists.filter((w) => w.id !== currentWatchlistId);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-[#0a1020] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#070b16]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white tracking-wide">
              {cleanSymbol}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
              {exchange}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">{name}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Price Card */}
        <div className="bg-slate-50 dark:bg-[#0d162d] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1">
            Last Traded Price
          </div>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              {price != null
                ? `₹${price.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "—"}
            </div>
            {price != null && (
              <div
                className={`flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-xl ${
                  isPositive
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                }`}
              >
                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>
                  {isPositive ? "+" : ""}
                  {change.toFixed(2)} ({isPositive ? "+" : ""}
                  {changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          {/* Mini Sparkline Banner */}
          {quote?.sparkline && quote.sparkline.length > 1 && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                5-Day Trend
              </span>
              <WatchlistSparkline
                data={quote.sparkline}
                positive={isPositive}
                width={120}
                height={32}
              />
            </div>
          )}
        </div>

        {/* Market Stats Grid */}
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Key Session Statistics
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white dark:bg-[#0c1328] border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 block">Open</span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                {quote?.open != null ? `₹${quote.open.toFixed(2)}` : "—"}
              </span>
            </div>

            <div className="bg-white dark:bg-[#0c1328] border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 block">Previous Close</span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                {quote?.prev_close != null ? `₹${quote.prev_close.toFixed(2)}` : "—"}
              </span>
            </div>

            <div className="bg-white dark:bg-[#0c1328] border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 block">Day High</span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {quote?.high != null ? `₹${quote.high.toFixed(2)}` : "—"}
              </span>
            </div>

            <div className="bg-white dark:bg-[#0c1328] border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 block">Day Low</span>
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                {quote?.low != null ? `₹${quote.low.toFixed(2)}` : "—"}
              </span>
            </div>

            <div className="bg-white dark:bg-[#0c1328] border border-slate-200 dark:border-slate-800 p-3 rounded-xl col-span-2">
              <span className="text-[10px] font-mono text-slate-500 block">Total Volume</span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                {quote?.volume != null ? fmtVol(quote.volume) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="space-y-2 pt-2">
          <Link
            to={`/market?symbol=${encodeURIComponent(symbol)}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all shadow-md shadow-indigo-600/25"
          >
            <BarChart2 size={14} />
            <span>Open Interactive Chart</span>
          </Link>

          <Link
            to={`/trading?symbol=${encodeURIComponent(symbol)}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-all shadow-md shadow-emerald-600/25"
          >
            <TrendingUp size={14} />
            <span>Place Paper Trade</span>
          </Link>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copied ? "Symbol Copied!" : "Copy Ticker Symbol"}</span>
          </button>
        </div>

        {/* Add to another Watchlist */}
        {otherLists.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Copy to Another Watchlist:
            </label>
            <div className="flex gap-2">
              <select
                value={selectedTargetList}
                onChange={(e) => setSelectedTargetList(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="">Select watchlist...</option>
                {otherLists.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddToList}
                disabled={!selectedTargetList}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FolderPlus size={13} />
                <span>Add</span>
              </button>
            </div>
            {addedToListMessage && (
              <span className="inline-block mt-1.5 text-[11px] font-mono text-emerald-500">
                ✓ {addedToListMessage}
              </span>
            )}
          </div>
        )}

        {/* Remove from current Watchlist */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              onRemoveFromWatchlist(symbol);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-mono font-semibold transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Remove from this Watchlist</span>
          </button>
        </div>
      </div>
    </div>
  );
}
