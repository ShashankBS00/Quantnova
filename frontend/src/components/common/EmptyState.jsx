import React from "react";
import { FolderOpen } from "lucide-react";

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = "No data available",
  description = "There are currently no items to display.",
  action,
  className = "",
}) {
  return (
    <div
      className={`py-12 px-6 flex flex-col items-center justify-center text-center max-w-sm mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/60 shadow-sm">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
