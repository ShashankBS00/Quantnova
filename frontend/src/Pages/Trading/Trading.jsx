import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Bot,
  ChartNoAxesCombined,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { getCurrentPrice } from "@/services/portfolioService";
import { getTradingAccount, placeOrder } from "@/services/tradingService";
import { getStrategies } from "@/services/strategyService";
import { runPaperTrade } from "@/services/paperTradingService";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const labelStyle = { color: "var(--qn-text-3)", fontFamily: "'JetBrains Mono', monospace" };
const monoStyle = { color: "var(--qn-text-1)", fontFamily: "'JetBrains Mono', monospace" };

function PanelTitle({ icon: Icon, color, tint, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: tint, color }}>
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--qn-text-3)" }}>{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export default function Trading() {
  const [account, setAccount] = useState(null);
  const [symbol, setSymbol] = useState("TCS.NS");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [side, setSide] = useState("BUY");
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [marketPrice, setMarketPrice] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");
  const [strategyResult, setStrategyResult] = useState(null);
  const [activeTab, setActiveTab] = useState("holdings");

  async function loadMarketPrice() {
    if (!symbol.trim()) return;
    try {
      setPriceLoading(true);
      const currentPrice = await getCurrentPrice(symbol.toUpperCase());
      setMarketPrice(currentPrice);
      setPrice(Number(currentPrice).toFixed(2));
    } catch (error) {
      console.error("Failed to load market price:", error);
      setMarketPrice(null);
      setPrice("");
    } finally {
      setPriceLoading(false);
    }
  }

  async function loadAccount() {
    try {
      setAccount(await getTradingAccount());
    } catch (error) {
      console.error("Failed to load trading account:", error);
    }
  }

  async function loadStrategies() {
    try {
      const data = await getStrategies();
      setStrategies(data);
      if (data.length > 0 && !selectedStrategyId) setSelectedStrategyId(String(data[0].id));
    } catch (error) {
      console.error("Failed to load strategies:", error);
    }
  }

  useEffect(() => {
    loadAccount();
    loadStrategies();
  }, []);

  useEffect(() => {
    loadMarketPrice();
    const interval = setInterval(loadMarketPrice, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  async function handleRunStrategy() {
    setMessage("");
    setMessageType("");
    setStrategyResult(null);
    if (!selectedStrategyId) {
      setMessage("Please select a strategy.");
      setMessageType("error");
      return;
    }
    try {
      setStrategyLoading(true);
      const result = await runPaperTrade(Number(selectedStrategyId));
      setStrategyResult(result);
      if (result.symbol) setSymbol(result.symbol);
      await loadAccount();
      setMessage(result.message || "Strategy executed successfully.");
      setMessageType(result.action === "BUY" || result.action === "SELL" ? "success" : "info");
    } catch (error) {
      console.error("Failed to run paper strategy:", error);
      setMessage(error.response?.data?.detail || "Failed to run paper strategy.");
      setMessageType("error");
    } finally {
      setStrategyLoading(false);
    }
  }

  async function handleOrder() {
    setMessage("");
    setMessageType("");
    try {
      setLoading(true);
      await placeOrder({ symbol: symbol.trim().toUpperCase(), quantity: Number(quantity), price: Number(price), side });
      setMessage(`${side} order placed successfully.`);
      setMessageType("success");
      setShowConfirmation(false);
      await loadAccount();
    } catch (error) {
      console.error("Failed to place order:", error);
      setMessage(error.response?.data?.detail || "Failed to place order.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function requestOrderConfirmation() {
    if (!symbol.trim() || !price || Number(price) <= 0 || !quantity || Number(quantity) <= 0) {
      setMessage("Please enter valid order details.");
      setMessageType("error");
      return;
    }
    setMessage("");
    setShowConfirmation(true);
  }

  const winningTrades = account?.winning_trades || 0;
  const losingTrades = account?.losing_trades || 0;
  const totalCompletedTrades = winningTrades + losingTrades;
  const winRate = totalCompletedTrades > 0 ? ((winningTrades / totalCompletedTrades) * 100).toFixed(2) : "0.00";
  const realizedPnl = Number(account?.realized_pnl || 0);
  const estimatedTotal = Number(price || 0) * Number(quantity || 0);
  const isBuy = side === "BUY";
  const actionColor = isBuy ? "var(--qn-bull)" : "var(--qn-bear)";
  const actionTint = isBuy ? "var(--qn-bull-dim)" : "var(--qn-bear-dim)";

  const stats = [
    { label: "Available cash", value: money(account?.cash), detail: "Buying power", icon: Banknote, color: "var(--qn-indigo)", tint: "rgba(79, 70, 229, 0.09)" },
    { label: "Realized P&L", value: `${realizedPnl >= 0 ? "+" : "-"}${money(Math.abs(realizedPnl))}`, detail: "Closed positions", icon: ChartNoAxesCombined, color: realizedPnl >= 0 ? "var(--qn-bull)" : "var(--qn-bear)", tint: realizedPnl >= 0 ? "var(--qn-bull-dim)" : "var(--qn-bear-dim)" },
    { label: "Winning trades", value: winningTrades, detail: `${losingTrades} losing trades`, icon: TrendingUp, color: "var(--qn-bull)", tint: "var(--qn-bull-dim)" },
    { label: "Win rate", value: `${winRate}%`, detail: `${totalCompletedTrades} completed trades`, icon: Sparkles, color: "var(--qn-cyan)", tint: "rgba(8, 145, 178, 0.09)" },
  ];

  return (
    <div className="space-y-8 pb-10 animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em]" style={{ background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.16)", color: "var(--qn-indigo)", fontFamily: "'JetBrains Mono', monospace" }}>
            <WalletCards size={12} strokeWidth={2.2} /> PAPER TRADING DESK
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Trade with confidence.</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--qn-text-2)" }}>Test your ideas in real market conditions, without putting capital at risk.</p>
        </div>
        <button type="button" onClick={loadAccount} className="qn-btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5" style={{ fontFamily: "'Inter', sans-serif" }}>
          <RefreshCw size={15} /> Refresh account
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon, color, tint }) => (
          <article key={label} className="qn-card p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={labelStyle}>{label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: tint, color }}><Icon size={17} /></span>
            </div>
            <p className="mt-5 text-2xl font-extrabold tracking-tight" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
            <p className="mt-2 text-xs" style={{ color: "var(--qn-text-2)" }}>{detail}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="qn-card min-w-0 p-5 sm:p-6">
          <PanelTitle icon={Bot} color="var(--qn-violet)" tint="rgba(109, 40, 217, 0.09)" title="Strategy runner" description="Execute a saved strategy against live market data." />
          {strategies.length === 0 ? (
            <div className="rounded-xl border px-4 py-8 text-center" style={{ background: "var(--qn-surface-2)", borderColor: "var(--qn-border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--qn-text-2)" }}>No saved strategies</p>
              <p className="mt-1 text-xs" style={{ color: "var(--qn-text-3)" }}>Create one in Strategy Builder to run it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em]" style={labelStyle}>Select strategy</label>
                <select value={selectedStrategyId} onChange={(event) => { setSelectedStrategyId(event.target.value); setStrategyResult(null); setMessage(""); }} className="qn-input w-full rounded-xl px-3 py-3.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {strategies.map((strategy) => <option key={strategy.id} value={strategy.id}>{strategy.name} — {strategy.symbol} — {strategy.strategy_type}</option>)}
                </select>
              </div>
              <button type="button" onClick={handleRunStrategy} disabled={strategyLoading || !selectedStrategyId} className="qn-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-50">
                {strategyLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={15} fill="currentColor" />} {strategyLoading ? "Running strategy" : "Run strategy"}
              </button>
            </div>
          )}
        </article>

        <article className="qn-card min-w-0 p-5 sm:p-6">
          <PanelTitle icon={Plus} color={actionColor} tint={actionTint} title="Manual paper order" description="Place a simulated order at the latest market price." />
          <div className="mb-5 inline-flex rounded-xl p-1" style={{ background: "var(--qn-surface-2)", border: "1px solid var(--qn-border)" }}>
            {["BUY", "SELL"].map((option) => {
              const active = side === option;
              const optionColor = option === "BUY" ? "var(--qn-bull)" : "var(--qn-bear)";
              return <button key={option} type="button" onClick={() => setSide(option)} className="rounded-lg px-5 py-2 text-xs font-bold tracking-wide transition-all" style={{ background: active ? (option === "BUY" ? "var(--qn-bull)" : "var(--qn-bear)") : "transparent", color: active ? "#fff" : optionColor, boxShadow: active ? "0 3px 8px rgba(26,31,60,0.12)" : "none", fontFamily: "'JetBrains Mono', monospace" }}>{option}</button>;
            })}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em]" style={labelStyle}>Symbol</label><input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} className="qn-input w-full rounded-xl px-3 py-3" style={monoStyle} placeholder="TCS.NS" /></div>
            <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em]" style={labelStyle}>Quantity</label><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="qn-input w-full rounded-xl px-3 py-3" style={monoStyle} /></div>
            <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em]" style={labelStyle}>Market price</label><input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="qn-input w-full rounded-xl px-3 py-3" style={monoStyle} placeholder="Loading…" /></div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={loadMarketPrice} disabled={priceLoading} className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-50" style={{ color: "var(--qn-indigo)" }}><RefreshCw size={13} className={priceLoading ? "animate-spin" : ""} /> {priceLoading ? "Updating market price" : "Refresh market price"}</button>
            {marketPrice !== null && !priceLoading && <span className="text-[10px]" style={labelStyle}>Latest quote: <b style={{ color: "var(--qn-text-2)" }}>{money(marketPrice)}</b></span>}
          </div>
          <div className="mt-5 flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: actionTint, border: `1px solid ${isBuy ? "rgba(5, 150, 105, 0.18)" : "rgba(220, 38, 38, 0.18)"}` }}>
            <div><p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ ...labelStyle, color: actionColor }}>Estimated total</p><p className="mt-1 text-xl font-extrabold" style={{ ...monoStyle, color: actionColor }}>{money(estimatedTotal)}</p></div>
            <button type="button" onClick={requestOrderConfirmation} disabled={loading || priceLoading} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" style={{ background: actionColor, boxShadow: isBuy ? "0 5px 16px rgba(5,150,105,0.22)" : "0 5px 16px rgba(220,38,38,0.22)" }}>
              {isBuy ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />} Place {side} order
            </button>
          </div>
        </article>
      </section>

      {message && <div className="flex items-start gap-3 rounded-xl border px-4 py-3 animate-fade-up" style={{ background: messageType === "success" ? "var(--qn-bull-dim)" : messageType === "error" ? "var(--qn-bear-dim)" : "var(--qn-gold-dim)", borderColor: messageType === "success" ? "rgba(5,150,105,0.22)" : messageType === "error" ? "rgba(220,38,38,0.22)" : "rgba(217,119,6,0.22)", color: messageType === "success" ? "var(--qn-bull)" : messageType === "error" ? "var(--qn-bear)" : "var(--qn-gold)" }}>
        {messageType === "success" ? <CircleCheck size={18} className="mt-0.5 shrink-0" /> : <CircleAlert size={18} className="mt-0.5 shrink-0" />}<p className="text-sm font-medium">{message}</p>
      </div>}

      {strategyResult && <section className="qn-card p-5 sm:p-6 animate-fade-up"><PanelTitle icon={Sparkles} color="var(--qn-gold)" tint="var(--qn-gold-dim)" title="Strategy result" description={strategyResult.message || "Latest strategy execution details."} /><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[
        ["Signal", strategyResult.signal, strategyResult.signal === "BUY" ? "var(--qn-bull)" : strategyResult.signal === "SELL" ? "var(--qn-bear)" : "var(--qn-gold)"],
        ["Action", strategyResult.action, "var(--qn-indigo)"], ["Price", money(strategyResult.price), "var(--qn-text-1)"], ["Fast EMA", Number(strategyResult.indicators?.fast_ema || 0).toFixed(2), "var(--qn-text-1)"], ["Slow SMA", Number(strategyResult.indicators?.slow_sma || 0).toFixed(2), "var(--qn-text-1)"]
      ].map(([label, value, color]) => <div key={label} className="rounded-xl p-4" style={{ background: "var(--qn-surface-2)" }}><p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={labelStyle}>{label}</p><p className="mt-2 text-base font-extrabold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value || "—"}</p></div>)}</div></section>}

      {/* ── Holdings + Order History tabs ──────────────────────────── */}
      <section className="qn-card overflow-hidden">

        {/* Tab bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid var(--qn-border)",
          }}
        >
          {[
            { id: "holdings", label: "Current Holdings", count: account?.holdings ? Object.keys(account.holdings).length : 0, icon: WalletCards },
            { id: "orders",   label: "Order History",    count: account?.orders?.length ?? 0,                                    icon: ChartNoAxesCombined },
          ].map(({ id, label, count, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "16px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid var(--qn-indigo)" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  marginBottom: -1,
                  color: active ? "var(--qn-indigo)" : "var(--qn-text-3)",
                }}
              >
                <Icon size={15} />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--qn-indigo)" : "var(--qn-text-2)",
                    transition: "color 0.15s",
                  }}
                >
                  {label} ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Current Holdings panel ────────────────────────────────── */}
        {activeTab === "holdings" && (
          <div style={{ height: 360, overflowY: "auto", padding: "20px 24px" }}>
            {!account?.holdings || Object.keys(account.holdings).length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <p style={{ color: "var(--qn-text-3)", fontSize: 14 }}>No holdings yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(account.holdings).map(([stock, holding]) => (
                  <div
                    key={stock}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: 14,
                      padding: "14px 18px",
                      background: "var(--qn-surface-2)",
                      border: "1px solid var(--qn-border)",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(79,70,229,0.28)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--qn-border)"}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--qn-indigo)",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {stock}
                      </span>
                      <p style={{ marginTop: 4, fontSize: 12, color: "var(--qn-text-3)", fontFamily: "'Inter', sans-serif" }}>
                        {holding.quantity} shares
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--qn-text-1)",
                        }}
                      >
                        {money(holding.average_price)}
                      </p>
                      <p
                        style={{
                          marginTop: 3,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "var(--qn-text-3)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Average Price
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Order History panel ───────────────────────────────────── */}
        {activeTab === "orders" && (
          <div style={{ height: 360, overflowY: "auto" }}>
            {!account?.orders?.length ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <p style={{ color: "var(--qn-text-3)", fontSize: 14 }}>No orders yet.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 540 }}>
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "var(--qn-surface-2)",
                    zIndex: 1,
                  }}
                >
                  <tr>
                    {["Instrument", "Side", "Total", "P&L"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 20px",
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.10em",
                          color: "var(--qn-text-3)",
                          fontFamily: "'JetBrains Mono', monospace",
                          borderBottom: "1px solid var(--qn-border)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {account.orders.map((order, idx) => {
                    const pnl = Number(order.realized_pnl || 0);
                    const isBuyOrder = order.side === "BUY";
                    return (
                      <tr
                        key={`${order.symbol}-${idx}`}
                        style={{
                          borderTop: idx === 0 ? "none" : "1px solid var(--qn-border)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--qn-surface-2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {/* Instrument */}
                        <td style={{ padding: "14px 20px" }}>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--qn-text-1)" }}>
                            {order.symbol}
                          </p>
                          <p style={{ marginTop: 3, fontSize: 11, color: "var(--qn-text-3)", fontFamily: "'Inter', sans-serif" }}>
                            {order.quantity} × {money(order.price)} · {order.status}
                          </p>
                        </td>

                        {/* Side badge */}
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: 6,
                              fontSize: 10.5,
                              fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              letterSpacing: "0.06em",
                              background: isBuyOrder ? "var(--qn-bull-dim)" : "var(--qn-bear-dim)",
                              color: isBuyOrder ? "var(--qn-bull)" : "var(--qn-bear)",
                            }}
                          >
                            {order.side}
                          </span>
                        </td>

                        {/* Total */}
                        <td style={{ padding: "14px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--qn-text-1)" }}>
                          {money(order.total)}
                        </td>

                        {/* P&L */}
                        <td
                          style={{
                            padding: "14px 20px",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 13,
                            fontWeight: 700,
                            color: pnl >= 0 ? "var(--qn-bull)" : "var(--qn-bear)",
                          }}
                        >
                          {pnl >= 0 ? "+" : "-"}{money(Math.abs(pnl))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

      </section>

      {showConfirmation && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1f3c]/20 p-4"><div className="w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-up" style={{ background: "var(--qn-surface)", border: "1px solid var(--qn-border-glow)" }}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...labelStyle, color: actionColor }}>Order review</p><h2 className="mt-2 text-xl font-bold" style={{ color: "var(--qn-text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>Confirm {side} order</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: actionTint, color: actionColor }}>{isBuy ? <ArrowUpRight size={19} /> : <ArrowDownRight size={19} />}</span></div><div className="mt-6 space-y-3 rounded-xl p-4" style={{ background: "var(--qn-surface-2)" }}>{[["Symbol", symbol], ["Quantity", quantity], ["Price", money(price)], ["Estimated total", money(estimatedTotal)]].map(([label, value], index) => <div key={label} className={`flex justify-between ${index === 3 ? "border-t pt-3" : ""}`} style={index === 3 ? { borderColor: "var(--qn-border)" } : undefined}><span className="text-sm" style={{ color: "var(--qn-text-2)" }}>{label}</span><span className="text-sm font-bold" style={{ ...monoStyle, color: index === 3 ? actionColor : "var(--qn-text-1)" }}>{value}</span></div>)}</div><div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowConfirmation(false)} disabled={loading} className="qn-btn-ghost flex-1 rounded-xl py-3 disabled:opacity-50">Cancel</button><button type="button" onClick={handleOrder} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50" style={{ background: actionColor }}>{loading && <LoaderCircle size={15} className="animate-spin" />}{loading ? "Processing" : `Confirm ${side}`}</button></div></div></div>}
    </div>
  );
}
