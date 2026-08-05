import CandlestickChart from "@/components/charts/CandlestickChart";

export default function Market() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Market</h1>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
        <CandlestickChart />
      </div>
    </div>
  );
}