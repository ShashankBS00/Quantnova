import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


export default function PortfolioAllocation({
  holdings,
  marketData,
  loading,
}) {
  const data = holdings
    .map((stock) => {
      const price = marketData[stock.symbol]?.currentPrice;

      if (!price) return null;

      return {
        name: stock.symbol,
        value: stock.quantity * price,
      };
    })
    .filter(Boolean);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Portfolio Allocation
        </h2>

        <p className="text-sm text-slate-400 mt-1">
          Distribution of your current portfolio
        </p>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center text-slate-400">
          Loading allocation...
        </div>
      ) : data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-slate-400">
          No portfolio data available
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

          {/* Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[
                        "#3b82f6",
                        "#22c55e",
                        "#a855f7",
                        "#f59e0b",
                      ][index % 4]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(value).toFixed(2)}`
                  }
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation list */}
          <div className="space-y-4">
            {data.map((stock, index) => {
              const total = data.reduce(
                (sum, item) => sum + item.value,
                0
              );

              const percentage =
                total > 0
                  ? (stock.value / total) * 100
                  : 0;

              return (
                <div
                  key={stock.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: [
                          "#3b82f6",
                          "#22c55e",
                          "#a855f7",
                          "#f59e0b",
                        ][index % 4],
                      }}
                    />

                    <span className="text-white font-medium">
                      {stock.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-white">
                      ₹{stock.value.toFixed(2)}
                    </p>

                    <p className="text-sm text-slate-400">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}