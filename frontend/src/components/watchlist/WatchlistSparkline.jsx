import { useId } from "react";

/**
 * Clean SVG Mini Sparkline with smooth bezier curve and subtle gradient fill.
 */
export default function WatchlistSparkline({ data = [], positive = true, width = 90, height = 28 }) {
  const reactId = useId().replace(/:/g, "_");
  if (!data || data.length < 2) {
    return <span className="text-[11px] font-mono text-slate-400 dark:text-slate-600">—</span>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 3;
  const availableHeight = height - padding * 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((v - min) / range) * availableHeight;
    return { x, y };
  });

  const polylinePts = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Gradient area path
  const areaPath = `M ${points[0].x},${height} L ${polylinePts.replace(/ /g, " L ")} L ${points[points.length - 1].x},${height} Z`;

  const strokeColor = positive ? "#10b981" : "#ef4444";
  const gradId = `spark_${positive ? "bull" : "bear"}_${reactId}`;

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePts}
      />
    </svg>
  );
}
