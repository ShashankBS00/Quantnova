import { BrainCircuit, TrendingUp, ShieldCheck, Target, AlertTriangle } from "lucide-react";
import { prediction } from "@/mock/prediction";

export default function PredictionCard() {
  const isBuy = prediction.signal === "BUY";
  const isSell = prediction.signal === "SELL";

  const signalColor = isBuy ? 'var(--qn-bull)' : isSell ? 'var(--qn-bear)' : 'var(--qn-gold)';
  const signalBg   = isBuy ? 'rgba(5,150,105,0.09)' : isSell ? 'rgba(220,38,38,0.09)' : 'rgba(217,119,6,0.09)';
  const signalBorder = isBuy ? 'rgba(5,150,105,0.25)' : isSell ? 'rgba(220,38,38,0.25)' : 'rgba(217,119,6,0.25)';

  return (
    <div className="qn-card qn-card-violet p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-xl" style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.18)' }}>
          <BrainCircuit size={16} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--qn-text-1)', fontFamily: "'Space Grotesk', sans-serif" }}>
            AI Prediction
          </h2>
          <p className="text-[10px]" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
            ML-powered signal
          </p>
        </div>
      </div>

      {/* Signal Badge */}
      <div className="flex items-center justify-between mb-5">
        <span className="px-4 py-1.5 rounded-full text-xl font-black tracking-widest"
          style={{
            color: signalColor,
            background: signalBg,
            border: `1px solid ${signalBorder}`,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
          {prediction.signal}
        </span>
        <div className="text-right">
          <p className="text-[10px] mb-0.5" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>Confidence</p>
          <p className="text-2xl font-black" style={{ color: signalColor, fontFamily: "'JetBrains Mono', monospace" }}>
            {prediction.confidence}%
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-5">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.10)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${prediction.confidence}%`,
              background: `linear-gradient(90deg, ${signalColor}, ${isBuy ? '#0891b2' : isSell ? '#ea580c' : '#d97706'})`,
              boxShadow: `0 0 8px ${signalColor}`,
            }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2.5 flex-1">
        {[
          { icon: ShieldCheck, label: "Risk", value: prediction.risk, color: 'var(--qn-text-1)' },
          { icon: Target, label: "Target", value: prediction.target, color: 'var(--qn-bull)' },
          { icon: AlertTriangle, label: "Stop Loss", value: prediction.stopLoss, color: 'var(--qn-bear)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: '#f5f7ff', border: '1px solid rgba(79,70,229,0.08)' }}>
            <div className="flex items-center gap-2">
              <Icon size={13} style={{ color: 'var(--qn-text-3)' }} />
              <span className="text-xs" style={{ color: 'var(--qn-text-2)', fontFamily: "'Inter', sans-serif" }}>{label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button className="mt-5 w-full qn-btn-primary rounded-xl py-3 flex items-center justify-center gap-2">
        <TrendingUp size={16} />
        <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>View Full Analysis</span>
      </button>
    </div>
  );
}
