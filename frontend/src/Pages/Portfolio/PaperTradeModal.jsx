import React, { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wallet,
  ShieldCheck,
  Target,
} from "lucide-react";
import { placeOrder } from "@/services/tradingService";
import { formatINR, getCompanyName, getCleanSymbol } from "@/utils/stockUtils";

export default function PaperTradeModal({
  isOpen = false,
  onClose,
  onTradeSuccess,
  prefill = null, // { symbol, side, price, maxQuantity }
  availableCash = 100000,
  holdings = [],
}) {
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("BUY");
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState("MARKET");
  const [price, setPrice] = useState(100);
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Initialize or prefill
  useEffect(() => {
    if (prefill) {
      if (prefill.symbol) setSymbol(prefill.symbol);
      if (prefill.side) setSide(prefill.side);
      if (prefill.price) setPrice(prefill.price);
      if (prefill.quantity) setQuantity(prefill.quantity);
      else setQuantity(1);
    } else {
      setSymbol("");
      setSide("BUY");
      setQuantity(1);
      setPrice(100);
    }
    setError(null);
    setSuccessMessage(null);
  }, [prefill, isOpen]);

  if (!isOpen) return null;

  const currentHolding = holdings.find((h) => h.symbol.toUpperCase() === symbol.toUpperCase());
  const maxSellQuantity = currentHolding ? currentHolding.quantity : 0;

  const numQty = Math.max(1, parseInt(quantity, 10) || 1);
  const numPrice = Math.max(0.05, parseFloat(price) || 0);
  const estimatedTotal = numQty * numPrice;

  // Validations
  let validationError = null;
  if (!symbol.trim()) {
    validationError = "Please specify a stock symbol (e.g. TCS.NS, RELIANCE.NS).";
  } else if (side === "BUY" && estimatedTotal > availableCash) {
    validationError = `Insufficient cash. Order requires ${formatINR(estimatedTotal)}, but only ${formatINR(availableCash)} available.`;
  } else if (side === "SELL" && (!currentHolding || numQty > maxSellQuantity)) {
    validationError = `You only own ${maxSellQuantity} shares of ${symbol}. Cannot sell ${numQty} shares.`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderPayload = {
        symbol: symbol.trim().toUpperCase(),
        quantity: numQty,
        price: numPrice,
        side: side.toUpperCase(),
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        target: target ? parseFloat(target) : null,
      };

      const result = await placeOrder(orderPayload);
      setSuccessMessage(
        `Successfully executed ${side} order for ${numQty} shares of ${symbol} at ${formatINR(numPrice)}!`
      );

      if (onTradeSuccess) {
        onTradeSuccess(result);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Paper trade failed:", err);
      const detail = err.response?.data?.detail || err.message || "Failed to execute paper order.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm ${
                side === "BUY"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-rose-500 to-red-600"
              }`}
            >
              {side === "BUY" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </span>
            <div>
              <h2
                className="text-lg font-bold text-slate-900 tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Paper Trading Order Terminal
              </h2>
              <p className="text-xs text-slate-500">Instant simulated exchange execution on NSE</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Side Toggle: BUY / SELL */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSide("BUY")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                side === "BUY"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => setSide("SELL")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                side === "SELL"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              SELL / EXIT
            </button>
          </div>

          {/* Symbol Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Stock Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. TCS.NS or RELIANCE.NS"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              required
            />
            {symbol && (
              <p className="text-xs text-slate-500 mt-1">
                {getCompanyName(symbol)}
              </p>
            )}
          </div>

          {/* Quantity & Price Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Quantity
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                required
              />
              {side === "SELL" && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Holding: {maxSellQuantity} shares
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Execution Price (₹)
              </label>
              <input
                type="number"
                min="0.05"
                step="0.05"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                required
              />
            </div>
          </div>

          {/* Optional Stop Loss & Target */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <ShieldCheck size={13} className="text-amber-500" /> Stop Loss (Optional)
              </label>
              <input
                type="number"
                step="0.05"
                placeholder="Optional"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Target size={13} className="text-emerald-500" /> Target (Optional)
              </label>
              <input
                type="number"
                step="0.05"
                placeholder="Optional"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Estimated Order Value:</span>
              <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatINR(estimatedTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1">
                <Wallet size={13} /> Available Virtual Cash:
              </span>
              <span className="font-bold text-indigo-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatINR(availableCash)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !!validationError}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                side === "BUY"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting Order…</span>
                </>
              ) : (
                <span>Confirm & Place {side} Order</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
