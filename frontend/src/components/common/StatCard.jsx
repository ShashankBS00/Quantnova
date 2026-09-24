import React from "react";

export default function StatCard({
  title,
  value,
  subtitle,
  badge,
  icon: Icon,
  iconBg = "rgba(79, 70, 229, 0.08)",
  iconColor = "#4f46e5",
  loading = false,
  className = "",
}) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200/80 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${className}`}
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ background: iconBg, color: iconColor }}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-lg" />
        ) : (
          <div className="text-2xl md:text-[26px] font-bold text-slate-900 tracking-tight font-mono tabular-nums">
            {value}
          </div>
        )}
      </div>

      {/* Bottom row: Subtitle and/or Badge */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        {loading ? (
          <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
        ) : (
          <>
            {subtitle && (
              <span className="text-slate-500 truncate font-medium">
                {subtitle}
              </span>
            )}
            {badge && <div className="flex-shrink-0 ml-auto">{badge}</div>}
          </>
        )}
      </div>
    </div>
  );
}
