import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import CandlestickChart from "@/components/charts/CandlestickChart";
import StockSearch from "@/components/market/StockSearch";
import IndicatorsMenu, {
  ActiveIndicatorChip,
  IndicatorSettingsModal,
} from "@/components/charts/IndicatorsMenu";
import { INDICATOR_CATALOGUE } from "@/lib/indicatorCatalogue";
import {
  Activity,
  BarChart2,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";

// ─── Candle interval definitions ──────────────────────────────────────────────

const INTERVALS = [
  { label: "1m",  value: "1m",   supportedPeriods: ["1d","5d"] },
  { label: "3m",  value: "3m",   supportedPeriods: ["5d","1mo"] },
  { label: "5m",  value: "5m",   supportedPeriods: ["5d","1mo"] },
  { label: "15m", value: "15m",  supportedPeriods: ["1mo","3mo"] },
  { label: "30m", value: "30m",  supportedPeriods: ["1mo","3mo"] },
  { label: "1H",  value: "1h",   supportedPeriods: ["1mo","3mo","6mo"] },
  { label: "2H",  value: "2h",   supportedPeriods: ["3mo","6mo","1y"] },
  { label: "4H",  value: "4h",   supportedPeriods: ["3mo","6mo","1y"] },
  { label: "1D",  value: "1d",   supportedPeriods: ["1mo","3mo","6mo","1y","5y"] },
  { label: "1W",  value: "1wk",  supportedPeriods: ["1y","5y"] },
  { label: "1M",  value: "1mo",  supportedPeriods: ["5y"] },
];

// ─── Historical range definitions ─────────────────────────────────────────────

const RANGES = [
  { label: "1D",  value: "1d" },
  { label: "5D",  value: "5d" },
  { label: "1M",  value: "1mo" },
  { label: "3M",  value: "3mo" },
  { label: "6M",  value: "6mo" },
  { label: "1Y",  value: "1y" },
  { label: "5Y",  value: "5y" },
];

const DEFAULT_RANGE_FOR_INTERVAL = {
  "1m":  "1d",
  "3m":  "5d",
  "5m":  "5d",
  "15m": "1mo",
  "30m": "1mo",
  "1h":  "3mo",
  "2h":  "6mo",
  "4h":  "6mo",
  "1d":  "1y",
  "1wk": "5y",
  "1mo": "5y",
};

// Quick-pick stocks
const POPULAR_SYMBOLS = [
  { label: "RELIANCE", value: "RELIANCE.NS" },
  { label: "TCS", value: "TCS.NS" },
  { label: "INFY", value: "INFY.NS" },
  { label: "HDFCBANK", value: "HDFCBANK.NS" },
  { label: "TATAMOTORS", value: "TATAMOTORS.NS" },
  { label: "ICICIBANK", value: "ICICIBANK.NS" },
];

// Palette for indicator chips
const CHIP_COLORS = [
  "#60a5fa", "#f59e0b", "#34d399", "#c084fc", "#f97316",
  "#818cf8", "#22d3ee", "#fb7185", "#a78bfa", "#4ade80",
];
let colorIndex = 0;
const nextColor = () => CHIP_COLORS[colorIndex++ % CHIP_COLORS.length];

// ─── useIndicators hook ───────────────────────────────────────────────────────

function useIndicators() {
  const [indicators, setIndicators] = useState([]);

  const add = useCallback((definition) => {
    setIndicators((prev) => {
      const instanceId = `${definition.id}_${Date.now()}`;
      const paramLabel = Object.entries(definition.defaultParams)
        .map(([, v]) => v)
        .join("/");
      const label = paramLabel
        ? `${definition.label} ${paramLabel}`
        : definition.label;

      return [
        ...prev,
        {
          instanceId,
          id: definition.id,
          label,
          params: { ...definition.defaultParams },
          visible: true,
          color: nextColor(),
        },
      ];
    });
  }, []);

  const remove = useCallback((instanceId) => {
    setIndicators((prev) => prev.filter((i) => i.instanceId !== instanceId));
  }, []);

  const update = useCallback((instanceId, newParams) => {
    setIndicators((prev) =>
      prev.map((i) => {
        if (i.instanceId !== instanceId) return i;
        const def = INDICATOR_CATALOGUE.find((d) => d.id === i.id);
        const paramLabel = Object.entries(newParams)
          .map(([, v]) => v)
          .join("/");
        const label = paramLabel ? `${def?.label || i.id} ${paramLabel}` : def?.label || i.id;
        return { ...i, params: newParams, label };
      })
    );
  }, []);

  const toggle = useCallback((instanceId) => {
    setIndicators((prev) =>
      prev.map((i) =>
        i.instanceId === instanceId ? { ...i, visible: !i.visible } : i
      )
    );
  }, []);

  return { indicators, add, remove, update, toggle };
}

// ─── Market page ──────────────────────────────────────────────────────────────

export default function MarketChart({ symbol: propSymbol, onSymbolChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSymbol = searchParams.get("symbol");

  const [symbol, setSymbol] = useState(urlSymbol || propSymbol || "RELIANCE.NS");
  const [prevUrlSymbol, setPrevUrlSymbol] = useState(urlSymbol);

  // Sync symbol when URL param changes (React-recommended state derivation pattern)
  if (urlSymbol && urlSymbol !== prevUrlSymbol) {
    setPrevUrlSymbol(urlSymbol);
    if (urlSymbol !== symbol) {
      setSymbol(urlSymbol);
    }
  }

  const [interval, setInterval] = useState("1d");
  const [period, setPeriod] = useState(DEFAULT_RANGE_FOR_INTERVAL["1d"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingInstanceId, setEditingInstanceId] = useState(null);

  const containerRef = useRef(null);
  const { indicators, add, remove, update, toggle } = useIndicators();

  // Fullscreen toggle handler (DOM Fullscreen API + state fallback)
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      if (el?.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  // Listen to native fullscreenchange and keyboard shortcut 'F'
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const onKeyDown = (e) => {
      if (e.key === "f" || e.key === "F") {
        if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
        toggleFullscreen();
      } else if (e.key === "Escape" && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen, toggleFullscreen]);

  const handleSymbolChange = (newSymbol) => {
    let formatted = newSymbol.trim().toUpperCase();
    if (!formatted.includes(".")) formatted += ".NS";
    setSymbol(formatted);
    setSearchParams({ symbol: formatted });
    if (onSymbolChange) onSymbolChange(formatted);
    setError(null);
  };

  const handleIntervalChange = (newInterval) => {
    setInterval(newInterval);
    const defaultRange = DEFAULT_RANGE_FOR_INTERVAL[newInterval];
    const intervalDef = INTERVALS.find((i) => i.value === newInterval);
    if (intervalDef && !intervalDef.supportedPeriods.includes(period)) {
      setPeriod(defaultRange);
    }
    setError(null);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setError(null);
  };

  const currentIntervalDef = INTERVALS.find((i) => i.value === interval);
  const isRangeSupported = (rangeValue) => {
    if (!currentIntervalDef) return true;
    return currentIntervalDef.supportedPeriods.includes(rangeValue);
  };

  const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, "");
  const editingInstance = indicators.find((i) => i.instanceId === editingInstanceId);

  return (
    <div
      ref={containerRef}
      className={`select-none transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 w-screen h-screen bg-[#070b16] flex flex-col overflow-hidden"
          : "bg-[#090f22] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      }`}
    >
      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-5 py-3.5 border-b border-slate-800/80 bg-[#070c1a]/90 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Symbol & Market Status */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1.5 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                <Activity size={11} className="text-blue-400" /> Interactive Chart
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                NSE Real-Time
              </span>
              {loading && (
                <Loader2 size={12} className="text-blue-400 animate-spin ml-1" />
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                {cleanSymbol}
              </h1>
              <span className="text-xs text-slate-400 font-mono bg-slate-800/60 px-2 py-0.5 rounded-lg border border-slate-700/50">
                {symbol}
              </span>
            </div>
          </div>

          {/* Quick-Pick Popular Stocks */}
          <div className="hidden xl:flex items-center gap-1 pl-4 border-l border-slate-800/80">
            {POPULAR_SYMBOLS.map((item) => {
              const isCurrent = symbol === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => handleSymbolChange(item.value)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    isCurrent
                      ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Header Tools: Search + Fullscreen Button */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="w-full lg:w-[320px]">
            <StockSearch onSearch={handleSymbolChange} />
          </div>

          {/* Full Screen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (Esc or F)" : "Full Screen (F)"}
            className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-semibold transition-all shadow-sm cursor-pointer ${
              isFullscreen
                ? "bg-blue-600 border-blue-400 text-white shadow-blue-500/20"
                : "bg-[#090f22] border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800"
            }`}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit Full" : "Full Screen"}
            </span>
            <kbd className="hidden md:inline text-[9px] px-1 py-0.5 rounded bg-black/40 text-slate-400 border border-slate-700/50">
              F
            </kbd>
          </button>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-[#080d1c]/80 flex flex-col gap-2">
        {/* Row 1: Interval strip + Indicators + Quick Stats */}
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Interval buttons */}
            <div className="flex items-center gap-0.5 bg-[#060a14] p-1 rounded-xl border border-slate-800/80">
              {INTERVALS.map((item) => {
                const isActive = interval === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => handleIntervalChange(item.value)}
                    title={`Candle interval: ${item.label}`}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* Indicators dropdown menu */}
            <IndicatorsMenu
              activeIndicators={indicators}
              onAdd={add}
            />
          </div>

          {/* Timeframe pill */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="bg-[#060a14] border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
              <BarChart2 size={11} className="inline mr-1.5 text-blue-400" />
              Interval: <strong className="text-white">{interval}</strong> · Range: <strong className="text-white">{period}</strong>
            </span>
          </div>
        </div>

        {/* Row 2: Historical range buttons + Active indicator chips */}
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Range:
            </span>
            <div className="flex items-center gap-0.5 bg-[#060a14] p-1 rounded-xl border border-slate-800/80">
              {RANGES.map((item) => {
                const isActive = period === item.value;
                const supported = isRangeSupported(item.value);
                return (
                  <button
                    key={item.value}
                    onClick={() => supported && handlePeriodChange(item.value)}
                    disabled={!supported}
                    title={
                      supported
                        ? `Show ${item.label} of history`
                        : `${item.label} is not available for the ${interval} interval`
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      !supported
                        ? "text-slate-600 cursor-not-allowed opacity-40"
                        : isActive
                        ? "bg-[#0c1630] text-blue-400 border border-blue-500/40 shadow-xs"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active indicator chips strip */}
          {indicators.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {indicators.map((inst) => (
                <ActiveIndicatorChip
                  key={inst.instanceId}
                  instance={inst}
                  onRemove={() => remove(inst.instanceId)}
                  onEdit={() => setEditingInstanceId(inst.instanceId)}
                  onToggle={() => toggle(inst.instanceId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 my-2 flex items-center justify-between bg-rose-950/40 border border-rose-500/40 rounded-xl px-4 py-2.5 text-xs font-mono text-rose-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs underline cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Chart Canvas Area ──────────────────────────────────────────────── */}
      <div
        className={`w-full relative overflow-hidden ${
          isFullscreen ? "flex-1 min-h-0" : "flex-1 min-h-[480px]"
        }`}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-[#070b16]/70 backdrop-blur-xs flex items-center justify-center transition-opacity">
            <div className="flex items-center gap-2.5 bg-[#090f22]/90 border border-slate-700/80 px-4 py-2 rounded-xl shadow-xl font-mono text-xs text-blue-300">
              <Loader2 size={16} className="animate-spin text-blue-400" />
              <span>Loading market data for {symbol}…</span>
            </div>
          </div>
        )}

        <CandlestickChart
          symbol={symbol}
          period={period}
          interval={interval}
          activeIndicators={indicators}
          isFullscreen={isFullscreen}
          onLoading={setLoading}
          onError={setError}
        />
      </div>

      {/* ── Indicator Settings Modal (if opened) ────────────────────────────── */}
      {editingInstance && (
        <IndicatorSettingsModal
          instance={editingInstance}
          onClose={() => setEditingInstanceId(null)}
          onUpdate={(instanceId, newParams) => update(instanceId, newParams)}
        />
      )}
    </div>
  );
}