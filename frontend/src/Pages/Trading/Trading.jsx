
import { useEffect, useState } from "react";
import { getCurrentPrice } from "@/services/portfolioService";
import {
  getTradingAccount,
  placeOrder,
} from "@/services/tradingService";

export default function Trading() {
  const [account, setAccount] = useState(null);
  const [symbol, setSymbol] = useState("TCS.NS");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [side, setSide] = useState("BUY");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [marketPrice, setMarketPrice] = useState(null);
const [priceLoading, setPriceLoading] = useState(false);
async function loadMarketPrice() {
  if (!symbol) return;

  try {
    setPriceLoading(true);

    const price = await getCurrentPrice(symbol);

    setMarketPrice(price);
    setPrice(price.toFixed(2));
  } catch (error) {
    console.error("Failed to load market price:", error);
    setMarketPrice(null);
    setPrice("");
  } finally {
    setPriceLoading(false);
  }
}

  async function loadAccount() {
    try {
      const data = await getTradingAccount();
      setAccount(data);
    } catch (error) {
      console.error("Failed to load trading account:", error);
    }
  }

  useEffect(() => {
    loadAccount();
  }, []);
  useEffect(() => {
  loadMarketPrice();
}, [symbol]);

  async function handleOrder() {
    if (!price || Number(price) <= 0) {
      setMessage("Enter a valid price.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setMessage("Enter a valid quantity.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await placeOrder({
        symbol,
        quantity: Number(quantity),
        price: Number(price),
        side,
      });

      setMessage("Order placed successfully.");

      await loadAccount();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.detail ||
          "Failed to place order."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Paper Trading
        </h1>

        <p className="text-slate-400 mt-2">
          Practice trading with virtual money
        </p>
      </div>

      {/* Balance */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <p className="text-sm text-slate-400">
          Available Cash
        </p>

        <h2 className="text-3xl font-bold text-white mt-2">
          ₹
          {account
            ? account.cash.toFixed(2)
            : "0.00"}
        </h2>
      </div>

      {/* Order Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold text-white mb-6">
          Place Order
        </h2>

        {/* BUY / SELL */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setSide("BUY")}
            className={`px-6 py-2 rounded-lg font-medium ${
              side === "BUY"
                ? "bg-green-600 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            BUY
          </button>

          <button
            onClick={() => setSide("SELL")}
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
                setSymbol(e.target.value.toUpperCase())
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
                setQuantity(e.target.value)
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
      setPrice(e.target.value)
    }
    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
    placeholder="Loading..."
  />

  <button
    type="button"
    onClick={loadMarketPrice}
    disabled={priceLoading}
    className="mt-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
  >
    {priceLoading
      ? "Loading price..."
      : "↻ Refresh market price"}
  </button>

  {marketPrice !== null && !priceLoading && (
    <p className="text-xs text-slate-500 mt-1">
      Latest market price: ₹{marketPrice.toFixed(2)}
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
              Number(price || 0) *
              Number(quantity || 0)
            ).toFixed(2)}
          </span>
        </div>

        {/* Order Button */}
        <button
          onClick={handleOrder}
          disabled={loading}
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
          <p className="mt-4 text-sm text-slate-300">
            {message}
          </p>
        )}
      </div>

      {/* Holdings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold text-white mb-5">
          Current Holdings
        </h2>

        {!account ||
        Object.keys(account.holdings).length === 0 ? (
          <p className="text-slate-400">
            No holdings yet.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(account.holdings).map(
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
                      {holding.average_price.toFixed(
                        2
                      )}
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

      {/* Order History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold text-white mb-5">
          Order History
        </h2>

        {!account || account.orders.length === 0 ? (
          <p className="text-slate-400">
            No orders yet.
          </p>
        ) : (
          <div className="space-y-3">
            {account.orders.map((order, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-4"
              >
                <div>
                  <p className="text-white font-medium">
                    {order.symbol}
                  </p>

                  <p className="text-sm text-slate-400">
                    {order.quantity} × ₹
                    {order.price.toFixed(2)}
                  </p>
                </div>

                <div className="text-right">
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
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}