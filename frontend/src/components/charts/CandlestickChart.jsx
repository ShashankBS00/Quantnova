import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { getMarketHistory } from "@/services/marketService";
import { ohlcData } from "@/mock/ohlcData";

export default function CandlestickChart({ symbol, period }) {
    const chartContainerRef = useRef(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 450,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#CBD5E1",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    async function loadChart() {
      try {
const result = await getMarketHistory(symbol, period);    
    candleSeries.setData(result.data);

        chart.timeScale().fitContent();
      } catch (err) {
        console.error(err);
      }
    }

    loadChart();

    const handleResize = () => {
      chart.applyOptions({
        width: container.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
 }, [symbol, period]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-[450px]"
    />
  );
}