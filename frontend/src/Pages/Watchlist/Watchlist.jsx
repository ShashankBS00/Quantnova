import { useEffect, useRef, useState } from "react";
import {
  Star,
  Search,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getMarketHistory } from "@/services/marketService";

// ─── Default watchlist ────────────────────────────────────────────────────────
const DEFAULT_SYMBOLS = [
  { symbol: "RELIANCE.NS",   name: "Reliance Industries Ltd" },
  { symbol: "TCS.NS",        name: "Tata Consultancy Services" },
  { symbol: "INFY.NS",       name: "Infosys Limited" },
  { symbol: "HDFCBANK.NS",   name: "HDFC Bank Ltd" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Limited" },
  { symbol: "ICICIBANK.NS",  name: "ICICI Bank Ltd" },
];

// ─── Format volume numbers ────────────────────────────────────────────────────
function fmtVol(n) {
  if (!n) return "—";
  if (n >= 1e7) return (n / 1e7).toFixed(1) + "Cr";
  if (n >= 1e5) return (n / 1e5).toFixed(1) + "L";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

// ─── SVG mini sparkline ───────────────────────────────────────────────────────
function Sparkline({ data, positive }) {
  if (!data || data.length < 2) return <span style={{ color: "#374151", fontSize: 11 }}>—</span>;
  const W = 80, H = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline
        fill="none"
        stroke={positive ? "#10b981" : "#ef4444"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[220, 90, 110, 80, 100, 55, 90].map((w, i) => (
        <td key={i} style={{ padding: "16px 20px" }}>
          <div style={{ height: 13, width: w, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "wlPulse 1.4s ease-in-out infinite" }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WatchlistPage() {
  const [symbols,    setSymbols]    = useState(DEFAULT_SYMBOLS);
  const [marketData, setMarketData] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("");
  const [isAdding,   setIsAdding]   = useState(false);
  const [newSymbol,  setNewSymbol]  = useState("");
  const addInputRef = useRef(null);

  // live data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          symbols.map(({ symbol }) => getMarketHistory(symbol, "5d", "1d"))
        );
        if (cancelled) return;
        const map = {};
        results.forEach((res, idx) => {
          const sym = symbols[idx].symbol;
          if (res.status === "fulfilled") {
            const candles = res.value?.data || [];
            if (candles.length >= 2) {
              const prev = candles[candles.length - 2];
              const cur  = candles[candles.length - 1];
              const change    = cur.close - prev.close;
              const pctChange = (change / prev.close) * 100;
              map[sym] = {
                price:     cur.close,
                change,
                pctChange,
                dayHigh:   cur.high,
                dayLow:    cur.low,
                volume:    fmtVol(cur.volume),
                sparkline: candles.slice(-10).map((c) => c.close),
              };
            }
          }
        });
        setMarketData(map);
      } catch (e) {
        console.error("Watchlist load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [symbols]);

  useEffect(() => {
    if (isAdding) setTimeout(() => addInputRef.current?.focus(), 80);
  }, [isAdding]);

  function handleRemove(symbol) {
    setSymbols((prev) => prev.filter((s) => s.symbol !== symbol));
    setMarketData((prev) => { const n = { ...prev }; delete n[symbol]; return n; });
  }

  function handleAdd(e) {
    e.preventDefault();
    const raw = newSymbol.trim().toUpperCase();
    if (!raw) return;
    const sym = /\.(NS|BO)$/.test(raw) ? raw : `${raw}.NS`;
    if (symbols.some((s) => s.symbol === sym)) { alert("Already in watchlist"); return; }
    setSymbols((prev) => [{ symbol: sym, name: raw.replace(/\.(NS|BO)$/, "") + " Ltd" }, ...prev]);
    setNewSymbol("");
    setIsAdding(false);
  }

  const filtered = symbols.filter(({ symbol, name }) => {
    const q = filter.toLowerCase();
    return symbol.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

  // palette
  const BG_DEEP  = "#070c18";
  const BG_CARD  = "#0b1120";
  const BG_HDR   = "#060b16";
  const BORDER   = "#1a2744";
  const BORDER2  = "#111d35";
  const T1       = "#f1f5f9";
  const T2       = "#94a3b8";
  const T3       = "#475569";
  const BLUE     = "#3b82f6";
  const GREEN    = "#10b981";
  const RED      = "#ef4444";

  return (
    <div style={{ minHeight: "100vh", background: BG_DEEP, padding: "24px 28px 60px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes wlPulse { 0%,100%{opacity:.4} 50%{opacity:.85} }
        .wl-row:hover          { background: rgba(255,255,255,0.023) !important; }
        .wl-trade:hover        { background: rgba(16,185,129,0.22)   !important; }
        .wl-del:hover          { color: #ef4444 !important; }
        .wl-ext:hover          { color: #60a5fa !important; }
        .wl-fi:focus           { border-color: #3b82f6 !important; outline: none; }
        .wl-add-btn:hover      { opacity: .85; }
      `}</style>

      <div style={{ maxWidth: 1440, margin: "0 auto" }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
          padding: "22px 28px", display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between",
          gap: 16, marginBottom: 18,
          boxShadow: "0 4px 40px rgba(0,0,0,0.45)",
        }}>
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
              color: BLUE, fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              <Star size={12} fill={BLUE} /> Curated Monitor
            </div>
            <h1 style={{ color: T1, fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
              Market Watchlist
            </h1>
            <p style={{ color: T2, fontSize: 12.5, marginTop: 4 }}>
              Track real-time momentum, spreads, and fast execution setups for your primary assets.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* filter */}
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T3, pointerEvents: "none" }} />
              <input
                className="wl-fi"
                type="text"
                placeholder="Filter watchlist..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  background: BG_HDR, border: `1px solid ${BORDER}`, borderRadius: 12,
                  padding: "8px 12px 8px 34px", color: T1, fontSize: 12,
                  fontFamily: "'Inter',sans-serif", width: 220, transition: "border-color 0.15s",
                }}
              />
            </div>
            {/* add */}
            <button
              className="wl-add-btn"
              onClick={() => setIsAdding((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: BLUE, color: "#fff", border: "none", borderRadius: 12,
                padding: "8px 18px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(59,130,246,0.28)", transition: "opacity 0.15s",
                fontFamily: "'Inter',sans-serif",
              }}
            >
              <Plus size={14} /> Add Ticker
            </button>
          </div>
        </div>

        {/* ── Add ticker panel ─────────────────────────────────────────────── */}
        {isAdding && (
          <form onSubmit={handleAdd} style={{
            background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
            padding: "14px 20px", display: "flex", alignItems: "center",
            gap: 10, marginBottom: 14, maxWidth: 520,
          }}>
            <input
              ref={addInputRef}
              className="wl-fi"
              type="text"
              placeholder="NSE symbol (e.g. SBIN, WIPRO)..."
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              style={{
                flex: 1, background: BG_HDR, border: `1px solid ${BORDER}`, borderRadius: 9,
                padding: "8px 12px", color: T1, fontSize: 12,
                fontFamily: "'JetBrains Mono',monospace", transition: "border-color 0.15s",
              }}
            />
            <button type="submit" style={{
              background: GREEN, color: "#fff", border: "none", borderRadius: 9,
              padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Inter',sans-serif",
            }}>Confirm</button>
            <button type="button" onClick={() => setIsAdding(false)} style={{
              background: "none", border: "none", color: T3, cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center",
            }}><X size={14} /></button>
          </form>
        )}

        {/* ── Table card ──────────────────────────────────────────────────── */}
        <div style={{
          background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
          overflow: "hidden", boxShadow: "0 8px 60px rgba(0,0,0,0.55)",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>

              {/* thead */}
              <thead>
                <tr style={{ background: BG_HDR, borderBottom: `1px solid ${BORDER}` }}>
                  {[
                    { label: "Symbol / Company", align: "left"   },
                    { label: "LTP (₹)",          align: "right"  },
                    { label: "Change",           align: "right"  },
                    { label: "Day Trend",        align: "center" },
                    { label: "24H Range",        align: "right"  },
                    { label: "Volume",           align: "right"  },
                    { label: "Actions",          align: "center" },
                  ].map((col) => (
                    <th key={col.label} style={{
                      padding: "14px 20px",
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      color: T3, textAlign: col.align, whiteSpace: "nowrap",
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* tbody */}
              <tbody>
                {loading ? (
                  [1,2,3,4,5,6].map((i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "52px 20px", color: T3, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                    No matching tickers in watchlist.
                  </td></tr>
                ) : (
                  filtered.map(({ symbol, name }, idx) => {
                    const d = marketData[symbol];
                    const isPos = d ? d.change >= 0 : true;
                    const cc = isPos ? GREEN : RED;

                    return (
                      <tr key={symbol} className="wl-row" style={{
                        borderTop: idx === 0 ? "none" : `1px solid ${BORDER2}`,
                        transition: "background 0.1s",
                      }}>

                        {/* Symbol / Company */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button className="wl-del" onClick={() => handleRemove(symbol)} title="Remove"
                              style={{ background: "none", border: "none", color: T3, cursor: "pointer", padding: 4, display: "flex", alignItems: "center", transition: "color 0.12s" }}>
                              <Trash2 size={13} />
                            </button>
                            <div>
                              <div style={{ color: T1, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>
                                {symbol.replace(/\.(NS|BO)$/, "")}
                              </div>
                              <div style={{ color: T2, fontSize: 11, marginTop: 2, maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* LTP */}
                        <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: T1, whiteSpace: "nowrap" }}>
                          {d ? `₹${d.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <span style={{ color: T3 }}>—</span>}
                        </td>

                        {/* Change */}
                        <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                          {d ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: cc, fontWeight: 600 }}>
                              {isPos ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              {isPos ? "+" : ""}{d.change.toFixed(2)} ({isPos ? "+" : ""}{d.pctChange.toFixed(1)}%)
                            </span>
                          ) : <span style={{ color: T3 }}>—</span>}
                        </td>

                        {/* Sparkline */}
                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <Sparkline data={d?.sparkline} positive={isPos} />
                          </div>
                        </td>

                        {/* 24H Range */}
                        <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                          {d ? (
                            <>
                              <div style={{ color: T2 }}>H: ₹{d.dayHigh.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                              <div style={{ color: T3, marginTop: 2 }}>L: ₹{d.dayLow.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                            </>
                          ) : <span style={{ color: T3 }}>—</span>}
                        </td>

                        {/* Volume */}
                        <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: T2, whiteSpace: "nowrap" }}>
                          {d?.volume || <span style={{ color: T3 }}>—</span>}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                            <Link to="/trading" className="wl-trade" style={{
                              display: "inline-block", padding: "5px 14px", borderRadius: 20,
                              background: "rgba(16,185,129,0.11)", border: "1px solid rgba(16,185,129,0.28)",
                              color: GREEN, fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 10.5, fontWeight: 700, textDecoration: "none",
                              letterSpacing: "0.06em", transition: "background 0.12s", whiteSpace: "nowrap",
                            }}>
                              TRADE
                            </Link>
                            <Link to="/market" className="wl-ext" title="Open chart" style={{ color: T3, display: "flex", alignItems: "center", transition: "color 0.12s" }}>
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* footer */}
          <div style={{ borderTop: `1px solid ${BORDER2}`, padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: T3, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
              {filtered.length} of {symbols.length} ticker{symbols.length !== 1 ? "s" : ""} displayed
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: GREEN, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, display: "inline-block", boxShadow: `0 0 6px ${GREEN}` }} />
              NSE · Live Data
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}