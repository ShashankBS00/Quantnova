import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export function formatINR(value) {
  if (value === null || value === undefined || isNaN(value)) return "--";
  const num = Number(value);
  return `₹${Math.abs(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPnlINR(value) {
  if (value === null || value === undefined || isNaN(value)) return "--";
  const num = Number(value);
  const sign = num > 0 ? "+" : num < 0 ? "-" : "";
  return `${sign}₹${Math.abs(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return "--";
  const num = Number(value);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export default function PnlBadge({
  value,
  percent,
  isPercentOnly = false,
  size = "md",
  className = "",
}) {
  const numVal = typeof value === "number" ? value : parseFloat(value);
  const numPct = typeof percent === "number" ? percent : parseFloat(percent);
  const checkVal = !isNaN(numVal) ? numVal : !isNaN(numPct) ? numPct : 0;

  const isPositive = checkVal > 0;
  const isNegative = checkVal < 0;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-sm font-bold gap-1.5",
  }[size] || "px-2.5 py-1 text-xs font-semibold gap-1.5";

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size] || "w-3.5 h-3.5";

  let colorClasses = "bg-slate-100 text-slate-600 border border-slate-200/80";
  let Icon = Minus;

  if (isPositive) {
    colorClasses = "bg-emerald-50/80 text-emerald-700 border border-emerald-200/70";
    Icon = ArrowUpRight;
  } else if (isNegative) {
    colorClasses = "bg-rose-50/80 text-rose-700 border border-rose-200/70";
    Icon = ArrowDownRight;
  }

  let text = "";
  if (isPercentOnly && !isNaN(numPct)) {
    text = formatPercent(numPct);
  } else if (!isNaN(numVal) && !isNaN(numPct)) {
    text = `${formatPnlINR(numVal)} (${formatPercent(numPct)})`;
  } else if (!isNaN(numVal)) {
    text = formatPnlINR(numVal);
  } else if (!isNaN(numPct)) {
    text = formatPercent(numPct);
  } else {
    text = "--";
  }

  return (
    <span
      className={`inline-flex items-center rounded-lg font-mono tabular-nums leading-none tracking-tight transition-colors ${sizeClasses} ${colorClasses} ${className}`}
    >
      <Icon className={`${iconSizes} flex-shrink-0 stroke-[2.5]`} />
      <span>{text}</span>
    </span>
  );
}
