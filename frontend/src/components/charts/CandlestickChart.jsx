import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";
import {
  calcSMA,
  calcEMA,
  calcVWAP,
  calcBollingerBands,
  calcRSI,
  calcMACD,
  calcATR,
  calcADX,
  calcSupertrend,
  calcStandardPivots,
  calcCamarillaPivots,
} from "@/lib/indicators";
import { RotateCcw } from "lucide-react";

// ─── Colour palette for indicator lines ──────────────────────────────────────

const INDICATOR_COLORS = {
  sma: "#f59e0b",
  ema: "#818cf8",
  vwap: "#34d399",
  supertrend_bull: "#22c55e",
  supertrend_bear: "#ef4444",
  bb_upper: "#60a5fa",
  bb_middle: "#60a5fa",
  bb_lower: "#60a5fa",
  rsi: "#c084fc",
  macd_line: "#60a5fa",
  macd_signal: "#f97316",
  macd_hist_pos: "#22c55e",
  macd_hist_neg: "#ef4444",
  adx: "#fbbf24",
  atr: "#a78bfa",
  volume_up: "rgba(34,197,94,0.6)",
  volume_down: "rgba(239,68,68,0.6)",
  pivot: "#94a3b8",
};

// ─── Helper: add a price line for a pivot level ───────────────────────────────

function addPivotPriceLine(series, value, label, color) {
  return series.createPriceLine({
    price: value,
    color,
    lineWidth: 1,
    lineStyle: 2, // dashed
    axisLabelVisible: true,
    title: label,
  });
}

// ─── CandlestickChart ─────────────────────────────────────────────────────────

