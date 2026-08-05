import { BrainCircuit, TrendingUp } from "lucide-react";
import { prediction } from "@/mock/prediction";

export default function PredictionCard() {
  const signalColor =
    prediction.signal === "BUY"
      ? "text-green-400"
      : prediction.signal === "SELL"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <BrainCircuit className="text-blue-500" />
        <h2 className="text-xl font-semibold text-white">
          AI Prediction
        </h2>
      </div>

      <h3 className={`text-3xl font-bold ${signalColor}`}>
        {prediction.signal}
      </h3>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Confidence</span>
          <span className="text-white">{prediction.confidence}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Risk</span>
          <span className="text-white">{prediction.risk}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Target</span>
          <span className="text-green-400">{prediction.target}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Stop Loss</span>
          <span className="text-red-400">{prediction.stopLoss}</span>
        </div>
      </div>

      <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 text-white font-semibold flex items-center justify-center gap-2">
        <TrendingUp size={18} />
        View Analysis
      </button>
    </div>
  );
}