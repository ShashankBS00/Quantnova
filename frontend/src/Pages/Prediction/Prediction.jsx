import React, { useState } from "react";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Sparkles, 
  Cpu, 
  Gauge, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  ExternalLink,
  Sliders,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

const PREDICTION_DATA = {
  "RELIANCE.NS": {
    name: "Reliance Industries Ltd",
    currentPrice: 2942.50,
    targetPrice: 3015.00,
    signal: "STRONG BUY",
    confidence: 84.5,
    expectedReturn: "+2.46%",
    timeHorizon: "Next 5 Trading Days",
    primaryModel: "XGBoost Regressor + LSTM Ensemble",
    modelAccuracy: "79.2%",
    support: 2910.00,
    resistance: 2985.00,
    sentimentScore: "0.76 (Bullish)",
    signalsBreakdown: [
      { metric: "RSI Momentum (14D)", value: "58.4", state: "Bullish Divergence", isBull: true },
      { metric: "EMA 20 / 50 Crossover", value: "Golden Cross", state: "Bullish Trend Confirmation", isBull: true },
      { metric: "Order Book Imbalance", value: "+14.2% Bid Heavy", state: "Accumulation Pressure", isBull: true },
      { metric: "IV Skew (Derivatives)", value: "Call Volume Dominant", state: "Upside Hedging", isBull: true },
      { metric: "MACD Histogram", value: "+4.12", state: "Expanding Momentum", isBull: true },
    ],
    features: [
      { name: "Order Flow Delta", weight: 34 },
      { name: "Historical Volatility (20D)", weight: 26 },
      { name: "5-Day Rolling Volume", weight: 22 },
      { name: "Nifty 50 Beta Sensitivity", weight: 18 }
    ]
  },
  "TCS.NS": {
    name: "Tata Consultancy Services",
    currentPrice: 3814.20,
    targetPrice: 3740.00,
    signal: "SELL",
    confidence: 68.0,
    expectedReturn: "-1.95%",
    timeHorizon: "Next 5 Trading Days",
    primaryModel: "LightGBM + Transformer",
    modelAccuracy: "74.8%",
    support: 3720.00,
    resistance: 3850.00,
    sentimentScore: "-0.32 (Mild Bearish)",
    signalsBreakdown: [
      { metric: "RSI Momentum (14D)", value: "68.2", state: "Approaching Overbought", isBull: false },
      { metric: "EMA 20 / 50 Crossover", value: "Neutral", state: "Consolidation", isBull: false },
      { metric: "Order Book Imbalance", value: "-8.4% Ask Heavy", state: "Institutional Distribution", isBull: false },
      { metric: "IV Skew (Derivatives)", value: "Put Buying Heavy", state: "Downside Hedging", isBull: false },
      { metric: "MACD Histogram", value: "-1.40", state: "Contracting Trend", isBull: false },
    ],
    features: [
      { name: "Sector Rotation Factor", weight: 38 },
      { name: "Foreign Institutional Flow", weight: 28 },
      { name: "Earnings Surprise Delta", weight: 19 },
      { name: "Price-to-Earnings Ratio", weight: 15 }
    ]
  },
  "INFY.NS": {
    name: "Infosys Limited",
    currentPrice: 1623.40,
    targetPrice: 1675.00,
    signal: "BUY",
    confidence: 81.2,
    expectedReturn: "+3.18%",
    timeHorizon: "Next 5 Trading Days",
    primaryModel: "XGBoost Quant v2.4",
    modelAccuracy: "81.0%",
    support: 1590.00,
    resistance: 1640.00,
    sentimentScore: "0.64 (Bullish)",
    signalsBreakdown: [
      { metric: "RSI Momentum (14D)", value: "52.8", state: "Rebounding from 45", isBull: true },
      { metric: "EMA 20 / 50 Crossover", value: "Crossed Up", state: "Breakout Confirmation", isBull: true },
      { metric: "Order Book Imbalance", value: "+11.0% Bid Heavy", state: "Strong Buyer Support", isBull: true },
      { metric: "IV Skew (Derivatives)", value: "Balanced", state: "Low Downside Fear", isBull: true },
      { metric: "MACD Histogram", value: "+2.85", state: "Bullish Acceleration", isBull: true },
    ],
    features: [
      { name: "ADR Arbitrage Spread", weight: 36 },
      { name: "Volume Weighted Momentum", weight: 30 },
      { name: "NASDAQ Beta Correl", weight: 20 },
      { name: "Options Open Interest Drift", weight: 14 }
    ]
  }
};

