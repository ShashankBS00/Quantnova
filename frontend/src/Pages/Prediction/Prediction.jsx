import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Activity,
  Brain,
  ChevronDown,
  Clock,
  Loader2,
  Minus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import {
  getPrediction,
  searchStocks,
} from "../../services/predictionService";


// ============================================================
// TIMEFRAMES
// ============================================================

const TIMEFRAMES = [
  {
    value: "1d",
    label: "1 Day",
  },
  {
    value: "1wk",
    label: "1 Week",
  },
  {
    value: "1mo",
    label: "1 Month",
  },
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
// COMPONENT
// ============================================================

const Prediction = () => {

  // ----------------------------------------------------------
  // STOCK
  // ----------------------------------------------------------

  const [selectedStock, setSelectedStock] =
    useState(DEFAULT_STOCK);


  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchResults, setSearchResults] =
    useState([]);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);


  // ----------------------------------------------------------
  // TIMEFRAME
  // ----------------------------------------------------------

  const [timeframe, setTimeframe] =
    useState("1d");

  const [timeframeOpen, setTimeframeOpen] =
    useState(false);


  // ----------------------------------------------------------
  // PREDICTION
  // ----------------------------------------------------------

  const [prediction, setPrediction] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);


  // ----------------------------------------------------------
  // MODEL TRAINING
  // ----------------------------------------------------------

  const [modelStatus, setModelStatus] =
    useState("");


  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const searchTimeoutRef =
    useRef(null);

  const trainingPollRef =
    useRef(null);


  // ==========================================================
  // SEARCH STOCKS
  // ==========================================================

  useEffect(() => {

    if (searchTimeoutRef.current) {

      clearTimeout(
        searchTimeoutRef.current
      );
    }


    const query =
      searchQuery.trim();


    if (!query) {

      setSearchResults([]);
      setSearchLoading(false);

      return;
    }


    searchTimeoutRef.current =
      setTimeout(
        async () => {

          setSearchLoading(true);

          try {

            const data =
              await searchStocks(
                query,
                10
              );

            setSearchResults(
              data.results || []
            );

          } catch (searchError) {

            console.error(
              "Search error:",
              searchError
            );

            setSearchResults([]);

          } finally {

            setSearchLoading(false);

          }

        },
        350
      );


    return () => {

      if (
        searchTimeoutRef.current
      ) {

        clearTimeout(
          searchTimeoutRef.current
        );

      }

    };

  }, [searchQuery]);


  // ==========================================================
  // SELECT STOCK
  // ==========================================================

  const handleSelectStock = (
    stock
  ) => {

    setSelectedStock(stock);

    setSearchQuery("");

    setSearchResults([]);

    setSearchOpen(false);

    setPrediction(null);

    setError("");

    setModelStatus("");
  };


  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  const clearSearch = () => {

    setSearchQuery("");

    setSearchResults([]);

  };


  // ==========================================================
  // FETCH PREDICTION
  // ==========================================================

  const fetchPrediction =
    useCallback(
      async () => {

        if (
          !selectedStock?.symbol
        ) {
          return;
        }


        setLoading(true);

        setError("");

        try {

          const data =
            await getPrediction(
              selectedStock.symbol,
              timeframe
            );


          // --------------------------------------------------
          // Model training
          // --------------------------------------------------

          if (
            data.status ===
              "QUEUED" ||
            data.status ===
              "TRAINING"
          ) {

            setPrediction(null);

            setModelStatus(
              "TRAINING"
            );

            return;
          }


          // --------------------------------------------------
          // Failed training
          // --------------------------------------------------

          if (
            data.status ===
            "FAILED"
          ) {

            setModelStatus(
              "FAILED"
            );

            setError(
              data.error ||
              data.message ||
              "AI model training failed."
            );

            return;
          }


          // --------------------------------------------------
          // Prediction ready
          // --------------------------------------------------

          if (
            data.success === true &&
            data.status ===
              "READY"
          ) {

            setPrediction(data);

            setModelStatus(
              "READY"
            );

            setLastUpdated(
              new Date()
            );

          }

        } catch (predictionError) {

          console.error(
            "Prediction error:",
            predictionError
          );

          setError(
            predictionError.message ||
            "Failed to load prediction."
          );

        } finally {

          setLoading(false);

        }

      },
      [
        selectedStock,
        timeframe,
      ]
    );


  // ==========================================================
  // INITIAL / STOCK / TIMEFRAME LOAD
  // ==========================================================

  useEffect(() => {

    fetchPrediction();

  }, [fetchPrediction]);


  // ==========================================================
  // TRAINING POLLING
  // ==========================================================

  useEffect(() => {

    if (
      modelStatus !==
      "TRAINING"
    ) {

      return;
    }


    if (
      trainingPollRef.current
    ) {

      clearInterval(
        trainingPollRef.current
      );

    }


    trainingPollRef.current =
      setInterval(
        () => {

          fetchPrediction();

        },
        5000
      );


    return () => {

      if (
        trainingPollRef.current
      ) {

        clearInterval(
          trainingPollRef.current
        );

      }

    };

  }, [
    modelStatus,
    fetchPrediction,
  ]);


  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {

    return () => {

      if (
        searchTimeoutRef.current
      ) {

        clearTimeout(
          searchTimeoutRef.current
        );

      }


      if (
        trainingPollRef.current
      ) {

        clearInterval(
          trainingPollRef.current
        );

      }

    };

  }, []);


  // ==========================================================
  // FORMAT HELPERS
  // ==========================================================

  const formatPrice = (
    price
  ) => {

    if (
      price === null ||
      price === undefined ||
      Number.isNaN(
        Number(price)
      )
    ) {

      return "--";
    }


    return `₹${Number(
      price
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  };


  const formatPercent = (
    value
  ) => {

    if (
      value === null ||
      value === undefined ||
      Number.isNaN(
        Number(value)
      )
    ) {

      return "--";
    }


    const number =
      Number(value);


    return `${
      number >= 0
        ? "+"
        : ""
    }${number.toFixed(2)}%`;

  };


  const formatTime = (
    date
  ) => {

    if (!date) {

      return "--";
    }


    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );

  };


  // ==========================================================
  // PREDICTION UI HELPERS
  // ==========================================================

  const getPredictionColor =
    () => {

      if (!prediction) {
        return "text-slate-600";
      }


      switch (
        prediction.prediction
      ) {

        case "UP":
          return "text-emerald-600";

        case "DOWN":
          return "text-red-600";

        case "HOLD":
          return "text-amber-600";

        default:
          return "text-slate-600";

      }

    };


  const getPredictionBackground =
    () => {

      if (!prediction) {
        return "bg-slate-50";
      }


      switch (
        prediction.prediction
      ) {

        case "UP":
          return "bg-emerald-50";

        case "DOWN":
          return "bg-red-50";

        case "HOLD":
          return "bg-amber-50";

        default:
          return "bg-slate-50";

      }

    };


  const getPredictionIcon =
    () => {

      if (!prediction) {

        return (
          <Minus className="w-10 h-10" />
        );

      }


      switch (
        prediction.prediction
      ) {

        case "UP":

          return (
            <TrendingUp
              className="w-10 h-10"
            />
          );

        case "DOWN":

          return (
            <TrendingDown
              className="w-10 h-10"
            />
          );

        default:

          return (
            <Minus
              className="w-10 h-10"
            />
          );

      }

    };


  const getProbability = (
    direction
  ) => {

    if (
      !prediction?.probabilities
    ) {

      return 0;
    }


    return (
      Number(
        prediction.probabilities[
          direction
        ]
      ) * 100
    );

  };


  // ==========================================================
  // TRAINING SCREEN
  // ==========================================================

  const renderTrainingState =
    () => (

      <div className="bg-white rounded-3xl border border-slate-200 p-12 md:p-16 text-center">

        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center">

          <Loader2
            className="w-8 h-8 text-indigo-600 animate-spin"
          />

        </div>


        <h2 className="mt-6 text-xl font-bold text-slate-900">

          Preparing AI Model

        </h2>


        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">

          QuantNova is training an AI model
          for{" "}

          <span className="font-semibold text-slate-700">

            {selectedStock.symbol}

          </span>

          . This only needs to happen
          the first time for this stock
          and timeframe.

        </p>


        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">

          <Activity className="w-4 h-4" />

          Training in background...

        </div>

      </div>

    );


  // ==========================================================
  // MAIN RENDER
  // ==========================================================

  return (

    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      <div className="max-w-7xl mx-auto">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">


          {/* TITLE */}

          <div>

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">

                <Brain
                  className="w-6 h-6 text-white"
                />

              </div>


              <div>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">

                  AI Market Prediction

                </h1>


                <p className="text-sm text-slate-500 mt-1">

                  XGBoost-powered market direction analysis

                </p>

              </div>

            </div>

          </div>


          {/* CONTROLS */}

          <div className="flex flex-col sm:flex-row gap-3">


            {/* ==============================================
                SEARCHABLE STOCK SELECTOR
            ============================================== */}

            <div className="relative w-full sm:w-80">

              <div
                className={`flex items-center bg-white border rounded-xl transition ${
                  searchOpen
                    ? "border-indigo-500 ring-2 ring-indigo-100"
                    : "border-slate-200"
                }`}
              >

                <Search
                  className="w-4 h-4 text-slate-400 ml-4 flex-shrink-0"
                />


                <input
                  type="text"
                  value={
                    searchOpen
                      ? searchQuery
                      : selectedStock.short_name ||
                        selectedStock.symbol
                  }
                  onChange={(event) => {

                    setSearchQuery(
                      event.target.value
                    );

                    setSearchOpen(
                      true
                    );

                  }}
                  onFocus={() => {

                    setSearchOpen(
                      true
                    );

                  }}
                  placeholder="Search stocks..."
                  className="w-full px-3 py-3 bg-transparent text-sm font-medium text-slate-700 outline-none"
                />


                {searchQuery && (
                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    className="p-1 mr-1 rounded hover:bg-slate-100"
                  >

                    <X
                      className="w-4 h-4 text-slate-400"
                    />

                  </button>
                )}


                <button
                  type="button"
                  onClick={() =>
                    setSearchOpen(
                      !searchOpen
                    )
                  }
                  className="p-3"
                >

                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      searchOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />

                </button>

              </div>


              {/* ============================================
                  SEARCH RESULTS
              ============================================ */}

              {searchOpen && (

                <>

                  <div
                    className="fixed inset-0 z-10"
                    onClick={() =>
                      setSearchOpen(
                        false
                      )
                    }
                  />


                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">


                    {/* SEARCH INPUT HINT */}

                    <div className="px-4 py-3 border-b border-slate-100">

                      <p className="text-xs text-slate-400">

                        Search by company name or symbol

                      </p>

                    </div>


                    {/* LOADING */}

                    {searchLoading && (

                      <div className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-slate-500">

                        <Loader2
                          className="w-4 h-4 animate-spin"
                        />

                        Searching...

                      </div>

                    )}


                    {/* RESULTS */}

                    {!searchLoading &&
                      searchQuery.trim() &&
                      searchResults.length >
                        0 && (

                        <div className="max-h-80 overflow-y-auto">

                          {searchResults.map(
                            (stock) => (

                              <button
                                key={`${stock.symbol}-${stock.exchange}`}
                                type="button"
                                onClick={() =>
                                  handleSelectStock(
                                    stock
                                  )
                                }
                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-b-0 transition"
                              >

                                <div className="flex items-center justify-between gap-3">

                                  <div className="min-w-0">

                                    <p className="font-semibold text-sm text-slate-800 truncate">

                                      {stock.short_name ||
                                        stock.name}

                                    </p>


                                    <p className="text-xs text-slate-500 mt-1 truncate">

                                      {stock.symbol}

                                    </p>

                                  </div>


                                  <div className="flex-shrink-0 text-right">

                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">

                                      {stock.exchange_display ||
                                        stock.exchange ||
                                        "Market"}

                                    </p>

                                    <p className="text-[10px] text-slate-400 mt-1">

                                      {stock.quote_type}

                                    </p>

                                  </div>

                                </div>

                              </button>

                            )
                          )}

                        </div>

                      )}


                    {/* NO RESULTS */}

                    {!searchLoading &&
                      searchQuery.trim() &&
                      searchResults.length ===
                        0 && (

                        <div className="px-4 py-8 text-center">

                          <Search
                            className="w-8 h-8 mx-auto text-slate-300"
                          />

                          <p className="text-sm font-medium text-slate-600 mt-3">

                            No stocks found

                          </p>

                          <p className="text-xs text-slate-400 mt-1">

                            Try another company name or symbol

                          </p>

                        </div>

                      )}


                    {/* EMPTY SEARCH */}

                    {!searchQuery.trim() && (

                      <div className="px-4 py-6 text-center">

                        <Search
                          className="w-7 h-7 mx-auto text-slate-300"
                        />

                        <p className="text-sm text-slate-500 mt-2">

                          Start typing to search

                        </p>

                      </div>

                    )}

                  </div>

                </>

              )}

            </div>


            {/* ==============================================
                TIMEFRAME
            ============================================== */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setTimeframeOpen(
                    !timeframeOpen
                  )
                }
                className="flex items-center justify-between gap-8 w-full sm:w-36 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-indigo-300 transition"
              >

                <span>

                  {
                    TIMEFRAMES.find(
                      (item) =>
                        item.value ===
                        timeframe
                    )?.label
                  }

                </span>


                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    timeframeOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />

              </button>


              {timeframeOpen && (

                <div className="absolute right-0 top-full mt-2 w-full sm:w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">

                  {TIMEFRAMES.map(
                    (item) => (

                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {

                          setTimeframe(
                            item.value
                          );

                          setTimeframeOpen(
                            false
                          );

                          setPrediction(
                            null
                          );

                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition ${
                          timeframe ===
                          item.value
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >

                        {item.label}

                      </button>

                    )
                  )}

                </div>

              )}

            </div>


            {/* ==============================================
                REFRESH
            ============================================== */}

            <button
              type="button"
              onClick={
                fetchPrediction
              }
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
            >

              {loading ? (

                <Loader2
                  className="w-4 h-4 animate-spin"
                />

              ) : (

                <RefreshCw
                  className="w-4 h-4"
                />

              )}

              Refresh

            </button>

          </div>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">

            <AlertCircle
              className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
            />

            <div>

              <p className="font-semibold text-red-800">

                Prediction Error

              </p>

              <p className="text-sm text-red-700 mt-1">

                {error}

              </p>

            </div>

          </div>

        )}


        {/* ==================================================
            TRAINING
        ================================================== */}

        {modelStatus ===
          "TRAINING" &&
          !prediction && (

            renderTrainingState()

        )}


        {/* ==================================================
            PREDICTION
        ================================================== */}

        {prediction && (

          <>

            {/* =================================================
                TOP SUMMARY
            ================================================= */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">


              {/* MAIN PREDICTION */}

              <div
                className={`lg:col-span-2 rounded-3xl border border-slate-200 p-6 md:p-8 ${getPredictionBackground()}`}
              >

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                  <div>

                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">

                      <Activity
                        className="w-4 h-4"
                      />

                      AI Direction Prediction

                    </div>


                    <div
                      className={`flex items-center gap-4 ${getPredictionColor()}`}
                    >

                      {getPredictionIcon()}


                      <div>

                        <div className="text-4xl md:text-5xl font-bold">

                          {
                            prediction.prediction
                          }

                        </div>


                        <div className="text-sm text-slate-500 mt-1">

                          Model probability

                        </div>

                      </div>

                    </div>

                  </div>


                  <div className="text-left md:text-right">

                    <div className="text-4xl font-bold text-slate-900">

                      {
                        prediction.probability_percent
                      }%

                    </div>


                    <div className="text-sm text-slate-500 mt-1">

                      Predicted class probability

                    </div>

                  </div>

                </div>

              </div>


              {/* PRICE */}

              <div className="bg-white rounded-3xl border border-slate-200 p-6">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-500">

                      Current Price

                    </p>


                    <p className="text-3xl font-bold text-slate-900 mt-2">

                      {formatPrice(
                        prediction.current_price
                      )}

                    </p>

                  </div>


                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">

                    <Activity
                      className="w-5 h-5 text-indigo-600"
                    />

                  </div>

                </div>


                <div className="mt-5 pt-5 border-t border-slate-100">

                  <p className="text-sm text-slate-500">

                    Today's Change

                  </p>


                  <p
                    className={`text-xl font-bold mt-1 ${
                      Number(
                        prediction.daily_change_percent
                      ) >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >

                    {formatPercent(
                      prediction.daily_change_percent
                    )}

                  </p>

                </div>

              </div>

            </div>


            {/* =================================================
                PROBABILITIES
            ================================================= */}

            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 mb-6">

              <div className="flex items-center justify-between mb-6">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">

                    Prediction Probabilities

                  </h2>


                  <p className="text-sm text-slate-500 mt-1">

                    XGBoost output across all three classes

                  </p>

                </div>


                <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">

                  XGBoost

                </div>

              </div>


              <div className="space-y-5">


                {/* DOWN */}

                <ProbabilityBar
                  label="DOWN"
                  value={getProbability(
                    "DOWN"
                  )}
                  icon={
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  }
                  barClass="bg-red-500"
                />


                {/* HOLD */}

                <ProbabilityBar
                  label="HOLD"
                  value={getProbability(
                    "HOLD"
                  )}
                  icon={
                    <Minus className="w-4 h-4 text-amber-500" />
                  }
                  barClass="bg-amber-500"
                />


                {/* UP */}

                <ProbabilityBar
                  label="UP"
                  value={getProbability(
                    "UP"
                  )}
                  icon={
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  }
                  barClass="bg-emerald-500"
                />

              </div>

            </div>


            {/* =================================================
                MODEL INFO
            ================================================= */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">


              <InfoCard
                title="Asset"
                value={
                  selectedStock.short_name ||
                  selectedStock.name ||
                  prediction.symbol
                }
                subtitle={
                  prediction.symbol
                }
              />


              <InfoCard
                title="Timeframe"
                value={
                  prediction.timeframe
                }
                subtitle="Prediction interval"
              />


              <InfoCard
                title="Model"
                value={
                  prediction.model?.type ||
                  "XGBoost"
                }
                subtitle="3-class classifier"
              />

            </div>


            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                <div className="flex items-center gap-2 text-sm text-slate-500">

                  <Clock
                    className="w-4 h-4"
                  />

                  Market data:

                  <span className="font-medium text-slate-700">

                    {
                      prediction.prediction_time ||
                      "--"
                    }

                  </span>

                </div>


                <div className="text-sm text-slate-500">

                  Last refresh:

                  <span className="font-medium text-slate-700 ml-1">

                    {formatTime(
                      lastUpdated
                    )}

                  </span>

                </div>

              </div>

            </div>


            {/* =================================================
                DISCLAIMER
            ================================================= */}

            <div className="mt-6 p-4 rounded-2xl bg-slate-100 border border-slate-200">

              <p className="text-xs leading-5 text-slate-500">

                <strong className="text-slate-700">

                  Model information:

                </strong>{" "}

                This prediction is generated by an
                experimental XGBoost model using historical
                market data and technical features.
                Model probabilities are not guarantees of
                future price movement.

              </p>

            </div>

          </>

        )}


        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {!prediction &&
          modelStatus !==
            "TRAINING" &&
          !error && (

            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">

              <Brain
                className="w-12 h-12 mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-lg font-bold text-slate-700">

                Loading AI prediction...

              </h2>

              <p className="text-sm text-slate-500 mt-2">

                Preparing market data and model.

              </p>

            </div>

          )}

      </div>

    </div>
  );
};


// ============================================================
// PROBABILITY BAR
// ============================================================

const ProbabilityBar = ({
  label,
  value,
  icon,
  barClass,
}) => (

  <div>

    <div className="flex justify-between items-center mb-2">

      <div className="flex items-center gap-2">

        {icon}

        <span className="text-sm font-semibold text-slate-700">

          {label}

        </span>

      </div>


      <span className="text-sm font-bold text-slate-900">

        {Number(
          value
        ).toFixed(2)}%

      </span>

    </div>


    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">

      <div
        className={`h-full rounded-full transition-all duration-700 ${barClass}`}
        style={{
          width: `${Math.min(
            100,
            Math.max(
              0,
              value
            )
          )}%`,
        }}
      />

    </div>

  </div>
);


// ============================================================
// INFO CARD
// ============================================================

const InfoCard = ({
  title,
  value,
  subtitle,
}) => (

  <div className="bg-white rounded-2xl border border-slate-200 p-5">

    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">

      {title}

    </p>


    <p className="text-lg font-bold text-slate-900 mt-2 truncate">

      {value}

    </p>


    <p className="text-sm text-slate-500 mt-1">

      {subtitle}

    </p>

  </div>
);


export default Prediction;