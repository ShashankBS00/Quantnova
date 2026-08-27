import { useEffect, useState } from "react";

import { getCurrentPrice } from "@/services/portfolioService";

import {
  getTradingAccount,
  placeOrder,
} from "@/services/tradingService";

import { getStrategies } from "@/services/strategyService";

import { runPaperTrade } from "@/services/paperTradingService";


export default function Trading() {
  // --------------------------------
  // Account
  // --------------------------------

  const [account, setAccount] = useState(null);

  // --------------------------------
  // Manual Order
  // --------------------------------

  const [symbol, setSymbol] = useState("TCS.NS");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [side, setSide] = useState("BUY");

  // --------------------------------
  // Loading
  // --------------------------------

  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);

  // --------------------------------
  // Messages
  // --------------------------------

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // --------------------------------
  // Market Price
  // --------------------------------

  const [marketPrice, setMarketPrice] = useState(null);

  // --------------------------------
  // Confirmation
  // --------------------------------

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  // --------------------------------
  // Strategies
  // --------------------------------

  const [strategies, setStrategies] = useState([]);
  const [selectedStrategyId, setSelectedStrategyId] =
    useState("");

  // --------------------------------
  // Paper Strategy Result
  // --------------------------------

  const [strategyResult, setStrategyResult] =
    useState(null);


  // ========================================
  // Load Market Price
  // ========================================

  async function loadMarketPrice() {
    if (!symbol.trim()) {
      return;
    }

    try {
      setPriceLoading(true);

      const currentPrice = await getCurrentPrice(
        symbol.toUpperCase()
      );

      setMarketPrice(currentPrice);

      setPrice(
        Number(currentPrice).toFixed(2)
      );

    } catch (error) {
      console.error(
        "Failed to load market price:",
        error
      );

      setMarketPrice(null);
      setPrice("");

    } finally {
      setPriceLoading(false);
    }
  }


  // ========================================
  // Load Trading Account
  // ========================================

  async function loadAccount() {
    try {
      const data = await getTradingAccount();

      setAccount(data);

    } catch (error) {
      console.error(
        "Failed to load trading account:",
        error
      );
    }
  }


  // ========================================
  // Load Strategies
  // ========================================

  async function loadStrategies() {
    try {
      const data = await getStrategies();

      setStrategies(data);

      if (
        data.length > 0 &&
        !selectedStrategyId
      ) {
        setSelectedStrategyId(
          String(data[0].id)
        );
      }

    } catch (error) {
      console.error(
        "Failed to load strategies:",
        error
      );
    }
  }


  // ========================================
  // Initial Load
  // ========================================

  useEffect(() => {
    loadAccount();
    loadStrategies();
  }, []);


  // ========================================
  // Market Price Refresh
  // ========================================

  useEffect(() => {
    loadMarketPrice();

    const interval = setInterval(() => {
      loadMarketPrice();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [symbol]);


  // ========================================
  // Run Strategy
  // ========================================

  async function handleRunStrategy() {
    setMessage("");
    setMessageType("");
    setStrategyResult(null);

    if (!selectedStrategyId) {
      setMessage(
        "Please select a strategy."
      );

      setMessageType("error");

      return;
    }

    try {
      setStrategyLoading(true);

      const result = await runPaperTrade(
        Number(selectedStrategyId)
      );

      setStrategyResult(result);

      // Update symbol from strategy
      if (result.symbol) {
        setSymbol(result.symbol);
      }

      // Refresh account because strategy
      // may have placed an order
      await loadAccount();

      setMessage(
        result.message ||
          "Strategy executed successfully."
      );

      setMessageType(
        result.action === "BUY" ||
        result.action === "SELL"
          ? "success"
          : "info"
      );

    } catch (error) {
      console.error(
        "Failed to run paper strategy:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
          "Failed to run paper strategy."
      );

      setMessageType("error");

    } finally {
      setStrategyLoading(false);
    }
  }


  // ========================================
  // Manual Order
  // ========================================

  async function handleOrder() {
    setMessage("");
    setMessageType("");

    if (!symbol.trim()) {
      setMessage(
        "Enter a stock symbol."
      );

      setMessageType("error");

      return;
    }

    if (
      !quantity ||
      Number(quantity) <= 0
    ) {
      setMessage(
        "Enter a valid quantity."
      );

      setMessageType("error");

      return;
    }

    if (
      !price ||
      Number(price) <= 0
    ) {
      setMessage(
        "Enter a valid price."
      );

      setMessageType("error");

      return;
    }

    try {
      setLoading(true);

      await placeOrder({
        symbol: symbol
          .trim()
          .toUpperCase(),

        quantity: Number(quantity),

        price: Number(price),

        side: side.toUpperCase(),
      });

      setMessage(
        `${side} order placed successfully.`
      );

      setMessageType("success");

      setShowConfirmation(false);

      await loadAccount();

    } catch (error) {
      console.error(
        "Failed to place order:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
          "Failed to place order."
      );

      setMessageType("error");

    } finally {
      setLoading(false);
    }
  }


  // ========================================
  // Statistics
  // ========================================

  const winningTrades =
    account?.winning_trades || 0;

  const losingTrades =
    account?.losing_trades || 0;

  const totalCompletedTrades =
    winningTrades + losingTrades;

  const winRate =
    totalCompletedTrades > 0
      ? (
          (winningTrades /
            totalCompletedTrades) *
          100
        ).toFixed(2)
      : "0.00";

  const realizedPnl =
    Number(account?.realized_pnl || 0);


  // ========================================
  // UI
  // ========================================

  return (
    <div className="space-y-8">

      {/* ================================= */}
      {/* Header */}
      {/* ================================= */}

      <div>
        <h1 className="text-3xl font-bold text-white">
          Paper Trading
        </h1>

        <p className="text-slate-400 mt-2">
          Practice trading with virtual money
        </p>
      </div>


      {/* ================================= */}
      {/* Account Summary */}
      {/* ================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* Cash */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <p className="text-sm text-slate-400">
            Available Cash
          </p>

          <h2 className="text-2xl font-bold text-white mt-3">
            ₹
            {Number(
              account?.cash || 0
            ).toFixed(2)}
          </h2>

        </div>


        {/* Realized P&L */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <p className="text-sm text-slate-400">
            Realized P&L
          </p>

          <h2
            className={`text-2xl font-bold mt-3 ${
              realizedPnl >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {realizedPnl >= 0
              ? "+"
              : "-"}
            ₹
            {Math.abs(
              realizedPnl
            ).toFixed(2)}
          </h2>

        </div>


        {/* Winning */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <p className="text-sm text-slate-400">
            Winning Trades
          </p>

          <h2 className="text-2xl font-bold text-green-400 mt-3">
            {winningTrades}
          </h2>

        </div>


        {/* Win Rate */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <p className="text-sm text-slate-400">
            Win Rate
          </p>

          <h2 className="text-2xl font-bold text-white mt-3">
            {winRate}%
          </h2>

        </div>

      </div>


      {/* ================================= */}
      {/* Strategy Paper Trading */}
      {/* ================================= */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>
            <h2 className="text-xl font-semibold text-white">
              Strategy Paper Trading
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Run one of your saved strategies
            </p>
          </div>

        </div>


        {strategies.length === 0 ? (

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">

            <p className="text-slate-400">
              No strategies available.
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Create a strategy first from the
              Strategy Builder.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Strategy */}

            <div className="md:col-span-2">

              <label className="block text-sm text-slate-400 mb-2">
                Select Strategy
              </label>

              <select
                value={selectedStrategyId}
                onChange={(e) => {
                  setSelectedStrategyId(
                    e.target.value
                  );

                  setStrategyResult(null);
                  setMessage("");
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              >

                {strategies.map(
                  (strategy) => (

                    <option
                      key={strategy.id}
                      value={strategy.id}
                    >
                      {strategy.name} —{" "}
                      {strategy.symbol} —{" "}
                      {strategy.strategy_type}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* Run */}

            <div className="flex items-end">

              <button
                type="button"
                onClick={
                  handleRunStrategy
                }
                disabled={
                  strategyLoading ||
                  !selectedStrategyId
                }
                className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >

                {strategyLoading
                  ? "Running..."
                  : "▶ Run Strategy"}

              </button>

            </div>

          </div>

        )}


        {/* Strategy Result */}

        {strategyResult && (

          <div className="mt-6">

            <h3 className="text-lg font-semibold text-white mb-4">
              Strategy Result
            </h3>


            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">


              {/* Signal */}

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">

                <p className="text-xs text-slate-400">
                  Signal
                </p>

                <p
                  className={`text-xl font-bold mt-2 ${
                    strategyResult.signal ===
                    "BUY"
                      ? "text-green-400"
                      : strategyResult.signal ===
                        "SELL"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {strategyResult.signal}
                </p>

              </div>


              {/* Action */}

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">

                <p className="text-xs text-slate-400">
                  Action
                </p>

                <p className="text-xl font-bold text-white mt-2">
                  {strategyResult.action}
                </p>

              </div>


              {/* Price */}

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">

                <p className="text-xs text-slate-400">
                  Price
                </p>

                <p className="text-xl font-bold text-white mt-2">
                  ₹
                  {Number(
                    strategyResult.price || 0
                  ).toFixed(2)}
                </p>

              </div>


              {/* Fast EMA */}

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">

                <p className="text-xs text-slate-400">
                  Fast EMA
                </p>

                <p className="text-xl font-bold text-white mt-2">
                  {Number(
                    strategyResult.fast_ema || 0
                  ).toFixed(2)}
                </p>

              </div>


              {/* Slow SMA */}

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">

                <p className="text-xs text-slate-400">
                  Slow SMA
                </p>

                <p className="text-xl font-bold text-white mt-2">
                  {Number(
                    strategyResult.slow_sma || 0
                  ).toFixed(2)}
                </p>

              </div>

            </div>


            {/* Message */}

            {strategyResult.message && (

              <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-xl p-4">

                <p className="text-sm text-slate-300">
                  {strategyResult.message}
                </p>

              </div>

            )}

          </div>

        )}

      </div>


      {/* ================================= */}
      {/* Manual Order */}
      {/* ================================= */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold text-white mb-6">
          Manual Paper Order
        </h2>


        {/* BUY / SELL */}

        <div className="flex gap-3 mb-6">

          <button
            type="button"
            onClick={() =>
              setSide("BUY")
            }
            className={`px-6 py-2 rounded-lg font-medium ${
              side === "BUY"
                ? "bg-green-600 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            BUY
          </button>


          <button
            type="button"
            onClick={() =>
              setSide("SELL")
            }
            className={`px-6 py-2 rounded-lg font-medium ${
              side === "SELL"
                ? "bg-red-600 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            SELL
          </button>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Symbol */}

          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Symbol
            </label>

            <input
              value={symbol}
              onChange={(e) =>
                setSymbol(
                  e.target.value.toUpperCase()
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="TCS.NS"
            />

          </div>


          {/* Quantity */}

          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Quantity
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
            />

          </div>


          {/* Price */}

          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Market Price
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="Loading..."
            />


            <button
              type="button"
              onClick={
                loadMarketPrice
              }
              disabled={
                priceLoading
              }
              className="mt-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              {priceLoading
                ? "Loading price..."
                : "↻ Refresh market price"}
            </button>


            {marketPrice !== null &&
              !priceLoading && (

                <p className="text-xs text-slate-500 mt-1">
                  Latest market price: ₹
                  {Number(
                    marketPrice
                  ).toFixed(2)}
                </p>

              )}

          </div>

        </div>


        {/* Total */}

        <div className="mt-6 text-slate-400">

          Estimated Total:

          <span className="text-white font-semibold ml-2">

            ₹
            {(
              Number(
                price || 0
              ) *
              Number(
                quantity || 0
              )
            ).toFixed(2)}

          </span>

        </div>


        {/* Order */}

        <button
          type="button"
          onClick={() => {

            if (
              !symbol.trim() ||
              !price ||
              Number(price) <= 0 ||
              !quantity ||
              Number(quantity) <= 0
            ) {

              setMessage(
                "Please enter valid order details."
              );

              setMessageType(
                "error"
              );

              return;
            }

            setMessage("");
            setShowConfirmation(
              true
            );

          }}
          disabled={
            loading ||
            priceLoading
          }
          className={`mt-6 w-full py-3 rounded-lg font-semibold text-white ${
            side === "BUY"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } disabled:opacity-50`}
        >

          {loading
            ? "Processing..."
            : `Place ${side} Order`}

        </button>


        {/* Message */}

        {message && (

          <p
            className={`mt-4 text-sm ${
              messageType === "success"
                ? "text-green-400"
                : messageType === "info"
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {message}
          </p>

        )}

      </div>


      {/* ================================= */}
      {/* Holdings */}
      {/* ================================= */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold text-white mb-5">
          Current Holdings
        </h2>


        {!account ||
        !account.holdings ||
        Object.keys(
          account.holdings
        ).length === 0 ? (

          <p className="text-slate-400 py-6 text-center">
            No holdings yet.
          </p>

        ) : (

          <div className="space-y-3">

            {Object.entries(
              account.holdings
            ).map(
              ([stock, holding]) => (

                <div
                  key={stock}
                  className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-4"
                >

                  <div>

                    <p className="font-medium text-white">
                      {stock}
                    </p>

                    <p className="text-sm text-slate-400">
                      {holding.quantity} shares
                    </p>

                  </div>


                  <div className="text-right">

                    <p className="text-white">
                      ₹
                      {Number(
                        holding.average_price
                      ).toFixed(2)}
                    </p>

                    <p className="text-xs text-slate-400">
                      Average Price
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* ================================= */}
      {/* Order History */}
      {/* ================================= */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold text-white mb-5">
          Order History
        </h2>


        {!account ||
        !account.orders ||
        account.orders.length === 0 ? (

          <p className="text-slate-400 py-6 text-center">
            No orders yet.
          </p>

        ) : (

          <div className="space-y-3">

            {account.orders.map(
              (order, index) => (

                <div
                  key={index}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-800/60 rounded-xl px-4 py-4"
                >

                  <div>

                    <p className="text-white font-medium">
                      {order.symbol}
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      {order.quantity} × ₹
                      {Number(
                        order.price
                      ).toFixed(2)}
                    </p>

                  </div>


                  <div>

                    <p
                      className={
                        order.side === "BUY"
                          ? "text-green-400 font-semibold"
                          : "text-red-400 font-semibold"
                      }
                    >
                      {order.side}
                    </p>

                    <p className="text-xs text-slate-400">
                      {order.status}
                    </p>

                  </div>


                  <div className="text-right">

                    <p className="text-white font-medium">
                      ₹
                      {Number(
                        order.total || 0
                      ).toFixed(2)}
                    </p>

                    <p className="text-xs text-slate-500">
                      Total
                    </p>

                  </div>


                  <div className="text-right">

                    <p
                      className={`font-medium ${
                        Number(
                          order.realized_pnl || 0
                        ) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {Number(
                        order.realized_pnl || 0
                      ) >= 0
                        ? "+"
                        : ""}
                      ₹
                      {Number(
                        order.realized_pnl || 0
                      ).toFixed(2)}
                    </p>

                    <p className="text-xs text-slate-500">
                      P&L
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* ================================= */}
      {/* Confirmation Modal */}
      {/* ================================= */}

      {showConfirmation && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">

          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">

            <h2 className="text-xl font-semibold text-white">
              Confirm {side} Order
            </h2>

            <p className="text-slate-400 mt-2">
              Please review your order before submitting.
            </p>


            <div className="mt-6 space-y-4">

              <div className="flex justify-between">

                <span className="text-slate-400">
                  Symbol
                </span>

                <span className="text-white font-medium">
                  {symbol}
                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-slate-400">
                  Quantity
                </span>

                <span className="text-white">
                  {quantity}
                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-slate-400">
                  Price
                </span>

                <span className="text-white">
                  ₹
                  {Number(
                    price || 0
                  ).toFixed(2)}
                </span>

              </div>


              <div className="border-t border-slate-800 pt-4 flex justify-between">

                <span className="text-slate-400">
                  Total
                </span>

                <span className="text-white font-bold">
                  ₹
                  {(
                    Number(
                      price || 0
                    ) *
                    Number(
                      quantity || 0
                    )
                  ).toFixed(2)}
                </span>

              </div>

            </div>


            <div className="flex gap-3 mt-6">

              <button
                type="button"
                onClick={() =>
                  setShowConfirmation(
                    false
                  )
                }
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  handleOrder
                }
                disabled={loading}
                className={`flex-1 py-3 rounded-lg font-semibold text-white ${
                  side === "BUY"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >

                {loading
                  ? "Processing..."
                  : `Confirm ${side}`}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}