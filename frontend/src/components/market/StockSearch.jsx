import { useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";

export default function StockSearch({ onSearch }) {
  const [symbol, setSymbol] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = symbol.trim().toUpperCase();
    if (!value) return;
    onSearch(value);
    setSymbol("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full">
      <div className="relative flex-1 group">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none"
        />
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Search stock e.g. RELIANCE, TCS..."
          className="w-full h-9 pl-9 pr-8 bg-[#070d1a]/80 hover:bg-[#070d1a] focus:bg-[#070d1a] border border-slate-700/60 focus:border-blue-500 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none transition-all shadow-inner"
        />
        {symbol && (
          <button
            type="button"
            onClick={() => setSymbol("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={!symbol.trim()}
        className="ml-2 h-9 px-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-600/30 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
      >
        <span>Search</span>
        <ArrowRight size={12} />
      </button>
    </form>
  );
}