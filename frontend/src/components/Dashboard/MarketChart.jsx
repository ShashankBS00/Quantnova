export default function MarketChart() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Market Overview
          </h2>
          <p className="text-sm text-slate-400">
            RELIANCE.NS • 1 Day
          </p>
        </div>

        <div className="flex gap-2">
          {["1D", "1W", "1M", "1Y"].map((item) => (
            <button
              key={item}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[380px] rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center">
        <p className="text-slate-500">
          TradingView Chart Coming Next 🚀
        </p>
      </div>
    </div>
  );
}