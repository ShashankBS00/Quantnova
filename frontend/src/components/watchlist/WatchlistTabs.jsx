import { useState, useRef, useEffect } from "react";
import { Plus, MoreVertical, Edit2, Trash2, Check, X } from "lucide-react";

export default function WatchlistTabs({
  watchlists = [],
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const menuRef = useRef(null);
  const createInputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (isCreating) createInputRef.current?.focus();
  }, [isCreating]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const clean = newListName.trim();
    if (!clean) return;
    onCreate(clean);
    setNewListName("");
    setIsCreating(false);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    const clean = editName.trim();
    if (!clean) return;
    onRename(editingId, clean);
    setEditingId(null);
    setEditName("");
  };

  const confirmDelete = (id) => {
    onDelete(id);
    setDeletingId(null);
    setMenuOpenId(null);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {watchlists.map((wl) => {
        const isActive = wl.id === activeId;
        const count = wl.symbols ? wl.symbols.length : 0;
        const isEditingThis = editingId === wl.id;

        if (isEditingThis) {
          return (
            <form
              key={wl.id}
              onSubmit={handleRenameSubmit}
              className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded-xl px-2.5 py-1.5 shadow-sm"
            >
              <input
                ref={editInputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-28 text-xs font-semibold bg-transparent text-slate-800 dark:text-white outline-none"
              />
              <button
                type="submit"
                className="p-1 text-emerald-600 hover:text-emerald-500 rounded"
                title="Save name"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                title="Cancel"
              >
                <X size={13} />
              </button>
            </form>
          );
        }

        return (
          <div key={wl.id} className="relative group">
            <button
              onClick={() => onSelect(wl.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all select-none cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{wl.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {count}
              </span>

              {/* Context menu trigger (on active or hover) */}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === wl.id ? null : wl.id);
                }}
                className={`ml-1 p-0.5 rounded transition-opacity ${
                  isActive
                    ? "text-white/70 hover:text-white"
                    : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
                title="List options"
              >
                <MoreVertical size={13} />
              </span>
            </button>

            {/* Dropdown menu */}
            {menuOpenId === wl.id && (
              <div
                ref={menuRef}
                className="absolute top-full left-0 mt-1.5 z-40 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95"
              >
                <button
                  onClick={() => {
                    setEditingId(wl.id);
                    setEditName(wl.name);
                    setMenuOpenId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit2 size={12} className="text-slate-400" />
                  <span>Rename</span>
                </button>

                {watchlists.length > 1 && (
                  <button
                    onClick={() => {
                      setDeletingId(wl.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* "+ Add List" button or inline form */}
      {isCreating ? (
        <form
          onSubmit={handleCreateSubmit}
          className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded-xl px-2.5 py-1.5 shadow-sm"
        >
          <input
            ref={createInputRef}
            type="text"
            placeholder="Watchlist name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="w-32 text-xs font-semibold bg-transparent text-slate-800 dark:text-white placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            className="p-1 text-indigo-600 hover:text-indigo-500 rounded"
            title="Create"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewListName("");
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            title="Cancel"
          >
            <X size={13} />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          title="Create a new watchlist"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
        >
          <Plus size={13} />
          <span>New List</span>
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete Watchlist?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                "{watchlists.find((w) => w.id === deletingId)?.name}"
              </strong>
              ? All tickers in this list will be removed.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deletingId)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Delete List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
