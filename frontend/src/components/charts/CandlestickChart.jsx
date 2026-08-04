import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function CandlestickChart() {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          color: "#111827",
        },
        textColor: "#CBD5E1",
      },

      grid: {
        vertLines: {
          color: "#1E293B",
        },
        horzLines: {
          color: "#1E293B",
        },
      },

      width: chartContainerRef.current.clientWidth,
      height: 420,
    });

    const candleSeries = chart.addCandlestickSeries();

    candleSeries.setData([
      {
        time: "2025-01-01",
        open: 100,
        high: 110,
        low: 95,
        close: 108,
      },
      {
        time: "2025-01-02",
        open: 108,
        high: 115,
        low: 105,
        close: 112,
      },
      {
        time: "2025-01-03",
        open: 112,
        high: 118,
        low: 109,
        close: 114,
      },
      {
        time: "2025-01-04",
        open: 114,
        high: 120,
        low: 111,
        close: 117,
      },
    ]);

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div
      ref={chartContainerRef}
      className="w-full rounded-2xl overflow-hidden"
    />
  );
}