export default function Prediction() {
  const [selectedTicker, setSelectedTicker] = useState("RELIANCE.NS");
  const [selectedHorizon, setSelectedHorizon] = useState("5D");
  const currentPred = PREDICTION_DATA[selectedTicker] || PREDICTION_DATA["RELIANCE.NS"];
  const isBullish = currentPred.signal.includes("BUY");

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div>
          <div className="flex items-center gap-2 mb-1 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <Brain size={15} /> Neural Market Predictor
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            AI Quant Price Forecasting
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Predictive machine learning models trained on order book liquidity, historical OHLCV, and volatility skews.
          </p>
        </div>

        {/* Ticker Selector Buttons */}
        <div className="flex items-center gap-2 bg-[#070b16] p-1.5 rounded-xl border border-[#162444]">
          {Object.keys(PREDICTION_DATA).map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedTicker(sym)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedTicker === sym
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {sym.replace(".NS", "")}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top Forecast Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Signal Direction */}
        <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400">
            Model Signal
          </span>
          <div className="mt-3 flex items-center justify-between">
            <span
              className={`text-xl font-bold font-mono px-3 py-1 rounded-lg border ${
                isBullish
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                  : "bg-rose-950/60 text-rose-400 border-rose-800/60"
              }`}
            >
              {currentPred.signal}
            </span>
            {isBullish ? (
              <TrendingUp className="text-emerald-400" size={28} />
            ) : (
              <TrendingDown className="text-rose-400" size={28} />
            )}
          </div>
          <div className="mt-3 text-[11px] text-slate-400 font-mono">
            Target Horizon: {currentPred.timeHorizon}
          </div>
        </div>

        {/* Confidence Score */}
        <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400">
              Confidence Score
            </span>
            <Gauge size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {currentPred.confidence}%
            </span>
            <span className="text-xs text-amber-400 font-mono font-semibold">High Conviction</span>
          </div>
          {/* Progress Meter Bar */}
          <div className="mt-3 w-full bg-[#070b16] h-2 rounded-full overflow-hidden border border-[#162444]">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${currentPred.confidence}%` }}
            />
          </div>
        </div>

        {/* Projected Price Target */}
        <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400">
              5D Price Target
            </span>
            <Target size={16} className="text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold font-mono text-white">
              ₹{currentPred.targetPrice.toFixed(2)}
            </div>
            <div
              className={`mt-1 text-xs font-mono font-semibold ${
                isBullish ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              Exp. Delta: {currentPred.expectedReturn}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            LTP: ₹{currentPred.currentPrice.toFixed(2)}
          </div>
        </div>

        {/* Support & Resistance Bands */}
        <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400">
            Key Pivot Bands
          </span>
          <div className="mt-2 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Resistance (R1):</span>
              <span className="text-rose-400 font-bold">₹{currentPred.resistance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Support (S1):</span>
              <span className="text-emerald-400 font-bold">₹{currentPred.support.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#162444] text-[10px] text-slate-400 font-mono flex justify-between">
            <span>Sentiment Index:</span>
            <span className="text-slate-200">{currentPred.sentimentScore}</span>
          </div>
        </div>
      </div>

      {/* 3. Detailed Model Interpretation & Indicator Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Indicator & Signal Breakdown */}
        <div className="lg:col-span-2 bg-[#0b1222] border border-[#162444] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Indicator Divergence Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-factor inputs processed by the inference engine for {selectedTicker}.
              </p>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
              {currentPred.primaryModel}
            </span>
          </div>

          <div className="space-y-3">
            {currentPred.signalsBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#070b16] border border-[#162444] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">{item.metric}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.state}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {item.value}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      item.isBull
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {item.isBull ? "BULL" : "BEAR"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Model Feature Weights & Execution Action */}
        <div className="bg-[#0b1222] border border-[#162444] rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders size={16} className="text-blue-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Feature Importance
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Weights contributing to this forecast.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {currentPred.features.map((feat) => (
                <div key={feat.name} className="space-y-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>{feat.name}</span>
                    <span className="text-blue-400 font-bold">{feat.weight}%</span>
                  </div>
                  <div className="w-full bg-[#070b16] h-1.5 rounded-full overflow-hidden border border-[#162444]">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${feat.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Execution Card */}
          <div className="pt-4 border-t border-[#162444] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Model Backtest Acc:</span>
              <span className="text-emerald-400 font-bold">{currentPred.modelAccuracy}</span>
            </div>

            <Link
              to="/trading"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold font-mono flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
            >
              Route Prediction Order <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}