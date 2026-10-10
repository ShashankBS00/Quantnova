import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Plus } from "lucide-react";
import { INDICATOR_CATALOGUE, INDICATOR_CATEGORIES } from "@/lib/indicatorCatalogue";

// ─── IndicatorSettingsForm ────────────────────────────────────────────────────

function IndicatorSettingsForm({ definition, params, onChange }) {
  if (definition.paramDefs.length === 0) {
    return <p className="text-xs text-slate-500 italic">No configurable parameters.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {definition.paramDefs.map((def) => (
        <label key={def.key} className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {def.label}
          </span>
          <input
            type="number"
            min={def.min}
            max={def.max}
            step={def.step || 1}
            value={params[def.key] ?? definition.defaultParams[def.key]}
            onChange={(e) =>
              onChange({ ...params, [def.key]: parseFloat(e.target.value) || def.min })
            }
            className="w-full bg-[#0c1328] border border-[#1e2d4a] rounded-lg px-3 py-1.5 text-white text-xs font-mono outline-none focus:border-blue-500 transition-colors"
          />
        </label>
      ))}
    </div>
  );
}

// ─── ActiveIndicatorChip ──────────────────────────────────────────────────────

export function ActiveIndicatorChip({ instance, onRemove, onEdit, onToggle }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-mono transition-all select-none ${
        instance.visible
          ? "bg-blue-900/30 border-blue-500/40 text-blue-300"
          : "bg-slate-800/30 border-slate-600/40 text-slate-500"
      }`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: instance.color || "#60a5fa" }}
      />
      <span
        onClick={onEdit}
        className="hover:text-white transition-colors cursor-pointer"
      >
        {instance.label}
      </span>
      <button
        onClick={onToggle}
        className="opacity-50 hover:opacity-100 transition-opacity ml-0.5"
        title={instance.visible ? "Hide" : "Show"}
      >
        {instance.visible ? "●" : "○"}
      </button>
      <button
        onClick={onRemove}
        className="opacity-50 hover:opacity-100 transition-opacity"
        title="Remove"
      >
        <X size={10} />
      </button>
    </div>
  );
}

// ─── IndicatorsMenu ───────────────────────────────────────────────────────────

export default function IndicatorsMenu({ activeIndicators, onAdd, onRemove, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [editingId, setEditingId] = useState(null); // instanceId being edited
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setEditingId(null);
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

  const editingInstance = editingId
    ? activeIndicators.find((i) => i.instanceId === editingId)
    : null;
  const editingDef = editingInstance
    ? INDICATOR_CATALOGUE.find((d) => d.id === editingInstance.id)
    : null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        id="indicators-menu-btn"
        onClick={() => { setOpen((v) => !v); setEditingId(null); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
          open || activeIndicators.length > 0
            ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
            : "bg-[#0c1328] border-[#1e2d4a] text-slate-400 hover:text-white hover:border-slate-500"
        }`}
      >
        <span className="text-sm leading-none">📊</span>
        Indicators
        {activeIndicators.length > 0 && (
          <span className="bg-blue-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {activeIndicators.length}
          </span>
        )}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Catalogue dropdown */}
      {open && !editingId && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-[#0b1222] border border-[#1e2d4a] rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-[#1e2d4a]">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search indicators…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#070b16] border border-[#1e2d4a] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 px-3 pt-2 pb-1 overflow-x-auto">
            {["All", ...INDICATOR_CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Indicator list */}
          <div className="overflow-y-auto max-h-64 p-2 flex flex-col gap-0.5">
            {filtered.length === 0 && (
              <p className="text-center text-xs text-slate-600 py-4">No indicators found</p>
            )}
            {filtered.map((def) => {
              const alreadyActive = activeIndicators.some((i) => i.id === def.id);
              return (
                <button
                  key={def.id}
                  onClick={() => handleAdd(def)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors group ${
                    alreadyActive ? "bg-blue-900/20 hover:bg-blue-900/30" : "hover:bg-[#0c1328]"
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-white">{def.label}</span>
                    <span className="ml-2 text-[10px] text-slate-500">{def.fullName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-600 bg-[#0c1328] px-1.5 py-0.5 rounded font-mono">
                      {def.category}
                    </span>
                    <Plus
                      size={12}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                        alreadyActive ? "text-blue-400" : "text-slate-400"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings edit panel */}
      {editingId && editingInstance && editingDef && (
        <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-[#0b1222] border border-[#1e2d4a] rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1e2d4a]">
            <span className="text-xs font-mono font-bold text-white">{editingDef.fullName}</span>
            <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-white">
              <X size={13} />
            </button>
          </div>
          <div className="p-3">
            <IndicatorSettingsForm
              definition={editingDef}
              params={editingInstance.params}
              onChange={(newParams) => onUpdate(editingInstance.instanceId, newParams)}
            />
          </div>
          <div className="px-3 pb-3">
            <button
              onClick={() => { onRemove(editingInstance.instanceId); setEditingId(null); }}
              className="w-full py-1.5 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-900/50 transition-colors"
            >
              Remove Indicator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
