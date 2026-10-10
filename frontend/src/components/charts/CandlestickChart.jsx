import { useEffect, useRef, useCallback } from "react";
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

export default function CandlestickChart({ symbol, period, interval, activeIndicators }) {
  const containerRef = useRef(null);
  // Stable refs — we never want these to trigger re-renders
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const candleDataRef = useRef([]); // latest candle data for indicator re-calc
  const seriesMapRef = useRef({}); // instanceId → { series[], paneIndex }
  const priceLinesRef = useRef({}); // instanceId → priceLine[]
  const paneCountRef = useRef(1); // how many panes currently exist

  // ── Build chart once ──────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 460,
      layout: {
        background: { color: "#070b16" },
        textColor: "#94a3b8",
        fontSize: 11,
        fontFamily: "'Geist Mono', monospace",
      },
      grid: {
        vertLines: { color: "#0f172a" },
        horzLines: { color: "#0f172a" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#334155", style: 0, width: 1, labelBackgroundColor: "#1e293b" },
        horzLine: { color: "#334155", style: 0, width: 1, labelBackgroundColor: "#1e293b" },
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

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
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

  // ── Remove all indicator series ───────────────────────────────────────────
  const removeAllIndicatorSeries = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Remove series
    Object.values(seriesMapRef.current).forEach(({ seriesList }) => {
      seriesList.forEach((s) => {
        try { chart.removeSeries(s); } catch { /* already removed */ }
      });
    });
    seriesMapRef.current = {};

    // Price lines are removed when their series is removed
    priceLinesRef.current = {};
    paneCountRef.current = 1; // reset; candleSeries is pane 0
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
        // Overbought / oversold lines
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
        // Colour histogram bars by sign
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
        // Volume histogram coloured by candle direction
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
        // No chart series added — just price lines on candle pane

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
      try {
        // Dynamic import to avoid circular-dep issues
        const { getMarketHistory } = await import("@/services/marketService");
        const result = await getMarketHistory(symbol, period, interval, abortCtrl.signal);
        if (cancelled) return;

        const candles = result.data;
        candleDataRef.current = candles;
        candleSeries.setData(candles);
        chart.timeScale().fitContent();

        // Re-render active indicators with new data
        renderAllIndicators(candles);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        console.error("[QuantNova] Failed to load market data:", err);
      }
    }

    load();

    return () => {
      cancelled = true;
      abortCtrl.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, period, interval]); // intentionally omit renderAllIndicators to avoid infinite loops

  // Re-render indicators when activeIndicators changes (not candle data)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    renderAllIndicators(candleDataRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndicators]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ minHeight: 460 }}
    />
  );
}