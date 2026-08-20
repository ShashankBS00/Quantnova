import { useEffect, useState } from "react";

import {
  getStrategies,
  createStrategy,
  deleteStrategy,
} from "@/services/strategyService";

const strategyTypes = [
  {
    value: "SMA_CROSSOVER",
    label: "SMA Crossover",
  },
  {
    value: "EMA_CROSSOVER",
    label: "EMA Crossover",
  },
  {
    value: "RSI",
    label: "RSI Strategy",
  },
];

export default function Strategy() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("TCS.NS");
  const [strategyType, setStrategyType] =
    useState("SMA_CROSSOVER");

  const [fastPeriod, setFastPeriod] = useState(20);
  const [slowPeriod, setSlowPeriod] = useState(50);

  const [strategies, setStrategies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load strategies from backend
  async function loadStrategies() {
    try {
      setLoading(true);
      setError("");

      const data = await getStrategies();

      setStrategies(data);
    } catch (error) {
      console.error(
        "Failed to load strategies:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to load strategies."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStrategies();
  }, []);

  // Create strategy
  async function handleSave() {
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Enter a strategy name.");
      return;
    }

    if (!symbol.trim()) {
      setError("Enter a stock symbol.");
      return;
    }

    if (Number(fastPeriod) >= Number(slowPeriod)) {
      setError(
        "Fast period must be smaller than slow period."
      );
      return;
    }

    try {
      setSaving(true);

      const strategy = await createStrategy({
        name: name.trim(),
        symbol: symbol.toUpperCase(),
        strategy_type: strategyType,
        fast_period: Number(fastPeriod),
        slow_period: Number(slowPeriod),
      });

      setStrategies((current) => [
        ...current,
        strategy,
      ]);

      setName("");

      setMessage(
        "Strategy created successfully."
      );
    } catch (error) {
      console.error(
        "Failed to create strategy:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to create strategy."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete strategy
  async function handleDelete(id) {
    try {
      setError("");
      setMessage("");

      await deleteStrategy(id);

      setStrategies((current) =>
        current.filter(
          (strategy) => strategy.id !== id
        )
      );

      setMessage(
        "Strategy deleted successfully."
      );
    } catch (error) {
      console.error(
        "Failed to delete strategy:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to delete strategy."
      );
    }
  }

  function getStrategyLabel(type) {
    const strategy = strategyTypes.find(
      (item) => item.value === type
    );

    return strategy
      ? strategy.label
      : type;
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Strategy Builder
        </h1>

        <p className="text-slate-400 mt-2">
          Create and manage algorithmic trading strategies
        </p>
      </div>

      {/* Create Strategy */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold text-white mb-6">
          Create Strategy
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Strategy Name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="TCS SMA Strategy"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Stock Symbol
            </label>

            <input
              value={symbol}
              onChange={(e) =>
                setSymbol(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="TCS.NS"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Strategy Type */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Strategy Type
            </label>

            <select
              value={strategyType}
              onChange={(e) =>
                setStrategyType(e.target.value)
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              {strategyTypes.map((strategy) => (
                <option
                  key={strategy.value}
                  value={strategy.value}
                >
                  {strategy.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fast Period */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Fast Period
            </label>

            <input
              type="number"
              min="2"
              value={fastPeriod}
              onChange={(e) =>
                setFastPeriod(e.target.value)
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Slow Period */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Slow Period
            </label>

            <input
              type="number"
              min="3"
              value={slowPeriod}
              onChange={(e) =>
                setSlowPeriod(e.target.value)
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

        </div>

        {/* Description */}
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-white">
              SMA Crossover:
            </span>{" "}
            Buy when the fast moving average crosses
            above the slow moving average and sell when
            it crosses below.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 text-sm text-green-400">
            {message}
          </p>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving
            ? "Saving..."
            : "+ Save Strategy"}
        </button>

      </div>

      {/* Saved Strategies */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-xl font-semibold text-white">
              My Strategies
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Your saved trading strategies
            </p>
          </div>

          <button
            onClick={loadStrategies}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : "↻ Refresh"}
          </button>

        </div>

        {loading ? (
          <p className="text-slate-500 py-8 text-center">
            Loading strategies...
          </p>
        ) : strategies.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500">
              No strategies created yet.
            </p>

            <p className="text-sm text-slate-600 mt-2">
              Create your first strategy above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-5"
              >

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {strategy.name}
                    </h3>

                    <p className="text-sm text-slate-400 mt-1">
                      {strategy.symbol} •{" "}
                      {getStrategyLabel(
                        strategy.strategy_type
                      )}
                    </p>

                    <p className="text-sm text-slate-500 mt-2">
                      Fast:{" "}
                      {strategy.fast_period}
                      {" • "}
                      Slow:{" "}
                      {strategy.slow_period}
                    </p>
                  </div>

                  <div className="flex gap-3">

                    <button
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Backtest
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(strategy.id)
                      }
                      className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}