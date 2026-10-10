import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import CandlestickChart from "@/components/charts/CandlestickChart";
import StockSearch from "@/components/market/StockSearch";
import IndicatorsMenu, { ActiveIndicatorChip } from "@/components/charts/IndicatorsMenu";
import { INDICATOR_CATALOGUE } from "@/lib/indicatorCatalogue";
import { Activity, Settings, BarChart2, Loader2, AlertCircle } from "lucide-react";
import { getMarketHistory } from "@/services/marketService";

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

// Map interval → sensible default range
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

// ─── Colour palette for indicator chips ───────────────────────────────────────

const CHIP_COLORS = [
  "#60a5fa","#f59e0b","#34d399","#c084fc","#f97316",
  "#818cf8","#22d3ee","#fb7185","#a78bfa","#4ade80",
];

let colorIndex = 0;
const nextColor = () => CHIP_COLORS[colorIndex++ % CHIP_COLORS.length];

// ─── useIndicators hook ───────────────────────────────────────────────────────

function useIndicators() {
  const [indicators, setIndicators] = useState([]);

  const add = useCallback((definition) => {
    setIndicators((prev) => {
      // Allow duplicates — each gets a unique instanceId
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
  const [interval, setInterval] = useState("1d");
  const [period, setPeriod] = useState(DEFAULT_RANGE_FOR_INTERVAL["1d"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { indicators, add, remove, update, toggle } = useIndicators();

  // Sync symbol when URL param changes (e.g. from another page linking here)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (urlSymbol && urlSymbol !== symbol) setSymbol(urlSymbol);
  }, [urlSymbol]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSymbolChange = (newSymbol) => {
    let formatted = newSymbol.trim().toUpperCase();
    if (!formatted.includes(".")) formatted += ".NS";
    setSymbol(formatted);
    setSearchParams({ symbol: formatted });
    if (onSymbolChange) onSymbolChange(formatted);
    setError(null);
  };

  // When interval changes, auto-select a compatible period
  const handleIntervalChange = (newInterval) => {
    setInterval(newInterval);
    const defaultRange = DEFAULT_RANGE_FOR_INTERVAL[newInterval];
    const intervalDef = INTERVALS.find((i) => i.value === newInterval);
    // If current period is supported, keep it; otherwise use default
    if (intervalDef && !intervalDef.supportedPeriods.includes(period)) {
      setPeriod(defaultRange);
    }
    setError(null);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setError(null);
  };

  // Check whether current interval supports the current period
  const currentIntervalDef = INTERVALS.find((i) => i.value === interval);
  const isRangeSupported = (rangeValue) => {
    if (!currentIntervalDef) return true;
    return currentIntervalDef.supportedPeriods.includes(rangeValue);
  };

  const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, "");

  return (
    <div className="bg-[#0b1222] border border-[#162444] rounded-2xl shadow-xl select-none overflow-hidden">
      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#162444]">
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1">
                <Activity size={11} /> Interactive Chart
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-px rounded-full">
                NSE Real-Time
              </span>
              {loading && (
                <Loader2 size={11} className="text-blue-400 animate-spin" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white font-mono tracking-tight">
                {cleanSymbol}
              </h2>
              <span className="text-xs text-slate-500 font-mono">({symbol})</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[360px]">
          <StockSearch onSearch={handleSymbolChange} />
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 border-b border-[#162444] flex flex-col gap-2">
        {/* Row 1: Interval buttons + Indicators + Settings */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Interval strip */}
          <div className="flex items-center gap-0.5 bg-[#070b16] px-1 py-1 rounded-xl border border-[#162444]">
            {INTERVALS.map((item) => {
              const isActive = interval === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => handleIntervalChange(item.value)}
                  title={`Candle interval: ${item.label}`}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-white hover:bg-[#0c1328]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-[#1e2d4a] hidden sm:block" />

          {/* Indicators menu */}
          <IndicatorsMenu
            activeIndicators={indicators}
            onAdd={add}
            onRemove={remove}
            onUpdate={update}
            onToggle={toggle}
          />

          {/* Settings placeholder */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2d4a] bg-[#0c1328] text-slate-500 hover:text-white text-xs font-mono transition-colors"
            title="Chart settings"
          >
            <Settings size={12} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>

        {/* Row 2: Historical range + active indicator chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Historical range */}
          <div className="flex items-center gap-0.5 bg-[#070b16] px-1 py-1 rounded-xl border border-[#162444]">
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
                      ? "text-slate-700 cursor-not-allowed"
                      : isActive
                      ? "bg-[#0c1328] text-blue-400 border border-blue-600/40"
                      : "text-slate-500 hover:text-white hover:bg-[#0c1328]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <span className="text-[10px] font-mono text-slate-600 hidden sm:inline">
            <BarChart2 size={10} className="inline mr-1 text-slate-700" />
            {interval} · {period}
          </span>

          {/* Active indicator chips */}
          {indicators.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              {indicators.map((inst) => (
                <ActiveIndicatorChip
                  key={inst.instanceId}
                  instance={inst}
                  onRemove={() => remove(inst.instanceId)}
                  onEdit={() => {}}
                  onToggle={() => toggle(inst.instanceId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 text-xs font-mono text-red-400">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* ── Chart Canvas ───────────────────────────────────────────────────── */}
      <div className="w-full bg-[#070b16] border-t border-[#162444] overflow-hidden">
        <ChartWithState
          symbol={symbol}
          period={period}
          interval={interval}
          activeIndicators={indicators}
          onLoading={setLoading}
          onError={setError}
        />
      </div>
    </div>
  );
}

// ChartWithState wrapper — handles loading/error state without touching the
// imperative chart instance.
function ChartWithState({ symbol, period, interval, activeIndicators, onLoading, onError }) {
  const abortRef = useRef(null);

  useEffect(() => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Schedule state updates asynchronously to avoid synchronous setState-in-effect
    queueMicrotask(() => {
      if (!ctrl.signal.aborted) {
        onLoading(true);
        onError(null);
      }
    });

    // Kick off the preflight request
    getMarketHistory(symbol, period, interval, ctrl.signal)
      .then(() => {
        if (!ctrl.signal.aborted) {
          onLoading(false);
        }
      })
      .catch((err) => {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        onLoading(false);
        const detail = err?.response?.data?.detail;
        onError(
          detail ||
            `Failed to load ${symbol} (${interval}, ${period}). Check backend connection.`
        );
      });

    return () => ctrl.abort();
  }, [symbol, period, interval, onLoading, onError]);

  return (
    <CandlestickChart
      symbol={symbol}
      period={period}
      interval={interval}
      activeIndicators={activeIndicators}
    />
  );
}