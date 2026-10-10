import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Plus, Eye, EyeOff, SlidersHorizontal, Check } from "lucide-react";
import { INDICATOR_CATALOGUE, INDICATOR_CATEGORIES } from "@/lib/indicatorCatalogue";

// ─── IndicatorSettingsModal / Form ────────────────────────────────────────────

export function IndicatorSettingsModal({ instance, onClose, onUpdate }) {
  if (!instance) return null;
  const def = INDICATOR_CATALOGUE.find((d) => d.id === instance.id);
  if (!def) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#0b1329] border border-slate-700/80 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#080d1a]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: instance.color || "#3b82f6" }}
            />
            <span className="text-sm font-mono font-bold text-white">{def.fullName}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {def.paramDefs.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">This indicator has no configurable parameters.</p>
          ) : (
            def.paramDefs.map((param) => (
              <label key={param.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-medium">{param.label}</span>
                  <span className="text-slate-500 text-[10px]">
                    [{param.min} – {param.max}]
                  </span>
                </div>
                <input
                  type="number"
                  min={param.min}
                  max={param.max}
                  step={param.step || 1}
                  value={instance.params[param.key] ?? def.defaultParams[param.key]}
                  onChange={(e) =>
                    onUpdate(instance.instanceId, {
                      ...instance.params,
                      [param.key]: parseFloat(e.target.value) || param.min,
                    })
                  }
                  className="w-full bg-[#060a14] border border-slate-700/70 focus:border-blue-500 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none transition-colors"
                />
              </label>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-800/80 bg-[#080d1a]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Check size={13} />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ActiveIndicatorChip ──────────────────────────────────────────────────────

export function ActiveIndicatorChip({ instance, onRemove, onEdit, onToggle }) {
  return (
    <div
      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all select-none ${
        instance.visible
          ? "bg-[#0b1736]/80 border-blue-500/30 text-blue-200 hover:border-blue-400/60"
          : "bg-slate-900/60 border-slate-700/40 text-slate-500 opacity-60"
      }`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: instance.color || "#60a5fa" }}
      />
      <span className="font-semibold">{instance.label}</span>

      {/* Visibility Toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
        title={instance.visible ? "Hide indicator" : "Show indicator"}
      >
        {instance.visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>

      {/* Settings / Edit */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-slate-400 hover:text-blue-400 p-0.5 rounded transition-colors"
          title="Configure parameters"
        >
          <SlidersHorizontal size={11} />
        </button>
      )}

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-red-400 p-0.5 rounded transition-colors ml-0.5"
        title="Remove indicator"
      >
        <X size={11} />
      </button>
    </div>
  );
}

// ─── IndicatorsMenu ───────────────────────────────────────────────────────────

export default function IndicatorsMenu({
  activeIndicators,
  onAdd,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = INDICATOR_CATALOGUE.filter((ind) => {
    const matchSearch =
      search.trim() === "" ||
      ind.label.toLowerCase().includes(search.toLowerCase()) ||
      ind.fullName.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || ind.category === activeCategory;
    return matchSearch && matchCat;
  });

  const handleAdd = (definition) => {
    onAdd(definition);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        id="indicators-menu-btn"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all shadow-sm ${
          open || activeIndicators.length > 0
            ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
            : "bg-[#080e1c] border-slate-700/70 text-slate-400 hover:text-white hover:border-slate-500"
        }`}
      >
        <SlidersHorizontal size={13} className="text-blue-400" />
        <span>Indicators</span>
        {activeIndicators.length > 0 && (
          <span className="bg-blue-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {activeIndicators.length}
          </span>
        )}
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Catalogue dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-[#090f21] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search */}
          <div className="p-3 border-b border-slate-800 bg-[#060b17]">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search indicators (e.g. RSI, MACD)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a1224] border border-slate-700/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 px-3 pt-2 pb-1.5 overflow-x-auto border-b border-slate-800/60 no-scrollbar">
            {["All", ...INDICATOR_CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Indicator list */}
          <div className="overflow-y-auto max-h-72 p-2 flex flex-col gap-1">
            {filtered.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-6 font-mono">No indicators found</p>
            )}
            {filtered.map((def) => {
              const activeCount = activeIndicators.filter((i) => i.id === def.id).length;
              return (
                <button
                  key={def.id}
                  onClick={() => handleAdd(def)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
                    activeCount > 0
                      ? "bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/20"
                      : "hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">{def.label}</span>
                      {activeCount > 0 && (
                        <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-px rounded font-mono">
                          Active ({activeCount})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{def.fullName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 bg-[#060a14] border border-slate-800 px-1.5 py-0.5 rounded font-mono">
                      {def.category}
                    </span>
                    <Plus
                      size={13}
                      className="text-slate-400 group-hover:text-blue-400 transition-colors"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
