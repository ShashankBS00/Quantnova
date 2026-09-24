import React from "react";

export default function PageHeader({
  badge,
  badgeIcon: BadgeIcon,
  title,
  description,
  actions,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1 ${className}`}
    >
      <div>
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase text-indigo-700 bg-indigo-50 border border-indigo-200/60 mb-2">
            {BadgeIcon && <BadgeIcon className="w-3 h-3 text-indigo-600" />}
            <span>{badge}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 font-medium">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
