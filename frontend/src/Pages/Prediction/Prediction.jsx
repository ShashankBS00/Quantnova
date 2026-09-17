import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  Brain,
  ChevronDown,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  Clock,
} from "lucide-react";

import { getPrediction } from "../../services/predictionService";


const STOCKS = [
  {
    symbol: "TCS.NS",
    name: "TCS",
  },
  {
    symbol: "RELIANCE.NS",
    name: "Reliance",
  },
  {
    symbol: "INFY.NS",
    name: "Infosys",
  },
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank",
  },
  {
    symbol: "ICICIBANK.NS",
    name: "ICICI Bank",
  },
];


const TIMEFRAMES = [
  {
    value: "1d",
    label: "1 Day",
  },
  {
    value: "1wk",
    label: "1 Week",
  },
];


const Prediction = () => {
  const [symbol, setSymbol] =
    useState("TCS.NS");

  const [timeframe, setTimeframe] =
    useState("1d");

  const [prediction, setPrediction] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);


  // ==========================================================
  // FETCH PREDICTION
  // ==========================================================

  const fetchPrediction = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getPrediction(
          symbol,
          timeframe
        );

        setPrediction(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          "Prediction error:",
          err
        );

        setPrediction(null);

        setError(
          err.message ||
            "Failed to load prediction."
        );
      } finally {
        setLoading(false);
      }
    },
    [symbol, timeframe]
  );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);


  // ==========================================================
  // HELPERS
  // ==========================================================

  const formatPrice = (price) => {
    if (
      price === null ||
      price === undefined ||
      Number.isNaN(Number(price))
    ) {
      return "--";
    }

    return `₹${Number(price).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };


  const formatPercent = (value) => {
    if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
    ) {
      return "--";
    }

    const number = Number(value);

    return `${number >= 0 ? "+" : ""}${number.toFixed(
      2
    )}%`;
  };


  const formatTime = (date) => {
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


  const getPredictionColor = () => {
    if (!prediction) {
      return "";
    }

    switch (prediction.prediction) {
      case "UP":
        return "text-emerald-600";

      case "DOWN":
        return "text-red-600";

      case "HOLD":
        return "text-amber-600";

      default:
        return "text-gray-600";
    }
  };


  const getPredictionBackground = () => {
    if (!prediction) {
      return "bg-gray-50";
    }

    switch (prediction.prediction) {
      case "UP":
        return "bg-emerald-50";

      case "DOWN":
        return "bg-red-50";

      case "HOLD":
        return "bg-amber-50";

      default:
        return "bg-gray-50";
    }
  };


  const getPredictionIcon = () => {
    if (!prediction) {
      return (
        <Minus
          className="w-10 h-10"
        />
      );
    }

    switch (prediction.prediction) {
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

      case "HOLD":
        return (
          <Minus
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


  const getProbability = (direction) => {
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


  const selectedStock = STOCKS.find(
    (stock) =>
      stock.symbol === symbol
  );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

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

            {/* SYMBOL */}

            <div className="relative">

              <select
                value={symbol}
                onChange={(event) =>
                  setSymbol(
                    event.target.value
                  )
                }
                className="appearance-none w-full sm:w-52 bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >

                {STOCKS.map(
                  (stock) => (
                    <option
                      key={stock.symbol}
                      value={stock.symbol}
                    >
                      {stock.name} (
                      {stock.symbol})
                    </option>
                  )
                )}

              </select>

              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              />

            </div>


            {/* TIMEFRAME */}

            <div className="relative">

              <select
                value={timeframe}
                onChange={(event) =>
                  setTimeframe(
                    event.target.value
                  )
                }
                className="appearance-none w-full sm:w-36 bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >

                {TIMEFRAMES.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  )
                )}

              </select>

              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              />

            </div>


            {/* REFRESH */}

            <button
              onClick={
                fetchPrediction
              }
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
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


        {/* ====================================================
            ERROR
        ==================================================== */}

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


        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && !prediction ? (

          <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center">

            <Loader2
              className="w-10 h-10 text-indigo-600 animate-spin"
            />

            <p className="mt-4 text-slate-600 font-medium">
              Running AI prediction...
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Fetching latest market data
            </p>

          </div>

        ) : prediction ? (

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
                          {prediction.prediction}
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
                    Model output across all three classes
                  </p>

                </div>

                <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                  XGBoost
                </div>

              </div>


              <div className="space-y-5">


                {/* DOWN */}

                <div>

                  <div className="flex justify-between items-center mb-2">

                    <div className="flex items-center gap-2">

                      <TrendingDown
                        className="w-4 h-4 text-red-500"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        DOWN
                      </span>

                    </div>

                    <span className="text-sm font-bold text-slate-900">
                      {getProbability(
                        "DOWN"
                      ).toFixed(2)}
                      %
                    </span>

                  </div>

                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${getProbability(
                          "DOWN"
                        )}%`,
                      }}
                    />

                  </div>

                </div>


                {/* HOLD */}

                <div>

                  <div className="flex justify-between items-center mb-2">

                    <div className="flex items-center gap-2">

                      <Minus
                        className="w-4 h-4 text-amber-500"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        HOLD
                      </span>

                    </div>

                    <span className="text-sm font-bold text-slate-900">
                      {getProbability(
                        "HOLD"
                      ).toFixed(2)}
                      %
                    </span>

                  </div>

                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${getProbability(
                          "HOLD"
                        )}%`,
                      }}
                    />

                  </div>

                </div>


                {/* UP */}

                <div>

                  <div className="flex justify-between items-center mb-2">

                    <div className="flex items-center gap-2">

                      <TrendingUp
                        className="w-4 h-4 text-emerald-500"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        UP
                      </span>

                    </div>

                    <span className="text-sm font-bold text-slate-900">
                      {getProbability(
                        "UP"
                      ).toFixed(2)}
                      %
                    </span>

                  </div>

                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${getProbability(
                          "UP"
                        )}%`,
                        }}
                    />

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                MODEL INFORMATION
            ================================================= */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">


              {/* SYMBOL */}

              <div className="bg-white rounded-2xl border border-slate-200 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                  Asset
                </p>

                <p className="text-lg font-bold text-slate-900 mt-2">
                  {selectedStock?.name ||
                    prediction.symbol}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {prediction.symbol}
                </p>

              </div>


              {/* TIMEFRAME */}

              <div className="bg-white rounded-2xl border border-slate-200 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                  Timeframe
                </p>

                <p className="text-lg font-bold text-slate-900 mt-2">
                  {prediction.timeframe}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Prediction interval
                </p>

              </div>


              {/* MODEL */}

              <div className="bg-white rounded-2xl border border-slate-200 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                  Model
                </p>

                <p className="text-lg font-bold text-slate-900 mt-2">
                  {
                    prediction.model
                      ?.type
                  }
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  3-class classifier
                </p>

              </div>

            </div>


            {/* =================================================
                FOOTER INFORMATION
            ================================================= */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                <div className="flex items-center gap-2 text-sm text-slate-500">

                  <Clock
                    className="w-4 h-4"
                  />

                  <span>
                    Market data:
                    {" "}
                    {prediction.prediction_time ||
                      "--"}
                  </span>

                </div>


                <div className="text-sm text-slate-500">

                  Last API refresh:
                  {" "}
                  <span className="font-medium text-slate-700">
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
                experimental XGBoost machine-learning
                model using historical market data and
                technical features. The displayed class
                probability is the model output and is
                not a calibrated guarantee of future
                price movement.

              </p>

            </div>

          </>

        ) : (

          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">

            <Brain
              className="w-12 h-12 mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-lg font-bold text-slate-700">
              No prediction available
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Select an asset and refresh the prediction.
            </p>

          </div>

        )}

      </div>

    </div>
  );
};


export default Prediction;