export default function CandlestickChart({
  symbol,
  period,
  interval,
  activeIndicators = [],
  isFullscreen = false,
  onLoading,
  onError,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const candleDataRef = useRef([]); // latest candle data for indicator re-calc
  const seriesMapRef = useRef({}); // instanceId → { series[], paneIndex }
  const priceLinesRef = useRef({}); // instanceId → priceLine[]
  const paneCountRef = useRef(1); // how many panes currently exist

  const [hoverCandle, setHoverCandle] = useState(null);
  const [latestCandle, setLatestCandle] = useState(null);

  // ── Build chart once ──────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: container.clientHeight || 500,
      layout: {
        background: { color: "#070b16" },
        textColor: "#94a3b8",
        fontSize: 11,
        fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: "#0f172a" },
        horzLines: { color: "#0f172a" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#3b82f680", style: 2, width: 1, labelBackgroundColor: "#1e293b" },
        horzLine: { color: "#3b82f680", style: 2, width: 1, labelBackgroundColor: "#1e293b" },
      },
      rightPriceScale: {
        borderColor: "#1e293b",
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: "#1e293b",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    paneCountRef.current = 1;

    // Crosshair hover subscriber for live OHLC info
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoverCandle(null);
        return;
      }
      const data = param.seriesData.get(candleSeries);
      if (data) {
        setHoverCandle(data);
      } else {
        setHoverCandle(null);
      }
    });

    // Resize observer observing width & height
    const ro = new ResizeObserver((entries) => {
      if (!entries || !entries[0]) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      seriesMapRef.current = {};
      priceLinesRef.current = {};
      paneCountRef.current = 1;
    };
  }, []); // runs only once

  // ── Handle Fullscreen size changes ─────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    const timer = setTimeout(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        chart.applyOptions({ width: w, height: h });
        chart.timeScale().fitContent();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // ── Reset zoom / Fit content ───────────────────────────────────────────────
  const handleFitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  // ── Remove all indicator series ───────────────────────────────────────────
  const removeAllIndicatorSeries = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    Object.values(seriesMapRef.current).forEach(({ seriesList }) => {
      seriesList.forEach((s) => {
        try { chart.removeSeries(s); } catch { /* already removed */ }
      });
    });
    seriesMapRef.current = {};
    priceLinesRef.current = {};
    paneCountRef.current = 1;
  }, []);

  // ── Render a single indicator onto the chart ──────────────────────────────
  const renderIndicator = useCallback((instance, candles) => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries || candles.length === 0) return;

    const { instanceId, id, params, visible } = instance;
    const seriesList = [];

    const lineOpts = (color, lineWidth = 1.5, paneIdx = 0) => ({
      color,
      lineWidth,
      priceScaleId: paneIdx === 0 ? "right" : `ind_${paneIdx}`,
      lastValueVisible: true,
      priceLineVisible: false,
    });

    const getNextPane = () => {
      paneCountRef.current += 1;
      return paneCountRef.current - 1;
    };

    try {
      if (id === "sma") {
        const data = calcSMA(candles, params.period);
        const s = chart.addSeries(LineSeries, { ...lineOpts(INDICATOR_COLORS.sma), lineWidth: 1.5 }, 0);
        s.setData(data);
        if (!visible) s.applyOptions({ visible: false });
        seriesList.push(s);

      } else if (id === "ema") {
        const data = calcEMA(candles, params.period);
        const s = chart.addSeries(LineSeries, { ...lineOpts(INDICATOR_COLORS.ema), lineWidth: 1.5 }, 0);
        s.setData(data);
        if (!visible) s.applyOptions({ visible: false });
        seriesList.push(s);

      } else if (id === "vwap") {
        const data = calcVWAP(candles);
        const s = chart.addSeries(LineSeries, { ...lineOpts(INDICATOR_COLORS.vwap, 1.5), lineStyle: 2 }, 0);
        s.setData(data);
        if (!visible) s.applyOptions({ visible: false });
        seriesList.push(s);

      } else if (id === "supertrend") {
        const { bull, bear } = calcSupertrend(candles, params.atrPeriod, params.multiplier);
        const sBull = chart.addSeries(LineSeries, { ...lineOpts(INDICATOR_COLORS.supertrend_bull, 2), lineWidth: 2 }, 0);
        const sBear = chart.addSeries(LineSeries, { ...lineOpts(INDICATOR_COLORS.supertrend_bear, 2), lineWidth: 2 }, 0);
        sBull.setData(bull);
        sBear.setData(bear);
        if (!visible) { sBull.applyOptions({ visible: false }); sBear.applyOptions({ visible: false }); }
        seriesList.push(sBull, sBear);

      } else if (id === "bb") {
        const { upper, middle, lower } = calcBollingerBands(candles, params.period, params.stdDev);
        const sUpper = chart.addSeries(LineSeries, { color: INDICATOR_COLORS.bb_upper, lineWidth: 1, lineStyle: 2, lastValueVisible: false, priceLineVisible: false }, 0);
        const sMid = chart.addSeries(LineSeries, { color: INDICATOR_COLORS.bb_middle, lineWidth: 1, lineStyle: 0, lastValueVisible: false, priceLineVisible: false }, 0);
        const sLower = chart.addSeries(LineSeries, { color: INDICATOR_COLORS.bb_lower, lineWidth: 1, lineStyle: 2, lastValueVisible: false, priceLineVisible: false }, 0);
        sUpper.setData(upper);
        sMid.setData(middle);
        sLower.setData(lower);
        if (!visible) { sUpper.applyOptions({ visible: false }); sMid.applyOptions({ visible: false }); sLower.applyOptions({ visible: false }); }
        seriesList.push(sUpper, sMid, sLower);

      } else if (id === "rsi") {
        const data = calcRSI(candles, params.period);
        const pane = getNextPane();
        const s = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.rsi,
          lineWidth: 1.5,
          priceScaleId: `ind_${pane}`,
          lastValueVisible: true,
          priceLineVisible: false,
          priceFormat: { type: "price", precision: 2 },
        }, pane);
        s.setData(data);
        s.createPriceLine({ price: params.overbought, color: "#ef444480", lineWidth: 1, lineStyle: 2, title: "OB" });
        s.createPriceLine({ price: params.oversold, color: "#22c55e80", lineWidth: 1, lineStyle: 2, title: "OS" });
        s.createPriceLine({ price: 50, color: "#ffffff20", lineWidth: 1, lineStyle: 3, title: "" });
        if (!visible) s.applyOptions({ visible: false });
        seriesList.push(s);

      } else if (id === "macd") {
        const { macd, signal, histogram } = calcMACD(candles, params.fast, params.slow, params.signal);
        const pane = getNextPane();
        const sMACD = chart.addSeries(LineSeries, { color: INDICATOR_COLORS.macd_line, lineWidth: 1.5, priceScaleId: `ind_${pane}`, lastValueVisible: true, priceLineVisible: false }, pane);
        const sSignal = chart.addSeries(LineSeries, { color: INDICATOR_COLORS.macd_signal, lineWidth: 1.5, priceScaleId: `ind_${pane}`, lastValueVisible: false, priceLineVisible: false }, pane);
        const sHist = chart.addSeries(HistogramSeries, {
          priceScaleId: `ind_${pane}`,
          lastValueVisible: false,
          priceLineVisible: false,
        }, pane);
        const histColoured = histogram.map((d) => ({
          ...d,
          color: d.value >= 0 ? INDICATOR_COLORS.macd_hist_pos : INDICATOR_COLORS.macd_hist_neg,
        }));
        sMACD.setData(macd);
        sSignal.setData(signal);
        sHist.setData(histColoured);
        if (!visible) { sMACD.applyOptions({ visible: false }); sSignal.applyOptions({ visible: false }); sHist.applyOptions({ visible: false }); }
        seriesList.push(sMACD, sSignal, sHist);

      } else if (id === "adx") {
        const data = calcADX(candles, params.period);
        const pane = getNextPane();
        const s = chart.addSeries(LineSeries, { color: INDICATOR_COLORS.adx, lineWidth: 1.5, priceScaleId: `ind_${pane}`, lastValueVisible: true, priceLineVisible: false }, pane);
        s.setData(data);
        if (!visible) s.applyOptions({ visible: false });
        seriesList.push(s);

      } else if (id === "atr") {
        const data = calcATR(candles, params.period);
        const pane = getNextPane();
        const s = chart.addSeries(LineSeries, { color: INDICATOR_COLORS.atr, lineWidth: 1.5, priceScaleId: `ind_${pane}`, lastValueVisible: true, priceLineVisible: false }, pane);
        s.setData(data);
        if (!visible) s.applyOptions({ visible: false });
        seriesList.push(s);

      } else if (id === "volume") {
        const volData = candles.map((c) => ({
          time: c.time,
          value: c.volume || 0,
          color: c.close >= c.open ? INDICATOR_COLORS.volume_up : INDICATOR_COLORS.volume_down,
        }));
        const pane = getNextPane();
        const s = chart.addSeries(HistogramSeries, { priceScaleId: `ind_${pane}`, lastValueVisible: false, priceLineVisible: false }, pane);
        s.setData(volData);
        if (!visible) s.applyOptions({ visible: false });
        seriesList.push(s);

      } else if (id === "pivot_standard") {
        const levels = calcStandardPivots(candles);
        if (levels) {
          const pivotColors = {
            P: "#94a3b8", R1: "#34d399", R2: "#22c55e", R3: "#16a34a",
            S1: "#f87171", S2: "#ef4444", S3: "#b91c1c",
          };
          const priceLines = [];
          Object.entries(levels).forEach(([key, val]) => {
            const pl = addPivotPriceLine(candleSeriesRef.current, val, key, pivotColors[key] || INDICATOR_COLORS.pivot);
            priceLines.push(pl);
          });
          priceLinesRef.current[instanceId] = priceLines;
        }

      } else if (id === "pivot_camarilla") {
        const levels = calcCamarillaPivots(candles);
        if (levels) {
          const pivotColors = {
            H4: "#22c55e", H3: "#4ade80", H2: "#86efac", H1: "#bbf7d0",
            L1: "#fca5a5", L2: "#f87171", L3: "#ef4444", L4: "#b91c1c",
          };
          const priceLines = [];
          Object.entries(levels).forEach(([key, val]) => {
            const pl = addPivotPriceLine(candleSeriesRef.current, val, key, pivotColors[key] || INDICATOR_COLORS.pivot);
            priceLines.push(pl);
          });
          priceLinesRef.current[instanceId] = priceLines;
        }
      }
    } catch (err) {
      console.error(`[QuantNova] Failed to render indicator ${id}:`, err);
    }

    seriesMapRef.current[instanceId] = { seriesList };
  }, []);

  // ── Re-render indicators when activeIndicators list changes ───────────────
  const renderAllIndicators = useCallback((candles) => {
    removeAllIndicatorSeries();
    if (!candles || candles.length === 0) return;
    activeIndicators.forEach((instance) => renderIndicator(instance, candles));
  }, [activeIndicators, removeAllIndicatorSeries, renderIndicator]);

  // ── Load candle data whenever symbol / period / interval changes ──────────
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    let cancelled = false;
    const abortCtrl = new AbortController();

    async function load() {
      onLoading?.(true);
      onError?.(null);

      try {
        const { getMarketHistory } = await import("@/services/marketService");
        const result = await getMarketHistory(symbol, period, interval, abortCtrl.signal);
        if (cancelled) return;

        const candles = result.data;
        candleDataRef.current = candles;
        candleSeries.setData(candles);
        chart.timeScale().fitContent();

        if (candles && candles.length > 0) {
          setLatestCandle(candles[candles.length - 1]);
        }

        renderAllIndicators(candles);
        onLoading?.(false);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        console.error("[QuantNova] Failed to load market data:", err);
        onLoading?.(false);
        const detail = err?.response?.data?.detail;
        onError?.(detail || `Failed to load ${symbol} (${interval}, ${period}).`);
      }
    }

    load();

    return () => {
      cancelled = true;
      abortCtrl.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, period, interval]);

  // Re-render indicators when activeIndicators changes (not candle data)
  useEffect(() => {
    renderAllIndicators(candleDataRef.current);
  }, [activeIndicators, renderAllIndicators]);

  // Computed display candle (hover candle taking precedence over latest)
  const displayCandle = hoverCandle || latestCandle;
  const candleChange = displayCandle ? displayCandle.close - displayCandle.open : 0;
  const candleChangePct = displayCandle && displayCandle.open
    ? (candleChange / displayCandle.open) * 100
    : 0;

  return (
    <div className="relative w-full h-full min-h-[480px] bg-[#070b16] select-none flex flex-col">
      {/* ── TradingView-style top-left OHLC live overlay ──────────────────── */}
      {displayCandle && (
        <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2.5 text-[11px] font-mono pointer-events-none bg-[#090f22]/90 px-3 py-1.5 rounded-xl border border-slate-800/80 backdrop-blur-xs shadow-md flex-wrap max-w-[90%]">
          <span className="font-bold text-white tracking-wide">{symbol}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            O <span className="text-white font-medium">{displayCandle.open?.toFixed(2)}</span>
          </span>
          <span className="text-slate-400">
            H <span className="text-emerald-400 font-medium">{displayCandle.high?.toFixed(2)}</span>
          </span>
          <span className="text-slate-400">
            L <span className="text-rose-400 font-medium">{displayCandle.low?.toFixed(2)}</span>
          </span>
          <span className="text-slate-400">
            C{" "}
            <span
              className={`font-medium ${
                candleChange >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {displayCandle.close?.toFixed(2)}
            </span>
          </span>
          <span
            className={`font-semibold ${
              candleChange >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {candleChange >= 0 ? "+" : ""}
            {candleChange.toFixed(2)} ({candleChangePct >= 0 ? "+" : ""}
            {candleChangePct.toFixed(2)}%)
          </span>
        </div>
      )}

      {/* ── Quick Reset / Fit Zoom Button (Top Right) ────────────────────── */}
      <button
        onClick={handleFitContent}
        title="Reset Chart Zoom / Fit Content"
        className="absolute top-2.5 right-3 z-10 p-1.5 rounded-xl bg-[#090f22]/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
      >
        <RotateCcw size={13} />
      </button>

      {/* ── Chart Container ──────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-[460px]"
        style={{ height: isFullscreen ? "100%" : "520px" }}
      />
    </div>
  );
}