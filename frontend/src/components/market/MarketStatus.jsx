import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { marketData } from "@/mock/marketData";

export default function MarketStatus() {
  const isPositive = !String(marketData.change).startsWith("-");
  return (
    <div className="qn-card qn-card-bull p-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: 'var(--qn-bull)' }} />
            <span className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--qn-bull)', fontFamily: "'JetBrains Mono', monospace" }}>
              Market {marketData.status}
            </span>
          </div>

          <h2 className="text-lg font-bold mb-1"
            style={{ color: 'var(--qn-text-2)', fontFamily: "'Space Grotesk', sans-serif" }}>
            {marketData.index}
          </h2>

          <p className="text-3xl font-bold mb-2"
            style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>
            ₹{marketData.price}
          </p>

          <p className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: isPositive ? 'var(--qn-bull)' : 'var(--qn-bear)', fontFamily: "'JetBrains Mono', monospace" }}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {marketData.change} ({marketData.changePercent})
          </p>
        </div>

        <div className="text-right">
          <Clock style={{ color: 'var(--qn-text-3)' }} className="ml-auto mb-1" size={18} />
          <p className="text-xs mb-0.5" style={{ color: 'var(--qn-text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
            Last Updated
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--qn-text-1)', fontFamily: "'JetBrains Mono', monospace" }}>
            {marketData.lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
}
