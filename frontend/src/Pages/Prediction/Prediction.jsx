import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Database,
  Layers,
  Loader2,
  Minus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getPrediction,
  searchStocks,
  getPredictionHistory,
  getPredictionPerformance,
  verifyPredictionHistory,
} from "../../services/predictionService";


// ============================================================
// TIMEFRAMES
// ============================================================

const TIMEFRAMES = [
  { value: "1d",  label: "1 Day",   description: "Daily signals" },
  { value: "1wk", label: "1 Week",  description: "Weekly signals" },
  { value: "1mo", label: "1 Month", description: "Monthly signals" },
];


// ============================================================
// DEFAULT STOCK
// ============================================================

const DEFAULT_STOCK = {
  symbol: "TCS.NS",
  name: "Tata Consultancy Services Limited",
  short_name: "TCS",
  exchange: "NSI",
  exchange_display: "NSE",
  quote_type: "EQUITY",
};


// ============================================================
// FORMAT HELPERS
// ============================================================

const formatPrice = (price) => {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return "--";
  return `\u20B9${Number(price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "--";
  const n = Number(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
};

const formatTime = (date) => {
  if (!date) return "--";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDate = (str) => {
  if (!str) return "--";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


// ============================================================
// DIRECTION CONFIG
// ============================================================

const DIRECTION_CONFIG = {
  UP: {
    icon: TrendingUp,
    textClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
    barClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    fill: "#10b981",
    darkGrad: "#064e3b, #065f46",
    darkGlow: "rgba(16,185,129,0.25)",
    signalLabel: "Bullish signal",
  },
  DOWN: {
    icon: TrendingDown,
    textClass: "text-red-600",
    bgClass: "bg-red-50",
    barClass: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    fill: "#ef4444",
    darkGrad: "#450a0a, #7f1d1d",
    darkGlow: "rgba(239,68,68,0.25)",
    signalLabel: "Bearish signal",
  },
  HOLD: {
    icon: Minus,
    textClass: "text-amber-600",
    bgClass: "bg-amber-50",
    barClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    fill: "#f59e0b",
    darkGrad: "#451a03, #78350f",
    darkGlow: "rgba(245,158,11,0.25)",
    signalLabel: "Neutral signal",
  },
};

const DEFAULT_DIR = {
  icon: Minus,
  textClass: "text-slate-400",
  bgClass: "bg-slate-50",
  barClass: "bg-slate-300",
  badgeClass: "bg-slate-50 text-slate-500 border-slate-200",
  fill: "#94a3b8",
  darkGrad: "#1e293b, #334155",
  darkGlow: "rgba(148,163,184,0.15)",
  signalLabel: "No signal",
};


// ============================================================
// COMPONENT: Prediction
// ============================================================

const Prediction = () => {

  const [selectedStock, setSelectedStock] = useState(DEFAULT_STOCK);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [timeframe, setTimeframe]         = useState("1d");
  const [timeframeOpen, setTimeframeOpen] = useState(false);
  const [prediction, setPrediction]       = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [modelStatus, setModelStatus]     = useState("");
  const [predictionHistory, setPredictionHistory]         = useState([]);
  const [predictionPerformance, setPredictionPerformance] = useState(null);
  const [historyLoading, setHistoryLoading]               = useState(false);
  const [verifyLoading, setVerifyLoading]                 = useState(false);
  const [historyError, setHistoryError]                   = useState("");
  const [animKey, setAnimKey]             = useState(0);

  const searchTimeoutRef = useRef(null);
  const trainingPollRef  = useRef(null);


  // Search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); setSearchLoading(false); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await searchStocks(q, 10);
        setSearchResults(data.results || []);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 350);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setSearchQuery(""); setSearchResults([]);
    setSearchOpen(false); setPrediction(null);
    setError(""); setModelStatus("");
  };

  const clearSearch = () => { setSearchQuery(""); setSearchResults([]); };


  // Fetch prediction
  const fetchPrediction = useCallback(async () => {
    if (!selectedStock?.symbol) return;
    setLoading(true); setError("");
    try {
      const data = await getPrediction(selectedStock.symbol, timeframe);
      if (data.status === "QUEUED" || data.status === "TRAINING") {
        setPrediction(null); setModelStatus("TRAINING"); return;
      }
      if (data.status === "FAILED") {
        setModelStatus("FAILED");
        setError(data.error || data.message || "AI model training failed.");
        return;
      }
      if (data.success === true && data.status === "READY") {
        setPrediction(data); setModelStatus("READY");
        setLastUpdated(new Date()); setAnimKey((k) => k + 1);
      }
    } catch (e) { setError(e.message || "Failed to load prediction."); }
    finally { setLoading(false); }
  }, [selectedStock, timeframe]);

  useEffect(() => { fetchPrediction(); }, [fetchPrediction]);

  // Poll during training
  useEffect(() => {
    if (modelStatus !== "TRAINING") return;
    if (trainingPollRef.current) clearInterval(trainingPollRef.current);
    trainingPollRef.current = setInterval(() => { fetchPrediction(); }, 5000);
    return () => { if (trainingPollRef.current) clearInterval(trainingPollRef.current); };
  }, [modelStatus, fetchPrediction]);


  // Fetch history & performance
  const fetchPredictionHistory = useCallback(async () => {
    if (!selectedStock?.symbol) return;
    setHistoryLoading(true); setHistoryError("");
    try {
      const [histData, perfData] = await Promise.all([
        getPredictionHistory(selectedStock.symbol, timeframe, 50),
        getPredictionPerformance(selectedStock.symbol, timeframe),
      ]);
      setPredictionHistory(histData.results || []);
      setPredictionPerformance(perfData || null);
    } catch (e) {
      setHistoryError(e.message || "Unable to load prediction history.");
    } finally { setHistoryLoading(false); }
  }, [selectedStock, timeframe]);

  useEffect(() => { fetchPredictionHistory(); }, [fetchPredictionHistory]);


  // Verify
  const handleVerifyPredictions = async () => {
    if (!selectedStock?.symbol) return;
    setVerifyLoading(true); setHistoryError("");
    try {
      await verifyPredictionHistory(selectedStock.symbol, timeframe);
      await fetchPredictionHistory();
    } catch (e) {
      setHistoryError(e.message || "Failed to verify prediction history.");
    } finally { setVerifyLoading(false); }
  };


  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (trainingPollRef.current)  clearInterval(trainingPollRef.current);
    };
  }, []);


  const dirConf = prediction
    ? (DIRECTION_CONFIG[prediction.prediction] || DEFAULT_DIR)
    : DEFAULT_DIR;

  const pendingCount = predictionHistory.filter(
    (h) => h.is_correct === null || h.is_correct === undefined
  ).length;

  const timeframeCurrent = TIMEFRAMES.find((t) => t.value === timeframe);


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="min-h-screen" style={{ background: "var(--qn-bg)" }}>

      {/* =======================================================
          HEADER
      ======================================================= */}
      <div
        className="relative z-30"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 42%, #1e40af 72%, #0c4a6e 100%)" }}
      >
        {/* decorative orbs clipped to banner */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.55) 0%, transparent 68%)", opacity: 0.22 }} />
          <div className="absolute top-8 left-1/3 w-60 h-60 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.45) 0%, transparent 68%)", opacity: 0.12 }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 pb-10">

          {/* Title row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(139,92,246,0.9) 100%)",
                  boxShadow: "0 8px 32px rgba(99,102,241,0.40), inset 0 1px 0 rgba(255,255,255,0.20)",
                }}>
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    AI Market Analytics
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-violet-200 tracking-widest uppercase"
                    style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.40)" }}>
                    <Sparkles className="w-3 h-3" /> XGBoost
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-0.5">
                  Real-time AI prediction &middot; {selectedStock.short_name || selectedStock.symbol}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">

              {/* Stock Search */}
              <div className="relative w-full sm:w-72">
                <div className={`flex items-center rounded-xl transition-all ${searchOpen ? "ring-2 ring-violet-400/60" : "ring-1 ring-white/20"}`}
                  style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
                  <Search className="w-4 h-4 text-slate-300 ml-3.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchOpen ? searchQuery : (selectedStock.short_name || selectedStock.symbol)}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); setTimeframeOpen(false); }}
                    onFocus={() => { setSearchOpen(true); setTimeframeOpen(false); }}
                    placeholder="Search stocks..."
                    className="w-full px-3 py-3 bg-transparent text-sm font-medium text-white placeholder-slate-400 outline-none"
                  />
                  {searchQuery && (
                    <button type="button" onClick={clearSearch} className="p-1 mr-1 rounded hover:bg-white/10">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                  <button type="button" onClick={() => { setSearchOpen(!searchOpen); setTimeframeOpen(false); }} className="p-3">
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${searchOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {searchOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xs text-slate-400">Search by company name or symbol</p>
                      </div>
                      {searchLoading && (
                        <div className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                        </div>
                      )}
                      {!searchLoading && searchQuery.trim() && searchResults.length > 0 && (
                        <div className="max-h-72 overflow-y-auto">
                          {searchResults.map((stock) => (
                            <button key={`${stock.symbol}-${stock.exchange}`} type="button"
                              onClick={() => handleSelectStock(stock)}
                              className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-b-0 transition">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-800 truncate">{stock.short_name || stock.name}</p>
                                  <p className="text-xs text-slate-500 mt-0.5 truncate">{stock.symbol}</p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{stock.exchange_display || stock.exchange || "Market"}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{stock.quote_type}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <Search className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-sm font-medium text-slate-600 mt-3">No stocks found</p>
                          <p className="text-xs text-slate-400 mt-1">Try another company name or symbol</p>
                        </div>
                      )}
                      {!searchQuery.trim() && (
                        <div className="px-4 py-6 text-center">
                          <Search className="w-7 h-7 mx-auto text-slate-300" />
                          <p className="text-sm text-slate-500 mt-2">Start typing to search</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Timeframe */}
              <div className="relative">
                <button type="button" onClick={() => { setTimeframeOpen(!timeframeOpen); setSearchOpen(false); }}
                  className="flex items-center justify-between gap-6 w-full sm:w-36 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <span>{timeframeCurrent?.label}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${timeframeOpen ? "rotate-180" : ""}`} />
                </button>
                {timeframeOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setTimeframeOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {TIMEFRAMES.map((item) => (
                        <button key={item.value} type="button"
                          onClick={() => { setTimeframe(item.value); setTimeframeOpen(false); setPrediction(null); }}
                          className={`w-full text-left px-4 py-3 text-sm transition ${timeframe === item.value ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>
                          <div className="font-semibold">{item.label}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Predict button */}
              <button type="button" onClick={fetchPrediction} disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)", boxShadow: "0 4px 14px rgba(109,40,217,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Predict
              </button>

            </div>
          </div>


          {/* Chips row */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Chip icon={<Database className="w-3 h-3" />} text={selectedStock.exchange_display || selectedStock.exchange} />
            <Chip icon={<Layers className="w-3 h-3" />} text={selectedStock.quote_type} />
            <Chip icon={<Cpu className="w-3 h-3" />} text="XGBoost Classifier" />
            {lastUpdated && (
              <Chip
                icon={<Activity className="w-3 h-3" />}
                text={`Updated ${formatTime(lastUpdated)}`}
                color="rgba(16,185,129,0.12)"
                border="rgba(16,185,129,0.25)"
                textColor="text-emerald-300"
              />
            )}
            {modelStatus === "TRAINING" && (
              <Chip
                icon={<Loader2 className="w-3 h-3 animate-spin" />}
                text="Training model..."
                color="rgba(245,158,11,0.12)"
                border="rgba(245,158,11,0.25)"
                textColor="text-amber-300"
              />
            )}
          </div>

        </div>
      </div>


      {/* =======================================================
          BODY
      ======================================================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-7 space-y-6">

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.20)" }}>
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Prediction Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Training */}
        {modelStatus === "TRAINING" && !prediction && (
          <div className="rounded-3xl p-12 md:p-16 text-center"
            style={{ background: "var(--qn-surface)", border: "1px solid var(--qn-border)", boxShadow: "0 4px 24px rgba(79,70,229,0.06)" }}>
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.08)" }}>
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-900">Preparing AI Model</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              QuantNova is training an XGBoost model for{" "}
              <strong className="text-slate-700">{selectedStock.symbol}</strong> on the{" "}
              <strong className="text-slate-700">{timeframeCurrent?.label}</strong> timeframe.
              This only happens once per stock/timeframe.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Activity className="w-4 h-4" />
              Training in background — polling every 5 seconds...
            </div>
          </div>
        )}

        {/* Empty */}
        {!prediction && modelStatus !== "TRAINING" && !error && (
          <div className="rounded-3xl p-12 text-center"
            style={{ background: "var(--qn-surface)", border: "1px solid var(--qn-border)" }}>
            <Brain className="w-12 h-12 mx-auto text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-700">
              {loading ? "Loading AI prediction..." : "Ready for prediction"}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              {loading
                ? "Fetching market data and running the model..."
                : `Click Predict to run the AI model for ${selectedStock.short_name || selectedStock.symbol}`}
            </p>
          </div>
        )}

        {/* PREDICTION DASHBOARD */}
        {prediction && (
          <div key={animKey} className="space-y-6 animate-fade-up">

            {/* Row 1: Main prediction + Price + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Main prediction card (dark gradient) */}
              <div className="lg:col-span-1 rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${dirConf.darkGrad})`,
                  boxShadow: `0 8px 40px ${dirConf.darkGlow}`,
                }}>
                {/* bg orb */}
                <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${dirConf.fill} 0%, transparent 68%)`, opacity: 0.22 }} />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">AI Direction</span>
                  </div>
                  <div className="text-6xl font-black text-white tracking-tight leading-none">
                    {prediction.prediction}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {prediction.prediction === "UP"   && <TrendingUp   className="w-5 h-5 text-emerald-300" />}
                    {prediction.prediction === "DOWN" && <TrendingDown  className="w-5 h-5 text-red-300" />}
                    {prediction.prediction === "HOLD" && <Minus         className="w-5 h-5 text-amber-300" />}
                    <span className="text-sm text-white/70">{dirConf.signalLabel}</span>
                  </div>
                </div>

                <div className="relative mt-7 pt-7 border-t border-white/10">
                  <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Model Confidence</p>
                  <div className="text-3xl font-bold text-white">{prediction.probability_percent}%</div>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${prediction.probability_percent}%`, background: "rgba(255,255,255,0.55)" }} />
                  </div>
                </div>
              </div>

              {/* Price + timestamp */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="qn-card flex-1 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Price</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{formatPrice(prediction.current_price)}</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(79,70,229,0.07)" }}>
                      <Activity className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-400">Today's Change</p>
                    <span className={`flex items-center gap-1 text-lg font-bold ${Number(prediction.daily_change_percent) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {Number(prediction.daily_change_percent) >= 0
                        ? <ArrowUpRight className="w-5 h-5" />
                        : <ArrowDownRight className="w-5 h-5" />}
                      {formatPercent(prediction.daily_change_percent)}
                    </span>
                  </div>
                </div>
                <div className="qn-card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(79,70,229,0.07)" }}>
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Data As Of</p>
                    <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">
                      {prediction.prediction_time
                        ? new Date(prediction.prediction_time).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "--"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence donut */}
              <div className="lg:col-span-1 qn-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-slate-900">Confidence Breakdown</h2>
                    <p className="text-xs text-slate-400 mt-0.5">XGBoost class probabilities</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-indigo-600"
                    style={{ background: "rgba(79,70,229,0.07)" }}>Live</span>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "UP",   value: Number((prediction.probabilities?.UP   || 0) * 100) },
                          { name: "HOLD", value: Number((prediction.probabilities?.HOLD || 0) * 100) },
                          { name: "DOWN", value: Number((prediction.probabilities?.DOWN || 0) * 100) },
                        ]}
                        cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                        dataKey="value" paddingAngle={3} strokeWidth={0}
                      >
                        <Cell key="UP"   fill="#10b981" />
                        <Cell key="HOLD" fill="#f59e0b" />
                        <Cell key="DOWN" fill="#ef4444" />
                      </Pie>
                      <Tooltip
                        formatter={(v) => [`${Number(v).toFixed(2)}%`, ""]}
                        contentStyle={{ background: "#1e293b", border: "none", borderRadius: "12px", color: "#f1f5f9", fontSize: "12px", fontWeight: 600 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 mt-2">
                  {[
                    { dir: "UP",   conf: DIRECTION_CONFIG.UP },
                    { dir: "HOLD", conf: DIRECTION_CONFIG.HOLD },
                    { dir: "DOWN", conf: DIRECTION_CONFIG.DOWN },
                  ].map(({ dir, conf }) => {
                    const val = Number((prediction.probabilities?.[dir] || 0) * 100);
                    const Icon = conf.icon;
                    return (
                      <div key={dir} className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${conf.textClass}`} />
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${conf.barClass} transition-all duration-700`}
                            style={{ width: `${Math.min(100, val)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-12 text-right tabular-nums">{val.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>


            {/* Row 2: Performance metrics */}
            <PerformanceMetricsRow
              predictionPerformance={predictionPerformance}
              predictionHistory={predictionHistory}
            />


            {/* Row 3: Per-direction accuracy */}
            {predictionPerformance?.by_direction && predictionPerformance.total_predictions > 0 && (
              <PerDirectionAccuracy byDirection={predictionPerformance.by_direction} />
            )}


            {/* Disclaimer */}
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: "rgba(79,70,229,0.035)", border: "1px solid rgba(79,70,229,0.10)" }}>
              <Shield className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-500 leading-5">
                <strong className="text-slate-600">Disclaimer:</strong>{" "}
                Predictions are generated by an experimental XGBoost model using historical market data and
                technical features. Model probabilities are not guarantees of future price movement.
                Do not use as sole basis for investment decisions.
              </p>
            </div>

          </div>
        )}


        {/* =======================================================
            PREDICTION HISTORY
        ======================================================= */}
        <PredictionHistoryTable
          fetchPredictionHistory={fetchPredictionHistory}
          historyLoading={historyLoading}
          verifyLoading={verifyLoading}
          handleVerifyPredictions={handleVerifyPredictions}
          predictionHistory={predictionHistory}
          historyError={historyError}
          pendingCount={pendingCount}
        />

      </div>
    </div>
  );
};


