import { useState } from "react";

export default function StockSearch({ onSearch }) {
  const [symbol, setSymbol] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const value = symbol.trim().toUpperCase();

    if (!value) return;

    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="relative flex-1">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Search stock e.g. RELIANCE.NS"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
      >
        Search
      </button>
    </form>
  );
}