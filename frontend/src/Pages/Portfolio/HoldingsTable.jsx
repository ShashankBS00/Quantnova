import { holdings } from "@/data/portfolioData";

export default function HoldingsTable({ marketData, loading }) {
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

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 text-sm text-slate-400">
              <th className="pb-3">Stock</th>
              <th className="pb-3">Qty</th>
              <th className="pb-3">Avg Price</th>
              <th className="pb-3">Current Price</th>
              <th className="pb-3">P&L</th>
            </tr>
          </thead>

          <tbody>
            {holdings.map((stock) => {
              const data = marketData[stock.symbol];

              const currentPrice = data?.currentPrice;

              const pnl =
                currentPrice !== undefined
                  ? (currentPrice - stock.averagePrice) *
                    stock.quantity
                  : null;

              return (
                <tr
                  key={stock.symbol}
                  className="border-b border-slate-800/60 text-sm"
                >
                  <td className="py-4 font-medium text-white">
                    {stock.symbol}
                  </td>

                  <td className="py-4 text-slate-300">
                    {stock.quantity}
                  </td>

                  <td className="py-4 text-slate-300">
                    ₹{stock.averagePrice.toFixed(2)}
                  </td>

                  <td className="py-4 text-white">
                    {loading
                      ? "Loading..."
                      : currentPrice !== undefined
                      ? `₹${currentPrice.toFixed(2)}`
                      : "--"}
                  </td>

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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}