// ============================================================
// CHIP
// ============================================================

const Chip = ({
  icon,
  text,
  color = "rgba(255,255,255,0.08)",
  border = "rgba(255,255,255,0.12)",
  textColor = "text-slate-200",
}) => (
  <span
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${textColor}`}
    style={{ background: color, border: `1px solid ${border}` }}
  >
    {icon}{text}
  </span>
);


// ============================================================
// PERFORMANCE METRICS ROW
// ============================================================

const MetricCard = ({ icon: Icon, iconColor, iconBg, title, value, subtitle, accentBorder }) => (
  <div className="qn-card p-5 flex flex-col" style={accentBorder ? { borderColor: accentBorder } : {}}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{title}</p>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
    </div>
    <p className="text-2xl font-black text-slate-900 tracking-tight animate-count-up">{value}</p>
    <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
  </div>
);

const PerformanceMetricsRow = ({ predictionPerformance, predictionHistory }) => {
  const total    = predictionHistory.length;
  const verified = predictionPerformance?.total_predictions   ?? 0;
  const correct  = predictionPerformance?.correct_predictions ?? 0;
  const accuracy = predictionPerformance?.accuracy;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        icon={Database} iconColor="text-indigo-600" iconBg="rgba(79,70,229,0.07)"
        title="Total Predictions" value={total} subtitle="All saved predictions"
      />
      <MetricCard
        icon={Target} iconColor="text-violet-600" iconBg="rgba(139,92,246,0.07)"
        title="Verified" value={verified} subtitle="Outcome confirmed"
      />
      <MetricCard
        icon={CheckCircle2} iconColor="text-emerald-600" iconBg="rgba(16,185,129,0.07)"
        title="Correct" value={correct} subtitle="Accurate predictions"
        accentBorder="rgba(16,185,129,0.22)"
      />
      <MetricCard
        icon={Zap} iconColor="text-amber-600" iconBg="rgba(245,158,11,0.07)"
        title="Accuracy"
        value={accuracy != null ? `${Number(accuracy).toFixed(1)}%` : "--"}
        subtitle={verified > 0 ? `Over ${verified} verified` : "No verified data"}
        accentBorder={
          accuracy != null
            ? accuracy >= 60 ? "rgba(16,185,129,0.22)"
              : accuracy >= 45 ? "rgba(245,158,11,0.22)"
              : "rgba(239,68,68,0.22)"
            : undefined
        }
      />
    </div>
  );
};


// ============================================================
// PER-DIRECTION ACCURACY
// ============================================================

const PerDirectionAccuracy = ({ byDirection }) => (
  <div className="rounded-3xl p-6 md:p-7"
    style={{ background: "var(--qn-surface)", border: "1px solid var(--qn-border)" }}>
    <div className="flex items-center gap-2 mb-5">
      <BarChart3 className="w-5 h-5 text-indigo-500" />
      <div>
        <h2 className="font-bold text-slate-900">Per-Direction Accuracy</h2>
        <p className="text-xs text-slate-400 mt-0.5">Breakdown of model accuracy by prediction class</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {["UP", "HOLD", "DOWN"].map((dir) => {
        const conf  = DIRECTION_CONFIG[dir];
        const Icon  = conf.icon;
        const stats = byDirection?.[dir] || { total: 0, correct: 0, accuracy: null };
        const pct   = stats.accuracy ?? 0;
        return (
          <div key={dir} className="rounded-2xl p-4"
            style={{ background: "var(--qn-surface-2)", border: "1px solid var(--qn-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}>
                  <Icon className={`w-4 h-4 ${conf.textClass}`} />
                </div>
                <span className="font-bold text-slate-800">{dir}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                stats.total > 0 ? conf.badgeClass : "bg-slate-100 text-slate-400 border-slate-200"
              }`}>
                {stats.total} predictions
              </span>
            </div>
            <div>
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-xs text-slate-400">Accuracy</span>
                <span className={`text-xl font-black ${
                  stats.accuracy != null ? conf.textClass : "text-slate-300"
                }`}>
                  {stats.accuracy != null ? `${Number(stats.accuracy).toFixed(1)}%` : "--"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${conf.barClass} transition-all duration-700`}
                  style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>{stats.correct} correct</span>
                <span>{stats.total - stats.correct} wrong</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);


// ============================================================
// PREDICTION HISTORY TABLE
// ============================================================

const PredictionHistoryTable = ({
  fetchPredictionHistory,
  historyLoading,
  verifyLoading,
  handleVerifyPredictions,
  predictionHistory,
  historyError,
  pendingCount,
}) => (
  <div className="rounded-3xl overflow-hidden"
    style={{ background: "var(--qn-surface)", border: "1px solid var(--qn-border)" }}>

    {/* Header */}
    <div className="px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      style={{ borderColor: "var(--qn-border)" }}>
      <div>
        <h2 className="text-xl font-bold text-slate-900">Prediction History</h2>
        <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
          Historical AI predictions and their verified outcomes
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-200">
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={fetchPredictionHistory} disabled={historyLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 transition border hover:bg-slate-50 disabled:opacity-50"
          style={{ border: "1px solid var(--qn-border)" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <button type="button" onClick={handleVerifyPredictions} disabled={verifyLoading || historyLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)", color: "#fff", boxShadow: "0 4px 12px rgba(79,70,229,0.25)" }}>
          <CheckCircle2 className={`w-3.5 h-3.5 ${verifyLoading ? "animate-spin" : ""}`} />
          {verifyLoading ? "Verifying..." : "Verify Outcomes"}
        </button>
      </div>
    </div>

    {/* Error */}
    {historyError && (
      <div className="m-5 p-4 rounded-xl flex items-center gap-3"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-sm text-red-700">{historyError}</p>
      </div>
    )}

    {/* Loading */}
    {historyLoading && predictionHistory.length === 0 && (
      <div className="py-16 flex justify-center items-center gap-3 text-sm text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading prediction history...
      </div>
    )}

    {/* Empty */}
    {!historyLoading && predictionHistory.length === 0 && !historyError && (
      <div className="py-16 text-center">
        <Clock className="w-10 h-10 mx-auto text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-600">No prediction history yet</p>
        <p className="mt-1 text-xs text-slate-400">Predictions will appear here automatically after running the AI model.</p>
      </div>
    )}

    {/* Table */}
    {predictionHistory.length > 0 && (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--qn-surface-2)", borderBottom: "1px solid var(--qn-border)" }}>
              {["Date", "Prediction", "Confidence", "Entry Price", "Actual Price", "Return", "Result"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {predictionHistory.map((item, idx) => {
              const predDir = item.prediction;
              const conf    = DIRECTION_CONFIG[predDir] || DEFAULT_DIR;
              const actConf = item.actual_direction ? (DIRECTION_CONFIG[item.actual_direction] || DEFAULT_DIR) : null;
              const result  = item.is_correct;
              const prob    = item.probability != null ? (Number(item.probability) * 100).toFixed(1) : null;

              return (
                <tr key={item.id}
                  className="border-b transition-colors hover:bg-slate-50/60"
                  style={{ borderColor: "var(--qn-border)" }}>

                  {/* Date */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="font-semibold text-slate-700">{formatDate(item.prediction_time)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.timeframe?.toUpperCase() || "--"}</p>
                  </td>

                  {/* Prediction badge */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${conf.badgeClass}`}>
                      {predDir}
                    </span>
                  </td>

                  {/* Confidence bar */}
                  <td className="px-5 py-4">
                    {prob != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${conf.barClass}`}
                            style={{ width: `${Math.min(100, Number(prob))}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 tabular-nums">{prob}%</span>
                      </div>
                    ) : <span className="text-slate-300">--</span>}
                  </td>

                  {/* Entry price */}
                  <td className="px-5 py-4 font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                    {item.prediction_price != null ? formatPrice(item.prediction_price) : "--"}
                  </td>

                  {/* Actual price */}
                  <td className="px-5 py-4 font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                    {item.actual_price != null
                      ? formatPrice(item.actual_price)
                      : <span className="text-slate-300 font-normal">Pending</span>}
                  </td>

                  {/* Actual direction + return */}
                  <td className="px-5 py-4">
                    {item.actual_direction ? (
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-bold text-xs ${actConf?.textClass || "text-slate-500"}`}>
                          {item.actual_direction}
                        </span>
                        {item.actual_return_percent != null && (
                          <span className={`text-[11px] font-semibold tabular-nums ${Number(item.actual_return_percent) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {formatPercent(item.actual_return_percent)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">Pending</span>
                    )}
                  </td>

                  {/* Result badge */}
                  <td className="px-5 py-4">
                    {result === true ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : result === false ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                        <X className="w-3.5 h-3.5" /> Wrong
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}

  </div>
);


export default Prediction;
