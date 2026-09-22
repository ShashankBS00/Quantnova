import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, Bell, Moon, X, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.svg";

const TICKERS = [
  { symbol: "RELIANCE", price: "₹2,942", change: "+1.8%", isPos: true },
  { symbol: "TCS", price: "₹3,814", change: "-0.4%", isPos: false },
  { symbol: "NIFTY50", price: "₹23,516", change: "+0.9%", isPos: true },
  { symbol: "INFY", price: "₹1,623", change: "+2.1%", isPos: true },
  { symbol: "HDFC", price: "₹1,648", change: "-0.7%", isPos: false },
  { symbol: "ICICIBANK", price: "₹1,180", change: "+0.6%", isPos: true },
  { symbol: "TATAMOTORS", price: "₹985", change: "+1.4%", isPos: true },
];

// ── Autocomplete search hook ──────────────────────────────────────────────────
function useStockSearch() {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [cursor,  setCursor]  = useState(-1);
  const debounceRef = useRef(null);

  const search = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`http://127.0.0.1:8000/market/search?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        setResults(data?.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setCursor(-1);
    search(val);
  }

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    setCursor(-1);
    setLoading(false);
    clearTimeout(debounceRef.current);
  }

  function handleKeyDown(e, onSelect) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && cursor >= 0 && results[cursor]) { onSelect(results[cursor]); }
    if (e.key === "Escape") { setOpen(false); }
  }

  return { query, results, loading, open, cursor, handleChange, handleKeyDown, clear, setOpen, setCursor };
}

export default function Navbar() {
  const navigate    = useNavigate();
  const user        = JSON.parse(localStorage.getItem("user") || "null");
  const username    = user?.username || "Shashank";
  const search      = useStockSearch();
  const wrapperRef  = useRef(null);

  // Outside click → close dropdown
  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        search.setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(stock) {
    search.clear();
    navigate(`/market?symbol=${encodeURIComponent(stock.symbol)}`);
  }

  return (
    <header className="w-full z-40 shrink-0" style={{
      background: 'linear-gradient(180deg, #ffffff 0%, #fafbff 100%)',
      borderBottom: '1px solid rgba(79, 70, 229, 0.12)',
    }}>
      {/* 1. Main Navigation Bar */}
      <div className="h-16 flex items-center justify-between px-6 gap-4">

        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 w-64 shrink-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-md opacity-40"
              style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }} />
            <img
              src={logo}
              alt="QuantNova"
              className="relative w-8 h-8 rounded-xl object-contain shadow-lg"
            />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#1a1f3c' }}>
              Quant<span style={{ color: '#4f46e5' }}>Nova</span>
            </span>
            <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-md font-bold"
              style={{
                background: 'rgba(79,70,229,0.08)',
                color: '#4f46e5',
                border: '1px solid rgba(79,70,229,0.20)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
              Live Lab
            </span>
          </div>
        </div>

        {/* ── Global Autocomplete Search Bar ── */}
        <div ref={wrapperRef} className="relative w-full max-w-[480px]">
          {/* Input */}
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute", left: 14, top: "50%",
                transform: "translateY(-50%)",
                color: search.loading ? "#4f46e5" : "var(--qn-text-3)",
                pointerEvents: "none",
                transition: "color 0.15s",
              }}
            />
            <input
              type="text"
              value={search.query}
              onChange={search.handleChange}
              onKeyDown={(e) => search.handleKeyDown(e, handleSelect)}
              onFocus={() => { if (search.results.length) search.setOpen(true); }}
              placeholder="Search stocks (e.g. RELIANCE, NIFTY50)..."
              autoComplete="off"
              style={{
                width: "100%",
                borderRadius: 50,
                padding: "9px 36px 9px 38px",
                fontSize: 13,
                background: '#f5f7ff',
                border: search.open
                  ? '1px solid rgba(79,70,229,0.48)'
                  : '1px solid rgba(79,70,229,0.16)',
                boxShadow: search.open ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
                color: 'var(--qn-text-1)',
                fontFamily: "'Inter', sans-serif",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />
            {/* Spinner or clear button */}
            {search.loading ? (
              <Loader
                size={13}
                style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4f46e5",
                  animation: "nbSpin 0.8s linear infinite",
                }}
              />
            ) : search.query ? (
              <button
                onClick={search.clear}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(79,70,229,0.10)",
                  border: "none",
                  borderRadius: "50%",
                  width: 18, height: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  color: "#4f46e5",
                }}
              >
                <X size={10} />
              </button>
            ) : null}
          </div>

          {/* Results dropdown */}
          {search.open && search.results.length > 0 && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0, right: 0,
              background: "#ffffff",
              border: "1px solid rgba(79,70,229,0.18)",
              borderRadius: 14,
              boxShadow: "0 12px 40px rgba(79,70,229,0.14), 0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 9999,
              overflow: "hidden",
              animation: "nbFadeDown 0.12s ease-out",
            }}>
              <div style={{
                padding: "6px 14px 5px",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--qn-text-3)",
                fontFamily: "'JetBrains Mono', monospace",
                borderBottom: "1px solid rgba(79,70,229,0.07)",
              }}>
                Indian Stock Search
              </div>

              {search.results.map((stock, i) => {
                const isNSE      = stock.symbol?.toUpperCase().endsWith(".NS");
                const active     = search.cursor === i;
                const baseSymbol = (stock.symbol || "").replace(/\.(NS|BO)$/i, "");
                return (
                  <div
                    key={stock.symbol}
                    onMouseEnter={() => search.setCursor(i)}
                    onMouseLeave={() => search.setCursor(-1)}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(stock); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 16px",
                      cursor: "pointer",
                      background: active ? "rgba(79,70,229,0.06)" : "transparent",
                      transition: "background 0.1s",
                      borderBottom: i < search.results.length - 1
                        ? "1px solid rgba(79,70,229,0.05)"
                        : "none",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13, fontWeight: 700,
                          color: active ? "#4f46e5" : "var(--qn-text-1)",
                          letterSpacing: "0.03em",
                        }}>
                          {baseSymbol}
                        </span>
                        <span style={{
                          fontSize: 9.5, fontWeight: 700,
                          padding: "1px 6px", borderRadius: 4,
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: "0.06em",
                          background: isNSE ? "rgba(5,150,105,0.10)" : "rgba(234,88,12,0.10)",
                          color:      isNSE ? "#059669"               : "#ea580c",
                        }}>
                          {isNSE ? "NSE" : "BSE"}
                        </span>
                      </div>
                      <p style={{
                        fontSize: 11, color: "var(--qn-text-3)",
                        fontFamily: "'Inter', sans-serif",
                        marginTop: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        maxWidth: 260,
                      }}>
                        {stock.short_name || stock.name}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 10, color: "var(--qn-text-3)",
                      fontFamily: "'JetBrains Mono', monospace",
                      marginLeft: 12, flexShrink: 0,
                    }}>
                      {stock.symbol}
                    </span>
                  </div>
                );
              })}

              {/* Keyboard hint footer */}
              <div style={{
                padding: "6px 14px",
                fontSize: 10, color: "var(--qn-text-3)",
                fontFamily: "'JetBrains Mono', monospace",
                background: "rgba(79,70,229,0.03)",
                borderTop: "1px solid rgba(79,70,229,0.06)",
                display: "flex", gap: 12,
              }}>
                <span>↑↓ navigate</span>
                <span>↵ open chart</span>
                <span>esc close</span>
              </div>
            </div>
          )}

          {/* No results */}
          {search.open && !search.loading && search.query && search.results.length === 0 && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0, right: 0,
              background: "#ffffff",
              border: "1px solid rgba(79,70,229,0.14)",
              borderRadius: 14,
              padding: "16px",
              textAlign: "center",
              fontSize: 12, color: "var(--qn-text-3)",
              fontFamily: "'Inter', sans-serif",
              zIndex: 9999,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}>
              No Indian stocks found for "<b style={{ color: "var(--qn-text-2)" }}>{search.query}</b>"
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(5,150,105,0.08)',
              border: '1px solid rgba(5,150,105,0.20)',
              color: 'var(--qn-bull)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--qn-bull)' }} />
            <span>Live</span>
          </div>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-xl transition-all"
            style={{ background: '#f5f7ff', border: '1px solid rgba(79,70,229,0.14)', color: 'var(--qn-text-2)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.32)'; e.currentTarget.style.color = 'var(--qn-text-1)'; e.currentTarget.style.background = '#eef0fb'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.14)'; e.currentTarget.style.color = 'var(--qn-text-2)'; e.currentTarget.style.background = '#f5f7ff'; }}
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--qn-bear)' }} />
          </button>

          {/* Theme toggle */}
          <button
            aria-label="Theme Toggle"
            className="p-2 rounded-xl transition-all hidden md:block"
            style={{ background: '#f5f7ff', border: '1px solid rgba(79,70,229,0.14)', color: 'var(--qn-text-2)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.32)'; e.currentTarget.style.color = 'var(--qn-text-1)'; e.currentTarget.style.background = '#eef0fb'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.14)'; e.currentTarget.style.color = 'var(--qn-text-2)'; e.currentTarget.style.background = '#f5f7ff'; }}
          >
            <Moon size={16} />
          </button>

          {/* User avatar pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full cursor-pointer transition-all"
            style={{ background: '#f5f7ff', border: '1px solid rgba(79,70,229,0.16)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.36)'; e.currentTarget.style.background = '#eef0fb'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.16)'; e.currentTarget.style.background = '#f5f7ff'; }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(109,40,217,0.12))',
                border: '1px solid rgba(79,70,229,0.28)',
                color: '#4f46e5',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <h4 className="text-xs font-semibold leading-tight" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
                {username}
              </h4>
              <p className="text-[10px] leading-tight" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                Quant Workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ticker Tape */}
      <div className="h-8 overflow-hidden flex items-center relative w-full"
        style={{
          background: 'rgba(238,240,251,0.75)',
          borderTop: '1px solid rgba(79,70,229,0.08)',
        }}>
        <div className="ticker-tape-scroll space-x-8 px-4 cursor-pointer">
          {[...TICKERS, ...TICKERS].map((item, idx) => (
            <div key={idx} className="flex items-center space-x-1.5 text-xs font-medium whitespace-nowrap">
              <span className="font-bold tracking-wide"
                style={{ color: 'var(--qn-text-2)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                {item.symbol}
              </span>
              <span className="font-bold"
                style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                {item.price}
              </span>
              <span className="font-semibold"
                style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: item.isPos ? 'var(--qn-bull)' : 'var(--qn-bear)' }}>
                {item.change}
              </span>
              <span style={{ color: 'var(--qn-text-3)', fontSize: '10px' }}>·</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes nbFadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nbSpin {
          from { transform: translateY(-50%) rotate(0deg); }
          to   { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </header>
  );
}