export default function HoldingsTable({
  holdings,
  marketData,
  loading,
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Holdings
        </h2>

        <p className="text-sm text-slate-400 mt-1">
          Your current investments
        </p>
      </div>

      {holdings.length === 0 ? (
        <div className="py-10 text-center text-slate-500">
          No holdings yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-sm text-slate-400">
                <th className="pb-3">Stock</th>
                <th className="pb-3">Qty</th>
                <th className="pb-3">Avg Price</th>
                <th className="pb-3">Current Price</th>
                <th className="pb-3">Invested</th>
                <th className="pb-3">Current Value</th>
                <th className="pb-3">P&L</th>
                <th className="pb-3">P&L %</th>
              </tr>
            </thead>

            <tbody>
              {holdings.map((stock) => {
                const data = marketData[stock.symbol];

                const currentPrice = data?.currentPrice;

                const investedValue =
                  stock.averagePrice * stock.quantity;

                const currentValue =
                  currentPrice !== undefined
                    ? currentPrice * stock.quantity
                    : null;

                const pnl =
                  currentValue !== null
                    ? currentValue - investedValue
                    : null;

                const pnlPercentage =
                  pnl !== null && investedValue > 0
                    ? (pnl / investedValue) * 100
                    : null;

                return (
                  <tr
                    key={stock.symbol}
                    className="border-b border-slate-800/60 text-sm"
                  >
                    {/* Stock */}
                    <td className="py-4 font-medium text-white">
                      {stock.symbol}
                    </td>

                    {/* Quantity */}
                    <td className="py-4 text-slate-300">
                      {stock.quantity}
                    </td>

                    {/* Average Price */}
                    <td className="py-4 text-slate-300">
                      ₹{stock.averagePrice.toFixed(2)}
                    </td>

                    {/* Current Price */}
                    <td className="py-4 text-white">
                      {loading
                        ? "Loading..."
                        : currentPrice !== undefined
                        ? `₹${currentPrice.toFixed(2)}`
                        : "--"}
                    </td>

                    {/* Invested Value */}
                    <td className="py-4 text-slate-300">
                      ₹{investedValue.toFixed(2)}
                    </td>

                    {/* Current Value */}
                    <td className="py-4 text-white">
                      {currentValue !== null
                        ? `₹${currentValue.toFixed(2)}`
                        : "--"}
                    </td>

                    {/* P&L */}
                    <td
                      className={`py-4 font-medium ${
                        pnl === null
                          ? "text-slate-500"
                          : pnl >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {pnl === null
                        ? "--"
                        : `${pnl >= 0 ? "+" : "-"}₹${Math.abs(
                            pnl
                          ).toFixed(2)}`}
                    </td>

                    {/* P&L % */}
                    <td
                      className={`py-4 font-medium ${
                        pnlPercentage === null
                          ? "text-slate-500"
                          : pnlPercentage >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {pnlPercentage === null
                        ? "--"
                        : `${
                            pnlPercentage >= 0 ? "+" : ""
                          }${pnlPercentage.toFixed(2)}%`}
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
}