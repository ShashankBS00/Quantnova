import React, { useState, useMemo } from "react";
import {
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  CheckCircle2,
  ReceiptText,
} from "lucide-react";
import { formatINR, formatPnlINR, getCleanSymbol, getCompanyName } from "@/utils/stockUtils";

export default function RecentTransactions({ orders = [], loading = false }) {
  const [sideFilter, setSideFilter] = useState("ALL"); // ALL | BUY | SELL
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (sideFilter === "BUY") {
      result = result.filter((o) => o.side === "BUY");
    } else if (sideFilter === "SELL") {
      result = result.filter((o) => o.side === "SELL");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.symbol.toLowerCase().includes(q) ||
          getCleanSymbol(o.symbol).toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, sideFilter, searchQuery]);

  return (
    <section className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-lg font-bold text-slate-900 tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Recent Transactions & Execution Log
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {orders.length} Executed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified paper-trading order fills recorded by execution engine
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter symbol…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {["ALL", "BUY", "SELL"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSideFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  sideFilter === s
                    ? "bg-white text-indigo-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {s === "ALL" ? "All Fills" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Loading order execution log…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Clock className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No Transactions Recorded</p>
          <p className="text-xs text-slate-400 max-w-sm mt-0.5">
            Placed paper-trading orders will automatically appear here with execution timestamps and realized returns.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          No transactions match this filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <tr>
                <th className="py-3 px-5">Date / Time</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Execution Price</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-right">Realized P&L</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map((order, index) => {
                const isBuy = order.side === "BUY";
                const pnl = Number(order.realized_pnl ?? 0);
                const orderTotal = Number(order.total) || Number(order.quantity) * Number(order.price);

                const dateStr = order.created_at
                  ? new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                const timeStr = order.created_at
                  ? new Date(order.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "—";

                return (
                  <tr key={order.id || index} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <span className="font-semibold text-slate-800">{dateStr}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">{timeStr}</span>
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4 font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      <div className="flex items-center gap-1.5">
                        <span>{getCleanSymbol(order.symbol)}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">NSE</span>
                      </div>
                    </td>

                    {/* Side */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isBuy
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {isBuy ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {order.side}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {order.quantity} shs
                    </td>

                    {/* Execution Price */}
                    <td className="py-3.5 px-4 text-right text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatINR(order.price)}
                    </td>

                    {/* Order Total */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatINR(orderTotal)}
                    </td>

                    {/* Realized P&L */}
                    <td className="py-3.5 px-4 text-right font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {!isBuy && order.realized_pnl !== undefined ? (
                        <span className={pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                          {formatPnlINR(pnl)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        {order.status || "FILLED"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
